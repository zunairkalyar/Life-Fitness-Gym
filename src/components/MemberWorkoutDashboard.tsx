import React, { useState, useEffect } from "react";
import { 
  Flame, 
  Dumbbell, 
  Lock, 
  Unlock, 
  Eye, 
  Plus, 
  Trash2, 
  CheckCircle, 
  RotateCcw, 
  Save, 
  Copy, 
  Camera, 
  FileText, 
  Sliders, 
  Clipboard, 
  Activity,
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react";
import { MemberWorkoutPlan, MemberWorkoutSession, MemberWorkoutExerciseDetail } from "../types";

interface MemberWorkoutDashboardProps {
  memberId: string;
}

export default function MemberWorkoutDashboard({ memberId }: MemberWorkoutDashboardProps) {
  // Database state
  const [plans, setPlans] = useState<MemberWorkoutPlan[]>([]);
  const [activePlan, setActivePlan] = useState<MemberWorkoutPlan | null>(null);
  const [session, setSession] = useState<MemberWorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Exercise edit state
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editedExercises, setEditedExercises] = useState<MemberWorkoutExerciseDetail[]>([]);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [searchPreset, setSearchPreset] = useState("");
  
  // Accordions tracker for demo URLs, notes, and coaching manuals
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Common preset list for muscle builder or hyper split
  const EXERCISE_PRESETS = [
    "Barbell Squats", "Incline Bench Press", "Deadlifts", "Pull-Ups", "Push-Ups",
    "Cable Crossovers", "Dumbbell Bicep Curls", "Tricep Pushdowns", "Leg Press",
    "Plank Hold", "Overhead Dumbbell Press", "Lat Pulldowns", "Bent Over Rows"
  ];

  // Load plans & sessions
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch workout plans belonging to authenticated member
      const planRes = await fetch(`/api/member/workouts`);
      if (!planRes.ok) throw new Error("Could not load your workout plan.");
      const planList = await planRes.json();
      setPlans(planList);
      if (planList && planList.length > 0) {
        setActivePlan(planList[0]);
        setEditedExercises(JSON.parse(JSON.stringify(planList[0].exercises || [])));
      }

      // 2. Open or get today's workout session check state
      const sessionRes = await fetch("/api/member/sessions/today/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.session) {
          setSession(sessionData.session);
        }
      }
    } catch (err: any) {
      setError(err.message || "Network loading error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [memberId]);

  // Handle marking exercise as done/incomplete
  const handleToggleExerciseCompletion = async (exerciseId: string, currentCompleted: boolean) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/member/sessions/${session.id}/exercise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, completed: !currentCompleted })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
        }
      }
    } catch (err) {
      console.error("Failed to toggle exercise completion state:", err);
    }
  };

  // Handle completing whole workout
  const handleCompleteEntireWorkout = async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/member/sessions/${session.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
          setSuccessMsg("🔋 Dynamic Workout Reported! Streak updated in Aura Leaderboard.");
          setTimeout(() => setSuccessMsg(null), 5000);
        }
      }
    } catch (err) {
      console.error("Failed to complete workout session:", err);
    }
  };

  // Add exercise to list in full editing mode
  const handleAddExerciseToPlan = () => {
    const nameToUse = searchPreset || newExerciseName.trim();
    if (!nameToUse) return;

    const newEx: MemberWorkoutExerciseDetail = {
      id: `ex-${Math.random().toString(36).substring(2, 9)}`,
      name: nameToUse,
      sets: 3,
      reps: "12",
      weight: "10 KG",
      rest: "60s",
      notes: "Custom entry note",
      coachInstructions: ""
    };

    setEditedExercises(prev => [...prev, newEx]);
    setNewExerciseName("");
    setSearchPreset("");
  };

  // Remove exercise from plan
  const handleRemoveExerciseFromPlan = (exId: string) => {
    setEditedExercises(prev => prev.filter(ex => ex.id !== exId));
  };

  // Reordering exercises
  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= editedExercises.length) return;

    const updated = [...editedExercises];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setEditedExercises(updated);
  };

  // Duplicate entire workout plan Split
  const handleDuplicatePlanSplit = async () => {
    if (!activePlan) return;
    try {
      const res = await fetch("/api/member/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: activePlan.memberId,
          title: `${activePlan.title} (Clone split)`,
          editPermission: activePlan.editPermission,
          exercises: activePlan.exercises,
          startDate: activePlan.startDate,
          endDate: activePlan.endDate
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg("📋 Split duplicated successfully! Switch plan below to view.");
        loadData();
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        const errData = await res.json();
        setError(`Failed to duplicate: ${errData.error}`);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Save changes to backend
  const handleSavePlanEdits = async () => {
    if (!activePlan) return;
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/member/workouts/${activePlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercises: editedExercises,
          title: activePlan.title,
          changeNote: "Member updated training split configuration values"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.plan) {
          setActivePlan(data.plan);
          setEditedExercises(JSON.parse(JSON.stringify(data.plan.exercises || [])));
          setIsEditingPlan(false);
          setSuccessMsg("💪 Workout Plan updated! Original reserved in historical rollback logs.");
          loadData();
          setTimeout(() => setSuccessMsg(null), 5000);
        }
      } else {
        const errData = await res.json();
        setError(`Failed to save edits: ${errData.error || "Mismatched access control restrictions"}`);
      }
    } catch (err: any) {
      setError(err.message || "Network updating server issue");
    }
  };

  // Restore chronological plan version logs
  const handleRestoreBackupVersion = async (versionId: string) => {
    if (!activePlan) return;
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/member/workouts/${activePlan.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.plan) {
          setActivePlan(data.plan);
          setEditedExercises(JSON.parse(JSON.stringify(data.plan.exercises || [])));
          setSuccessMsg("🔄 Plan split restored to selected version state successfully!");
          loadData();
          setTimeout(() => setSuccessMsg(null), 5000);
        }
      } else {
        const errData = await res.json();
        setError(`Restoration blocked: ${errData.error}`);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="h-8 w-8 animate-spin border-4 border-red-650 border-red-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="font-mono text-xs text-neutral-400 uppercase">Synchronizing Aura Workout Vault Registers...</p>
      </div>
    );
  }

  const editPermission = activePlan?.editPermission || "full";
  const isCompletedToday = session?.status === "workout_completed";
  const completedCount = session?.completedExercises?.length || 0;
  const totalExercises = activePlan?.exercises?.length || 0;
  const progressPercent = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in text-neutral-100 pb-12">
      
      {/* ERROR / SUCCESS ALERTS */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Lock className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce-slow">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* OVERALL PROGRESS & DYNAMIC STATUS */}
      {activePlan && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
          {/* Subtle glowing radial background */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Split Metrics */}
            <div className="md:col-span-7 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-red-500 font-black uppercase tracking-widest block font-display">Active Gym Plan</span>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">{activePlan.title}</h2>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-950/80 border border-neutral-800 text-[10px] font-extrabold uppercase rounded-full text-neutral-300">
                    {editPermission === "locked" ? (
                      <>
                        <Lock className="h-3 w-3 text-red-500 animate-pulse" />
                        <span className="text-red-400">Coach Locked</span>
                      </>
                    ) : editPermission === "limited" ? (
                      <>
                        <Eye className="h-3 w-3 text-cyan-400" />
                        <span className="text-cyan-400">Limited Editing</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Full Editing</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-neutral-400 font-medium">Valid from <span className="text-neutral-200 font-semibold font-mono">{activePlan.startDate}</span> to <span className="text-red-400 font-semibold font-mono">{activePlan.endDate}</span></p>
              </div>

              {/* Progress gauge metrics */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase">
                  <span className="text-neutral-400 font-semibold flex items-center gap-1.5"><Activity className="h-4 w-4 text-red-500" />Today's Routine Accomplishment</span>
                  <span className="text-white font-mono">{completedCount} of {totalExercises} exercises ({progressPercent}%)</span>
                </div>
                <div className="w-full bg-neutral-950 h-3 rounded-full overflow-hidden border border-neutral-850/30">
                  <div className="bg-red-655 bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Completion Circular Ring representation */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-neutral-950/40 rounded-2xl border border-neutral-850/20 text-center gap-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Daily Compliance Tracker</span>
              {isCompletedToday ? (
                <div className="space-y-2">
                  <span className="inline-flex h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 items-center justify-center font-black animate-pulse">✓</span>
                  <div>
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider block">Log Sheet Completed!</span>
                    <span className="text-[10px] text-neutral-500">Attendance updated at {session?.completedAt ? new Date(session.completedAt).toLocaleTimeString() : ""}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 w-full">
                  <button
                    disabled={completedCount === 0}
                    onClick={handleCompleteEntireWorkout}
                    className={`w-full py-3 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      completedCount > 0 
                        ? "bg-red-600 hover:bg-red-700 text-black shadow-lg" 
                        : "bg-neutral-850 text-neutral-500 cursor-not-allowed border border-neutral-800"
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    Complete Daily Workout Goal
                  </button>
                  <p className="text-[9.5px] text-neutral-500 leading-normal">
                    {completedCount === 0 ? "Perform and toggle at least one exercise step to report overall split completion." : "Awesome progress! Mark workout completed to gain XP."}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* WORKOUT DAY PLAN EXERCISES SHEETS CONTROLLER */}
      {activePlan && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-neutral-800 pb-4">
            <div className="space-y-1">
              <h3 className="text-md font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                Scheduled Movements List
              </h3>
              <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Tap exercise block to toggle detailed coaching guides and demo URLs</p>
            </div>
            
            {/* Plan management buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDuplicatePlanSplit}
                className="bg-neutral-950 hover:bg-neutral-850 text-neutral-300 hover:text-white px-3 py-2 text-[10px] font-extrabold uppercase rounded-lg border border-neutral-850 flex items-center gap-1.5 cursor-pointer select-none"
              >
                <Copy className="h-3.5 w-3.5" />
                Clone Plan
              </button>

              {editPermission !== "locked" && (
                <>
                  {!isEditingPlan ? (
                    <button
                      onClick={() => {
                        setIsEditingPlan(true);
                        setEditedExercises(JSON.parse(JSON.stringify(activePlan.exercises || [])));
                      }}
                      className="bg-red-600 hover:bg-red-700 text-black px-4 py-2 text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md select-none"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      Edit Training Split
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSavePlanEdits}
                        className="bg-emerald-500 hover:bg-emerald-600 text-black px-3.5 py-2 text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md select-none"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save Split Configuration
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingPlan(false);
                          setEditedExercises(JSON.parse(JSON.stringify(activePlan.exercises || [])));
                          setError(null);
                        }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-2 text-[10px] font-extrabold uppercase rounded-lg cursor-pointer select-none"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ACTIVE EDITING INTERFACE OR PROGRESS SHEET VIEWER */}
          {isEditingPlan ? (
            <div className="space-y-6">
              
              {/* Add exercise sub-panel inside Split Creator */}
              {editPermission === "full" ? (
                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850/60 space-y-3.5">
                  <span className="text-[10px] text-red-500 font-black uppercase tracking-wider block">Add Exercises & Movements split:</span>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[9px] text-neutral-500 uppercase font-black">Preset Library Selector:</label>
                      <select
                        value={searchPreset}
                        onChange={(e) => {
                          setSearchPreset(e.target.value);
                          if (e.target.value) setNewExerciseName("");
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white p-2 text-semibold placeholder-neutral-700 rounded-xl focus:outline-none focus:border-red-500"
                      >
                        <option value="">-- Choose Preset Exercise --</option>
                        {EXERCISE_PRESETS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-5 space-y-1">
                      <label className="text-[9px] text-neutral-500 uppercase font-black">Or Type Custom Movement Name:</label>
                      <input
                        type="text"
                        value={newExerciseName}
                        onChange={(e) => {
                          setNewExerciseName(e.target.value);
                          if (e.target.value) setSearchPreset("");
                        }}
                        placeholder="e.g. Romanian Deadlifts"
                        className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white p-2 placeholder-neutral-750 placeholder-neutral-600 rounded-xl focus:outline-none focus:border-red-500 font-semibold"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <button
                        type="button"
                        onClick={handleAddExerciseToPlan}
                        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-800 text-[10px] font-black uppercase py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Append Step
                      </button>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-neutral-950 border border-neutral-850/40 rounded-xl flex items-center gap-2.5 text-[11px] font-semibold text-cyan-400">
                  <Eye className="h-4 w-4 shrink-0" />
                  <span>Limited Edit Permission configuration: You can adjust parameters but cannot modify workout layout or delete movements split sequence.</span>
                </div>
              )}

              {/* Editable exercises list */}
              <div className="space-y-3.5">
                {editedExercises.map((ex, idx) => (
                  <div key={ex.id} className="p-4 bg-neutral-950/60 border border-neutral-800 hover:border-neutral-800/80 rounded-2xl flex flex-col md:flex-row justify-between gap-4">
                    
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] font-black h-6 w-6 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-white text-xs font-black uppercase tracking-tight">{ex.name}</span>
                      </div>

                      {/* Inputs grids */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        
                        <div className="space-y-1">
                          <label className="text-[9px] text-neutral-500 uppercase font-bold block">Sets Volume:</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={ex.sets}
                            disabled={editPermission === "locked"}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEditedExercises(prev => prev.map(item => item.id === ex.id ? { ...item, sets: val } : item));
                            }}
                            className="w-full bg-neutral-900 border border-neutral-850 text-xs p-1.5 focus:outline-none text-white font-mono rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-neutral-500 uppercase font-bold block">Target Reps:</label>
                          <input
                            type="text"
                            value={ex.reps}
                            disabled={editPermission === "locked"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedExercises(prev => prev.map(item => item.id === ex.id ? { ...item, reps: val } : item));
                            }}
                            className="w-full bg-neutral-900 border border-neutral-850 text-xs p-1.5 focus:outline-none text-white font-mono rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-neutral-500 uppercase font-bold block">Weight Metric:</label>
                          <input
                            type="text"
                            value={ex.weight}
                            disabled={editPermission === "locked"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedExercises(prev => prev.map(item => item.id === ex.id ? { ...item, weight: val } : item));
                            }}
                            className="w-full bg-neutral-900 border border-neutral-850 text-xs p-1.5 focus:outline-none text-white font-mono rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-neutral-500 uppercase font-bold block">Rest Interval:</label>
                          <input
                            type="text"
                            value={ex.rest}
                            disabled={editPermission === "locked"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedExercises(prev => prev.map(item => item.id === ex.id ? { ...item, rest: val } : item));
                            }}
                            className="w-full bg-neutral-900 border border-neutral-850 text-xs p-1.5 focus:outline-none text-white font-mono rounded-lg"
                          />
                        </div>

                      </div>

                      {/* Notes input */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-neutral-550 text-neutral-500 uppercase font-bold block">Personal Notes / Workout Log Comments:</label>
                        <input
                          type="text"
                          value={ex.notes || ""}
                          placeholder="e.g. Felt a bit heavy today, focus on breathing"
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditedExercises(prev => prev.map(item => item.id === ex.id ? { ...item, notes: val } : item));
                          }}
                          className="w-full bg-neutral-900 border border-neutral-850 text-xs p-2 text-white placeholder-neutral-700 rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Controls alignment buttons */}
                    <div className="flex md:flex-col items-center justify-end gap-2.5">
                      {editPermission === "full" && (
                        <>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveExercise(idx, "up")}
                              className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 h-7 w-7 rounded-lg text-xs font-bold text-neutral-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed select-none"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={idx === editedExercises.length - 1}
                              onClick={() => handleMoveExercise(idx, "down")}
                              className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 h-7 w-7 rounded-lg text-xs font-bold text-neutral-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed select-none"
                            >
                              ▼
                            </button>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveExerciseFromPlan(ex.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 h-8 w-8 rounded-lg flex items-center justify-center border border-red-500/20 transition-all select-none cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ) : (
            /* NON-EDITING WORKOUT PLAYBACK PANEL LIST */
            <div className="space-y-3">
              {activePlan.exercises?.length === 0 ? (
                <div className="py-12 text-center bg-neutral-950 rounded-2xl border border-dashed border-neutral-800 space-y-2">
                  <Clipboard className="h-8 w-8 text-neutral-600 mx-auto" />
                  <p className="text-xs text-neutral-400 font-bold uppercase tracking-wide">No movements structured yet</p>
                  <p className="text-[10px] text-neutral-500">Enable plan editing split controls to build your daily training routine.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {activePlan.exercises?.map((ex, idx) => {
                    const isExCompleted = session?.completedExercises?.includes(ex.id) || false;
                    const isExpanded = expandedExerciseId === ex.id;

                    return (
                      <div 
                        key={ex.id} 
                        className={`p-4 bg-neutral-950 border rounded-2xl transition-all duration-300 ${
                          isExCompleted 
                            ? "border-emerald-500/20 bg-emerald-500/[0.02] bg-neutral-950" 
                            : "border-neutral-850 hover:border-neutral-800"
                        }`}
                      >
                        <div className="flex justify-between items-start md:items-center gap-4">
                          <div className="flex gap-3.5 items-start">
                            
                            {/* Checkbox trigger to toggle step completion */}
                            <button
                              type="button"
                              onClick={() => handleToggleExerciseCompletion(ex.id, isExCompleted)}
                              className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer mt-1 md:mt-0 select-none ${
                                isExCompleted 
                                  ? "bg-emerald-500 border-emerald-400 text-black font-black font-mono scale-105" 
                                  : "border-neutral-700 hover:border-red-500"
                              }`}
                            >
                              {isExCompleted ? "✓" : ""}
                            </button>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono text-neutral-5050 text-neutral-500">#{idx+1}</span>
                                <h4 className={`text-xs md:text-sm font-black uppercase tracking-tight ${isExCompleted ? "line-through text-neutral-500" : "text-white"}`}>
                                  {ex.name}
                                </h4>
                              </div>
                              
                              {/* Volume metrics */}
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400 font-semibold uppercase">
                                <span className="text-red-400 font-mono font-bold leading-normal">{ex.sets} Sets</span>
                                <span className="text-neutral-500 font-bold leading-normal">•</span>
                                <span className="font-mono">{ex.reps} Reps</span>
                                <span className="text-neutral-500 font-bold leading-normal">•</span>
                                <span className="font-mono text-neutral-200">{ex.weight}</span>
                                {ex.rest && (
                                  <>
                                    <span className="text-neutral-500 font-bold leading-normal">•</span>
                                    <span className="font-mono text-amber-500">Rest: {ex.rest}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expansion arrow button */}
                          <button
                            onClick={() => setExpandedExerciseId(isExpanded ? null : ex.id)}
                            className="p-1 text-neutral-500 hover:text-white transition-all select-none cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>

                        {/* Collapsible coaching guidelines panel */}
                        {isExpanded && (
                          <div className="mt-4 pt-3 border-t border-neutral-900 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold uppercase animate-fade-in">
                            
                            <div className="space-y-2 bg-neutral-900/40 p-3 rounded-xl border border-neutral-850/20">
                              <span className="text-[9px] text-red-400 font-black tracking-wider flex items-center gap-1"><FileText className="h-3.5 w-3.5" />Personal Notes / Instructions:</span>
                              <p className="text-neutral-300 normal-case leading-relaxed font-sans">{ex.notes || "No custom logs configured. Open plan editor Split to add training details."}</p>
                            </div>

                            <div className="space-y-2 bg-neutral-900/40 p-3 rounded-xl border border-neutral-850/20 text-neutral-300">
                              <span className="text-[9px] text-red-400 font-black tracking-wider flex items-center gap-1"><Camera className="h-3.5 w-3.5" />Gym Coach Manual:</span>
                              <p className="normal-case leading-relaxed font-sans text-neutral-400">
                                {ex.coachInstructions || `Ensure proper posture. Complete ${ex.sets} splits pacing sets within ${ex.rest || "60s"} intervals. Don't skip target weights.`}
                              </p>
                              <div className="pt-1 select-none">
                                <a 
                                  href={`https://musclewiki.com/exercises?search=${encodeURIComponent(ex.name)}`} 
                                  referrerPolicy="no-referrer"
                                  target="_blank" 
                                  className="text-[9px] text-red-500 font-bold uppercase tracking-wider hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  View Demo Reference via MuscleWiki
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              </div>
                            </div>

                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* PLAN SPLIT HISTORICAL VERSION VAULT HANDLER */}
      {activePlan && activePlan.history && activePlan.history.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
          <div className="border-b border-neutral-800 pb-3">
            <span className="text-[9px] text-red-500 font-black uppercase tracking-widest block font-display">Archived Records Vault</span>
            <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2 mt-0.5">
              <RotateCcw className="h-4 w-4 text-red-500" />
              Chronological Plan Backup Logs
            </h3>
            <p className="text-[10px] text-neutral-500 leading-normal font-semibold mt-0.5">
              Accidental edits can be rolled back instantly! Select structured backups to restore configuration keys safely.
            </p>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {activePlan.history.map((ver, idx) => (
              <div key={ver.versionId} className="bg-neutral-950 p-3 border border-neutral-850 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-red-400 bg-neutral-900 border border-neutral-850 px-2.5 py-0.5 rounded">
                      Ver {idx + 1}
                    </span>
                    <span className="text-white font-extrabold uppercase text-[10.5px] tracking-wide">{ver.note || "Auto Plan Backup"}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block leading-tight font-sans">
                    Archived on {new Date(ver.updatedAt).toLocaleString()} • Paced: {ver.exercises?.length || 0} Movements Split
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRestoreBackupVersion(ver.versionId)}
                  className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white px-3.5 py-2 text-[9.5px] font-black uppercase rounded-lg border border-neutral-800 transition-all select-none cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
