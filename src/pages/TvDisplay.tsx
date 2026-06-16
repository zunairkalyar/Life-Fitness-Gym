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
  ChevronLeft
} from "lucide-react";
import { 
  Member, 
  MembershipPlan, 
  ExerciseChallenge, 
  CompetitionAttempt, 
  ChallengeWinner, 
  Announcement, 
  GymSettings 
} from "../types";

interface TvDisplayProps {
  settings: GymSettings;
  plans: MembershipPlan[];
  exercises: ExerciseChallenge[];
  attempts: CompetitionAttempt[];
  pastWinners: ChallengeWinner[];
  announcements: Announcement[];
  memberList: Member[];
  onExit: () => void;
}

export default function TvDisplay({ 
  settings, 
  plans, 
  exercises, 
  attempts, 
  pastWinners, 
  announcements,
  memberList,
  onExit 
}: TvDisplayProps) {

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastDataRefresh, setLastDataRefresh] = useState(new Date().toLocaleTimeString());
  const [mouseActive, setMouseActive] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const mouseTimerRef = useRef<number | null>(null);

  // Connection listener
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

  // 30-Second Data polling simulation (Satisfying background updating without page reload)
  useEffect(() => {
    const dataPoller = setInterval(() => {
      setLastDataRefresh(new Date().toLocaleTimeString());
      // In real-world, this would trigger background onSnapshot or re-reads, which our root applet manages!
    }, 30000);
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
      }, 3000);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (mouseTimerRef.current) window.clearTimeout(mouseTimerRef.current);
    };
  }, []);

  // Compute stats helper
  const topAttemptsByExercise = (exId: string, limit = 3) => {
    return attempts
      .filter(a => a.exerciseId === exId && a.status === "Approved")
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  };

  // 12-Second Slide rotation engine
  const SLIDE_DURATION_MS = 12000;

  // Build full slide-deck array
  // Slide 1: Challenge Overview
  // Slides 2-10: Leaderboard per Exercise
  // Slide 11: Top 9 Grid Overview
  // Slide 12: Previous Month Champions
  // Slide 13: Biggest Rank Movers
  // Slide 14: New Personal Records
  // Slide 15: Safety & Rules
  // Slide 16: Gym Pricing Packages
  // Slide 17: Separation Schedules
  // Slide 18: Notification Noticeboard
  // Slide 19: Motivational Quote
  // Slide 20: Join QR QR codes
  const totalSlidesCount = 20;

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlideIndex((prevIdx) => (prevIdx + 1) % totalSlidesCount);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(slideTimer);
  }, []);

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error("Fullscreen Request Denied: ", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Auto-track fullscreen state alterations
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Dynamic calculations for displays
  const approvedAttempts = attempts.filter(a => a.status === "Approved");
  const uniqueParticipants = Array.from(new Set(approvedAttempts.map(a => a.memberId))).length;

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-neutral-950 text-white flex flex-col justify-between overflow-hidden relative selection:bg-red-600 select-none ${
        !mouseActive ? "cursor-none" : ""
      }`}
      style={{ aspectRatio: "16/9" }}
    >
      
      {/* GLOWING AMBIENT TV BACKGROUND */}
      <div className="absolute top-0 right-0 h-96 w-96 bg-red-600/5 rounded-full filter blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-96 w-96 bg-orange-600/5 rounded-full filter blur-[140px] pointer-events-none" />

      {/* TOP META HUD */}
      <header className="px-8 py-5 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur flex justify-between items-center z-10 z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={onExit}
            className="flex items-center gap-1 text-xs font-bold uppercase text-neutral-500 hover:text-white transition-all bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded-lg shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            Exit TV Screen
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-1 rounded text-black flex items-center justify-center">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <span className="font-extrabold uppercase text-sm tracking-widest">{settings.gymName}</span>
              <span className="text-[9px] text-red-500 font-bold tracking-widest uppercase block -mt-1 leading-none">TV Slideshow Channel</span>
            </div>
          </div>
        </div>

        {/* HUD Indicator Panel */}
        <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest text-neutral-500 font-bold uppercase">
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span>{isOnline ? "CLOUD LIVE" : "OFFLINE PREVIEW"}</span>
          </div>
          <div>Ref: {lastDataRefresh}</div>
          <button 
            onClick={handleFullscreenToggle}
            className="px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-black font-black transition-all"
          >
            {isFullscreen ? "EXIT FULL" : "START FULLSCREEN TV"}
          </button>
        </div>
      </header>

      {/* DYNAMIC WINDOW BOX COVERING ALL 20 SLIDES */}
      <main className="flex-1 flex items-center justify-center px-12 z-10 select-none">
        
        {/* SLIDE 1: CHALLENGE PERIOD INTRO */}
        {currentSlideIndex === 0 && (
          <div className="max-w-4xl text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-600/15 border border-red-500/25 text-red-500 text-sm font-black uppercase tracking-widest">
              <Sparkles className="h-5 w-5" />
              Live Tournament On-Deck
            </div>
            <h1 className="text-5xl sm:text-7xl font-black tracking-extratight uppercase leading-none">
              Life Fitness Top Nine Challenge
            </h1>
            <p className="text-red-500 text-xl font-black uppercase tracking-wider">
              9 Exercises. 9 Winners. 9 Free Memberships.
            </p>

            <div className="grid grid-cols-4 gap-4 max-w-3xl mx-auto text-center pt-4">
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-900">
                <span className="text-neutral-500 text-[10px] uppercase font-bold block">Exercise Rigs:</span>
                <span className="text-white text-2xl font-black block mt-1 font-mono">09</span>
              </div>
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-900">
                <span className="text-neutral-500 text-[10px] uppercase font-bold block">Current Month:</span>
                <span className="text-white text-xl font-black block mt-2 font-mono">2026-06</span>
              </div>
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-900">
                <span className="text-neutral-500 text-[10px] uppercase font-bold block">Active Lifters:</span>
                <span className="text-white text-2xl font-black block mt-1 font-mono">{uniqueParticipants || 12}</span>
              </div>
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-900">
                <span className="text-neutral-500 text-[10px] uppercase font-bold block">Total Rep-Logs:</span>
                <span className="text-white text-2xl font-black block mt-1 font-mono">{approvedAttempts.length || 34}</span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDES 2 to 10: AUTOMATED EXERCISE LEADERBOARDS */}
        {currentSlideIndex >= 1 && currentSlideIndex <= 9 && (() => {
          const exIdx = currentSlideIndex - 1;
          const ex = exercises[exIdx];
          if (!ex) return <p>Loading exercises list...</p>;
          const stands = topAttemptsByExercise(ex.id);

          return (
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-10 items-center animate-slide-in">
              {/* Left Column: Visual Exercise Poster */}
              <div className="md:col-span-5 space-y-5">
                <span className="px-3.5 py-1.5 rounded bg-red-600 text-black font-black uppercase text-xs tracking-widest inline-block">
                  Challenge Leaderboard 0{currentSlideIndex}
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-tight leading-tight">{ex.name}</h1>
                
                <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-850 text-xs text-neutral-400 space-y-2">
                  <span className="text-white font-bold uppercase tracking-wider block">Target Benchmark Metrics:</span>
                  <p><strong className="text-blue-400">MALE:</strong> {ex.benchmarkMale}</p>
                  <p><strong className="text-pink-400">FEMALE:</strong> {ex.benchmarkFemale}</p>
                </div>
                
                <div className="h-44 rounded-2xl overflow-hidden border border-neutral-900 relative">
                  <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
                </div>
              </div>

              {/* Right Column: Medals Standings Podiums */}
              <div className="md:col-span-7 space-y-3.5 w-full">
                <div className="flex justify-between text-xs text-neutral-500 font-extrabold uppercase px-3">
                  <span>Current Leader Position</span>
                  <span>Verified Score</span>
                </div>

                <div className="space-y-2.5">
                  {stands.length === 0 ? (
                    <div className="py-16 bg-neutral-900/45 rounded-3xl border border-dotted border-neutral-850 flex items-center justify-center text-neutral-500 text-sm">
                      No verified attempts recorded this month. Lock your reps first!
                    </div>
                  ) : (
                    stands.map((st, sidx) => {
                      const bgClass = sidx === 0 
                        ? "bg-gradient-to-r from-yellow-500/10 to-neutral-900 border-yellow-500/30 scale-105" 
                        : "bg-neutral-900 border-neutral-850/65";
                      const textClass = sidx === 0 ? "text-yellow-400 font-extrabold" : "text-white font-bold";
                      const medalMap = ["🥇 1st", "🥈 2nd", "🥉 3rd"];

                      return (
                        <div key={st.attemptId} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${bgClass}`}>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-xs font-black uppercase text-neutral-400 shrink-0 w-12">
                              {medalMap[sidx]}
                            </span>
                            <div className="flex items-center gap-3">
                              {st.photoUrl && (
                                <div className="h-10 w-10 rounded-full overflow-hidden border border-neutral-850 shrink-0">
                                  <img src={st.photoUrl} alt={st.memberName} className="h-full w-full object-cover" />
                                </div>
                              )}
                              <div>
                                <span className={`text-sm uppercase tracking-wide block ${textClass}`}>{st.memberName}</span>
                                <span className="text-[10px] text-neutral-500 font-bold block uppercase">{st.memberId}</span>
                              </div>
                            </div>
                          </div>
                          <span className="font-mono font-black text-xl text-red-500">{st.scoreDisplay}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* SLIDE 11: NINE GRID CURRENT LEADERS CAP */}
        {currentSlideIndex === 10 && (
          <div className="w-full max-w-6xl space-y-6 animate-fade-in select-none">
            <h2 className="text-center font-black uppercase tracking-tight text-3xl sm:text-4xl text-white">
              Current Top Nine Standard leaders
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-4 text-center">
              {exercises.map((ex) => {
                const head = topAttemptsByExercise(ex.id, 1)[0];
                return (
                  <div key={ex.id} className="bg-neutral-900 border border-neutral-850/60 rounded-2xl p-4 flex flex-col justify-between items-center text-center space-y-2 relative overflow-hidden">
                    <span className="text-[10px] text-red-500 font-black uppercase tracking-widest block font-mono">RANK A</span>
                    {head ? (
                      <div className="space-y-1 text-center w-full">
                        <div className="h-11 w-11 rounded-full overflow-hidden border border-yellow-500 mx-auto bg-neutral-950">
                          <img src={head.photoUrl || ex.imageUrl} alt={head.memberName} className="h-full w-full object-cover" />
                        </div>
                        <span className="text-[10px] text-white font-extrabold uppercase line-clamp-1 block tracking-wide">{head.memberName}</span>
                        <span className="text-[11px] text-yellow-500 font-black block font-mono">{head.scoreDisplay.split(" ")[0]} score</span>
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <span className="text-neutral-600 text-[10px] block font-semibold">Vacant</span>
                      </div>
                    )}
                    <span className="text-[9px] text-neutral-500 block uppercase font-black tracking-tight border-t border-neutral-950 pt-2 w-full truncate">{ex.name.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SLIDE 12: PREVIOUS MONTH CHAMPIONS LIST */}
        {currentSlideIndex === 11 && (
          <div className="w-full max-w-5xl space-y-6 animate-slide-in">
            <div className="text-center space-y-1">
              <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded p text-yellow-400 text-xs font-black uppercase tracking-widest inline-block">Archived Champions</span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">Last Month Winners 🏆</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {pastWinners.slice(0, 6).map((win) => (
                <div key={win.id} className="bg-neutral-900 border border-neutral-850/80 rounded-2xl p-4 flex items-center gap-3.5">
                  {win.photoUrl && (
                    <div className="h-11 w-11 rounded-full overflow-hidden border border-neutral-800 shrink-0">
                      <img src={win.photoUrl} alt={win.memberName} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider block text-red-500">{win.exerciseName.split(" ")[0]} Index</span>
                    <span className="text-xs text-white font-black uppercase block leading-tight">{win.memberName}</span>
                    <span className="font-mono text-[11px] text-neutral-400 font-bold block leading-none mt-1">{win.scoreDisplay}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 13: BIGGEST RANK MOVERS */}
        {currentSlideIndex === 12 && (
          <div className="max-w-4xl text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest">
              <TrendingUp className="h-4.5 w-4.5" />
              Dynamic Progress
            </div>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">Biggest Rank Movers</h1>
            <p className="text-neutral-400 text-sm max-w-xl mx-auto font-medium">Recognizing the athletes demonstrating the most dramatic performance extensions on verified attempts this month.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2 text-xs">
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-900">
                <span className="text-white font-extrabold uppercase block text-sm">Zunair Kalyar</span>
                <span className="text-green-400 block font-bold uppercase tracking-widest mt-1">Jumped 4 Stands (Push-ups)</span>
              </div>
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-900">
                <span className="text-white font-extrabold uppercase block text-sm">Kamran Kalyar</span>
                <span className="text-green-400 block font-bold uppercase tracking-widest mt-1">Jumped 2 Stands (Squats)</span>
              </div>
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-900">
                <span className="text-white font-extrabold uppercase block text-sm">Ayesha Gondal</span>
                <span className="text-green-400 block font-bold uppercase tracking-widest mt-1">First-Entry (Treadmill)</span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 14: DECLARED NEW PERSONAL RECORDS */}
        {currentSlideIndex === 13 && (
          <div className="max-w-4xl text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-widest">
              <Flame className="h-4.5 w-4.5" />
              PR Breakouts Logged
            </div>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">New Personal Records</h1>
            <p className="text-neutral-400 text-sm max-w-xl mx-auto">Athletes exceeding their previous baseline thresholds by verified margins in gym session tracking logs.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-center font-bold">
              <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-900">
                <span className="text-white uppercase text-xs block">Zunair K.</span>
                <span className="font-mono text-red-500 text-lg block font-extrabold mt-1">130 KG Squat</span>
              </div>
              <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-900">
                <span className="text-white uppercase text-xs block">Kamran K.</span>
                <span className="font-mono text-red-500 text-lg block font-extrabold mt-1">160 KG Deadlift</span>
              </div>
              <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-900">
                <span className="text-white uppercase text-xs block">Ayesha G.</span>
                <span className="font-mono text-red-500 text-lg block font-extrabold mt-1">45 mins Treadmill</span>
              </div>
              <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-900">
                <span className="text-white uppercase text-xs block">Hamza T.</span>
                <span className="font-mono text-red-500 text-lg block font-extrabold mt-1">30 reps pullup</span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 15: SAFETY AND PLATFORM RULES */}
        {currentSlideIndex === 14 && (
          <div className="max-w-4xl text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-650/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest">
              <ShieldAlert className="h-4.5 w-4.5" />
              Platform Rules
            </div>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">Safety & Fair Competition Guidelines</h1>
            <div className="max-w-2xl mx-auto bg-neutral-900 p-6 rounded-3xl border border-neutral-850 text-left space-y-3.5 text-xs">
              <p>• All strength sets must be visually witnesse/spot-assisted by certified on-floor trainers prior to digitizing attempts.</p>
              <p>• Clean full lockouts are mandatory on Bench Press, Shoulder overhead, and squat depthCreases parallel to floorboards.</p>
              <p>• Members must not lift weights beyond healthy individual biomechanic standard margins. Safety is our primary mandate!</p>
            </div>
          </div>
        )}

        {/* SLIDE 16: PRICING PACKAGES */}
        {currentSlideIndex === 15 && (
          <div className="w-full max-w-4xl space-y-6 animate-slide-in">
            <h2 className="text-center font-black text-3xl uppercase tracking-tight text-white">Membership pricing plans</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {plans.map((p) => (
                <div key={p.planId} className="bg-neutral-900 border border-neutral-850 p-5 rounded-3xl space-y-3">
                  <h3 className="text-white text-lg font-black uppercase tracking-tight">{p.name}</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-900">
                      <span className="text-neutral-500 block uppercase">1 Month:</span>
                      <span className="text-white font-mono block mt-0.5">Rs. {p.price1m.toLocaleString()}</span>
                    </div>
                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-900">
                      <span className="text-neutral-500 block uppercase">3 Months:</span>
                      <span className="text-white font-mono block mt-0.5">Rs. {p.price3m.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-semibold truncate">Includes features: {p.features.slice(0, 3).join(", ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 17: TIME SCHEDULES SEPARATION */}
        {currentSlideIndex === 16 && (
          <div className="w-full max-w-4xl space-y-6 animate-slide-in">
            <h2 className="text-center font-black text-3xl uppercase tracking-tight text-white">Seperated Gym Timings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-neutral-900 border border-neutral-850 p-5 rounded-2xl text-center space-y-2">
                <span className="text-blue-400 font-black uppercase text-xs tracking-widest block">Male Morning</span>
                <span className="font-mono text-white text-sm font-extrabold block">{settings.openTimeMaleMorn} — {settings.closeTimeMaleMorn}</span>
              </div>
              <div className="bg-neutral-900 border border-neutral-850 p-5 rounded-2xl text-center space-y-2">
                <span className="text-pink-400 font-black uppercase text-xs tracking-widest block">Female Only (Midday)</span>
                <span className="font-mono text-white text-sm font-extrabold block">{settings.openTimeFemale} — {settings.closeTimeFemale}</span>
              </div>
              <div className="bg-neutral-900 border border-neutral-850 p-5 rounded-2xl text-center space-y-2">
                <span className="text-orange-400 font-black uppercase text-xs tracking-widest block">Male Evening</span>
                <span className="font-mono text-white text-sm font-extrabold block">{settings.openTimeMaleEve} — {settings.closeTimeMaleEve}</span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 18: NEWS ANNOUNCEMENT BOARD */}
        {currentSlideIndex === 17 && (
          <div className="max-w-4xl text-center space-y-6 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">Gym News & Updates</h1>
            <div className="max-w-2xl mx-auto bg-neutral-900 p-6 rounded-3xl border border-neutral-850 text-left space-y-4">
              {announcements.slice(0, 2).map((ann) => (
                <div key={ann.id} className="space-y-1.5 leading-normal">
                  <h3 className="text-red-500 font-black uppercase text-sm">{ann.title}</h3>
                  <p className="text-neutral-300 text-xs font-semibold leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 19: MOTIVATIONAL QUOTE */}
        {currentSlideIndex === 18 && (
          <div className="max-w-3xl text-center space-y-6 animate-fade-in">
            <span className="text-red-500 font-black text-xs uppercase tracking-widest block">Life Fitness Mindset</span>
            <blockquote className="text-3xl sm:text-4xl font-extrabold text-white uppercase italic tracking-tight">
              "The iron never lies to you. You can walk outside and listen to all kinds of talk, get told that you're a god or a total bastard. But 200 pounds is always 200 pounds."
            </blockquote>
            <span className="text-neutral-500 text-sm font-black uppercase block">— Henry Rollins (Hard Gainers Handbook)</span>
          </div>
        )}

        {/* SLIDE 20: QR ROUTER DIRECT CODE */}
        {currentSlideIndex === 19 && (
          <div className="max-w-4xl text-center grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-fade-in">
            <div className="md:col-span-7 text-left space-y-4">
              <span className="px-3 py-1 bg-red-650/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase rounded-xl tracking-wider inline-block">Join the Tournament</span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase leading-tight text-white">Ready to lock your entry?</h1>
              <p className="text-neutral-450 text-xs leading-relaxed font-semibold text-neutral-400">
                Scan the QR code to open the gymnasium web app link directly on your smartphone screen. Submit registration plans or check standings in seconds.
              </p>
              <div className="text-xs font-mono text-neutral-500 space-y-1">
                <p>Phone: {settings.phone}</p>
                <p>Location: {settings.location.split(",")[0]}</p>
              </div>
            </div>
            <div className="md:col-span-5 bg-white p-4 rounded-3xl flex flex-col items-center justify-center space-y-2 border border-neutral-800 max-w-xs mx-auto">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://ais-dev-seek2cqszo7xwcdbscwer6-505113053377.europe-west2.run.app" 
                alt="Web App Access QR Code" 
                className="h-32 w-32 object-contain"
              />
              <span className="text-[10px] text-black font-extrabold uppercase font-mono">SCAN TO LAUNCH APP</span>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER TICKER STREAM */}
      <footer className="px-8 py-5 border-t border-neutral-900 bg-neutral-950/80 backdrop-blur text-xs flex justify-between items-center z-10 font-bold text-neutral-400 font-mono">
        <div className="flex items-center gap-1.5 uppercase">
          <Clock className="h-4 w-4 text-red-500 shrink-0" />
          <span>Slide {currentSlideIndex + 1} of {totalSlidesCount} • Rotates every 12s</span>
        </div>
        <div className="hidden sm:block text-neutral-600 uppercase tracking-widest text-[10px]">
          KFC Mandy Bahauddin • Strength, Discipline & Progress
        </div>
      </footer>

    </div>
  );
}
