import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Clipboard, 
  RefreshCcw, 
  Info, 
  CheckCircle, 
  Clock, 
  Sliders, 
  Plus, 
  AlertTriangle,
  Flame,
  ChevronRight,
  BookOpen,
  Play,
  X,
  Heart
} from "lucide-react";
import { 
  Member, 
  AttendanceRecord, 
  CompetitionAttempt, 
  FitnessProfile, 
  HealthConsiderations, 
  AiConsentSettings, 
  ChatMessage, 
  AdminAiSettings,
  WorkoutPlan,
  WorkoutLog
} from "../types";
import { db } from "../firebase";
import { setDoc, doc } from "firebase/firestore";

interface LifeFitnessAiCoachProps {
  member: Member;
  attendance: AttendanceRecord[];
  attempts: CompetitionAttempt[];
}

export default function LifeFitnessAiCoach({ 
  member, 
  attendance, 
  attempts 
}: LifeFitnessAiCoachProps) {
  const memberId = member.id;

  // AI Active settings
  const [aiSettings, setAiSettings] = useState<AdminAiSettings>(() => {
    const saved = localStorage.getItem("kf_admin_ai_settings");
    return saved ? JSON.parse(saved) : {
      enabled: true,
      provider: "gemini",
      model: "gemini-3.5-flash",
      maxResponseLength: 1200,
      dailyLimitPerMember: 30,
      monthlyTokenLimit: 500000,
      systemInstructions: "You are the premium Life Fitness AI Personal Fitness Coach and Technical Exercise Consultant. Offer highly custom weightlifting, posture alignment, dietary timing, and muscle hydration routines. Suggest exact resting durations. Refuse medical diagnosis. Instruct users to consult physical instructors or doctors. Keep answers focused, clear, and highly encouraging.",
      safetyInstructions: "DO NOT suggest heavy squats if lower back injury is declared. DO NOT recommend high-intensity impact run structures if knee stiffness exists. Prioritize stretching and warmups.",
      allowBodyMeasurements: true,
      allowAttendance: true,
      allowWorkoutLogs: true,
      allowChampionships: true,
      allowHealthNotes: true,
      workoutPlanToggle: true,
      nutritionToggle: true,
      competitionToggle: true,
      retentionPeriodDays: 90
    };
  });

  // Client Chat history load/reset state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`ai_chat_${memberId}`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "ai-init",
        role: "model",
        content: `💪 **AURA-UP, ${member.fullName.split(" ")[0].toUpperCase()}!** Welcome to your premium **Life Fitness AI Coach** portal.\n\nI am synced with your active **${member.planName}** plan and gym metrics. Ask me to formulate a customized workout pattern, review physical stats, or suggest injury-safe benchpress alternatives!\n\n*How can we dominate your goals today?*`,
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Daily messaging counts
  const [dailyCount, setDailyCount] = useState<number>(() => {
    const today = new Date().toISOString().split("T")[0];
    const saved = localStorage.getItem(`ai_count_${memberId}_${today}`);
    return saved ? parseInt(saved) : 0;
  });

  // 11. AI Daily Workouts & Schedules states
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(() => {
    const saved = localStorage.getItem(`ai_gen_plan_${memberId}`);
    return saved ? JSON.parse(saved) : null;
  });

  const [schedulesList, setSchedulesList] = useState<WorkoutPlan[]>(() => {
    const saved = localStorage.getItem(`ai_scheds_${memberId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [loggedHistory, setLoggedHistory] = useState<WorkoutLog[]>(() => {
    const saved = localStorage.getItem(`ai_log_hist_${memberId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Workout generator form states
  const [genTargetMuscle, setGenTargetMuscle] = useState("Full Body");
  const [genPlanGoal, setGenPlanGoal] = useState("Hypertrophy / Muscle Gain");
  const [genPlanDuration, setGenPlanDuration] = useState(60);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Active workout logger modal states
  const [showLoggerModal, setShowLoggerModal] = useState(false);
  const [logWorkoutName, setLogWorkoutName] = useState("");
  const [logDifficulty, setLogDifficulty] = useState(5);
  const [logEnergy, setLogEnergy] = useState(7);
  const [logDuration, setLogDuration] = useState(60);
  const [logCalories, setLogCalories] = useState(400);
  const [logPainNotes, setLogPainNotes] = useState("");
  const [logGenNotes, setLogGenNotes] = useState("");
  const [logInputExercises, setLogInputExercises] = useState<{name: string, weight: number, sets: number, reps: number, completed: boolean}[]>([
    { name: "Chest Press Bench", weight: 60, sets: 4, reps: 10, completed: true },
    { name: "Incline Dumbbell Flyes", weight: 16, sets: 3, reps: 12, completed: true },
    { name: "Tricep Overhead Extension", weight: 24, sets: 4, reps: 10, completed: true }
  ]);

  // Sync state hooks
  useEffect(() => {
    localStorage.setItem(`ai_chat_${memberId}`, JSON.stringify(messages));
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, memberId]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(`ai_count_${memberId}_${today}`, dailyCount.toString());
  }, [dailyCount, memberId]);

  useEffect(() => {
    localStorage.setItem(`ai_gen_plan_${memberId}`, JSON.stringify(generatedPlan));
  }, [generatedPlan, memberId]);

  useEffect(() => {
    localStorage.setItem(`ai_scheds_${memberId}`, JSON.stringify(schedulesList));
  }, [schedulesList, memberId]);

  useEffect(() => {
    localStorage.setItem(`ai_log_hist_${memberId}`, JSON.stringify(loggedHistory));
  }, [loggedHistory, memberId]);

  // Load auxiliary settings
  const getPersonalizedContext = () => {
    const today = new Date().toISOString().split("T")[0];
    const fitnessProfile: FitnessProfile = JSON.parse(localStorage.getItem(`fit_prof_${memberId}`) || "{}");
    const healthAndSafety: HealthConsiderations = JSON.parse(localStorage.getItem(`health_safety_${memberId}`) || "{}");
    const consentSettings: AiConsentSettings = JSON.parse(localStorage.getItem(`consent_${memberId}`) || "{}");
    const measurements: any[] = JSON.parse(localStorage.getItem(`measurements_${memberId}`) || "[]");

    const daysRemaining = Math.max(0, Math.ceil((new Date(member.expiryDate).getTime() - Date.now()) / (86400 * 1000)));

    // Measurement summaries
    const measurementsLogs = consentSettings.bodyMeasurements 
      ? measurements.slice(0, 8).map(m => ({ type: m.measurementType, val: m.value, unit: m.unit, logged: m.createdAt }))
      : [];

    return {
      fullName: member.fullName,
      gender: member.gender,
      planName: member.planName,
      membershipStatus: member.membershipStatus,
      expiryDate: member.expiryDate,
      remainingDays: daysRemaining,
      weight: fitnessProfile.weight,
      height: fitnessProfile.height,
      targetWeight: fitnessProfile.targetWeight,
      targetDate: fitnessProfile.targetDate,
      fitnessGoals: fitnessProfile.fitnessGoals,
      experienceLevel: fitnessProfile.experienceLevel,
      trainingStyle: fitnessProfile.trainingStyle,
      workoutDuration: fitnessProfile.workoutDuration,
      workoutDays: fitnessProfile.workoutDays,
      allowedEquipment: fitnessProfile.availableEquipment?.join(", "),
      restrictionsEnabled: consentSettings.healthConsiderations || !!member.medicalNotes,
      healthConsiderations: {
        ...(consentSettings.healthConsiderations ? healthAndSafety : {}),
        profileMedicalNotes: member.medicalNotes || ""
      },
      disclaimerAccepted: healthAndSafety.disclaimerAccepted,
      attendanceHistory: consentSettings.attendance ? attendance.slice(0, 10) : [],
      measurementSummary: measurementsLogs,
      competitionSummary: consentSettings.competitionHistory ? attempts : []
    };
  };

  // Submit chat query
  const handleSendMessage = async (textToSend?: string) => {
    if (!aiSettings.enabled) {
      alert("The Life Fitness AI assistant is currently disabled by administrators.");
      return;
    }

    const messageContent = textToSend || inputMessage;
    if (!messageContent.trim()) return;

    // Credit consumption checking
    if (dailyCount >= aiSettings.dailyLimitPerMember) {
      alert(`⚠️ Messaging limit reached. You have completed your allocated ${aiSettings.dailyLimitPerMember} daily conversational tokens. Limits reset at midnight.`);
      return;
    }

    // Set local loading
    setInputMessage("");
    setIsLoading(true);
    setErrorMessage(null);

    const userMsg: ChatMessage = {
      id: `chat-usr-${Date.now()}`,
      role: "user",
      content: messageContent,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setDailyCount(prev => prev + 1);

    try {
      // Gather dynamic context
      const memberContext = getPersonalizedContext();
      
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageContent,
          history: messages.slice(-10), // Pass recent conversation context
          context: memberContext,
          systemInstruction: `${aiSettings.systemInstructions}\n\nSafety Parameters:\n${aiSettings.safetyInstructions}`
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "An abnormal response from Gemini service.");
      }

      const aiMsg: ChatMessage = {
        id: `chat-ai-${Date.now()}`,
        role: "model",
        content: data.text,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Unable to establish stable telemetry with premium AI servers.");
      // Rollback prompt limit consumption on fail
      setDailyCount(prev => Math.max(0, prev - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm("Do you want to clear your Life Fitness AI conversational logs history?")) {
      setMessages([
        {
          id: "ai-init",
          role: "model",
          content: `💪 **REBOOTED!** Chat history successfully vaporized. Let's start clean.\n\n*What is on your muscle agenda today?*`,
          createdAt: new Date().toISOString()
        }
      ]);
      triggerFeedbackNotification("Conversational database cleared!");
    }
  };

  const handleSaveExerciseFromCoach = async (data: any) => {
    try {
      const docId = `${member.id}_${data.id}`;
      await setDoc(doc(db, "savedExercises", docId), {
        id: docId,
        memberId: member.id,
        provider: "musclewiki",
        externalExerciseId: data.id,
        exerciseName: data.name,
        primaryMuscles: [data.muscle || "General"],
        category: data.equipment || "General",
        difficulty: data.difficulty || "Beginner",
        savedAt: new Date().toISOString(),
        personalNote: `Recommended by AI: ${data.reason}`
      });
      triggerFeedbackNotification(`Saved ${data.name} to bookmarks!`);
    } catch (err) {
      console.error(err);
      triggerFeedbackNotification("Failed to bookmark from assistant.");
    }
  };

  // Modern direct regex parser for custom markdown markup blocks
  const renderMarkdownContent = (text: string) => {
    // Escape simple tags, then parse bold (**), bullet points, and headers
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Support dynamic high-fidelity athletic interactive card blocks
      if (trimmed.startsWith("[EXERCISE:") && trimmed.endsWith("]")) {
        try {
          const jsonStr = trimmed.slice(10, -1);
          const data = JSON.parse(jsonStr);
          return (
            <div key={idx} className="bg-neutral-900 border border-red-500/30 hover:border-red-500 rounded-2xl p-4 my-3 text-xs space-y-3 shadow-lg transition-all">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="text-red-500 font-extrabold text-[9px] uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded border border-red-950/20">{data.equipment || data.category || "Exercise"}</span>
                  <h4 className="text-white font-extrabold text-sm uppercase mt-1.5 leading-snug">{data.name}</h4>
                  <p className="text-neutral-400 text-[10px] uppercase font-bold mt-0.5">Target: {data.muscle || "General"}</p>
                </div>
                <button 
                  onClick={() => handleSaveExerciseFromCoach(data)}
                  className="bg-neutral-950 hover:bg-neutral-800 text-red-500 p-2 rounded-xl border border-neutral-850/60 transition-all flex items-center justify-center cursor-pointer shadow-md"
                  title="Bookmark Exercise"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>
              </div>
              <div className="bg-neutral-955 bg-neutral-950 p-2.5 rounded-lg border border-neutral-850 text-neutral-350 leading-relaxed font-semibold">
                <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest block mb-1">Reason Recommended:</span>
                "{data.reason}"
              </div>
            </div>
          );
        } catch (ex) {
          console.error("Failed to parse custom tag JSON:", ex);
        }
      }
      
      // Bold bullet highlights
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const payload = trimmed.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-neutral-300 leading-relaxed mb-1.5 font-semibold">
            {renderBoldText(payload)}
          </li>
        );
      }

      // Headers formats
      if (trimmed.startsWith("### ")) {
        return (
          <h5 key={idx} className="text-red-500 font-extrabold uppercase text-[11px] tracking-wider mt-4 mb-2">
            {trimmed.substring(4)}
          </h5>
        );
      }
      if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
        return (
          <h4 key={idx} className="text-white font-black uppercase text-xs tracking-widest mt-5 mb-2.5 pb-1 border-b border-neutral-850">
            {trimmed.replace(/^#+\s+/, "")}
          </h4>
        );
      }

      // Default lines formatting
      return (
        <p key={idx} className="text-xs text-neutral-300 leading-relaxed mb-3 font-semibold">
          {renderBoldText(line)}
        </p>
      );
    });
  };

  const renderBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-red-500 font-black">{part}</strong>;
      }
      return part;
    });
  };

  // Workout planning trigger (custom prompt)
  const handleGenerateAiWorkout = async () => {
    setIsGeneratingPlan(true);
    setErrorMessage(null);

    const fitProf: FitnessProfile = JSON.parse(localStorage.getItem(`fit_prof_${memberId}`) || "{}");
    const allowed = fitProf.availableEquipment?.join(", ") || "Free weights, standard bench alignment";

    const promptText = `GENERATE WORKOUT SCHEDULE PLAN FILE:
Target Muscle focus: ${genTargetMuscle}
Routine Style target: ${genPlanGoal}
Planned workout length/duration: ${genPlanDuration} minutes
Allowed equipment limits: ${allowed}

Provide a fully detailed workout schema plan inside JSON format block for parsing, keeping schema like this:
{
  "title": "Clean concise muscle title",
  "goal": "Focus targeted description",
  "warmUp": "concise warm up instructions",
  "exercises": [
    { "name": "Exercise name", "sets": 4, "reps": "10-12 reps", "rest": "60 sec", "equipment": "required machine", "notes": "form pointers" }
  ],
  "coolDown": "cooldown details",
  "safetyNote": "precautions"
}

Do not include any descriptive chatter before/after, only return valid raw JSON matching this schema so I can parse it cleanly.`;

    try {
      const apiKey = localStorage.getItem("temp_api_key") || ""; // fallback
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptText,
          context: getPersonalizedContext(),
          systemInstruction: "You are a JSON compiler. Return only valid raw JSON conforming strictly to the requested schema. No front/end text blocks."
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to parse JSON from AI engine.");

      // Clean markdown tags if returned
      let cleanedText = data.text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsedPlan = JSON.parse(cleanedText);
      const outputPlan: WorkoutPlan = {
        id: `wp-${Date.now()}`,
        memberId,
        title: parsedPlan.title || `${genTargetMuscle} Smash`,
        goal: parsedPlan.goal || genPlanGoal,
        warmUp: parsedPlan.warmUp || "5 mins dynamic stretching",
        exercises: parsedPlan.exercises || [],
        coolDown: parsedPlan.coolDown || "3 mins recovery breaths",
        safetyNote: parsedPlan.safetyNote || "Control eccentrics fully.",
        estimatedDuration: genPlanDuration,
        createdAt: new Date().toISOString()
      };

      setGeneratedPlan(outputPlan);
      triggerFeedbackNotification(`AI successfully generated: ${outputPlan.title}!`);
    } catch (err: any) {
      console.error(err);
      alert("AI compiler was busy formulating configurations. Creating a structured hyper-plan manually inside instead.");
      
      // Seed robust backup plan
      const backupPlan: WorkoutPlan = {
        id: `wp-${Date.now()}`,
        memberId,
        title: `${genPlanGoal.split(" ")[0]} ${genTargetMuscle} Hyper-Pump`,
        goal: genPlanGoal,
        warmUp: "10 minutes of low intensity cardio followed by dynamic rotational circles of target limbs.",
        exercises: [
          { name: "Incline Barbell Bench Press", sets: 4, reps: "8-10 reps", rest: "90s", equipment: "Barbell & Incline Bench", notes: "Barbell touches upper chest on decline. Explode up." },
          { name: "Cable Chest Crossovers / Flyes", sets: 3, reps: "12-15 reps", rest: "60s", equipment: "Double Cables setup", notes: "Focus on peak contraction. Squeeze for 1s at torso center." },
          { name: "Overhead Dumbbell Extension", sets: 4, reps: "10 reps", rest: "75s", equipment: "Heavier Dumbbell", notes: "Keep elbows pinned to head sides. Do not flare wide." }
        ],
        coolDown: "Decompress chest ligaments on Swiss ball. Static overhead stretching.",
        safetyNote: "If shoulders feel excessive load, switch bench angle lower.",
        estimatedDuration: genPlanDuration,
        createdAt: new Date().toISOString()
      };
      setGeneratedPlan(backupPlan);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSaveToSchedule = () => {
    if (!generatedPlan) return;
    
    const exists = schedulesList.find(s => s.title === generatedPlan.title);
    if (exists) {
      alert("This routine is already pinned in your active lists.");
      return;
    }

    const pinnedPlan = { ...generatedPlan, savedToSchedule: true };
    setSchedulesList(prev => [pinnedPlan, ...prev]);
    triggerFeedbackNotification("Routine added to your goal schedule calendar!");
  };

  const handleLaunchLoggerMod = (plan: WorkoutPlan) => {
    setLogWorkoutName(plan.title);
    const mapped = plan.exercises.map(e => ({
      name: e.name,
      weight: 40,
      sets: e.sets,
      reps: parseInt(e.reps) || 12,
      completed: true
    }));
    setLogInputExercises(mapped);
    setShowLoggerModal(true);
  };

  const handleSubmitWorkoutLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logWorkoutName.trim()) return;

    const newLog: WorkoutLog = {
      id: `w-log-${Date.now()}`,
      memberId,
      date: new Date().toISOString().split("T")[0],
      workoutName: logWorkoutName,
      exercises: logInputExercises,
      duration: logDuration,
      difficultyRating: logDifficulty,
      energyLevel: logEnergy,
      notes: logGenNotes.trim() || undefined,
      painOrDiscomfort: logPainNotes.trim() || undefined,
      completed: true,
      caloriesBurned: logCalories
    };

    setLoggedHistory(prev => [newLog, ...prev]);
    setShowLoggerModal(false);
    triggerFeedbackNotification(`Logged workout: ${newLog.workoutName}! Gym stats updated.`);
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedulesList(prev => prev.filter(s => s.id !== id));
    triggerFeedbackNotification("Removed scheduled routine template.");
  };

  const handleDeleteLog = (id: string) => {
    if (window.confirm("Permanently wipe this workout registration from your archives?")) {
      setLoggedHistory(prev => prev.filter(l => l.id !== id));
      triggerFeedbackNotification("Log wiped.");
    }
  };

  const [notifText, setNotifText] = useState<string | null>(null);
  const triggerFeedbackNotification = (txt: string) => {
    setNotifText(txt);
    setTimeout(() => {
      setNotifText(null);
    }, 4000);
  };

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row max-w-6xl mx-auto w-full relative">
      
      {/* Toast Feedback */}
      {notifText && (
        <div className="absolute top-4 right-4 z-50 bg-red-655 bg-red-600 text-black font-black uppercase text-xs px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-red-500/25 animate-bounce">
          <CheckCircle className="h-4 w-4" />
          {notifText}
        </div>
      )}

      {/* LEFT: THE CHAT INTERFACE */}
      <div className="flex-1 border-b lg:border-b-0 lg:border-r border-neutral-900 flex flex-col h-[70vh] min-h-[500px]">
        {/* Chat upper rail */}
        <div className="bg-neutral-900 p-4 border-b border-neutral-850 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-650/10 border border-red-500/20 flex items-center justify-center animate-pulse">
              <Bot className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-white font-black uppercase text-xs tracking-wider flex items-center gap-1.5">
                Life Fitness Coach
                <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-ping" />
              </h3>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Secure Gemini 3.5 AI Protocol</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span className="font-mono text-neutral-400 font-extrabold uppercase">
              Credits: <span className="text-red-500">{dailyCount}</span> / {aiSettings.dailyLimitPerMember} used
            </span>
            <button
              onClick={handleResetChat}
              className="p-1 px-2.5 bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg flex items-center gap-1 transition-all cursor-pointer font-bold uppercase text-[9px]"
              title="Reset Logs"
            >
              <Trash2 className="h-3 w-3" />
              Reset logs
            </button>
          </div>
        </div>

        {/* Message Bubble Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-none bg-neutral-950/30">
          {messages.map((msg, i) => {
            const isAi = msg.role === "model";
            return (
              <div 
                key={msg.id} 
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                  isAi 
                    ? "bg-neutral-900 text-neutral-200 border border-neutral-850 self-start mr-auto" 
                    : "bg-red-600 text-black font-semibold self-end ml-auto"
                }`}
              >
                {isAi ? (
                  <div>{renderMarkdownContent(msg.content)}</div>
                ) : (
                  <p className="text-xs leading-relaxed font-bold">{msg.content}</p>
                )}
                <span className={`text-[8px] block mt-2 text-right ${isAi ? "text-neutral-500 font-bold" : "text-neutral-700 font-black"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })}

          {isLoading && (
            <div className="bg-neutral-900 border border-neutral-850 text-neutral-200 rounded-2xl p-4 self-start mr-auto max-w-[85%] flex items-center gap-3 shadow-md">
              <RefreshCcw className="h-4 w-4 animate-spin text-red-500" />
              <span className="text-xs font-black uppercase text-neutral-400 tracking-wider animate-pulse">Formulating personalized regime...</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-950/25 border border-red-500/20 p-4 rounded-2xl text-xs text-red-500 flex items-start gap-2 max-w-[85%]">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-extrabold uppercase text-[10px] tracking-wider">AI Telegraph Failures</p>
                <p className="mt-1 leading-relaxed font-semibold">{errorMessage}</p>
              </div>
            </div>
          )}

          <div ref={messageEndRef} />
        </div>

        {/* Action Suggestion Chips */}
        <div className="px-4 py-2 bg-neutral-950 border-t border-neutral-900 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {[
            { tag: "Chest hypertrophy planning", text: "Draft a customized chest/triceps workout plan focused on hypertrophy." },
            { tag: "Diet timing rules", text: "What is the best nutrient timing for pre- and post-workout meals?" },
            { tag: "Review weights progress", text: "Review my physical body measurement logs and tell me if I am making safe progress." },
            { tag: "Injury-safe routines", text: "What are some warmups and exercises I should use to safely train shoulders?" }
          ].map((chip, k) => (
            <button
              key={k}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(chip.text)}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850/50 text-[10px] font-black uppercase tracking-wider text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              🚀 {chip.tag}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="p-3 bg-neutral-900 border-t border-neutral-850 flex gap-2 shrink-0">
          <input
            type="text"
            placeholder={dailyCount >= aiSettings.dailyLimitPerMember ? "Allocated credentials depleted" : "Ask premium coach... (e.g., Construct active recovery block)"}
            disabled={isLoading || dailyCount >= aiSettings.dailyLimitPerMember}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
          />
          <button
            type="button"
            disabled={isLoading || !inputMessage.trim() || dailyCount >= aiSettings.dailyLimitPerMember}
            onClick={() => handleSendMessage()}
            className="h-10.5 w-10.5 bg-red-655 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-black flex items-center justify-center rounded-xl transition-all cursor-pointer shrink-0"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* RIGHT: ACTIVE SCHEDULER & WORKOUT PLANNERS */}
      <div className="w-full lg:w-96 bg-neutral-950 p-5 space-y-6 overflow-y-auto max-h-[70vh]">
        
        {/* Workout Planner Form block */}
        <div className="bg-neutral-900 border border-neutral-850 p-4.5 rounded-3xl space-y-4">
          <h3 className="text-white font-black uppercase text-xs tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-red-500 animate-pulse" />
            AI Workout Hyper-Compiler
          </h3>
          <p className="text-[10px] text-neutral-500 font-semibold leading-normal">Generate bespoke weightlifting matrices. Plans are customized to physical constraints and allowed plan machinery.</p>

          <div className="space-y-3.5">
            <div>
              <label className="text-neutral-400 text-[9px] font-black uppercase block mb-1">Target Muscle Group:</label>
              <select
                value={genTargetMuscle}
                onChange={(e) => setGenTargetMuscle(e.target.value)}
                className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none"
              >
                <option value="Full Body">Full Body (General Conditioning)</option>
                <option value="Chest & Triceps">Chest & Triceps (Push Matrix)</option>
                <option value="Back & Biceps">Back & Biceps (Pull Matrix)</option>
                <option value="Shoulders & Arms">Shoulders & Arms (Upper Framing)</option>
                <option value="Legs & Abs">Legs & Abs (Lower Base)</option>
                <option value="Cardio & Core">Cardio & Core (Fat Loss Sweep)</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 text-[9px] font-black uppercase block mb-1">Planned Goal Preference:</label>
              <select
                value={genPlanGoal}
                onChange={(e) => setGenPlanGoal(e.target.value)}
                className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none"
              >
                <option value="Hypertrophy / Muscle Gain">Hypertrophy (Muscle Expansion)</option>
                <option value="Maximum Strength Gain">Strength (Heavy Compression)</option>
                <option value="Endurance & Vascularity">Endurance (Vascular Pacing)</option>
                <option value="Fat Loss / Calorie Deficit">Fat Deficit (Explosive Sweeps)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-neutral-400 text-[9px] font-black uppercase block mb-1">Duration (Min):</label>
                <input
                  type="number"
                  min="20"
                  max="120"
                  value={genPlanDuration}
                  onChange={(e) => setGenPlanDuration(parseInt(e.target.value) || 60)}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={isGeneratingPlan}
                  onClick={handleGenerateAiWorkout}
                  className="w-full h-9.5 bg-red-655 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 text-black font-black uppercase text-[10px] tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isGeneratingPlan ? (
                    <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                  Synthesize
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Display newly generated plan if exists */}
        {generatedPlan && (
          <div className="bg-neutral-900 border border-neutral-850 p-4.5 rounded-3xl space-y-4 animate-fade-in text-xs">
            <div className="flex justify-between items-start border-b border-neutral-800 pb-2">
              <div>
                <span className="text-[8px] bg-red-650/15 border border-red-500/25 px-2 py-0.5 rounded text-red-500 font-black uppercase tracking-wider">Plan Generated</span>
                <h4 className="text-white font-black uppercase text-xs mt-1 leading-tight">{generatedPlan.title}</h4>
              </div>
              <button 
                onClick={() => setGeneratedPlan(null)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 leading-normal">
              <p className="text-neutral-400"><strong className="text-white uppercase font-bold text-[9px]">Target Goal:</strong> {generatedPlan.goal}</p>
              <p className="text-neutral-450 text-neutral-400"><strong className="text-white uppercase font-bold text-[9px]">Warm Up:</strong> {generatedPlan.warmUp}</p>
              
              <div className="space-y-2 pt-1 border-t border-neutral-850">
                <span className="text-[10px] text-white font-extrabold uppercase">Exercise Circuit Matrices:</span>
                {generatedPlan.exercises.map((ex, m) => (
                  <div key={m} className="bg-neutral-950 p-3 rounded-2xl border border-neutral-850">
                    <div className="flex justify-between font-bold text-white">
                      <span className="uppercase text-[10px]">{ex.name}</span>
                      <span className="text-red-500 font-mono text-[10px]">{ex.sets}x {ex.reps}</span>
                    </div>
                    {ex.notes && <p className="text-[9.5px] text-neutral-500 mt-1 italic leading-normal">Pointers: {ex.notes}</p>}
                    <div className="flex justify-between items-center text-[8px] text-neutral-500 font-bold uppercase tracking-wider mt-1 pt-1 border-t border-neutral-900">
                      <span>Rest: {ex.rest}</span>
                      <span>{ex.equipment}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-neutral-450 text-neutral-400"><strong className="text-white uppercase font-bold text-[9px]">Cooldown recovery:</strong> {generatedPlan.coolDown}</p>
              <p className="text-red-500 text-[10.5px] leading-relaxed"><strong className="text-white uppercase font-bold text-[9px] block">Precautions:</strong> ⚠ {generatedPlan.safetyNote}</p>

              <div className="flex gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={handleSaveToSchedule}
                  className="flex-1 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white font-extrabold uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  Pin Schedule
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchLoggerMod(generatedPlan)}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-black font-black uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  Log Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE SCHEDULED ROUTINES templates */}
        <div className="space-y-3">
          <h3 className="text-white font-black uppercase text-xs tracking-wider border-b border-neutral-900 pb-2">
            My Goal Schedules Template
          </h3>
          {schedulesList.length === 0 ? (
            <p className="text-[10px] text-neutral-500 italic py-2 text-center bg-neutral-900/10 border border-neutral-900 rounded-2xl">No schedules templates pinned.</p>
          ) : (
            schedulesList.map(s => (
              <div key={s.id} className="bg-neutral-900 border border-neutral-850 p-3.5 rounded-3xl flex justify-between items-center text-xs">
                <div>
                  <span className="text-white font-black uppercase text-[10.5px] block">{s.title}</span>
                  <span className="text-[9px] text-neutral-500 font-mono">Length: {s.estimatedDuration} mins</span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLaunchLoggerMod(s)}
                    className="p-1.5 bg-red-650/10 hover:bg-red-650/20 text-red-500 border border-red-500/20 rounded-lg cursor-pointer"
                    title="Log completed session"
                  >
                    <Play className="h-3.5 w-3.5 fill-red-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(s.id)}
                    className="p-1.5 bg-neutral-950/60 hover:bg-neutral-950 text-neutral-550 hover:text-red-500 rounded-lg cursor-pointer text-neutral-550 border border-neutral-850"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* WORKOUT REGISTRATION LOGS HISTORY */}
        <div className="space-y-3">
          <h3 className="text-white font-black uppercase text-xs tracking-wider border-b border-neutral-900 pb-2 flex items-center gap-1.5">
            <Clipboard className="h-4 w-4 text-red-500" />
            Gym Workouts Archives
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-none pr-0.5">
            {loggedHistory.length === 0 ? (
              <p className="text-[10px] text-neutral-500 italic py-4 text-center bg-neutral-900/10 border border-neutral-900 rounded-2xl">No workouts registrations checked.</p>
            ) : (
              loggedHistory.map(l => (
                <div key={l.id} className="bg-neutral-900 border border-neutral-850 p-3.5 rounded-3xl space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-white font-black uppercase text-[11px] block">{l.workoutName}</span>
                      <span className="text-[9px] text-neutral-500 font-mono">Date: {l.date} • Dur: {l.duration}m</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(l.id)}
                      className="text-neutral-500 hover:text-red-500 p-0.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1 px-2.5 py-1.5 bg-neutral-950 border border-neutral-850 rounded-2xl text-[9px] uppercase font-black text-center font-mono">
                    <div>
                      <span className="text-neutral-550 text-neutral-500 block">Diff</span>
                      <span className="text-red-550 text-red-500 text-xs block">{l.difficultyRating}/10</span>
                    </div>
                    <div>
                      <span className="text-neutral-550 text-neutral-500 block">Energy</span>
                      <span className="text-red-550 text-red-400 text-xs block">{l.energyLevel}/10</span>
                    </div>
                    <div>
                      <span className="text-neutral-550 text-neutral-500 block">Calories</span>
                      <span className="text-white text-xs block flex items-center justify-center gap-0.5">
                        <Flame className="h-3 w-3 text-red-650" />
                        {l.caloriesBurned}
                      </span>
                    </div>
                  </div>

                  {l.painOrDiscomfort && (
                    <p className="text-[10px] text-red-500 leading-normal flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>Pain: {l.painOrDiscomfort}</span>
                    </p>
                  )}
                  {l.notes && <p className="text-[10px] text-neutral-500 italic">Notes: {l.notes}</p>}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* DETAILED INTERACTIVE WORKOUT LOGGER MODAL */}
      {showLoggerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-850 pb-3">
              <div>
                <span className="text-[8px] bg-red-650/15 border border-red-500/25 px-2 py-0.5 rounded text-red-500 font-black uppercase tracking-wider">Registration Form</span>
                <h3 className="text-white font-black uppercase text-sm mt-1">Check-out Gym Session Log</h3>
              </div>
              <button 
                onClick={() => setShowLoggerModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWorkoutLog} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-neutral-400 text-[10px] font-black uppercase block mb-1">Routines / Workout Title:</label>
                <input
                  type="text"
                  required
                  value={logWorkoutName}
                  onChange={(e) => setLogWorkoutName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-neutral-9050 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              {/* Slider Difficulty Rating */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-[10px] uppercase font-black text-neutral-400 mb-1">
                    <span>Session Difficulty:</span>
                    <span className="text-red-550 text-red-500">{logDifficulty}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={logDifficulty}
                    onChange={(e) => setLogDifficulty(parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] uppercase font-black text-neutral-400 mb-1">
                    <span>Power / Energy Level:</span>
                    <span className="text-red-550 text-red-500">{logEnergy}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={logEnergy}
                    onChange={(e) => setLogEnergy(parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>
              </div>

              {/* Extra log attributes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 text-[9px] font-black uppercase block mb-1">Active Duration (Mins):</label>
                  <input
                    type="number"
                    value={logDuration}
                    onChange={(e) => setLogDuration(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 text-[9px] font-black uppercase block mb-1">Calories Burned (Est):</label>
                  <input
                    type="number"
                    value={logCalories}
                    onChange={(e) => setLogCalories(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-white font-black uppercase block mb-1">Exercises Checklist Completed:</span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {logInputExercises.map((e, index) => (
                    <div key={index} className="bg-neutral-900 p-2.5 border border-neutral-850 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={e.completed}
                          onChange={(cb) => {
                            const val = [...logInputExercises];
                            val[index].completed = cb.target.checked;
                            setLogInputExercises(val);
                          }}
                          className="accent-red-500 rounded h-4 w-4"
                        />
                        <span className="uppercase text-[10px] font-extrabold text-white">{e.name}</span>
                      </div>
                      <div className="flex gap-2 items-center text-[10px]">
                        <input
                          type="number"
                          placeholder="KG"
                          value={e.weight}
                          onChange={(co) => {
                            const val = [...logInputExercises];
                            val[index].weight = parseFloat(co.target.value) || 0;
                            setLogInputExercises(val);
                          }}
                          className="w-12 p-1 text-center bg-neutral-950 border border-neutral-800 rounded text-white"
                        />
                        <span className="text-neutral-500 uppercase font-bold text-[9px]">KG</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-neutral-400 text-[10px] font-black uppercase block mb-1">Pain, Stiff knee, Back tweaks warnings (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Mild knee stiffness on extensions"
                  value={logPainNotes}
                  onChange={(e) => setLogPainNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 text-[10px] font-black uppercase block mb-1">General Workout Notes:</label>
                <input
                  type="text"
                  placeholder="e.g. Concentrated eccentric squeeze felt amazing"
                  value={logGenNotes}
                  onChange={(e) => setLogGenNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-850 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-red-655 bg-red-600 hover:bg-red-700 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Commit Session Log
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoggerModal(false)}
                  className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold uppercase text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global simple styles */}
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
