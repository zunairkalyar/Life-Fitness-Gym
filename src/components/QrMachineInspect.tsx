import React, { useState, useEffect } from "react";
import { 
  Wrench, 
  ShieldAlert, 
  Flame, 
  RefreshCw, 
  AlertTriangle, 
  Activity, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  UserX
} from "lucide-react";

interface QrMachineInspectProps {
  machineId: string;
  onBack: () => void;
}

export default function QrMachineInspect({ machineId, onBack }: QrMachineInspectProps) {
  const [machine, setMachine] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<any[]>([]);
  const [substitutes, setSubstitutes] = useState<any[]>([]);
  
  // Feedback states
  const [reportingIssue, setReportingIssue] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportIssueType, setReportIssueType] = useState("Machine damaged");
  const [reportNotes, setReportNotes] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    fetchMachineDetails();
  }, [machineId]);

  const fetchMachineDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch hardware specifications
      const res = await fetch("/api/equipment");
      if (res.ok) {
        const equipments = await res.json();
        const found = equipments.find((e: any) => e.equipment_id === machineId);
        setMachine(found || null);

        if (found) {
          // 2. Fetch all exercises and filter by required equipment
          const exRes = await fetch("/api/exercises");
          if (exRes.ok) {
            const allEx = await exRes.json();
            // Filter exercises that require this specific machine
            const matchingExercises = allEx.filter((ex: any) => 
              ex.required_equipment && ex.required_equipment.includes(found.equipment_id)
            );
            setExercises(matchingExercises);

            // Collect substitution alternatives
            const allAlts: any[] = [];
            matchingExercises.forEach((ex: any) => {
              if (ex.alternatives && ex.alternatives.length > 0) {
                ex.alternatives.forEach((alt: any) => {
                  allAlts.push({
                    originalExercise: ex.name,
                    altExercise: alt.exercise,
                    requiredEquipment: alt.required_equipment
                  });
                });
              }
            });
            setSubstitutes(allAlts);
          }
        }
      }
    } catch (err) {
      console.error("Error loading QR machine details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNotes.trim()) {
      alert("Please provide a short description of the issue.");
      return;
    }

    try {
      const res = await fetch("/api/equipment/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipment_id: machineId,
          issue_type: reportIssueType,
          notes: reportNotes.trim()
        })
      });

      if (res.ok) {
        setReportSuccess(true);
        setReportNotes("");
        setReportingIssue(false);
        showToast("Ticket registered! Under Review by Staff.");
        fetchMachineDetails(); // Reload machine status
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit report. Please authenticate first.");
      }
    } catch (err) {
      console.error("Error submitting issue ticket:", err);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 font-sans">
        <RefreshCw className="h-8 w-8 text-red-500 animate-spin mb-3" />
        <span className="text-[10px] tracking-widest text-neutral-500 font-extrabold uppercase uppercase">Verifying Digital Node...</span>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 font-sans text-center max-w-sm mx-auto">
        <UserX className="h-12 w-12 text-neutral-600 mb-4" />
        <h3 className="text-white text-base font-black uppercase tracking-tight">Machine Unverified</h3>
        <p className="text-[11px] text-neutral-500 mt-2 font-medium leading-relaxed">
          The requested QR equipment slug is not registered in the Life Fitness database schema.
        </p>
        <button 
          onClick={onBack}
          className="mt-6 bg-red-600 font-black text-black px-5 py-2.5 rounded-xl uppercase tracking-wider text-[10px] hover:bg-red-700 transition-all cursor-pointer"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  // Generate dynamic steps based on machine type
  const getAdjustmentSteps = () => {
    switch (machine.category) {
      case "cardio":
        return [
          { title: "Power Up", desc: "Locate the main monitor console and select 'Quick Start' or step on the belt to trigger automatic screen wake." },
          { title: "Secur-Clip Tether", desc: "Always clip the red emergency tether securely on your waistband prior to starting dynamic movements." },
          { title: "Control Pace & Incline", desc: "Utilize the handrail push switches for progressive speed and grade elevations." }
        ];
      case "selectorized_machine":
      case "selectorized_combo_machine":
        return [
          { title: "Seat Height Lock", desc: "Adjust the lower safety pin so the chest pad sits flush against your upper sternum, keeping feet flat on the floor floor." },
          { title: "Select Weight Load", desc: "Slide the magnetic selector pin horizontally into the desired slot. Verify the supplementary weights are fully stacked." },
          { title: "Range Alignment", desc: "Verify your joints align smoothly with the main yellow pivot markers on the machine frame structures." }
        ];
      case "cable_machine":
        return [
          { title: "Pulley Height Lever", desc: "Pull the structural spring-pin and slide the main trolley vertically to select your pulling vector angle." },
          { title: "Select Attachment Care", desc: "Safely latch the correct attachment clip (D-handles, rope, curved bar) onto the high-strength carabiner snap." }
        ];
      case "guided_barbell_machine":
      case "free_weight_station":
        return [
          { title: "Adjust Safety Hooks", desc: "Set the robust steel catch rods exactly 2 inches below your lowest terminal concentric push threshold point." },
          { title: "Secure Weight Collars", desc: "Slide consistent weight plates onto both bar sleeves and lock them with heavy-duty clip collars." }
        ];
      default:
        return [
          { title: "Setup Check", desc: "Inspect alignment pads. Choose standard dumbbell range pairing corresponding with current training protocol." }
        ];
    }
  };

  // Status style mappings
  const getStatusBadge = () => {
    switch (machine.status) {
      case "active":
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
            ● Live: Available
          </span>
        );
      case "temporarily_unavailable":
      case "reserved_for_trainer":
        return (
          <span className="bg-amber-500/10 border border-amber-500/20 text-yellow-500 font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
            ● Busy: Occupied
          </span>
        );
      case "under_maintenance":
      case "out_of_service":
        return (
          <span className="bg-red-500/10 border border-red-500/20 text-red-500 font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
            ● OUT OF SERVICE / UNDER MAINTENANCE
          </span>
        );
      default:
        return (
          <span className="bg-neutral-800 border border-neutral-700 text-neutral-400 font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
            ● Status: {machine.status.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 font-sans p-4 sm:p-8 animate-fade-in relative max-w-2xl mx-auto" id="machine-inspection-screen">
      
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-650 bg-red-600 text-black py-2.5 px-5 rounded-xl font-black uppercase tracking-wider text-[10px] animate-bounce flex items-center gap-1.5 shadow-2xl">
          <CheckCircle className="h-4 w-4" />
          {toastMsg}
        </div>
      )}

      {/* Header back navigation */}
      <div className="flex justify-between items-center border-b border-neutral-900 pb-4 mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-red-500" /> Back to Console
        </button>

        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest font-mono">STATION ID: {machine.equipment_id}</span>
      </div>

      {/* Machine Intro Hero */}
      <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div className="space-y-1">
            <span className="text-red-500 text-[9px] font-black tracking-widest uppercase font-mono block">Scanned QR Hardware Station</span>
            <h1 className="text-white text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">{machine.canonical_name}</h1>
            <p className="text-[11px] font-mono text-neutral-500 uppercase mt-1">Zone: {machine.gym_zone || "General Fitness Floor"}</p>
          </div>
          <div className="shrink-0">{getStatusBadge()}</div>
        </div>

        {/* Machine Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-950 p-4 rounded-2xl border border-neutral-850 font-mono text-[9.5px]">
          <div>
            <span className="text-neutral-500 uppercase block font-bold">Category</span>
            <span className="text-white uppercase font-black">{machine.category.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-neutral-500 block font-bold">Manufacturer</span>
            <span className="text-white uppercase font-black">{machine.manufacturer || "Life Fitness"}</span>
          </div>
          <div>
            <span className="text-neutral-500 block font-bold">Model Spec</span>
            <span className="text-white uppercase font-black">{machine.model || "Commercial Elite"}</span>
          </div>
          <div>
            <span className="text-neutral-500 block font-bold">Total Available</span>
            <span className="text-white font-black">{machine.quantity} Unit(s)</span>
          </div>
        </div>

        {machine.notes && (
          <div className="bg-neutral-950/40 p-3.5 border border-red-500/10 rounded-xl text-[11px] text-red-400 font-semibold italic flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <span>Verification warning check: {machine.notes}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* HOW TO ADJUST AND TARGET */}
        <div className="space-y-4">
          <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-900 pb-2">
            <Wrench className="h-4 w-4 text-red-500" /> How to Safely Adjust Unit
          </h3>

          <div className="space-y-3 font-sans">
            {getAdjustmentSteps().map((step, idx) => (
              <div key={idx} className="bg-neutral-900 p-4 border border-neutral-850 rounded-2xl flex gap-3.5 items-start">
                <span className="bg-red-500/10 border border-red-500/30 text-red-500 font-black font-mono text-[11px] px-2 py-0.5 rounded-lg leading-none shrink-0">
                  {idx + 1}
                </span>
                <div className="space-y-0.5">
                  <h4 className="text-white font-black text-[11px] uppercase tracking-wide">{step.title}</h4>
                  <p className="text-[10.5px] text-neutral-400 font-semibold leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DEMONSTRATION & SAFETY */}
        <div className="space-y-4">
          <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-900 pb-2">
            <ShieldAlert className="h-4 w-4 text-red-500" /> Muscles & Safety Protocol
          </h3>

          <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-5 space-y-4">
            <div>
              <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block font-mono">Primary Muscle Targets</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(machine.primary_muscle_groups || ["General Strength"]).map((m: string) => (
                  <span key={m} className="bg-neutral-950 border border-neutral-800 text-white font-extrabold uppercase text-[9px] px-2.5 py-1 rounded">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-850">
              <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block font-mono">Workout Safety Disclaimer</span>
              <p className="text-[10px] text-neutral-400 leading-relaxed font-semibold mt-1">
                Maintain neutral spinal alignment throughout kinetic compression sets. If sharp joint clicking, localized lower back shocks, or hyperventilation thresholds are triggered, terminate the exercise loop immediately and report to a certified Life Fitness Floor Supervisor.
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-850 flex items-center gap-2">
              <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-[9.5px] font-mono font-bold text-red-500 uppercase tracking-widest">Always Latch Steel Catch Pins</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUPPORTED EXERCISES & SUBSTITUTION MATRIX */}
      <div className="mt-8 space-y-4">
        <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-900 pb-2">
          <Flame className="h-4 w-4 text-red-500" /> Supported Exercises & Available Substitutions
        </h3>

        {exercises.length === 0 ? (
          <div className="bg-neutral-900 p-6 border border-neutral-850 rounded-2xl text-center italic text-neutral-500 text-[11px]">
            No specific core exercises mapped directly on this unit. General movement patterns eligible.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map((ex) => (
              <div key={ex.exercise_id} className="bg-neutral-900 border border-neutral-850 rounded-2xl p-4.5 space-y-3 font-sans">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-950">
                  <h4 className="text-white font-extrabold text-xs uppercase">{ex.name}</h4>
                  <span className="bg-red-500/10 text-red-500 border border-red-500/20 uppercase text-[8px] font-mono px-2 py-0.5 rounded leading-none font-black">
                    {ex.difficulty}
                  </span>
                </div>

                {/* Sub Alternatives section */}
                <span className="text-[8px] text-neutral-500 font-black uppercase tracking-widest block font-mono">Substitute Alternatives:</span>
                <div className="space-y-1.5 pt-0.5">
                  {(ex.alternatives || []).map((alt: any, aIdx: number) => (
                    <div key={aIdx} className="bg-neutral-950 p-2 border border-neutral-850 rounded-xl flex justify-between items-center text-[9.5px]">
                      <span className="text-neutral-200 font-bold uppercase">{alt.exercise}</span>
                      <span className="text-neutral-500 text-[8px] italic pr-1">Requires: {(alt.required_equipment || []).join(', ').replace('_', ' ')}</span>
                    </div>
                  ))}
                  {(!ex.alternatives || ex.alternatives.length === 0) && (
                    <span className="text-[9px] text-neutral-500 italic block">No isolated substitutes mapped. Limit reps scale instead.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAULT REPORTING DESK */}
      <div className="mt-8 bg-neutral-900 border border-neutral-850 p-5 rounded-3xl space-y-4">
        <div className="flex justify-between items-center border-b border-neutral-950 pb-3">
          <div>
            <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" /> Urgent Node Fault Reporting Desk
            </h3>
            <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">Alert Life Fitness floor mechanics instantly if any part is broken or missing</p>
          </div>
          <button 
            type="button"
            onClick={() => setReportingIssue(!reportingIssue)}
            className="bg-neutral-950 border border-neutral-800 hover:border-red-500 font-black text-white text-[9px] px-4 py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer"
          >
            {reportingIssue ? "Close Desk" : "Submit Ticket"}
          </button>
        </div>

        {reportingIssue && (
          <form onSubmit={handleReportSubmit} className="space-y-4 font-sans font-semibold text-neutral-300 animate-fade-in text-[11px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono font-bold block">Issue Type Category</label>
                <select 
                  value={reportIssueType}
                  onChange={(e) => setReportIssueType(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-600 cursor-pointer font-bold text-xs"
                >
                  <option value="Machine damaged">Machine damaged / Mechanics broken</option>
                  <option value="Machine unavailable">Machine unavailable / Blocked</option>
                  <option value="Cable or attachment missing">Cable or attachment missing</option>
                  <option value="Seat adjustment problem">Seat adjustment problem</option>
                  <option value="Weight stack problem">Weight stack pin selector stuck</option>
                  <option value="Machine currently occupied">Machine occupied / Packed queue</option>
                  <option value="Incorrect exercise linked to machine">Incorrect exercise linked to machine</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono font-bold block">Station verification check</label>
                <input 
                  type="text" 
                  disabled 
                  value={`${machine.canonical_name} (${machineId})`}
                  className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-2.5 text-neutral-500 font-mono text-[10.5px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono font-bold block">Physical Condition / Detail Notes</label>
              <textarea 
                placeholder="E.g. High seat clamp slider is sticking, making adjustment impossible..."
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 text-xs min-h-[5rem]"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-red-650 bg-red-600 hover:bg-red-700 text-black font-black uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer"
            >
              Verify & Log Instant Fault Ticket
            </button>
          </form>
        )}

        {reportSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-[11px] font-bold leading-relaxed shadow-sm">
            🎉 TICKET SAVED SUCCESSFULLY!<br/>
            Mechanics and trainers have been notified inside the control center. The status has been set to Review. Thank you for securing our floor.
          </div>
        )}
      </div>

    </div>
  );
}
