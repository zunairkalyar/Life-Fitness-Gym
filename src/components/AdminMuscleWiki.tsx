import React, { useState, useEffect } from "react";
import { 
  Server, 
  Settings, 
  FileText, 
  Activity, 
  Trash2, 
  Check, 
  AlertTriangle,
  RotateCw,
  RefreshCw,
  Database
} from "lucide-react";
import { db } from "../firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  limit, 
  orderBy,
  deleteDoc
} from "firebase/firestore";

interface UsageStats {
  id: string;
  memberId: string;
  endpoint: string;
  timestamp: string;
  success: boolean;
}

interface CacheItem {
  id: string;
  cachedAt: string;
  url: string;
  expiry: string;
}

export default function AdminMuscleWiki() {
  const [activeSubTab, setActiveSubTab] = useState<"capabilities" | "usage" | "cache">("capabilities");
  const [loading, setLoading] = useState(false);

  // Configuration settings (stored under MuscleWikiSettings/global)
  const [tempApiKeyName, setTempApiKeyName] = useState("Configure via Settings panel");
  const [fallbackToMock, setFallbackToMock] = useState(true);
  const [cacheDurationMinutes, setCacheDurationMinutes] = useState(60);
  const [rateLimitPerHour, setRateLimitPerHour] = useState(100);

  // Firestore status items arrays
  const [usageLogs, setUsageLogs] = useState<UsageStats[]>([]);
  const [cacheList, setCacheList] = useState<CacheItem[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);

  // Action feedback message
  const [msg, setMsg] = useState("");

  const [testResult, setTestResult] = useState<{
    status: string;
    apiMode: string;
    code?: number;
    message: string;
    keyConfigured: boolean;
    sampleCategories?: string[];
  } | null>(null);
  const [testingKey, setTestingKey] = useState(false);

  const runConnectionTest = async () => {
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/musclewiki/test-connection");
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({
        status: "error",
        apiMode: "unknown",
        message: err instanceof Error ? err.message : String(err),
        keyConfigured: false
      });
    } finally {
      setTestingKey(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    loadActivityData();
  }, []);

  const fetchSettings = async () => {
    try {
      const snap = await getDoc(doc(db, "MuscleWikiSettings", "global"));
      if (snap.exists()) {
        const d = snap.data();
        setFallbackToMock(d.fallbackToMock ?? true);
        setCacheDurationMinutes(d.cacheDurationMinutes ?? 60);
        setRateLimitPerHour(d.rateLimitPerHour ?? 100);
      }
    } catch (err) {
      console.warn("Failed fetching MuscleWiki settings - using local state instead");
    }
  };

  const loadActivityData = async () => {
    setLoading(true);
    try {
      // Load Usage log entries
      const usageSnap = await getDocs(query(collection(db, "MuscleWikiUsage"), limit(25)));
      const usageArr: UsageStats[] = [];
      usageSnap.forEach((doc) => {
        usageArr.push({ id: doc.id, ...doc.data() } as UsageStats);
      });
      setUsageLogs(usageArr);

      // Load Cache items metadata
      const cacheSnap = await getDocs(collection(db, "MuscleWikiCacheMetadata"));
      const cacheArr: CacheItem[] = [];
      cacheSnap.forEach((doc) => {
        cacheArr.push({ id: doc.id, ...doc.data() } as CacheItem);
      });
      setCacheList(cacheArr);

      // Load error logs
      const errSnap = await getDocs(query(collection(db, "MuscleWikiErrorLog"), limit(20)));
      const errArr: any[] = [];
      errSnap.forEach((doc) => {
        errArr.push({ id: doc.id, ...doc.data() });
      });
      setErrorLogs(errArr);

    } catch (err) {
      console.error("Loader failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, "MuscleWikiSettings", "global"), {
        fallbackToMock,
        cacheDurationMinutes,
        rateLimitPerHour,
        updatedAt: new Date().toISOString()
      });
      setMsg("Settings successfully written and synchronized!");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Permission denied writing MuscleWiki config settings. Check firestore rules.");
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm("Perform database deletion of local cache keys?")) return;
    try {
      const col = collection(db, "MuscleWikiCacheMetadata");
      const snap = await getDocs(col);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "MuscleWikiCacheMetadata", d.id));
      }
      setCacheList([]);
      setMsg("Cache completely clear!");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-6 animate-fade-in text-xs max-w-7xl mx-auto">
      
      {/* feedback message popup */}
      {msg && (
        <div className="bg-green-600 text-black py-2.5 px-5 rounded-xl font-bold uppercase tracking-wider text-[10px] inline-block mb-3">
          ✓ {msg}
        </div>
      )}

      {/* Header and status flags */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-red-500 font-extrabold text-[9px] tracking-widest uppercase block mb-1">Developer API Services</span>
          <h2 className="text-white text-lg font-black uppercase tracking-tight flex items-center gap-1.5">
            <Server className="h-5 w-5 text-red-500" />
            MuscleWiki API Integration
          </h2>
        </div>

        {/* Sync trigger btn */}
        <button 
          onClick={loadActivityData}
          className="bg-neutral-950 border border-neutral-800 hover:border-red-500 text-neutral-300 font-extrabold uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-red-500 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Controller tab links */}
      <div className="flex border-b border-neutral-800 gap-4 text-[10px] uppercase font-bold text-neutral-500">
        <button 
          onClick={() => setActiveSubTab("capabilities")}
          className={`pb-2.5 border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "capabilities" ? "border-red-655 border-red-600 text-white font-extrabold" : "border-transparent hover:text-white"
          }`}
        >
          <Settings className="h-3.5 w-3.5" /> Configuration & Mock Toggle
        </button>
        <button 
          onClick={() => setActiveSubTab("usage")}
          className={`pb-2.5 border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "usage" ? "border-red-655 border-red-600 text-white font-extrabold" : "border-transparent hover:text-white"
          }`}
        >
          <Activity className="h-3.5 w-3.5" /> Live Usage logs ({usageLogs.length})
        </button>
        <button 
          onClick={() => setActiveSubTab("cache")}
          className={`pb-2.5 border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "cache" ? "border-red-655 border-red-600 text-white font-extrabold" : "border-transparent hover:text-white"
          }`}
        >
          <Database className="h-3.5 w-3.5" /> Cache Storage ({cacheList.length})
        </button>
      </div>

      {/* ==================== SUBTAB 1: SETTINGS / CAPABILITIES ==================== */}
      {activeSubTab === "capabilities" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-neutral-300 font-medium leading-relaxed">
          
          {/* Settings block inputs */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4">
            <h3 className="text-white font-extrabold text-xs uppercase border-b border-neutral-900 pb-2">Control Switch Preferences</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block">API Auth Security Header</label>
              <input 
                type="text" 
                disabled 
                value={tempApiKeyName} 
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-500 font-mono text-[10px]"
              />
              <span className="text-[9px] text-neutral-500 block">The server-side proxy safely utilizes the token stored secure in env secrets.</span>
            </div>

            {/* Toggle switch */}
            <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-850 flex items-center justify-between gap-4">
              <div>
                <span className="text-white font-extrabold uppercase text-[10px] block">Fallback Mock Engine mode</span>
                <p className="text-[10px] text-neutral-500 leading-normal mt-0.5">Force returning pre-cached structured routines of MuscleWiki when offline/unauthorized.</p>
              </div>
              <input 
                type="checkbox"
                checked={fallbackToMock}
                onChange={(e) => setFallbackToMock(e.target.checked)}
                className="h-4 w-4 accent-red-600 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block mb-1">Cache Expiry (Mins)</label>
                <input 
                  type="number" 
                  value={cacheDurationMinutes}
                  onChange={(e) => setCacheDurationMinutes(Number(e.target.value) || 60)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2 text-white font-mono text-center"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block mb-1">Rate Limit (Per Member/Hr)</label>
                <input 
                  type="number" 
                  value={rateLimitPerHour}
                  onChange={(e) => setRateLimitPerHour(Number(e.target.value) || 100)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2 text-white font-mono text-center"
                />
              </div>
            </div>

            <button 
              onClick={handleSaveSettings}
              className="w-full bg-red-655 bg-red-600 hover:bg-red-700 text-black font-black uppercase py-2.5 rounded-xl block transition-all cursor-pointer"
            >
              Write Settings Connection config
            </button>
          </div>

          {/* Healthcheck status */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-white font-extrabold text-xs uppercase border-b border-neutral-900 pb-2">Diagnostic Handshake</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-neutral-900 p-2.5 rounded-lg text-xs">
                  <span className="text-neutral-400 font-medium">Server API Proxy Link:</span>
                  <span className="font-mono text-green-400 font-bold uppercase text-[10px] flex items-center gap-1">● Active /api/musclewiki</span>
                </div>

                <div className="flex justify-between items-center bg-neutral-900 p-2.5 rounded-lg text-xs">
                  <span className="text-neutral-400 font-medium">Video/Media Streaming Gateway:</span>
                  <span className="font-mono text-green-400 font-bold uppercase text-[10px] flex items-center gap-1">● Secure Proxy enabled</span>
                </div>

                <div className="flex justify-between items-center bg-neutral-900 p-2.5 rounded-lg text-xs">
                  <span className="text-neutral-400 font-medium">Cache Memory Allocation Status:</span>
                  <span className="font-mono text-red-400 font-bold uppercase text-[10px]">{cacheList.length} documents indexed</span>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-900 mt-4 space-y-3">
                <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block">External API Live Handshake</span>
                <button
                  onClick={runConnectionTest}
                  disabled={testingKey}
                  className="w-full bg-red-600 hover:bg-red-700 text-black font-black uppercase py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <RotateCw className={`h-3 w-3 ${testingKey ? 'animate-spin' : ''}`} />
                  {testingKey ? "Testing connection..." : "Test Active API Key Now"}
                </button>
                
                {testResult && (
                  <div className={`p-3 rounded-lg border text-[11px] ${
                    testResult.status === "success" 
                      ? "bg-green-950/20 border-green-500/30 text-green-400" 
                      : testResult.status === "mock" 
                      ? "bg-yellow-950/20 border-yellow-500/30 text-yellow-500" 
                      : "bg-red-950/20 border-red-500/30 text-red-500"
                  }`}>
                    <span className="font-bold block uppercase text-[10px] mb-1">
                      Mode: {testResult.apiMode.toUpperCase()} ({testResult.status.toUpperCase()})
                    </span>
                    <p className="leading-relaxed font-semibold">{testResult.message}</p>
                    {testResult.sampleCategories && Array.isArray(testResult.sampleCategories) && (
                      <div className="mt-2 pt-2 border-t border-neutral-800">
                        <span className="text-[9px] text-neutral-500 uppercase block font-black mb-1">Response Sample (Categories):</span>
                        <div className="flex flex-wrap gap-1 font-mono text-[9px]">
                          {testResult.sampleCategories.slice(0, 5).map((c: any) => (
                            <span key={typeof c === 'string' ? c : c.id || JSON.stringify(c)} className="bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-400">
                              {typeof c === 'string' ? c : c.name || c.id || JSON.stringify(c)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {errorLogs.length > 0 && (
              <div className="mt-4 bg-red-950/20 border border-red-900/30 rounded-xl p-3 space-y-1.5 text-[10px] text-red-400">
                <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide">
                  <AlertTriangle className="h-3.5 w-3.5" /> Recent Server Warning Logs
                </span>
                <p className="font-mono text-[9px] leading-relaxed select-text truncate">
                  {errorLogs[0].errorMessage || "Error logged contacting external endpoint host."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUBTAB 2: USAGE LOGS ==================== */}
      {activeSubTab === "usage" && (
        <div className="bg-neutral-955 bg-neutral-950 rounded-2xl p-4 border border-neutral-850 space-y-3">
          <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest block">Activity logs (Last 25 transactions)</span>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 font-extrabold uppercase text-[9px] tracking-wider">
                  <th className="pb-2.5">Doc ID</th>
                  <th className="pb-2.5">Member ID</th>
                  <th className="pb-2.5">Proxied Route</th>
                  <th className="pb-2.5">Date Request</th>
                  <th className="pb-2.5">Handshake</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-300 font-medium">
                {usageLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-neutral-500 italic">No usage proxy occurrences logged yet. Ensure member has used client workspace portals.</td>
                  </tr>
                ) : (
                  usageLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-900/30">
                      <td className="py-2.5 font-mono text-[10px] text-neutral-500">{log.id}</td>
                      <td className="py-2.5 font-bold uppercase text-red-500">{log.memberId}</td>
                      <td className="py-2.5 font-mono text-neutral-400">{log.endpoint}</td>
                      <td className="py-2.5 text-neutral-400">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "Unknown"}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${log.success ? 'bg-green-600/10 border-green-500/20 text-green-400' : 'bg-red-650/10 border-red-500/20 text-red-500'}`}>
                          {log.success ? "Success" : "Failed/Mocked"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== SUBTAB 3: CACHED STORAGE ==================== */}
      {activeSubTab === "cache" && (
        <div className="bg-neutral-950 rounded-2xl p-5 border border-neutral-850 space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
            <div>
              <span className="text-white font-extrabold text-xs uppercase block">Active Memory Pool Indexes</span>
              <p className="text-[10px] text-neutral-500 leading-normal mt-0.5">Speeds query times and blocks IP restrictions from external sites.</p>
            </div>

            <button 
              onClick={handleClearCache}
              disabled={cacheList.length === 0}
              className="bg-red-650 bg-red-600 hover:bg-red-700 text-black font-black uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" /> Purge Cache Keys
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cacheList.length === 0 ? (
              <p className="col-span-2 text-center py-10 text-neutral-600 font-bold uppercase tracking-wider">No keys stored in cache yet.</p>
            ) : (
              cacheList.map((item) => (
                <div key={item.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-850 text-xs font-semibold select-text">
                  <span className="text-[9px] text-red-500 font-mono uppercase block truncate" title={item.url}>Request Link: {item.url || item.id}</span>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-neutral-400 text-[10px]">
                    <div>
                      <span className="text-[8px] text-neutral-600 uppercase block font-black">Cached Date:</span>
                      <span className="font-mono">{new Date(item.cachedAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-neutral-600 uppercase block font-black">Status Expiry:</span>
                      <span className="font-mono text-yellow-500">{new Date(item.expiry).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
