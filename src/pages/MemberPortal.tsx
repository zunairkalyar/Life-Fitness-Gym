import React, { useState } from "react";
import { 
  CreditCard, 
  Calendar, 
  Receipt, 
  Trophy, 
  Clock, 
  ShieldAlert, 
  Flame, 
  MessageCircle, 
  CheckCircle,
  Megaphone,
  Sliders,
  Bot,
  User,
  LogOut,
  Dumbbell
} from "lucide-react";
import { 
  Member, 
  PaymentRecord, 
  AttendanceRecord, 
  CompetitionAttempt, 
  MembershipCredit, 
  Announcement, 
  GymSettings 
} from "../types";
import MemberProfileEditor from "../components/MemberProfileEditor";
import LifeFitnessAiCoach from "../components/LifeFitnessAiCoach";
import ExerciseLibrary from "../components/ExerciseLibrary";

interface MemberPortalProps {
  member: Member;
  payments: PaymentRecord[];
  attendance: AttendanceRecord[];
  attempts: CompetitionAttempt[];
  credits: MembershipCredit[];
  announcements: Announcement[];
  settings: GymSettings;
  onLogout: () => void;
  onUpdateMember: (updated: Member) => void;
}

export default function MemberPortal({ 
  member, 
  payments, 
  attendance, 
  attempts, 
  credits, 
  announcements, 
  settings, 
  onLogout,
  onUpdateMember
}: MemberPortalProps) {
  const [activeSection, setActiveSection] = useState<"dashboard" | "ai-coach" | "exercises">("dashboard");
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  // Dynamic Gym Timing Allocation status calculator
  const getTimingStatus = () => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, etc.
    const hour = now.getHours();
    
    if (settings.weeklyHoliday && day === 0) {
      return { 
        status: "Weekly Holiday", 
        color: "text-red-500", 
        bg: "bg-red-500/10 border-red-500/20", 
        msg: `The gym is closed today (Sunday) for deep sanitization and scheduled maintenance.` 
      };
    }

    if (member.gender === "Female") {
      // Female timings is 11:00 AM to 4:00 PM -> 11 to 16
      if (hour >= 11 && hour < 16) {
        return { 
          status: "Gym Open (Female Slot)", 
          color: "text-green-400 animate-pulse font-extrabold", 
          bg: "bg-green-600/10 border-green-500/20", 
          msg: `Active female allotment slot is 11:00 AM to 04:00 PM. Have an incredible workout!` 
        };
      } else if (hour >= 10 && hour < 11) {
        return { 
          status: "Cleaning & Transition Break", 
          color: "text-yellow-500 font-extrabold", 
          bg: "bg-yellow-650/10 border-yellow-500/20", 
          msg: `The morning cleaning and session handover is in progress. Your slot begins in less than an hour!` 
        };
      } else {
        return { 
          status: "Gym Closed / Inactive Slot", 
          color: "text-red-400 font-extrabold", 
          bg: "bg-red-950/20 border-red-900/30", 
          msg: `The Female training block is 11:00 AM to 04:00 PM. Outside these timings, the facility is designated for Male logs or is closed.` 
        };
      }
    } else {
      // Male timings is 06:00 AM to 10:00 AM (6 to 10) & 05:00 PM to 10:00 PM (17 to 22)
      if (hour >= 6 && hour < 10) {
        return { 
          status: "Gym Open (Male Morning Slot)", 
          color: "text-green-400 animate-pulse font-extrabold", 
          bg: "bg-green-600/10 border-green-500/20", 
          msg: `Active morning schedule slot is 06:00 AM to 10:00 AM. Lift heavy, lift safe!` 
        };
      } else if (hour >= 17 && hour < 22) {
        return { 
          status: "Gym Open (Male Evening Slot)", 
          color: "text-green-400 animate-pulse font-extrabold", 
          bg: "bg-green-600/10 border-green-500/20", 
          msg: `Active evening schedule slot is 05:00 PM to 10:00 PM. Dominate your performance standards!` 
        };
      } else if (hour >= 10 && hour < 11) {
        return { 
          status: "Female Transition / Session Handover", 
          color: "text-yellow-500 font-extrabold", 
          bg: "bg-yellow-650/10 border-yellow-500/20", 
          msg: `Morning session switchover. The female training slot is currently active. The next male slot starts at 05:00 PM.` 
        };
      } else if (hour >= 16 && hour < 17) {
        return { 
          status: "Cleaning & Session Prep Break", 
          color: "text-yellow-500 font-extrabold", 
          bg: "bg-yellow-650/10 border-yellow-500/20", 
          msg: `Afternoon sanitization cycle (04:00 PM to 05:00 PM) is underway. Your evening block starts at 05:00 PM sharp!` 
        };
      } else {
        return { 
          status: "Gym Closed / Rest Hours", 
          color: "text-red-400 font-extrabold", 
          bg: "bg-red-950/20 border-red-900/30", 
          msg: `Male workout segments are 06:00 AM - 10:00 AM & 05:00 PM - 10:00 PM. Recover well for your next performance session.` 
        };
      }
    }
  };

  // Curated MuscleWiki Daily Spotlight exercise list
  const getExerciseOfTheDay = () => {
    const items = [
      {
        name: "Olympic Flat Bench Press",
        muscle: "Chest",
        difficulty: "Intermediate",
        equip: "Barbell",
        instructions: "Lie flat on standard bench, shoulder-blades retracted. Grip bar, lower with controlled deceleration to sternum height, then explode upwards.",
        tip: "Avoid flared elbows. Tuck them slightly in towards your ribs (approximately 45-60 degrees) to safeguard shoulder joint health.",
        url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400"
      },
      {
        name: "Conventional Floor Deadlift",
        muscle: "Back, Hamstrings, Glutes",
        difficulty: "Advanced",
        equip: "Barbell & Plates",
        instructions: "Set feet hip-width apart. Reach down, hinge hips back, and grip bar. Flatten spine actively. Press through heels and drag the weight bar upwards.",
        tip: "Do not let the hips shoot up early. Push the floor away continuously rather than pulling the bar with lower spine muscles.",
        url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=400"
      },
      {
        name: "Barbell Standing Military Overhead Press",
        muscle: "Shoulders, Triceps",
        difficulty: "Intermediate",
        equip: "Barbell",
        instructions: "Set bar at shoulder level. Brace core, tuck pelvis. Unrack and press bar straight up overhead, clearing face cleanly.",
        tip: "Avoid lumbar hyperextension by squeezing glutes and engaging stomach vacuum throughout the lift.",
        url: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=400"
      },
      {
        name: "Forearm Static Plank Hold",
        muscle: "Core, Abs",
        difficulty: "Beginner",
        equip: "Bodyweight",
        instructions: "Rest on elbows directly under shoulders, extend legs straight back. Maintain a solid, straight body-sheet from heels to crown.",
        tip: "Contract abdominal fibers, quadriceps and glutes at the same time to create maximum intra-abdominal stability.",
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400"
      }
    ];

    const day = new Date().getDate();
    return items[day % items.length];
  };

  // Calculate remaining days
  const getRemainingDays = () => {
    const today = new Date();
    const expiry = new Date(member.expiryDate);
    const diff = expiry.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const remainingDays = getRemainingDays();

  // Status badges
  const getStatusBadge = (status: Member["membershipStatus"]) => {
    switch (status) {
      case "Active":
        return <span className="bg-green-600/10 border border-green-500/20 text-green-400 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">● Active</span>;
      case "Expiring Soon":
        return <span className="bg-yellow-600/10 border border-yellow-500/20 text-yellow-500 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">● Expiring Soon</span>;
      case "Expired":
        return <span className="bg-red-650/10 border border-red-500/20 text-red-500 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">● Expired</span>;
      case "Frozen":
        return <span className="bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">● Frozen</span>;
      case "Suspended":
        return <span className="bg-red-950/20 border border-red-900/30 text-red-500 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">● Suspended</span>;
      default:
        return <span className="bg-neutral-800 text-neutral-450 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">● {status}</span>;
    }
  };

  const activeDisplayName = localStorage.getItem(`fit_prof_${member.id}`) 
    ? (JSON.parse(localStorage.getItem(`fit_prof_${member.id}`) || "{}").preferredDisplayName || member.fullName.split(" ")[0])
    : member.fullName.split(" ")[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* PROFILE EDITOR MODAL WINDOW OVERLAY */}
      {showProfileEditor && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-6xl">
            <MemberProfileEditor
              member={member}
              onUpdateMember={(updated) => {
                onUpdateMember(updated);
              }}
              onClose={() => setShowProfileEditor(false)}
            />
          </div>
        </div>
      )}

      {/* HEADER CARD */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex gap-4 sm:gap-6 items-center">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-red-500 overflow-hidden shrink-0 bg-neutral-950">
            <img src={member.photoUrl} alt={member.fullName} className="h-full w-full object-cover" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-white font-extrabold text-xl sm:text-2xl uppercase tracking-tight flex items-center gap-2">
                Aura: {activeDisplayName}
              </h1>
              {getStatusBadge(member.membershipStatus)}
            </div>
            <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-wide">Member ID: <span className="font-mono text-red-500">{member.id}</span></p>
            <p className="text-xs text-neutral-400 leading-normal font-semibold">Registered Plan: {member.planName} ({member.durationMonths} Months)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-1 gap-3 w-full md:w-auto">
          <div className="bg-neutral-950 border border-neutral-850/60 rounded-2xl p-4 text-center">
            <span className="text-[10px] text-neutral-500 font-extrabold uppercase block tracking-wider">Days Remaining:</span>
            <span className="font-mono text-2xl font-black text-red-500 block leading-none mt-1">
              {remainingDays}
            </span>
          </div>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setShowProfileEditor(true)}
              className="w-full text-center text-xs font-black bg-red-600 hover:bg-red-700 text-black py-2 rounded-xl uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Sliders className="h-3.5 w-3.5" />
              Edit Profile
            </button>
            <button 
              onClick={onLogout}
              className="w-full text-center text-[10px] font-extrabold text-neutral-500 hover:text-white uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* PORTAL SECTION TABS */}
      <div className="flex border-b border-neutral-900 text-xs uppercase font-black tracking-widest text-neutral-450 gap-6 shrink-0 mt-2">
        <button
          onClick={() => setActiveSection("dashboard")}
          className={`pb-3.5 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === "dashboard"
              ? "border-red-655 border-red-600 text-white font-black"
              : "border-transparent text-neutral-550 text-neutral-500 hover:text-white"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          My Member Space
        </button>
        <button
          onClick={() => setActiveSection("ai-coach")}
          className={`pb-3.5 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === "ai-coach"
              ? "border-red-655 border-red-600 text-white font-black"
              : "border-transparent text-neutral-550 text-neutral-500 hover:text-white"
          }`}
        >
          <Bot className="h-4 w-4 text-red-500 animate-pulse" />
          Life Fitness AI Coach
        </button>
        <button
          onClick={() => setActiveSection("exercises")}
          className={`pb-3.5 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === "exercises"
              ? "border-red-655 border-red-600 text-white font-black"
              : "border-transparent text-neutral-550 text-neutral-500 hover:text-white"
          }`}
        >
          <Dumbbell className="h-4 w-4 text-red-500" />
          Exercise Library
        </button>
      </div>

      {/* ACTIVE SECTION CONTENTS */}
      {activeSection === "dashboard" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          
          {/* EXPIRY & QUICK-RENEWAL HOTLINE CARD (Displays only if <= 30 days remaining) */}
          {(remainingDays <= 30) && (
            <div className={`col-span-12 p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative overflow-hidden ${
              remainingDays <= 0 
                ? "bg-red-500/10 border-red-500/20 text-red-100" 
                : "bg-amber-500/10 border-amber-500/20 text-amber-100"
            }`}>
              <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-red-600/5 to-transparent rounded-full filter blur-xl pointer-events-none" />
              <div className="space-y-1.5 z-10">
                <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className={`h-5 w-5 ${remainingDays <= 0 ? "text-red-500 animate-pulse animate-bounce" : "text-amber-500 animate-pulse"}`} />
                  {remainingDays <= 0 ? "Membership Subscriptions Expired!" : "Subscriptions Window Expiring Soon!"}
                </h4>
                <p className="text-xs text-neutral-400 max-w-4xl leading-relaxed font-semibold">
                  {remainingDays <= 0 
                    ? `Your active subscription has ended on ${member.expiryDate}. Please renew immediately to preserve your offline training logs, gym biometric checks, and TV display board contest entries.`
                    : `Your active training subscription expires in ${remainingDays} days (scheduled end date: ${member.expiryDate}). Request your renewal now to ensure seamless physical check-ins.`
                  }
                </p>
              </div>
              <a 
                href={`https://wa.me/${settings.whatsApp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Assalam-o-Alaikum, I would like to renew my ${member.planName} (ID: ${member.id}) before it expires.`)}`}
                target="_blank"
                referrerPolicy="no-referrer"
                className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 hover:opacity-95 shrink-0 z-10 border shadow-md ${
                  remainingDays <= 0 
                    ? "bg-red-600 border-red-500 text-white hover:bg-red-700" 
                    : "bg-amber-500 border-amber-400 text-black hover:bg-amber-600"
                }`}
              >
                <MessageCircle className="h-4.5 w-4.5 shrink-0" />
                Fast WhatsApp Renewal
              </a>
            </div>
          )}
          
          {/* LEFT COLUMN: DIGITAL MEMBERSHIP CARD */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-red-600/5 to-transparent rounded-full filter blur-2xl pointer-events-none" />
              <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                <div>
                  <span className="text-white font-black uppercase text-xs tracking-wider block">{settings.gymName}</span>
                  <span className="text-[9px] text-neutral-5050 tracking-widest uppercase block text-neutral-500 font-bold">Digital Pass Card</span>
                </div>
                <span className="text-[11px] font-mono text-red-500 font-extrabold bg-red-650/5 px-2.5 py-0.5 rounded border border-red-950/20">{member.id}</span>
              </div>

              <div className="flex gap-4 py-6">
                <div className="h-20 w-20 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shrink-0">
                  <img src={member.photoUrl} alt={member.fullName} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-1.5 flex-1 text-xs">
                  <div>
                    <span className="text-neutral-500 font-extrabold uppercase text-[9px] tracking-wider block">Full Name:</span>
                    <p className="text-white font-extrabold uppercase truncate">{member.fullName}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-extrabold uppercase text-[9px] tracking-wider block">Joined Date:</span>
                    <p className="text-neutral-300 font-mono">{member.joinedDate}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-extrabold uppercase text-[9px] tracking-wider block">Membership Expiry:</span>
                    <p className="text-red-450 font-semibold font-mono text-red-500">{member.expiryDate}</p>
                  </div>
                </div>
              </div>

              {/* Attendance QR Code */}
              <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 border border-neutral-800">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${member.id}`} 
                  alt="Attendance scan code" 
                  className="h-28 w-28 object-contain"
                />
                <span className="text-[10px] text-black font-extrabold uppercase tracking-widest font-mono">Check-In Scanner</span>
              </div>

              <p className="text-center text-[10px] text-neutral-500 leading-normal mt-4 font-semibold">
                Scan this QR code at the gymnasium lobby counter desk to verify daily attendance check-ins instantly.
              </p>
            </div>

            {/* DYNAMIC TIMINGS AND SHIFT ALLOCATION CHECKER */}
            <div className={`border rounded-3xl p-6 space-y-4 transition-all duration-300 ${getTimingStatus().bg}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3">
                <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-red-500" />
                  My Spot Hours Check
                </h3>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border border-white/10 ${getTimingStatus().color}`}>
                  {getTimingStatus().status}
                </span>
              </div>
              
              <div className="space-y-4 text-xs">
                <p className="text-neutral-400 leading-relaxed font-semibold">
                  {getTimingStatus().msg}
                </p>
                
                <div className="grid grid-cols-2 gap-3.5 text-[11px] bg-neutral-950/40 p-3.5 rounded-2xl border border-neutral-800/30 leading-normal">
                  <div>
                    <span className="text-neutral-500 block font-extrabold uppercase text-[9px] tracking-widest">Female Window:</span>
                    <span className="text-white font-black">{settings.openTimeFemale} - {settings.closeTimeFemale}</span>
                    <span className="text-[9px] text-neutral-500 block">Restricted Gym Access</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block font-extrabold uppercase text-[9px] tracking-widest">Male Window:</span>
                    <span className="text-white block font-black">Morning: 6:00 - 10:00 AM</span>
                    <span className="text-white block font-black">Evening: 5:00 - 10:00 PM</span>
                  </div>
                </div>

                {settings.ramadanTimings && (
                  <div className="bg-red-500/5 border border-red-500/10 p-3.5 rounded-2xl text-[10px] space-y-1.5">
                    <span className="text-red-450 text-red-400 font-extrabold uppercase tracking-widest block">🌙 Ramadan Timings In-Effect:</span>
                    <p className="text-neutral-400 leading-normal font-semibold">{settings.ramadanTimings}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ANNOUNCEMENTS BAR */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Megaphone className="h-4.5 w-4.5 text-red-500 animate-bounce" />
                Gym Announcements
              </h3>
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center">No active gym notices recorded.</p>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.id} className="bg-neutral-950 p-4 border border-neutral-900 rounded-2xl space-y-1.5 leading-normal">
                      <h4 className="text-white font-extrabold text-xs uppercase">{ann.title}</h4>
                      <p className="text-neutral-400 text-[11px] leading-relaxed font-semibold">{ann.content}</p>
                      <span className="text-[9px] font-mono text-neutral-600 block">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ATTENDANCE, CHAMPIONSHIPS, PAYMENTS */}
          <div className="lg:col-span-7 space-y-6">

            {/* MUSCLEWIKI SPOTLIGHT CARD: EXERCISE OF THE DAY */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-red-650/10 to-transparent rounded-full filter blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-start gap-4 border-b border-neutral-800 pb-4">
                <div>
                  <span className="text-[9px] text-red-500 font-black uppercase tracking-widest block">Daily Spotlight Recommendations</span>
                  <h3 className="text-white font-black uppercase text-sm tracking-widest mt-0.5">
                    Exercise of the Day
                  </h3>
                </div>
                <span className="text-[9px] uppercase font-black tracking-widest bg-red-600/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-full">
                  {getExerciseOfTheDay().difficulty}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-2/5 aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-neutral-850 bg-neutral-950 shrink-0">
                  <img 
                    src={getExerciseOfTheDay().url} 
                    alt={getExerciseOfTheDay().name} 
                    className="h-full w-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="flex-1 space-y-3.5 text-xs text-neutral-300">
                  <div>
                    <h4 className="text-white font-black text-sm uppercase tracking-tight">{getExerciseOfTheDay().name}</h4>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-[10px] uppercase font-black tracking-wider bg-neutral-950 border border-neutral-850 text-neutral-500 px-2 py-0.5 rounded">
                        Target: <span className="text-white font-extrabold">{getExerciseOfTheDay().muscle}</span>
                      </span>
                      <span className="text-[10px] uppercase font-black tracking-wider bg-neutral-950 border border-neutral-850 text-neutral-500 px-2 py-0.5 rounded">
                        Equipment: <span className="text-white font-extrabold">{getExerciseOfTheDay().equip}</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed text-neutral-400 font-medium">
                    {getExerciseOfTheDay().instructions}
                  </p>

                  <div className="text-[11px] leading-normal text-neutral-400 italic bg-neutral-950/60 p-3 rounded-2xl border border-neutral-850/40">
                    <span className="text-red-400 text-[9px] uppercase tracking-widest font-black block not-italic mb-0.5">💡 Expert Tip:</span>
                    "{getExerciseOfTheDay().tip}"
                  </div>

                  <div className="pt-1.5 flex gap-2.5">
                    <button
                      onClick={() => setActiveSection("exercises")}
                      className="px-4.5 py-2.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95 cursor-pointer flex-1 text-center"
                    >
                      Open Library
                    </button>
                    <button
                      onClick={() => setActiveSection("exercises")}
                      className="px-4.5 py-2.5 bg-red-655 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95 cursor-pointer flex-1 text-center"
                    >
                      Construct Routine
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* TOURNAMENT SUBMISSIONS STANDINGS */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Trophy className="h-4.5 w-4.5 text-red-500" />
                My Competition Attempts
              </h3>
              <div className="space-y-3">
                {attempts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-500 bg-neutral-950/40 border border-neutral-900 rounded-2xl">
                    You haven't recorded any exercise attempts this month. Ask your trainer to record one!
                  </div>
                ) : (
                  attempts.map((att) => (
                    <div key={att.attemptId} className="bg-neutral-950 p-4 border border-neutral-900 rounded-2xl flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-white font-extrabold text-xs uppercase">{att.exerciseName}</h4>
                        <span className="text-[10px] text-neutral-500 block font-semibold">Verifier: {att.staffName} • {new Date(att.createdAt).toLocaleDateString()}</span>
                        {att.notes && <p className="text-[10px] italic text-neutral-500 mt-1">Note: {att.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-white text-sm font-extrabold block">{att.scoreDisplay}</span>
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border mt-1 inline-block ${
                          att.status === "Approved" ? "bg-green-600/10 border-green-500/20 text-green-400" :
                          att.status === "Pending" ? "bg-yellow-600/10 border-yellow-500/20 text-yellow-400" :
                          "bg-red-650/10 border-red-500/20 text-red-500"
                        }`}>
                          {att.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-[10px] text-neutral-500 leading-normal italic text-center text-semibold pt-1">
                Ensure you lift under direct trainer spotting. Only Approved score settings appear live on gym TVs.
              </p>
            </div>

            {/* ATTENDANCE RECORDS LOG */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Clock className="h-4.5 w-4.5 text-red-500" />
                Attendance History (This Month)
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {attendance.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-4">No recent attendance records logged.</p>
                ) : (
                  attendance.slice().reverse().map((att) => (
                    <div key={att.recordId} className="bg-neutral-950 p-3.5 border border-neutral-900 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <span className="text-white font-extrabold uppercase font-mono">{att.date}</span>
                        <p className="text-neutral-500 text-[10px] font-semibold">Checked-In/Verifier: {att.staffName}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-red-500 font-extrabold">{att.checkInTime}</span>
                        {att.checkOutTime && <span className="text-neutral-500 block text-[9px] font-mono">Out: {att.checkOutTime}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* FEES PAYMENTS INVOICE RECORD */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Receipt className="h-4.5 w-4.5 text-red-500" />
                Billing & Invoices
              </h3>
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center">No payment entries found.</p>
                ) : (
                  payments.map((p) => (
                    <div key={p.paymentId} className="bg-neutral-950 p-4 border border-neutral-900 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="text-[10px] text-red-500 font-mono font-bold block">{p.receiptNo}</span>
                        <h4 className="text-white font-extrabold text-xs uppercase">{p.planName}</h4>
                        <p className="text-[10px] text-neutral-500 font-semibold">{p.paymentDate} • Paid via {p.paymentMethod}</p>
                      </div>
                      <div className="text-left sm:text-right shrink-0 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2 sm:gap-1">
                        <span className="font-mono text-white text-sm font-extrabold">Rs. {p.finalPaidAmount.toLocaleString()}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${p.paymentStatus === "Paid" ? "bg-green-650/10 border-green-500/20 text-green-400" : "bg-yellow-600/10 border-yellow-500/20 text-yellow-500"}`}>
                          {p.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SUPPORT LINK */}
            <div className="pt-2 text-center">
              <a 
                href={`https://wa.me/${settings.whatsApp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Assalam-o-Alaikum, I'm Member ${member.fullName} (${member.id}). I need support concerning my membership plan status.`)}`}
                target="_blank"
                referrerPolicy="no-referrer"
                className="inline-flex items-center gap-2 py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
              >
                <MessageCircle className="h-4.5 w-4.5 shrink-0" />
                Contact Direct Gym Support WhatsApp
              </a>
            </div>

          </div>
        </div>
      ) : activeSection === "exercises" ? (
        <div className="animate-fade-in text-white/90">
          <ExerciseLibrary member={member} />
        </div>
      ) : (
        <div className="animate-fade-in text-white/90">
          <LifeFitnessAiCoach 
            member={member} 
            attendance={attendance} 
            attempts={attempts} 
          />
        </div>
      )}
    </div>
  );
}
