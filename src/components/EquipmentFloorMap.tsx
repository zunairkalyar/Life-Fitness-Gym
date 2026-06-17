import React, { useState, useEffect } from "react";
import { MapPin, ShieldAlert, Cpu, Check, AlertTriangle, Play, RefreshCw, Clock } from "lucide-react";

interface Machine {
  id: string;
  name: string;
  stationNo: number;
  status: "Available" | "In Use" | "Maintenance";
  muscles: string;
  restTimer?: number; // remaining seconds
}

export default function EquipmentFloorMap() {
  const [machines, setMachines] = useState<Machine[]>([
    { id: "mac-1", name: "Life Fitness Olympic Bench Press", stationNo: 1, status: "Available", muscles: "Chest, Front Delts" },
    { id: "mac-2", name: "Dumbbells Dual Iso Range Racks", stationNo: 2, status: "In Use", muscles: "Full Upper Body Arms" },
    { id: "mac-3", name: "Power Linear Smith Squat Cage", stationNo: 3, status: "Available", muscles: "Quadriceps, Glutes" },
    { id: "mac-4", name: "Commercial Cable Overpass Rack", stationNo: 4, status: "In Use", muscles: "Chest Flys, Cable Pulls" },
    { id: "mac-5", name: "Commercial High Lat Pulldown Tower", stationNo: 5, status: "Available", muscles: "Lats, Rhomboids, Biceps" },
    { id: "mac-6", name: "Leg Extension Iso-Lateral Press", stationNo: 6, status: "Maintenance", muscles: "Quads Isolated" },
    { id: "mac-7", name: "Preacher Hammer Arm Curl Bench", stationNo: 7, status: "Available", muscles: "Bicep Brachii Peak" },
    { id: "mac-8", name: "Cardio Treadmill Runner Apex", stationNo: 8, status: "In Use", muscles: "Cardiovascular Endurance" },
    { id: "mac-9", name: "Standing Power Calf Raise Lever", stationNo: 9, status: "Available", muscles: "Soleus & Gastrocnemius" }
  ]);

  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const [ticketMachineId, setTicketMachineId] = useState<string>("");
  const [ticketIssue, setTicketIssue] = useState<string>("Cable Friction");
  const [ticketNotes, setTicketNotes] = useState<string>("");
  
  const [ticketsList, setTicketsList] = useState<{ id: string; date: string; machineName: string; issue: string; notes: string; status: string }[]>(() => {
    try {
      const saved = localStorage.getItem("fit_equipment_tickets");
      return saved ? JSON.parse(saved) : [
        { id: "T-8092", date: "2026-06-12", machineName: "Leg Extension Iso-Lateral Press", issue: "Ripped Upholstery Seat cushions", notes: "Severe foam leakage on corner edge", status: "In Review" }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("fit_equipment_tickets", JSON.stringify(ticketsList));
  }, [ticketsList]);

  // Handle countdown ticks for active machine rest stopwatch
  useEffect(() => {
    const mainCountdown = setInterval(() => {
      setActiveTimers((prev) => {
        const next: Record<string, number> = {};
        let changed = false;
        Object.entries(prev).forEach(([key, val]) => {
          const seconds = val as number;
          if (seconds > 1) {
            next[key] = seconds - 1;
            changed = true;
          } else {
            changed = true;
            // set that machine back to Available if it was marked as In Use on timer end
            setMachines((prevMacs) => 
              prevMacs.map((m) => m.id === key && m.status === "In Use" ? { ...m, status: "Available" } : m)
            );
          }
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(mainCountdown);
  }, []);

  const triggerMachineRestSet = (machineId: string) => {
    // Start a 60 second rest countdown for fitness pacing
    setActiveTimers(prev => ({
      ...prev,
      [machineId]: 60
    }));

    // Mark machine as In Use for duration of the set
    setMachines(prev => prev.map(m => m.id === machineId ? { ...m, status: "In Use" } : m));
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targeted = machines.find(m => m.id === ticketMachineId);
    if (!targeted) return;

    const newTicket = {
      id: `T-${1000 + Math.floor(Math.random() * 9000)}`,
      date: new Date().toISOString().split("T")[0],
      machineName: targeted.name,
      issue: ticketIssue,
      notes: ticketNotes.trim() || "No customized notes logged.",
      status: "In Review"
    };

    setTicketsList(prev => [newTicket, ...prev]);
    setTicketNotes("");
    
    // Set machine to Maintenance status
    setMachines(prev => prev.map(m => m.id === ticketMachineId ? { ...m, status: "Maintenance" } : m));
    alert(`🛠️ MAINTENANCE TICKET GRANTED!\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Ticket ID: ${newTicket.id}\n` +
      `Station: ${newTicket.machineName}\n` +
      `Staff Alerted! The machine has been flagged as "Under Maintenance" on Member & TV HUDs.\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Success.`);
  };

  const currentOccupancyPercentage = Math.round(
    (machines.filter(m => m.status !== "Available").length / machines.length) * 100
  );

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6 animate-fade-in" id="floor-map-widget">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-850 pb-4">
        <div>
          <span className="text-emerald-500 text-[10px] uppercase font-black tracking-widest font-mono flex items-center gap-1">
            <Cpu className="h-4 w-4 animate-spin text-emerald-500" style={{ animationDuration: '4s' }} /> Life Fitness Live Occupancy Matrix
          </span>
          <h3 className="text-white text-base font-black uppercase tracking-tight mt-0.5">Floor Map & Glitch Desk</h3>
        </div>
        
        {/* Occupancy HUD slider */}
        <div className="flex items-center gap-3 bg-neutral-950 px-4 py-2 rounded-2xl border border-neutral-850">
          <span className="text-[9px] text-neutral-500 uppercase font-mono font-bold">Gym Load Rate:</span>
          <span className={`text-xs font-mono font-black ${currentOccupancyPercentage > 75 ? "text-red-500" : "text-emerald-500"}`}>
            {currentOccupancyPercentage}% occupied
          </span>
          <div className="w-16 bg-neutral-900 h-2 rounded-full overflow-hidden p-0.5 border border-neutral-800">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${currentOccupancyPercentage > 75 ? "bg-red-500" : "bg-emerald-500"}`}
              style={{ width: `${currentOccupancyPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* GYM BENTO-GRID MAP: LEFT PANEL */}
        <div className="md:col-span-8 space-y-4">
          <span className="text-[9px] text-neutral-500 uppercase font-black tracking-wider block font-mono">Interactive Floor Plan Stations</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {machines.map((mac) => (
              <div 
                key={mac.id} 
                className={`bg-neutral-950 p-4 border rounded-2xl flex flex-col justify-between h-40 transition-all select-none relative ${
                  mac.status === "Available" 
                    ? "border-neutral-850 hover:border-emerald-500/30" 
                    : mac.status === "In Use"
                    ? "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/30"
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                {/* Station No Indicator */}
                <div className="absolute top-3 right-3 text-[14px] font-mono font-black text-neutral-800 leading-none">
                  {mac.stationNo < 10 ? `0${mac.stationNo}` : mac.stationNo}
                </div>

                <div className="space-y-1 z-10">
                  <span className={`text-[8px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none inline-block mb-1.5 ${
                    mac.status === "Available" 
                      ? "bg-green-650/10 border-green-500/20 text-emerald-400" 
                      : mac.status === "In Use"
                      ? "bg-yellow-600/10 border-yellow-500/20 text-yellow-500"
                      : "bg-red-650/10 border-red-500/20 text-red-500"
                  }`}>
                    {mac.status === "Available" ? "AVAILABLE" : mac.status === "In Use" ? "REST SET" : "RESERVED"}
                  </span>
                  <h4 className="text-white text-xs font-black uppercase leading-tight pr-5">{mac.name}</h4>
                  <p className="text-[9px] text-neutral-500 font-semibold leading-normal font-sans pt-1">Muscles: {mac.muscles}</p>
                </div>

                {/* Local timer overlay or button */}
                <div className="pt-2 z-10 flex justify-between items-center border-t border-neutral-900/40">
                  {activeTimers[mac.id] ? (
                    <div className="flex items-center gap-1.5 text-yellow-500 font-mono text-[9px] font-black">
                      <Clock className="h-3 w-3 animate-spin" />
                      <span>RESTING: {activeTimers[mac.id]}s</span>
                    </div>
                  ) : mac.status === "Available" ? (
                    <button
                      onClick={() => triggerMachineRestSet(mac.id)}
                      className="bg-neutral-900 hover:bg-neutral-850 text-white font-black text-[8px] px-2.5 py-1.5 rounded-lg border border-neutral-800 cursor-pointer uppercase tracking-wider font-mono hover:scale-95 transition-all"
                    >
                      ⏱️ Rest Set
                    </button>
                  ) : mac.status === "In Use" ? (
                    <span className="text-amber-500 text-[8px] font-mono uppercase font-extrabold flex items-center gap-1">
                      ● Active Lifting
                    </span>
                  ) : (
                    <span className="text-red-500 text-[8px] font-mono uppercase font-black flex items-center gap-1">
                      ⚠️ Out of Service
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TICKET REPORTING CONSOLE: RIGHT PANEL */}
        <div className="md:col-span-4 bg-neutral-950 p-5 border border-neutral-850 rounded-3xl space-y-4">
          <span className="text-[9px] text-neutral-500 uppercase font-black tracking-wider block font-mono">Structural Glitch Ticket Desk</span>

          <form onSubmit={handleCreateTicketSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <span className="text-[8px] text-neutral-500 uppercase font-black font-mono block">Station Target machine</span>
              <select
                value={ticketMachineId}
                onChange={(e) => setTicketMachineId(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl py-2 px-3 text-[11px] font-bold focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="">-- Choose Machine --</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id} className="bg-neutral-950 text-[11px]">
                    S{m.stationNo}: {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[8px] text-neutral-500 uppercase font-black font-mono block">Log physical Issue Type</span>
              <select
                value={ticketIssue}
                onChange={(e) => setTicketIssue(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl py-2 px-3 text-[11px] font-bold focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="Cable Friction">Cable Friction / Heavy Pull Resistance</option>
                <option value="Ripped Seat cushions">Ripped Cushioning / Foam Leakage</option>
                <option value="Slipped Pin Selector">Missing or Slipped Pin selector</option>
                <option value="Rust / Loose Bolt">Squeaking / Loose structural bolt</option>
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[8px] text-neutral-500 uppercase font-black font-mono block">Detailed Notes</span>
              <textarea
                value={ticketNotes}
                onChange={(e) => setTicketNotes(e.target.value)}
                placeholder="E.g. cable is sticking on high extension drops..."
                required
                rows={2}
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl p-2.5 text-[11px] font-semibold focus:outline-none focus:border-red-500 placeholder-neutral-600 resize-none leading-normal"
              />
            </div>

            <button
              type="submit"
              disabled={!ticketMachineId}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 disabled:bg-neutral-950 disabled:text-neutral-600 border border-neutral-800 disabled:border-neutral-900 text-emerald-500 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              File Maintenance Alert
            </button>
          </form>

          {/* Active tickets lists view */}
          {ticketsList.length > 0 && (
            <div className="pt-3 border-t border-neutral-900 space-y-2 max-h-32 overflow-y-auto pr-1">
              <span className="text-[8px] text-neutral-500 uppercase font-black block font-mono">Filer Maintenance Tickets Logs</span>
              <div className="space-y-2">
                {ticketsList.slice(0, 2).map((t, i) => (
                  <div key={i} className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-900 text-[10px] leading-relaxed flex justify-between items-center text-neutral-400">
                    <div>
                      <span className="text-white font-black uppercase block leading-none text-[9px]">{t.machineName}</span>
                      <span className="text-red-500 block text-[8px] font-mono uppercase font-bold mt-1">{t.issue}</span>
                    </div>
                    <span className="font-mono text-neutral-500 text-[8px]">{t.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
