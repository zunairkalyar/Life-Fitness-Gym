import React, { useState, useEffect } from "react";
import { 
  Sliders, 
  Plus, 
  Trash2, 
  Search, 
  Dumbbell, 
  Link2,
  CheckCircle,
  Database
} from "lucide-react";
import { db } from "../firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query 
} from "firebase/firestore";

interface EquipmentMapping {
  id: string; // generated ID
  apparatusName: string; // e.g. Precor Cable Column
  muscleWikiCategory: string; // e.g. cable, dumbbell, barbell, machine, bodyweight etc.
  notes?: string; // custom notes
  createdAt: string;
}

export default function AdminEquipmentMapping() {
  const [mappings, setMappings] = useState<EquipmentMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Input states for new mapping creation
  const [newApparatusName, setNewApparatusName] = useState("");
  const [newWikiCategory, setNewWikiCategory] = useState("machine");
  const [newNotes, setNewNotes] = useState("");

  // feedback notifications
  const [toastMsg, setToastMsg] = useState("");

  const standardCategories = [
    "barbell",
    "dumbbell",
    "machine",
    "cable",
    "smith",
    "kettlebell",
    "bands",
    "bodyweight"
  ];

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const col = collection(db, "exerciseEquipmentMapping");
      const snap = await getDocs(col);
      const items: EquipmentMapping[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as EquipmentMapping);
      });
      setMappings(items);
    } catch (err) {
      console.error("Failed to load mappings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApparatusName.trim()) {
      alert("Apparatus name is required!");
      return;
    }

    try {
      const generatedId = `map_${Date.now()}`;
      const data: EquipmentMapping = {
        id: generatedId,
        apparatusName: newApparatusName.trim(),
        muscleWikiCategory: newWikiCategory,
        notes: newNotes.trim(),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "exerciseEquipmentMapping", generatedId), data);
      
      // Reset form fields
      setNewApparatusName("");
      setNewNotes("");
      
      showToast("Apparatus category alignment created!");
      fetchMappings();
    } catch (err) {
      console.error(err);
      alert("Permission denied. Ensure firestore rules allow admin edits.");
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!window.confirm("Disconnect this apparatus mapping?")) return;
    try {
      await deleteDoc(doc(db, "exerciseEquipmentMapping", id));
      showToast("Mapping combination dissolved.");
      fetchMappings();
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Filter lists
  const filteredMappings = mappings.filter(m => 
    m.apparatusName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.muscleWikiCategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-neutral-900 border border-neutral-855 rounded-3xl p-6 space-y-6 animate-fade-in text-xs max-w-7xl mx-auto" id="equipment-mapping-dashboard">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-8 right-8 z-50 bg-red-600 text-black py-2.5 px-5 rounded-xl font-bold uppercase tracking-wider text-[10px] animate-bounce flex items-center gap-1.5 shadow-2xl">
          <CheckCircle className="h-4 w-4" />
          {toastMsg}
        </div>
      )}

      {/* Title */}
      <div className="border-b border-neutral-800 pb-5">
        <span className="text-red-500 font-extrabold text-[9px] tracking-widest uppercase block mb-1">Gym Apparatus Aligner</span>
        <h2 className="text-white text-lg font-black uppercase tracking-tight flex items-center gap-2">
          <Link2 className="h-5 w-5 text-red-500" />
          Exercise Equipment Mapping Console
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: DEFINE COMBINATION FORM */}
        <div className="lg:col-span-5 bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4">
          <h3 className="text-white font-extrabold text-xs uppercase flex items-center gap-1.5 border-b border-neutral-900 pb-2">
            <Plus className="h-4 w-4 text-red-500" />
            Establish New Apparatus Mapping
          </h3>

          <form onSubmit={handleAddMapping} className="space-y-4 font-semibold text-neutral-300">
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block">Apparatus / Brand Machine Model Name</label>
              <input 
                type="text"
                placeholder="e.g. Cybex Hack Squat Model E-02"
                value={newApparatusName}
                onChange={(e) => setNewApparatusName(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-red-655 focus:border-red-600 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block">Wiki Standard Category</label>
              <select 
                value={newWikiCategory}
                onChange={(e) => setNewWikiCategory(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-300 focus:outline-none focus:border-red-600 text-xs"
              >
                {standardCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                ))}
              </select>
              <span className="text-[9px] text-neutral-500 block">Matches the MuscleWiki API database queries filters properly.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block font-bold">Mapping Annotation / Gym Floor Notes</label>
              <textarea 
                placeholder="e.g. Cybex brand is configured in general back/leg training sector floor 2"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-red-600 text-xs min-h-[5rem]"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-red-655 bg-red-600 hover:bg-red-700 text-black font-black uppercase py-3 rounded-xl transition-all cursor-pointer shadow-md"
            >
              Verify & Connect Alignment Mapping
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: ACTIVE MAPPINGS TABLE LIST */}
        <div className="lg:col-span-7 bg-neutral-955 bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-neutral-900">
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase flex items-center gap-1.5">
                <Database className="h-4 w-4 text-red-500" />
                Apparatus Mapped Matrix
              </h3>
              <p className="text-[10px] text-neutral-500 mt-0.5">Custom hardware configurations dynamically paired</p>
            </div>

            <div className="relative shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Search pairings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 pl-8 pr-3 text-[11px] font-medium text-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-850 text-neutral-500 font-extrabold uppercase text-[9px] tracking-wider">
                  <th className="pb-2.5">Gym Apparatus</th>
                  <th className="pb-2.5">Wiki Alignment</th>
                  <th className="pb-2.5">Description Notes</th>
                  <th className="pb-2.5 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-300 font-medium">
                {filteredMappings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-neutral-500 italic">No equipment alignment listings indexed on file.</td>
                  </tr>
                ) : (
                  filteredMappings.map((m) => (
                    <tr key={m.id} className="hover:bg-neutral-900/30">
                      <td className="py-3 font-extrabold uppercase text-white">{m.apparatusName}</td>
                      <td className="py-3">
                        <span className="bg-red-500/10 border border-red-500/20 text-red-500 uppercase text-[9px] px-2 py-0.5 rounded font-black font-mono">
                          {m.muscleWikiCategory}
                        </span>
                      </td>
                      <td className="py-3 text-neutral-400 italic text-[11px] max-w-[180px] truncate" title={m.notes}>{m.notes || "—"}</td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => handleDeleteMapping(m.id)}
                          className="text-neutral-500 hover:text-red-500 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
