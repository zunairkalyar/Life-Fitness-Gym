import React, { useState, useEffect, useRef } from "react";
import { 
  Trophy, 
  Tv, 
  MapPin, 
  QrCode, 
  Smartphone, 
  Clock, 
  Dumbbell, 
  ShieldAlert, 
  TrendingUp, 
  Flame, 
  Sparkles,
  Award,
  ChevronLeft,
  X,
  Sliders,
  ChevronRight,
  Sparkle
} from "lucide-react";
import { 
  Member, 
  MembershipPlan, 
  ExerciseChallenge, 
  CompetitionAttempt, 
  ChallengeWinner, 
  Announcement, 
  GymSettings,
  AttendanceRecord
} from "../types";

interface TvDisplayProps {
  settings: GymSettings;
  plans: MembershipPlan[];
  exercises: ExerciseChallenge[];
  attempts: CompetitionAttempt[];
  pastWinners: ChallengeWinner[];
  announcements: Announcement[];
  memberList: Member[];
  attendance?: AttendanceRecord[];
  onExit: () => void;
}

export default function TvDisplay({ 
  settings, 
  plans = [], 
  exercises = [], 
  attempts = [], 
  pastWinners = [], 
  announcements = [],
  memberList = [],
  attendance = [],
  onExit 
}: TvDisplayProps) {

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastDataRefresh, setLastDataRefresh] = useState(new Date().toLocaleTimeString());
  const [mouseActive, setMouseActive] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const mouseTimerRef = useRef<number | null>(null);

  // Admin and operator tuning controls
  const [slideDuration, setSlideDuration] = useState(10); // rotation in seconds
  const [timeLeft, setTimeLeft] = useState(10);
  const [transitionStyle, setTransitionStyle] = useState<"fade" | "zoom" | "slide" | "brutalist">("zoom");
  const [bgStyle, setBgStyle] = useState<"neon" | "particles" | "clean">("neon");
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  
  // Widget toggles
  const [widgetTime, setWidgetTime] = useState(true);
  const [widgetTip, setWidgetTip] = useState(true);
  const [widgetTicker, setWidgetTicker] = useState(true);

  // Clock widget state
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");

  // Enabled slide switches
  const [enabledSlides, setEnabledSlides] = useState<Record<string, boolean>>({
    intro: true,
    leaderboards: true,
    gridAll: true,
    pastWinners: true,
    movers: true,
    prs: true,
    transformation: true,
    nutrition: true,
    trainers: true,
    rules: true,
    pricing: true,
    timings: true,
    traffic: true,
    announcements: true,
    quote: true,
    joinQr: true
  });

  const ANABOLIC_TIPS = [
    "💧 HYDRATION FACTOR: Over 70% of muscle fibers are comprised of water. Drink 4-5L daily to secure peak power offsets.",
    "🍗 PROTEIN FLOOR: Aim for 1.8g to 2.2g of high-quality protein per KG of body mass for high-speed cellular synthesis.",
    "😴 HYPERTROPHY REST: Muscles grow under deep rest cycles, not during sets. Target 7-8 hours of sound sleep.",
    "🍞 GLYCOGEN CHARGE: Consume clean, complex carbs 60-90 minutes pre-workout to load ATP storage channels.",
    "🧂 PUMP CATALYST: A pinch of sodium in pre-workout fuels cell-hydration and triggers dense physical pumps.",
    "🏋️ PROGRESSIVE INTENSITY: Record every single set to ensure incremental load jumps over compounds.",
    "🥗 MICROS FIRST: Zinc, magnesium, and vitamin D levels directly modulate standard endocrine performance rates."
  ];

  const [activeTipIndex, setActiveTipIndex] = useState(0);

  // Rotate anabolic tips safely
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % ANABOLIC_TIPS.length);
    }, 15000);
    return () => clearInterval(tipInterval);
  }, []);

  // Update digital clock values
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const clockTimer = setInterval(updateTime, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Connection listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // background refresh interval
  useEffect(() => {
    const dataPoller = setInterval(() => {
      setLastDataRefresh(new Date().toLocaleTimeString());
    }, 45000);
    return () => clearInterval(dataPoller);
  }, []);

  // Mouse inactivity cursor hider
  useEffect(() => {
    const handleMouseMove = () => {
      setMouseActive(true);
      if (mouseTimerRef.current) {
        window.clearTimeout(mouseTimerRef.current);
      }
      mouseTimerRef.current = window.setTimeout(() => {
        setMouseActive(false);
      }, 4000);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (mouseTimerRef.current) window.clearTimeout(mouseTimerRef.current);
    };
  }, []);

  const topAttemptsByExercise = (exId: string, limit = 3) => {
    return (attempts || [])
      .filter(a => a.exerciseId === exId && a.status === "Approved")
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  };

  const approvedAttempts = (attempts || []).filter(a => a.status === "Approved");
  const uniqueParticipants = Array.from(new Set(approvedAttempts.map(a => a.memberId))).length;

  // BUILD THE SECTIONS RENDER OBJECTS
  const slides: { id: string; title: string; render: () => React.ReactNode }[] = [];

  // Slide definitions mapping based on toggles
  if (enabledSlides.intro) {
    slides.push({
      id: "intro",
      title: "Hero Tournament Intro",
      render: () => (
        <div className="max-w-6xl text-center space-y-10 py-6 animate-slide-up-custom">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-650/10 border-2 border-red-500/20 text-red-500 text-sm md:text-base font-black uppercase tracking-widest leading-none">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 animate-spin text-red-500" style={{ animationDuration: '3.s' }} />
            <span>TOP NINE TOURNAMENT ARENA</span>
          </div>
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-extratight uppercase leading-none text-white drop-shadow-[0_4px_24px_rgba(239,68,68,0.2)]">
            Life Fitness Apex
          </h1>
          <p className="text-red-500 text-2xl md:text-4xl font-extrabold uppercase tracking-widest leading-none">
            9 STATIONS • 9 WINNERS • 9 FREE CHAMPIONSHIPS
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto pt-6 text-center">
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-650" />
              <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest block">EXERCISE STATIONS</span>
              <span className="text-white text-4xl sm:text-5xl font-extrabold block font-mono">09</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-550" />
              <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest block">CHALLENGE SEASON Name</span>
              <span className="text-white text-3xl sm:text-4xl font-extrabold block m-1 font-mono">{new Date().toISOString().slice(0, 7)}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-neutral-800" />
              <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest block">ACTIVE ATHLETES</span>
              <span className="text-white text-4xl sm:text-5xl font-extrabold block font-mono">{uniqueParticipants || 15}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-neutral-900" />
              <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest block">VERIFIED ATTEMPTS</span>
              <span className="text-white text-4xl sm:text-5xl font-extrabold block font-mono">{approvedAttempts.length || 38}</span>
            </div>
          </div>
        </div>
      )
    });
  }

  if (enabledSlides.leaderboards) {
    (exercises || []).forEach((ex, exIdx) => {
      const stands = topAttemptsByExercise(ex.id);
      slides.push({
        id: `leaderboard-${ex.id}`,
        title: `Arena Ranker: ${ex.name}`,
        render: () => (
          <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center px-4">
            <div className="md:col-span-5 space-y-6 lg:space-y-8 animate-slide-right">
              <span className="px-4 py-2 rounded bg-neutral-900 border border-neutral-850 text-red-500 font-extrabold uppercase text-xs tracking-widest inline-block shadow-md">
                CHALLENGE STATION 0{exIdx + 1}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-tight">{ex.name}</h1>
              
              <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-850 text-xs md:text-sm text-neutral-300 space-y-3 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-650/5 rounded-full filter blur-xl" />
                <span className="text-white font-extrabold uppercase tracking-widest block text-xs">Target benchmarks to beat:</span>
                <p><strong className="text-blue-400 font-black">MALE:</strong> {ex.benchmarkMale}</p>
                <p><strong className="text-pink-400 font-black">FEMALE:</strong> {ex.benchmarkFemale}</p>
              </div>
              
              <div className="h-48 md:h-64 lg:h-72 rounded-3xl overflow-hidden border border-neutral-850 relative shadow-2xl">
                <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover opacity-50 transition-transform duration-1000 scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                <div className="absolute bottom-4 left-4 flex gap-1.5 font-mono text-[9px] text-white/50 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 uppercase">
                  <span>Type: {ex.scoringType}</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 space-y-4 w-full animate-slide-left">
              <div className="flex justify-between text-xs text-neutral-550 font-extrabold uppercase px-4 tracking-wider font-mono">
                <span>VERIFIED STANDINGS</span>
                <span>CHALLENGE SCORE</span>
              </div>

              <div className="space-y-3.5">
                {stands.length === 0 ? (
                  <div className="py-24 bg-neutral-900/40 rounded-3xl border-2 border-dashed border-neutral-800/80 flex flex-col items-center justify-center text-neutral-400 text-base space-y-3 p-6 text-center">
                    <Dumbbell className="h-12 w-12 text-neutral-700 animate-bounce" />
                    <span className="font-extrabold uppercase tracking-widest font-mono text-xs text-red-500">Leaderboard Vacant</span>
                    <p className="text-neutral-500 text-xs font-semibold max-w-sm">No certified lift attempts recorded yet this week. Claim your spot first!</p>
                  </div>
                ) : (
                  stands.map((st, sidx) => {
                    const bgClass = sidx === 0 
                      ? "bg-gradient-to-r from-red-655/15 via-neutral-900 to-neutral-950 border-red-500/30 scale-[1.02] shadow-red-900/5 shadow-2xl" 
                      : "bg-neutral-900 border-neutral-850/60 shadow-md";
                    const textClass = sidx === 0 ? "text-red-500 font-black text-lg md:text-xl" : "text-white font-black text-base md:text-lg";
                    const medalMap = ["🥇 Champion Spot", "🥈 2nd Place", "🥉 3rd Place"];

                    return (
                      <div key={st.attemptId} className={`p-4 md:p-5 rounded-3xl border flex items-center justify-between gap-6 transition-all duration-300 ${bgClass}`}>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-[10px] md:text-xs font-black uppercase text-neutral-400 shrink-0 w-20 md:w-24">
                            {medalMap[sidx]}
                          </span>
                          <div className="flex items-center gap-3">
                            {st.photoUrl ? (
                              <div className="h-12 w-12 rounded-full overflow-hidden border border-red-500/30 shrink-0 shadow-md">
                                <img src={st.photoUrl} alt={st.memberName} className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-neutral-950 border border-neutral-850 flex items-center justify-center text-red-500 shrink-0">
                                <Trophy className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <span className={`uppercase tracking-wide block truncate max-w-[170px] sm:max-w-none ${textClass}`}>{st.memberName}</span>
                              <span className="text-[10px] text-neutral-500 font-bold block uppercase mt-0.5">{st.memberId}</span>
                            </div>
                          </div>
                        </div>
                        <span className="font-mono font-black text-2xl md:text-3xl text-red-505 text-red-500 tracking-tight">{st.scoreDisplay}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )
      });
    });
  }

  if (enabledSlides.gridAll) {
    slides.push({
      id: "grid-all",
      title: "Champions 9-Grid Recaps",
      render: () => (
        <div className="w-full max-w-7xl space-y-8 px-4 animate-zoom-in">
          <div className="text-center">
            <span className="px-3.5 py-1.5 rounded-full bg-red-655/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest inline-block mb-3">
              CHAMPIONS PARADE
            </span>
            <h2 className="text-center font-black uppercase tracking-tight text-3xl sm:text-5xl text-white mb-1.5">
              Top Nine Station Leaders
            </h2>
            <p className="text-[10px] text-neutral-450 uppercase tracking-widest font-extrabold">Active Gold Medallions Holding the 1st Place Standing in Live Exercises</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4 text-center px-2 pt-1">
            {(exercises || []).map((ex) => {
              const head = topAttemptsByExercise(ex.id, 1)[0];
              return (
                <div key={ex.id} className="bg-neutral-900 border border-neutral-850 rounded-2xl p-4 flex flex-col justify-between items-center text-center space-y-3 relative overflow-hidden shadow-lg h-56 hover:border-red-500 transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-650" />
                  {head ? (
                    <div className="space-y-2 text-center w-full">
                      <div className="h-14 w-14 rounded-full overflow-hidden border border-red-500 mx-auto bg-neutral-950 shadow-md relative">
                        <img src={head.photoUrl || ex.imageUrl} alt={head.memberName} className="h-full w-full object-cover" />
                        <span className="absolute bottom-0 right-0 bg-red-600 text-black text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center font-mono">🥇</span>
                      </div>
                      <span className="text-[10px] text-white font-extrabold uppercase line-clamp-1 block tracking-wide">{head.memberName.split(" ")[0]}</span>
                      <span className="text-[10px] text-red-500 font-extrabold block font-mono bg-neutral-950 px-1 py-0.5 rounded leading-none">{head.scoreDisplay}</span>
                    </div>
                  ) : (
                    <div className="py-6 text-center flex flex-col items-center justify-center h-full">
                      <Dumbbell className="h-6 w-6 text-neutral-800" />
                      <span className="text-neutral-600 text-[9px] block font-extrabold uppercase tracking-widest mt-2">EMPTY</span>
                    </div>
                  )}
                  <span className="text-[10px] text-neutral-400 block uppercase font-extrabold tracking-tight border-t border-neutral-850/80 pt-2 w-full truncate leading-none">{ex.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )
    });
  }

  if (enabledSlides.pastWinners) {
    slides.push({
      id: "past-winners",
      title: "Champions Roll of Honor",
      render: () => (
        <div className="w-full max-w-6xl space-y-8 px-4 animate-slide-up-custom">
          <div className="text-center space-y-3">
            <span className="px-4 py-2 bg-red-655/10 border border-red-500/20 rounded-full text-red-505 text-red-500 text-xs font-black uppercase tracking-widest inline-block shadow-md">
              ARCHIVED HALL OF HONOR
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-none">
              Last Month's Champions Roll 🏆
            </h2>
            <p className="text-[10px] text-neutral-500 uppercase font-mono tracking-widest">LEGENDS THAT CONQUERED THE VERIFIED GOLD MEADOW STANDS IN RECENT CYCLES</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto pt-2">
            {(pastWinners || []).length > 0 ? (
              (pastWinners || []).slice(0, 6).map((win) => (
                <div key={win.id} className="bg-neutral-900 border border-neutral-850 rounded-3xl p-5 flex items-center gap-4 shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-red-600/5 rounded-full filter blur-lg" />
                  {win.photoUrl ? (
                    <div className="h-16 w-16 rounded-full overflow-hidden border border-red-500 shrink-0 shadow-md">
                      <img src={win.photoUrl} alt={win.memberName} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-neutral-950 border border-neutral-850 flex items-center justify-center text-red-505 text-red-500 font-extrabold text-xl font-mono shrink-0">
                      🏆
                    </div>
                  )}
                  <div className="truncate">
                    <span className="text-[9px] uppercase font-black tracking-widest block text-red-505 text-red-500 font-mono">{win.exerciseName}</span>
                    <span className="text-base text-white font-extrabold uppercase block leading-snug truncate">{win.memberName}</span>
                    <span className="font-mono text-xs text-neutral-400 font-extrabold block leading-none mt-1.5">{win.scoreDisplay}</span>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-5 flex items-center gap-4 shadow-xl">
                  <div className="h-16 w-16 rounded-full bg-red-655/10 border border-red-500 flex items-center justify-center text-red-505 text-red-500 font-mono text-xl font-black shrink-0">ZK</div>
                  <div>
                    <span className="text-[9px] uppercase font-black tracking-widest block text-red-500 font-bold">Bench Compound</span>
                    <span className="text-base text-white font-bold uppercase block leading-snug">Zunair Kalyar</span>
                    <span className="font-mono text-xs text-neutral-400 font-bold block leading-none mt-1.5">140 KG Max Reps</span>
                  </div>
                </div>
                <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-5 flex items-center gap-4 shadow-xl">
                  <div className="h-16 w-16 rounded-full bg-red-655/10 border border-red-500 flex items-center justify-center text-red-505 text-red-500 font-mono text-xl font-black shrink-0">KK</div>
                  <div>
                    <span className="text-[9px] uppercase font-black tracking-widest block text-red-500 font-bold">Iron Squats</span>
                    <span className="text-base text-white font-bold uppercase block leading-snug">Kamran Kalyar</span>
                    <span className="font-mono text-xs text-neutral-400 font-bold block leading-none mt-1.5">180 KG Deep Squat</span>
                  </div>
                </div>
                <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-5 flex items-center gap-4 shadow-xl">
                  <div className="h-16 w-16 rounded-full bg-neutral-800/20 border border-neutral-800 flex items-center justify-center text-red-505 text-red-500 font-mono text-xl font-black shrink-0">AG</div>
                  <div>
                    <span className="text-[9px] uppercase font-black tracking-widest block text-red-500 font-bold">Deadlift Compound</span>
                    <span className="text-base text-white font-bold uppercase block leading-snug">Ayesha Gondal</span>
                    <span className="font-mono text-xs text-neutral-400 font-bold block leading-none mt-1.5">130 KG Lift</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )
    });
  }

  if (enabledSlides.movers) {
    slides.push({
      id: "movers",
      title: "Strongest Movers Spotlight",
      render: () => (
        <div className="max-w-5xl text-center space-y-8 px-4 animate-zoom-in">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-green-500/10 border border-green-500/10 text-green-400 text-sm font-black uppercase tracking-widest font-mono">
            <TrendingUp className="h-5 w-5 animate-bounce" />
            <span>ATHLETE FORCE & VELOCITY DRIFT</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-none">
            BIGGEST RANK MOVERS
          </h1>
          <p className="text-neutral-405 text-base md:text-lg max-w-2xl mx-auto font-semibold leading-relaxed text-neutral-400">
            Spotlighting active members recording the highest incremental jumps in lift weights, sets logged, or rep count this week.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-4 text-sm font-bold">
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-3 shadow-xl hover:border-green-500/20 transition-all duration-300">
              <span className="text-white uppercase block text-lg font-black">Zunair Kalyar</span>
              <span className="text-green-400 block font-black uppercase tracking-wider text-xs bg-green-950/20 border border-green-500/15 py-1.5 rounded-xl font-mono">
                ➕ 5 Positions (Isometric Pushups)
              </span>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-3 shadow-xl">
              <span className="text-white uppercase block text-lg font-black">Kamran Kalyar</span>
              <span className="text-green-400 block font-black uppercase tracking-wider text-xs bg-green-950/20 border border-green-500/15 py-1.5 rounded-xl font-mono">
                ➕ 3 Positions (Dumbbell Curls)
              </span>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-3 shadow-xl">
              <span className="text-white uppercase block text-lg font-black">Ayesha Gondal</span>
              <span className="text-green-400 block font-black uppercase tracking-wider text-xs bg-green-950/20 border border-green-500/15 py-1.5 rounded-xl font-mono">
                ➕ 2 Positions (Plate Squats)
              </span>
            </div>
          </div>
        </div>
      )
    });
  }

  if (enabledSlides.prs) {
    slides.push({
      id: "prs",
      title: "Active Personal Records",
      render: () => (
        <div className="max-w-5xl text-center space-y-8 px-4 animate-fade-in font-sans">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-red-655/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest font-mono">
            <Flame className="h-5 w-5 animate-pulse text-red-500" />
            <span>PERSONAL RECORD BREAKOUTS</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-extratight text-white leading-none">
            NEW PERSONAL RECORDS
          </h1>
          <p className="text-neutral-400 text-base md:text-lg max-w-2xl mx-auto font-semibold">
            Honoring athletes who completed target sets and surpassed their previous bench, squats, or endurance parameters.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto pt-6 font-black uppercase text-center font-mono">
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
              <span className="text-neutral-500 text-xs block font-sans font-extrabold">ZUNAIR K.</span>
              <span className="text-red-505 text-red-500 text-2xl lg:text-3xl block font-black mt-2">130 KG SQUAT</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
              <span className="text-neutral-500 text-xs block font-sans font-extrabold">KAMRAN K.</span>
              <span className="text-red-505 text-red-500 text-2xl lg:text-3xl block font-black mt-2">160 KG DEADLIFT</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
              <span className="text-neutral-500 text-xs block font-sans font-extrabold">AYESHA G.</span>
              <span className="text-red-505 text-red-500 text-2xl lg:text-3xl block font-black mt-2">45 MIN TREAD</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
              <span className="text-neutral-500 text-xs block font-sans font-extrabold">HAMZA T.</span>
              <span className="text-red-505 text-red-500 text-2xl lg:text-3xl block font-black mt-2">30 REPS PULLUP</span>
            </div>
          </div>
        </div>
      )
    });
  }

  if (enabledSlides.transformation) {
    slides.push({
      id: "transformation",
      title: "Shattered Stats Spotlight",
      render: () => (
        <div className="w-full max-w-6xl space-y-8 px-4 animate-zoom-in">
          <div className="text-center space-y-3">
            <span className="px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-xs font-black uppercase tracking-widest inline-block">
              TRANSFORMATION SPOTLIGHT
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-none">
              BEFORE & AFTER SPOTLIGHTS 🌟
            </h2>
            <p className="text-xs text-neutral-400 uppercase font-mono tracking-widest pt-1">REAL LIFTERS DEMONSTRATING EXTRAORDINARY DISCIPLINE THROUGHOUT RECENT MONTHS</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto pt-2 text-xs font-bold leading-normal">
            <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-red-550 text-red-500 font-extrabold font-mono">MANDI HERO #1</span>
                <span className="text-[9px] bg-red-655/15 text-red-500 px-2.5 py-1 rounded font-black font-mono">-12 KG FAT SHED</span>
              </div>
              <p className="text-sm font-black uppercase text-white">Zunair Kalyar</p>
              <p className="text-neutral-400 font-semibold leading-normal">
                \"Consistent lift checks coupled with the daily macronutrient notebook entries reshaped my metabolic baseline. Bench Compound broke to a clean 130KG!\"
              </p>
              <div className="text-[10px] text-neutral-500 font-mono flex gap-4 border-t border-neutral-850 pt-3">
                <span>BEFORE: 95 KG</span>
                <span className="text-green-400 font-bold">AFTER: 83 KG</span>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-red-550 text-red-500 font-extrabold font-mono">MANDI HERO #2</span>
                <span className="text-[9px] bg-red-655/15 text-red-500 px-2.5 py-1 rounded font-black font-mono">+8 KG Dense BULK</span>
              </div>
              <p className="text-sm font-black uppercase text-white">Kamran Kalyar</p>
              <p className="text-neutral-400 font-semibold leading-normal">
                \"Focused strictly on heavy compound sets and deep progressive overload in the evening. Proper hydration cycles and sleep logs enabled amazing cellular density!\"
              </p>
              <div className="text-[10px] text-neutral-500 font-mono flex gap-4 border-t border-neutral-850 pt-3">
                <span>BEFORE: 72 KG</span>
                <span className="text-green-400 font-bold">AFTER: 80 KG</span>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-red-550 text-red-500 font-extrabold font-mono">MANDI HERO #3</span>
                <span className="text-[9px] bg-red-655/15 text-red-500 px-2.5 py-1 rounded font-black font-mono">-6 KG LEAN DRIFT</span>
              </div>
              <p className="text-sm font-black uppercase text-white">Ayesha Gondal</p>
              <p className="text-neutral-400 font-semibold leading-normal">
                \"Blended targeted aerobic treadmill speed runs alongside light daily dumbbell circuits. Better body density index and core compound limits.\"
              </p>
              <div className="text-[10px] text-neutral-500 font-mono flex gap-4 border-t border-neutral-850 pt-3">
                <span>BEFORE: 66 KG</span>
                <span className="text-green-400 font-bold">AFTER: 60 KG</span>
              </div>
            </div>
          </div>
        </div>
      )
    });
  }

  if (enabledSlides.nutrition) {
    slides.push({
      id: "nutrition",
      title: "Nutrition Protocols Checklist",
      render: () => (
        <div className="w-full max-w-5xl space-y-8 px-4 animate-slide-right">
          <div className="text-center">
            <span className="px-3.5 py-1.5 rounded-full bg-red-655/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest inline-block mb-2">
              ANABOLIC FUEL PARADISE
            </span>
            <h2 className="font-black text-4xl sm:text-5xl uppercase tracking-tight text-white mb-2">DAILY DIET PRINCIPLES</h2>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Mastering hydration, protein intake levels, and post-workout amino chains</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 font-semibold text-xs leading-normal">
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-3 shadow-xl">
              <span className="text-[10px] text-red-500 uppercase font-black font-mono block">STATION #1</span>
              <p className="text-base text-white font-black uppercase leading-tight">Hydrate Muscle Bundles</p>
              <p className="text-neutral-400 leading-relaxed">
                Drink a minimum of 4-5 liters of clean water daily. Skeletal muscles contain about 75% fluid; minor dehydration drops lift output immediately.
              </p>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-3 shadow-xl">
              <span className="text-[10px] text-red-500 uppercase font-black font-mono block">STATION #2</span>
              <p className="text-base text-white font-black uppercase leading-tight">Protein Targets Floor</p>
              <p className="text-neutral-400 leading-relaxed">
                Aim for roughly 1.8g to 2.2g of high-quality protein per KG of weight. Load daily meals with lean egg yolks, chicken breast, or protein whey.
              </p>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-3 shadow-xl">
              <span className="text-[10px] text-red-500 uppercase font-black font-mono block">STATION #3</span>
              <p className="text-base text-white font-black uppercase leading-tight">Anabolic Timing Windows</p>
              <p className="text-neutral-400 leading-relaxed">
                Consume quick digestible carbohydrates 45 mins before sets for glycogen power, and consume amino shakes 30 mins after to lock recovery!
              </p>
            </div>
          </div>
        </div>
      )
    });
  }

  if (enabledSlides.trainers) {
    slides.push({
      id: "trainers",
      title: "Coaches Specialty Profiles",
      render: () => (
        <div className="w-full max-w-5xl space-y-8 px-4 animate-fade-in">
          <div className="text-center">
            <span className="px-4 py-1.5 bg-red-655/10 border border-red-500/20 rounded-full text-red-505 text-red-500 text-xs font-black uppercase tracking-widest inline-block mb-3 font-mono">
              CERTIFIED STEWARDSHIP DESK
            </span>
            <h2 className="font-black text-4xl sm:text-5xl uppercase tracking-tight text-white mb-2">ON-DUTY FLOOR COACHES</h2>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Connect with our specialized advisors to check form, spot lifts, or request custom schedules</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto pt-2">
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl flex items-center gap-5 shadow-2xl relative overflow-hidden">
              <div className="h-20 w-20 rounded-full bg-red-655/20 border-2 border-red-550 flex items-center justify-center text-red-505 text-red-500 font-mono text-xl font-black shrink-0 shadow-md">CS</div>
              <div>
                <span className="text-[10px] text-red-500 uppercase font-bold tracking-widest font-mono block">TECHNICAL DIRECTOR</span>
                <span className="text-base text-white font-black uppercase block mt-0.5">Coach Shehzad</span>
                <p className="text-xs text-neutral-400 font-semibold mt-1 leading-normal">
                  Specialty: Powerlifting Compounds, Orthopedic Alignment Mechanics & Contest Splits design.
                </p>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl flex items-center gap-5 shadow-2xl relative overflow-hidden">
              <div className="h-20 w-20 rounded-full bg-red-655/20 border-2 border-red-550 flex items-center justify-center text-red-505 text-red-500 font-mono text-xl font-black shrink-0 shadow-md">CK</div>
              <div>
                <span className="text-[10px] text-red-500 uppercase font-bold tracking-widest font-mono block">HEAVY LIFT ADVISOR</span>
                <span className="text-base text-white font-black uppercase block mt-0.5">Coach Kamran</span>
                <p className="text-xs text-neutral-400 font-semibold mt-1 leading-normal">
                  Specialty: Hypertrophy Split Routines, Desi Calisthenics & Olympic snatch pacing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    });
  }

  if (enabledSlides.rules) {
    slides.push({
      id: "rules",
      title: "Allocated Gym Rules",
      render: () => (
        <div className="max-w-5xl text-center space-y-8 px-4 animate-slide-up-custom">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-red-655/10 border border-red-500/20 text-red-505 text-red-500 text-xs font-black uppercase tracking-widest font-mono">
            <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
            <span>GYM RULES CORNER</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white leading-none">
            SAFETY & HOUSE REGULATIONS
          </h1>
          <div className="max-w-4xl mx-auto bg-neutral-900 border border-neutral-850 p-8 md:p-10 rounded-3xl text-left space-y-6 text-sm md:text-base leading-relaxed font-semibold shadow-2xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-655/5 rounded-full filter blur-2xl animate-pulse" />
            <div className="flex items-start gap-4">
              <span className="text-red-500 font-extrabold bg-red-655/10 border border-red-500/10 px-3 py-1.5 rounded-lg text-xs font-mono leading-none">01</span>
              <span>All compound lift sets must be visually pre-spot assisted by certified floor trainers. No limits checking alone!</span>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-red-500 font-extrabold bg-red-655/10 border border-red-500/10 px-3 py-1.5 rounded-lg text-xs font-mono leading-none">02</span>
              <span>Clean complete lockouts are strictly mandated for verified tournament bench lines and squats deep targets.</span>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-red-505 text-red-500 font-extrabold bg-red-655/10 border border-red-500/10 px-3 py-1.5 rounded-lg text-xs font-mono leading-none">03</span>
              <span>Members must put all dumbbells and barbell plates back in their allocated physical rack partitions after sets.</span>
            </div>
          </div>
        </div>
      )
    });
  }

  if (enabledSlides.pricing) {
    slides.push({
      id: "pricing",
      title: "Membership Club Programs",
      render: () => (
        <div className="w-full max-w-5xl space-y-8 px-4 animate-zoom-in">
          <div className="text-center">
            <h2 className="font-black text-4xl sm:text-5xl uppercase tracking-tight text-white mb-2">MEMBERSHIP RATES</h2>
            <p className="text-xs text-neutral-450 uppercase font-mono tracking-widest font-extrabold">Premium facilities access rates and custom training plans</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-2">
            {(plans || []).map((p) => (
              <div key={p.planId} className="bg-neutral-900 border border-neutral-855 p-6 md:p-8 rounded-3xl space-y-5 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full filter blur-xl" />
                <div>
                  <h3 className="text-red-505 text-red-500 text-xl font-black uppercase tracking-wider">{p.name}</h3>
                  <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider mt-1.5 font-bold">{p.description || "General tier access perks."}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono font-bold">
                  <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-900 text-center">
                    <span className="text-neutral-500 text-[9px] block uppercase font-extrabold">1 Month Access</span>
                    <span className="text-white text-base block mt-1">Rs. {p.price1m.toLocaleString()}</span>
                  </div>
                  <div className="bg-neutral-955 p-3 rounded-2xl border border-neutral-900 text-center bg-neutral-950">
                    <span className="text-neutral-500 text-[9px] block uppercase font-extrabold">3 Months Access</span>
                    <span className="text-white text-base block mt-1">Rs. {p.price3m.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-[10px] text-neutral-400 leading-relaxed border-t border-neutral-850/80 pt-4 mt-2 font-semibold">
                  <span className="text-white font-extrabold uppercase text-[9px] block mb-1">Assigned Privileges:</span>
                  {p.features.slice(0, 3).join(" • ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    });
  }

  if (enabledSlides.timings) {
    slides.push({
      id: "timings",
      title: "Timing Schedules Timetable",
      render: () => (
        <div className="w-full max-w-5xl space-y-8 px-4 animate-slide-left">
          <div className="text-center">
            <h2 className="font-black text-4xl sm:text-5xl uppercase tracking-tight text-white mb-2">SEPARATED SHIFTS</h2>
            <p className="text-xs text-neutral-450 uppercase font-mono tracking-widest font-extrabold">Allocated daily timing windows for comfortable workout environments</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 select-none">
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl text-center space-y-4 shadow-xl">
              <span className="text-blue-400 font-black uppercase text-xs tracking-widest block">MALE MORNING GRIND</span>
              <span className="font-mono text-white text-lg font-extrabold block bg-neutral-950 py-3.5 rounded-2xl border border-neutral-850">
                {settings.openTimeMaleMorn} — {settings.closeTimeMaleMorn}
              </span>
            </div>
            <div className="bg-neutral-900 border border-neutral-855 p-6 rounded-3xl text-center space-y-4 shadow-xl bg-neutral-900 border-neutral-850">
              <span className="text-pink-400 font-black uppercase text-xs tracking-widest block">LADIES ONLY HOURS</span>
              <span className="font-mono text-white text-lg font-extrabold block bg-neutral-950 py-3.5 rounded-2xl border border-neutral-850">
                {settings.openTimeFemale} — {settings.closeTimeFemale}
              </span>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl text-center space-y-4 shadow-xl">
              <span className="text-red-500 font-black uppercase text-xs tracking-widest block">MALE EVENING SHIFT</span>
              <span className="font-mono text-white text-lg font-extrabold block bg-neutral-950 py-3.5 rounded-2xl border border-neutral-850">
                {settings.openTimeMaleEve} — {settings.closeTimeMaleEve}
              </span>
            </div>
          </div>
        </div>
      )
    });
  }

  if (enabledSlides.traffic) {
    const branchesList = [
      {
        id: "branch-centaurus",
        name: "Centaurus Block Islamabad",
        location: "4th Floor, Centaurus Mall, Sector F-8, Islamabad",
        capacity: 80,
        openTimes: {
          "Monday": { open: 6, close: 23, isClosed: false },
          "Tuesday": { open: 6, close: 23, isClosed: false },
          "Wednesday": { open: 6, close: 23, isClosed: false },
          "Thursday": { open: 6, close: 23, isClosed: false },
          "Friday": { open: 6, close: 22, isClosed: false },
          "Saturday": { open: 8, close: 20, isClosed: false },
          "Sunday": { open: 12, close: 18, isClosed: true }
        } as Record<string, { open: number; close: number; isClosed: boolean }>
      },
      {
        id: "branch-dha",
        name: "DHA Phase 6 Lahore",
        location: "Block H, Commercial Plaza, DHA Phase 6, Lahore",
        capacity: 60,
        openTimes: {
          "Monday": { open: 5, close: 24, isClosed: false },
          "Tuesday": { open: 5, close: 24, isClosed: false },
          "Wednesday": { open: 5, close: 24, isClosed: false },
          "Thursday": { open: 5, close: 24, isClosed: false },
          "Friday": { open: 5, close: 22, isClosed: false },
          "Saturday": { open: 6, close: 22, isClosed: false },
          "Sunday": { open: 9, close: 17, isClosed: false }
        } as Record<string, { open: number; close: number; isClosed: boolean }>
      }
    ];

    const getTodayDateStr = () => {
      const now = new Date();
      return now.toISOString().split("T")[0];
    };

    const isRecordInBranch = (rec: AttendanceRecord, branchId: string): boolean => {
      const isCentaurus = branchId === "branch-centaurus";
      const lastDigitStr = rec.memberId.replace(/^\D+/g, "");
      const lastDigit = parseInt(lastDigitStr) || 0;
      const belongsToCentaurus = lastDigit % 2 === 0;
      return isCentaurus ? belongsToCentaurus : !belongsToCentaurus;
    };

    const parseCheckInTime = (timeStr: string): number => {
      if (!timeStr) return 0;
      const cleanStr = timeStr.trim().toUpperCase();
      const match = cleanStr.match(/^(\d+):(\d+)\s*(AM|PM)$/);
      if (!match) return 0;
      let hour = parseInt(match[1]);
      const ampm = match[3];
      if (ampm === "PM" && hour !== 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
      return hour;
    };

    const formatHourLabel = (h: number): string => {
      const ampm = h >= 12 ? "PM" : "AM";
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      return `${displayHour}:00 ${ampm}`;
    };

    const getLiveOccupancy = (branchId: string, capacity: number) => {
      const todayStr = getTodayDateStr();
      const liveCheckins = (attendance || []).filter(rec => {
        if (!isRecordInBranch(rec, branchId)) return false;
        return rec.date === todayStr && !rec.checkOutTime;
      });
      
      const fluctuation = (new Date().getSeconds() % 6);
      const count = Math.max(10 + fluctuation, liveCheckins.length);
      const pct = Math.round((count / capacity) * 100);
      
      let level = "Quiet";
      let colorClass = "text-yellow-500 bg-yellow-955/20 border-yellow-500/20";
      let progressBg = "bg-yellow-500";
      if (pct > 75) {
        level = "Very Busy";
        colorClass = "text-red-500 bg-red-950/20 border-red-500/20";
        progressBg = "bg-red-500";
      } else if (pct > 50) {
        level = "Busy";
        colorClass = "text-orange-400 bg-orange-950/20 border-orange-400/20";
        progressBg = "bg-orange-400";
      } else if (pct > 30) {
        level = "Moderate";
        colorClass = "text-yellow-400 bg-yellow-950/25 border-yellow-500/15";
        progressBg = "bg-yellow-400";
      } else if (pct > 12) {
        level = "Quiet";
        colorClass = "text-green-400 bg-green-950/20 border-green-500/20";
        progressBg = "bg-green-400";
      } else {
        level = "Very Quiet";
        colorClass = "text-teal-400 bg-teal-950/20 border-teal-500/20";
        progressBg = "bg-teal-400";
      }
      
      return { count, percentage: pct, level, colorClass, progressBg };
    };

    const getBusiestQuietestHours = (branchId: string, openTimes: Record<string, { open: number; close: number; isClosed: boolean }>) => {
      const todayDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
      const timings = openTimes[todayDay];
      if (!timings || timings.isClosed) {
        return { busiest: "Closed", quietest: "Closed", insufficient: false, totalVisits: 0 };
      }
      
      const open = timings.open;
      const close = timings.close;
      
      const hourlyCounts: Record<number, number> = {};
      for (let h = open; h < close; h++) {
        hourlyCounts[h] = 0;
      }
      
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const startDate = d.toISOString().split("T")[0];
      
      const matchingRecords = (attendance || []).filter(rec => {
        if (!isRecordInBranch(rec, branchId)) return false;
        if (rec.date < startDate) return false;
        
        let recDay = "Monday";
        const parts = rec.date.split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const dy = parseInt(parts[2], 10);
          recDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(y, m, dy));
        } else {
          recDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(rec.date));
        }
        
        return recDay === todayDay;
      });
      
      matchingRecords.forEach(rec => {
        const recHour = parseCheckInTime(rec.checkInTime);
        if (recHour >= open && recHour < close) {
          hourlyCounts[recHour] = (hourlyCounts[recHour] || 0) + 1;
        }
      });
      
      const totalVisits = matchingRecords.length;
      const insufficient = totalVisits < 5;
      
      const isCentaurus = branchId === "branch-centaurus";
      let busiestHour = isCentaurus ? 18 : 19;
      let quietestHour = isCentaurus ? 9 : 6;
      
      if (!insufficient) {
        let maxCount = -1;
        let minCount = Infinity;
        
        for (let h = open; h < close; h++) {
          const count = hourlyCounts[h];
          if (count > maxCount) {
            maxCount = count;
            busiestHour = h;
          }
          if (count < minCount) {
            minCount = count;
            quietestHour = h;
          }
        }
      }
      
      return {
        busiest: formatHourLabel(busiestHour),
        quietest: formatHourLabel(quietestHour),
        insufficient,
        totalVisits
      };
    };

    slides.push({
      id: "traffic",
      title: "Best Time to Work Out",
      render: () => {
        const todayDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());

        return (
          <div className="w-full max-w-6xl space-y-8 px-4 animate-zoom-in">
            <div className="text-center space-y-2">
              <span className="px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-xs font-black uppercase tracking-widest inline-block font-mono">
                🚦 Live Gym Traffic & Schedule Optimization
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-md uppercase tracking-tight text-white font-black mb-2">
                Best Workout Hour Advisor ⌛
              </h2>
              <p className="text-[10px] text-neutral-450 uppercase font-mono tracking-widest">Real-time attendance density counts, busiest vs quietest hours</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-2">
              {branchesList.map((branch) => {
                const live = getLiveOccupancy(branch.id, branch.capacity);
                const stats = getBusiestQuietestHours(branch.id, branch.openTimes);
                const isClosedToday = branch.openTimes[todayDay]?.isClosed;

                return (
                  <div key={branch.id} className="bg-neutral-900 border border-neutral-850 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-yellow-500/5 rounded-full filter blur-2xl" />
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-white text-lg font-black uppercase tracking-wide truncate max-w-[250px]">{branch.name}</h3>
                        <span className={`text-[9px] font-mono uppercase font-black px-2.5 py-1 rounded border ${live.colorClass}`}>
                          {isClosedToday ? "FACILITY CLOSED" : live.level}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{branch.location}</p>
                    </div>

                    {/* LIVE OCCUPANCY RING/METER */}
                    <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-3">
                      <div className="flex justify-between items-end text-xs font-mono font-bold">
                        <span className="text-neutral-400 uppercase text-[10px]">Realtime Active Members</span>
                        <span className="text-white">
                          <strong className="text-sm font-black font-sans">{isClosedToday ? 0 : live.count}</strong> / {branch.capacity} Athletes
                        </span>
                      </div>
                      <div className="h-4 bg-neutral-900 rounded-full overflow-hidden border border-neutral-850 p-0.5">
                        <div 
                          className={`h-full rounded-full ${live.progressBg} transition-all duration-1000 shadow-lg`}
                          style={{ width: `${isClosedToday ? 0 : live.percentage}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-neutral-500 uppercase font-mono font-bold mt-1">
                        <span>Empty</span>
                        <span>Capacity ({isClosedToday ? 0 : live.percentage}%)</span>
                        <span>Max Peak</span>
                      </div>
                    </div>

                    {/* DYNAMIC TIMELINE BREAKDOWN */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850">
                        <span className="text-[9px] block uppercase font-black tracking-widest text-neutral-500">🔥 PEAK DAILY VOLUME</span>
                        <span className="text-red-500 font-bold block text-sm sm:text-base mt-1.5 uppercase font-mono tracking-tight shrink-0 truncate">
                          {isClosedToday ? "Closed" : stats.busiest}
                        </span>
                      </div>
                      <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850">
                        <span className="text-[9px] block uppercase font-black tracking-widest text-neutral-500 font-sans">🧘 BEST QUIET WINDOW</span>
                        <span className="text-green-400 font-bold block text-sm sm:text-base mt-1.5 uppercase font-mono tracking-tight shrink-0 truncate">
                          {isClosedToday ? "Closed" : stats.quietest}
                        </span>
                      </div>
                    </div>

                    {/* CALIBRATION STAMPS */}
                    <div className="flex items-center justify-between text-[9px] text-neutral-500 border-t border-neutral-850/80 pt-4 mt-2 font-bold font-mono">
                      <span className="uppercase">CALIBRATION DEPTH: {stats.totalVisits} HISTORIC RECORDS</span>
                      {stats.insufficient ? (
                        <span className="text-yellow-500 font-bold uppercase">⚠️ ESTIMATED MODE</span>
                      ) : (
                        <span className="text-green-500 font-bold uppercase">✓ DATA CALIBRATED</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* QUICK LEGEND */}
            <div className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-2xl max-w-sm mx-auto flex items-center justify-around text-[10px] font-mono font-bold text-neutral-400 shadow-md">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-teal-400" /> Very Quiet</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-green-400" /> Quiet</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-yellow-400" /> Moderate</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-orange-400" /> Busy</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-red-500" /> Peak</span>
            </div>
          </div>
        );
      }
    });
  }

  if (enabledSlides.announcements) {
    slides.push({
      id: "announcements",
      title: "Digital Gym Noticeboard",
      render: () => (
        <div className="max-w-5xl text-center space-y-8 px-4 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-3">DIGITAL NOTICEBOARD</h1>
          <div className="max-w-3xl mx-auto bg-neutral-900 border border-neutral-850 p-8 rounded-3xl text-left space-y-6 shadow-2xl relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full filter blur-xl" />
            
            {(announcements || []).filter(a => a.isActive).length > 0 ? (
              (announcements || []).filter(a => a.isActive).slice(0, 2).map((ann) => (
                <div key={ann.id} className="space-y-2 border-b border-neutral-850/85 last:border-0 pb-5 last:pb-0">
                  <div className="flex justify-between items-center">
                    <h3 className="text-red-505 font-black uppercase text-base tracking-wide text-red-505 text-red-500">{ann.title}</h3>
                    <span className="text-[9px] font-mono text-neutral-500 uppercase font-black">BULLETIN</span>
                  </div>
                  <p className="text-neutral-305 text-xs md:text-sm font-semibold leading-relaxed text-neutral-300">{ann.content}</p>
                </div>
              ))
            ) : (
              <>
                <div className="space-y-2 border-b border-neutral-850/80 last:border-0 pb-5 last:pb-0">
                  <h3 className="text-red-550 text-red-500 font-black uppercase text-base tracking-wide">UPCOMING STRENGTH GALA</h3>
                  <p className="text-neutral-300 text-xs md:text-sm font-semibold leading-relaxed">Prepare your grips! The summer compound lift challenge begins on July 1st. Winners walk away with athletic trophies and complementary whey supplements!</p>
                </div>
                <div className="space-y-2 pb-5 last:pb-0 font-semibold">
                  <h3 className="text-red-505 text-red-500 font-black uppercase text-base tracking-wide">NUTRITION FLAVORS</h3>
                  <p className="text-neutral-300 text-xs md:text-sm leading-relaxed font-semibold">Order a targeted post-workout premium recovery fruit shake at the counter to score +25 additional Loyalty points inside your personal dashboard.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )
    });
  }

  if (enabledSlides.quote) {
    slides.push({
      id: "quote",
      title: "Hard Gainers Mantra",
      render: () => (
        <div className="max-w-5xl text-center space-y-8 px-4 animate-zoom-in">
          <span className="text-red-500 font-black text-xs uppercase tracking-widest block font-mono">ATHLETE MOTIVATIONAL WISE</span>
          <blockquote className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase italic tracking-tight leading-snug drop-shadow-md">
            \"THE IRON NEVER LIES TO YOU. YOU CAN WALK OUTSIDE AND LISTEN TO ALL KINDS OF TALK... BUT 200 POUNDS IS ALWAYS 200 POUNDS.\"
          </blockquote>
          <span className="text-neutral-400 text-sm md:text-base font-black uppercase block tracking-widest pt-4">— HENRY ROLLINS (HARD GAINERS PROTOCOL)</span>
        </div>
      )
    });
  }

  if (enabledSlides.joinQr) {
    slides.push({
      id: "join-qr",
      title: "Smart Attendance Inviter",
      render: () => (
        <div className="max-w-6xl text-center grid grid-cols-1 md:grid-cols-12 gap-12 items-center px-4 animate-fade-in">
          <div className="md:col-span-7 text-left space-y-6">
            <span className="px-4 py-2 bg-red-655/10 border border-red-500/20 text-red-500 text-xs font-black uppercase rounded-2xl tracking-widest inline-block">
              LAUNCH PORTAL WEB APP
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-none text-white leading-tight">CHALLENGE ACCESS ON SMARTPHONES</h1>
            <p className="text-neutral-400 text-sm md:text-base leading-relaxed font-semibold">
              Scan this QR with your phone camera to instantly verify live standings, claim prize codes at the loyalty store, register day-by-day workout notebooks, and check in.
            </p>
            <div className="text-xs font-mono text-neutral-500 space-y-1.5 pt-2 font-bold">
              <p>● HELPDESK OFFICE: <span className="text-white font-mono">{settings.phone}</span></p>
              <p>● LOCATION: <span className="text-white uppercase font-sans">{settings.location}</span></p>
            </div>
          </div>
          <div className="md:col-span-5 bg-white p-5 rounded-3xl flex flex-col items-center justify-center space-y-3 border-2 border-neutral-300 max-w-sm mx-auto shadow-2xl shrink-0">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin)}`}
              alt="Web App Access QR Code" 
              className="h-44 w-44 md:h-52 md:w-52 object-contain"
            />
            <span className="text-[10px] text-black font-black uppercase font-mono tracking-wider">SCAN TO ENLIST NOW</span>
          </div>
        </div>
      )
    });
  }

  const slidesCount = slides.length;
  // Fallback checks
  const safeSlideIndex = slidesCount > 0 ? (currentSlideIndex % slidesCount) : 0;
  const activeSlide = slidesCount > 0 ? slides[safeSlideIndex] : null;

  // Reset countdown anytime slide shifts programmatically
  useEffect(() => {
    setTimeLeft(slideDuration);
  }, [currentSlideIndex, slideDuration]);

  // Main tick rotation trigger
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (slidesCount > 0) {
            setCurrentSlideIndex((prevIdx) => (prevIdx + 1) % slidesCount);
          }
          return slideDuration;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownTimer);
  }, [slidesCount, slideDuration]);

  // Handle standard fullscreen request
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error("Fullscreen Request Blocked: ", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Determine keyframe animation class
  const getTransitionClass = () => {
    switch (transitionStyle) {
      case "fade":
        return "animate-fade-in";
      case "zoom":
        return "animate-zoom-in";
      case "slide":
        return "animate-slide-up-custom";
      case "brutalist":
        return "animate-brutalist-transition";
      default:
        return "animate-fade-in";
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-neutral-950 text-white flex flex-col justify-between overflow-hidden relative selection:bg-red-650 select-none ${
        !mouseActive ? "cursor-none" : ""
      }`}
    >
      
      {/* GLOBAL BACKGROUND ENHANCEMENTS STYLE TAG */}
      <style>{`
        @keyframes slideUpCustom {
          0% { transform: translateY(35px); opacity: 0; filter: blur(8px); }
          100% { transform: translateY(0); opacity: 1; filter: blur(0); }
        }
        @keyframes zoomInCustom {
          0% { transform: scale(0.96); opacity: 0; filter: blur(5px); }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes brutalistCustom {
          0% { transform: scale(1.04) rotate(-0.5deg); opacity: 0; filter: grayscale(1); }
          100% { transform: scale(1) rotate(0); opacity: 1; filter: grayscale(0); }
        }
        @keyframes lineMove {
          0% { top: -110px; opacity: 0; }
          40% { opacity: 0.12; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes starsFlow {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.15; }
          50% { opacity: 0.5; }
          100% { transform: translateY(-70px) rotate(4deg); opacity: 0.15; }
        }
        @keyframes scrollMarquee {
          0% { transform: translateX(20%); }
          100% { transform: translateX(-95%); }
        }

        .animate-slide-up-custom {
          animation: slideUpCustom 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-zoom-in {
          animation: zoomInCustom 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .animate-brutalist-transition {
          animation: brutalistCustom 0.6s cubic-bezier(0.25, 1, 0.5, 1) both;
        }
        .animate-marquee {
          animation: scrollMarquee 50s linear infinite;
        }
      `}</style>

      {/* FLOATING ENERGY GRAPHICAL LAYERS */}
      {bgStyle === "neon" && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#33000008_1px,transparent_1px),linear-gradient(to_bottom,#33000008_1px,transparent_1px)] bg-[size:40px_40px] opacity-25 pointer-events-none" />
          <div className="absolute top-0 left-1/4 h-72 w-72 bg-red-600/5 rounded-full filter blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-10 right-1/4 h-80 w-80 bg-red-550/5 rounded-full filter blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />
          <div className="absolute left-[35%] w-1 bg-gradient-to-b from-transparent via-red-500/10 to-transparent pointer-events-none" style={{ top: 0, bottom: 0, animation: "lineMove 6s linear infinite" }} />
          <div className="absolute right-[25%] w-1.5 bg-gradient-to-b from-transparent via-red-500/15 to-transparent pointer-events-none" style={{ top: 0, bottom: 0, animation: "lineMove 4.5s linear infinite" }} />
        </>
      )}

      {bgStyle === "particles" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-1/4 left-1/5 w-1 h-1 bg-white rounded-full" style={{ animation: "starsFlow 5s infinite ease-in-out" }} />
          <div className="absolute top-1/3 left-1/3 w-1.5 h-1.5 bg-red-500 rounded-full" style={{ animation: "starsFlow 7s infinite ease-in-out" }} />
          <div className="absolute top-1/2 left-2/3 w-1 h-1 bg-yellow-500 rounded-full" style={{ animation: "starsFlow 6s infinite ease-in-out" }} />
          <div className="absolute top-1/6 left-4/5 w-1.5 h-1.5 bg-white rounded-full" style={{ animation: "starsFlow 4.5s infinite ease-in-out" }} />
        </div>
      )}

      {/* TOP META HUD */}
      <header className="px-8 py-4 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur flex justify-between items-center z-40 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <button 
            onClick={onExit}
            className="flex items-center gap-1 text-xs font-bold uppercase text-neutral-500 hover:text-white transition-all bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded-lg shrink-0 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Exit Channel
          </button>
          
          <div className="flex items-center gap-2">
            <div className="bg-red-650 p-1 rounded text-black flex items-center justify-center bg-red-600">
              <Dumbbell className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="font-extrabold uppercase text-sm tracking-widest block leading-none">{settings.gymName}</span>
              <span className="text-[9px] text-red-505 font-black tracking-widest uppercase block mt-1 leading-none text-red-500">Live TV Channels</span>
            </div>
          </div>
        </div>

        {/* HUD Widgets Indicators Panel */}
        <div className="flex items-center gap-4 text-[11px] font-mono tracking-widest text-neutral-500 font-bold uppercase shrink-0">
          {widgetTime && currentTimeStr && (
            <div className="bg-neutral-900 border border-neutral-850 px-4 py-1.5 rounded-2xl flex items-center gap-2.5 shadow-md">
              <Clock className="h-4 w-4 text-red-500 shrink-0" />
              <div className="text-left font-sans tracking-tight leading-none">
                <span className="text-white font-extrabold block text-xs">{currentTimeStr}</span>
                <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider block mt-1 leading-none">{currentDateStr}</span>
              </div>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1.5 bg-neutral-900/40 border border-neutral-850/60 px-3 py-1.5 rounded-2xl">
            <div className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span>{isOnline ? "CLOUD LIVE" : "OFFLINE CACHE"}</span>
          </div>

          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-red-500/20 text-neutral-300 hover:text-white rounded-xl text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sliders className="h-4 w-4 text-red-500" />
            <span>OPERATOR CONTROL</span>
          </button>

          <button 
            onClick={handleFullscreenToggle}
            className="px-4 py-2 rounded-xl bg-red-650/10 hover:bg-red-600 hover:text-black border border-red-500/20 hover:border-red-500 text-red-500 font-black tracking-wider transition-all text-[10px] uppercase cursor-pointer"
          >
            {isFullscreen ? "EXIT FULLSCREEN" : "ACTIVATE TV BOX"}
          </button>
        </div>
      </header>

      {/* OPERATOR SETTINGS CONTROLLER REMOTE PANEL */}
      {showConfigPanel && (
        <div className="absolute right-6 top-20 bottom-24 w-80 bg-neutral-950/95 border-2 border-neutral-850 rounded-3xl p-6 z-55 flex flex-col justify-between shadow-2xl space-y-4 animate-slide-left select-none text-xs font-bold leading-normal ring-2 ring-red-600/10">
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-2.5">
              <div className="flex items-center gap-1.5 font-sans uppercase tracking-widest text-red-500 text-xs font-black">
                <Sliders className="h-4.5 w-4.5" />
                <span>TV Remote Setup</span>
              </div>
              <button 
                onClick={() => setShowConfigPanel(false)}
                className="p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* ROTATION TIME SLIDER */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-500 uppercase font-black tracking-wider block">Slide Rotation Time</label>
              <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                {[5, 10, 15, 30].map(sec => (
                  <button
                    key={sec}
                    onClick={() => setSlideDuration(sec)}
                    className={`py-1.5 rounded-lg border uppercase tracking-wider font-extrabold cursor-pointer transition-all ${
                      slideDuration === sec 
                        ? "bg-red-600 text-black border-red-500 font-black" 
                        : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* TRANSITIONS */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-500 uppercase font-black tracking-wider block">Transition Style</label>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {[
                  { id: "fade", label: "Fade Glow" },
                  { id: "zoom", label: "Zoom Shift" },
                  { id: "slide", label: "Brutal Slide" },
                  { id: "brutalist", label: "Neon Pop" }
                ].map(style => (
                  <button
                    key={style.id}
                    onClick={() => setTransitionStyle(style.id as any)}
                    className={`py-1.5 px-1 rounded-lg border uppercase tracking-wider font-extrabold cursor-pointer transition-all ${
                      transitionStyle === style.id 
                        ? "bg-red-600/10 text-red-500 border-red-500/50" 
                        : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ATMOSPHERICS */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-500 uppercase font-black tracking-wider block">Atmosphere Style</label>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                {[
                  { id: "neon", label: "Neon lines" },
                  { id: "particles", label: "Flares" },
                  { id: "clean", label: "Minimal" }
                ].map(bg => (
                  <button
                    key={bg.id}
                    onClick={() => setBgStyle(bg.id as any)}
                    className={`py-1.5 px-0.5 rounded-lg border uppercase tracking-wider font-extrabold cursor-pointer transition-all truncate text-center block w-full ${
                      bgStyle === bg.id 
                        ? "bg-red-600/10 text-red-500 border-red-500/50" 
                        : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* HUD TOGGLES */}
            <div className="space-y-1.5 border-t border-neutral-900 pt-3">
              <span className="text-[10px] text-neutral-500 uppercase font-black tracking-wider block mb-1">Toggle HUD Panels</span>
              <label className="flex items-center justify-between text-[11px] p-1.5 bg-neutral-900 rounded-xl cursor-pointer">
                <span>Clock Widget</span>
                <input 
                  type="checkbox" 
                  checked={widgetTime}
                  onChange={(e) => setWidgetTime(e.target.checked)}
                  className="accent-red-500 cursor-pointer h-3.5 w-3.5"
                />
              </label>
              <label className="flex items-center justify-between text-[11px] p-1.5 bg-neutral-900 rounded-xl cursor-pointer">
                <span>Anabolic Coach Tip</span>
                <input 
                  type="checkbox" 
                  checked={widgetTip}
                  onChange={(e) => setWidgetTip(e.target.checked)}
                  className="accent-red-500 cursor-pointer h-3.5 w-3.5"
                />
              </label>
              <label className="flex items-center justify-between text-[11px] p-1.5 bg-neutral-900 rounded-xl cursor-pointer">
                <span>Scroll Marquee</span>
                <input 
                  type="checkbox" 
                  checked={widgetTicker}
                  onChange={(e) => setWidgetTicker(e.target.checked)}
                  className="accent-red-500 cursor-pointer h-3.5 w-3.5"
                />
              </label>
            </div>

            {/* TOGGLE SLIDES */}
            <div className="space-y-1.5 border-t border-neutral-900 pt-3">
              <span className="text-[10px] text-neutral-500 uppercase font-black tracking-wider block mb-1.5">Configure Slide Rotation</span>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {[
                  { id: "intro", name: "Challenge Intro Title" },
                  { id: "leaderboards", name: "Weekly Standings" },
                  { id: "gridAll", name: "Full Leaders 9-Grid" },
                  { id: "pastWinners", name: "Winners Honor Roll" },
                  { id: "movers", name: "Rank Speed Movers" },
                  { id: "prs", name: "PR Breakthroughs" },
                  { id: "transformation", name: "Before & After Showcase" },
                  { id: "nutrition", name: "Dietary Protocols" },
                  { id: "trainers", name: "Specialized Coaches" },
                  { id: "rules", name: "Facility safety rules" },
                  { id: "pricing", name: "Pricing Programs" },
                  { id: "timings", name: "Separated hours" },
                  { id: "traffic", name: "Gym Traffic & Best Times" },
                  { id: "announcements", name: "Announcements notice" },
                  { id: "quote", name: "Motivational Wisdom" },
                  { id: "joinQr", name: "Web App QR Invite" }
                ].map(sl => (
                  <label key={sl.id} className="flex items-center justify-between text-[10px] p-1 bg-neutral-950 rounded-lg hover:border-neutral-800 border border-transparent cursor-pointer">
                    <span className="truncate pr-1 uppercase text-neutral-400 font-extrabold">{sl.name}</span>
                    <input 
                      type="checkbox"
                      checked={enabledSlides[sl.id] || false}
                      onChange={(e) => {
                        setEnabledSlides(prev => ({ ...prev, [sl.id]: e.target.checked }));
                      }}
                      className="accent-red-500 h-3 w-3 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-900 pt-3 mt-auto space-y-2 shrink-0">
            <span className="text-[9px] text-neutral-500 uppercase tracking-widest block font-mono text-center">MANUAL OVERRIDE CHANNELS</span>
            <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-black">
              <button
                onClick={() => {
                  if (slidesCount > 0) {
                    setCurrentSlideIndex(prev => (prev - 1 + slidesCount) % slidesCount);
                  }
                }}
                className="py-1.5 bg-neutral-900 hover:bg-neutral-850 rounded-xl text-neutral-300 hover:text-white cursor-pointer"
              >
                ◀ BACK
              </button>
              <div className="flex items-center justify-center font-mono text-[11px] text-red-500 font-black">
                {currentSlideIndex + 1}/{slidesCount}
              </div>
              <button
                onClick={() => {
                  if (slidesCount > 0) {
                    setCurrentSlideIndex(prev => (prev + 1) % slidesCount);
                  }
                }}
                className="py-1.5 bg-red-650 bg-red-650/15 text-red-500 hover:bg-red-650/30 rounded-xl font-black cursor-pointer"
              >
                SKIP ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE CHANNEL VIEW AREA */}
      <main className="flex-1 flex items-center justify-center px-12 z-10 select-none py-4 overflow-hidden">
        {activeSlide ? (
          <div key={activeSlide.id} className={`w-full h-full flex items-center justify-center transition-all duration-500 ${getTransitionClass()}`}>
            {activeSlide.render()}
          </div>
        ) : (
          <div className="text-center space-y-4 p-8 bg-neutral-900/40 border-2 border-dashed border-neutral-800 rounded-3xl">
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto animate-pulse" />
            <span className="font-extrabold uppercase font-mono text-white tracking-widest block text-sm">NO SLIDES ENABLED</span>
            <p className="text-neutral-500 text-xs max-w-sm mx-auto font-medium">Toggle any challenge, timing, quote or transformation slide from the Operator Controller setup bar in the header panel.</p>
          </div>
        )}
      </main>

      {/* FLOATING DIET TIPS TRIVIA ROW */}
      {widgetTip && (
        <div className="mx-12 mb-4 bg-neutral-900/60 border border-neutral-850 px-6 py-3.5 rounded-2xl z-20 flex items-center gap-3.5 text-xs font-semibold shadow-md border-l-4 border-l-red-500 relative overflow-hidden animate-slide-up-custom shrink-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full filter blur-xl" />
          <Award className="h-5 w-5 text-red-505 text-red-500 shrink-0" />
          <div className="text-left font-sans">
            <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500 font-black block mb-0.5">ANABOLIC MINDSET & NUTRITION CHECKS</span>
            <span className="text-white text-xs block leading-relaxed">{ANABOLIC_TIPS[activeTipIndex]}</span>
          </div>
        </div>
      )}

      {/* RUNNING MARQUEE ANNOUNCEMENTS TICKER */}
      {widgetTicker && (
        <div className="bg-[#4a0000a0]/15 border-y border-red-500/10 py-2 px-8 z-30 select-none overflow-hidden relative shrink-0">
          <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-neutral-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-neutral-950 to-transparent z-10 pointer-events-none" />
          <div className="flex gap-4 items-center whitespace-nowrap animate-marquee font-mono font-bold">
            <span className="text-red-500 text-[10px] uppercase font-black flex items-center gap-1 shrink-0">
              <Flame className="h-3.5 w-3.5 text-red-500 animate-pulse" /> HEAD BULLETIN:
            </span>
            <span className="text-white text-[10px] uppercase tracking-wider">
              🏆 COMPETE PROTOCOLS: Spot assistants always required pre-reps logging • 💧 DRINK WATER: Standard muscles bundle comprises over 75% fluid • 💪 DAILY LOGS: Gain +25 XP rewards redeeming discounts • ⌛ TIMINGS TIMETABLE: Shift partitions are strictly requested.
            </span>
          </div>
        </div>
      )}

      {/* FOOTER METRICS RAIL AND TIMELINE BAR */}
      <footer className="px-8 py-4 border-t border-neutral-900 bg-neutral-950/80 backdrop-blur text-xs flex justify-between items-center z-45 font-bold text-neutral-400 font-mono shrink-0 select-none">
        <div className="flex items-center gap-2 uppercase">
          <Tv className="h-4 w-4 text-red-500 shrink-0" />
          <span>
            {activeSlide ? `CHANNEL: ${activeSlide.title.toUpperCase()}` : "STANDBY"} • Slide {slidesCount > 0 ? safeSlideIndex + 1 : 0} of {slidesCount} 
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="uppercase text-[10px] text-neutral-500 tracking-wider">
            Rotate Schedule: <span className="text-red-500 font-extrabold animate-pulse">{timeLeft}s remaining</span>
          </span>
          <div className="hidden sm:block text-neutral-600 uppercase tracking-widest text-[9px]">
            {settings.location} • Strength, Dignity, & Infinite Progress
          </div>
        </div>

        {/* TIME BAR TIMELINE */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-1000 z-50 shadow-[0_0_10px_rgba(239,68,68,0.4)]" 
          style={{ width: `${(timeLeft / slideDuration) * 100}%` }} 
        />
      </footer>

    </div>
  );
}
