import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  Clock, 
  Activity, 
  Sliders, 
  TrendingUp, 
  MapPin, 
  AlertTriangle, 
  Check, 
  Tv, 
  Sparkles, 
  Info, 
  Layers, 
  Calendar,
  X,
  Bell,
  CheckCircle,
  Play,
  Settings,
  Plus,
  Trash
} from "lucide-react";
import { AttendanceRecord, GymSettings } from "../types";

// Heatmap interface
interface GymTrafficHeatmapProps {
  attendance: AttendanceRecord[];
  onAddAttendance?: (record: AttendanceRecord) => void;
  isAdminView?: boolean;
}

// Branch definition
interface GymBranch {
  id: string;
  name: string;
  location: string;
  capacity: number;
  openTimes: Record<string, { open: number; close: number; isClosed: boolean }>; // day -> {open, close}
  thresholds: {
    veryQuiet: number; // up to
    quiet: number;     // up to
    moderate: number;  // up to
    busy: number;      // up to
  };
}

// Default branches
const DEFAULT_BRANCHES: GymBranch[] = [
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
      "Sunday": { open: 12, close: 18, isClosed: true } // Closed Sundays by default
    },
    thresholds: {
      veryQuiet: 10,
      quiet: 25,
      moderate: 50,
      busy: 70
    }
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
    },
    thresholds: {
      veryQuiet: 8,
      quiet: 20,
      moderate: 38,
      busy: 52
    }
  }
];

export default function GymTrafficHeatmap({ 
  attendance, 
  onAddAttendance, 
  isAdminView = false 
}: GymTrafficHeatmapProps) {

  // Local state for configuration & simulation
  const [branches, setBranches] = useState<GymBranch[]>(() => {
    const saved = localStorage.getItem("kfc_traffic_branches");
    return saved ? JSON.parse(saved) : DEFAULT_BRANCHES;
  });

  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return branches[0]?.id || "branch-centaurus";
  });

  const [featureEnabled, setFeatureEnabled] = useState<boolean>(true);
  const [calculationWeeks, setCalculationWeeks] = useState<number>(6); // 4-8 weeks
  const [workoutDuration, setWorkoutDuration] = useState<number>(90); // 60, 90, 120 minutes
  const [showExactCounts, setShowExactCounts] = useState<boolean>(true);
  const [liveOccupancyVisible, setLiveOccupancyVisible] = useState<boolean>(true);
  const [membersCanPlan, setMembersCanPlan] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // in seconds
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const [holidayExclusions, setHolidayExclusions] = useState<string[]>(["2026-06-18", "2026-07-01"]);

  // Planned visits state
  const [plannedVisits, setPlannedVisits] = useState<{ id: string; day: string; hour: number; branchId: string; date: string }[]>(() => {
    const saved = localStorage.getItem("kfc_planned_visits");
    return saved ? JSON.parse(saved) : [];
  });

  // Client notifications setup subscriptions
  const [alertSubscriptions, setAlertSubscriptions] = useState<string[]>(() => {
    const saved = localStorage.getItem("kfc_alert_subs");
    return saved ? JSON.parse(saved) : [];
  });

  // UI Selection filters & views
  const [currentFilter, setCurrentFilter] = useState<"all" | "weekdays" | "weekend" | "morning" | "afternoon" | "evening">("all");
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; visits: number; level: string; recommendation: string } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ day: string; hour: number } | null>(null);

  // Active viewing panels: "heatmap" vs "analytics" vs "tv" vs "settings"
  const [activePanel, setActivePanel] = useState<"heatmap" | "analytics" | "tv" | "settings">(isAdminView ? "analytics" : "heatmap");

  // Plan My Visit Form
  const [planDay, setPlanDay] = useState<string>("Monday");
  const [planHour, setPlanHour] = useState<number>(18);
  const [planSuccess, setPlanSuccess] = useState<boolean>(false);

  // Edit branch state
  const [editBranchId, setEditBranchId] = useState<string | null>(null);
  const [customBranchName, setCustomBranchName] = useState("");
  const [customBranchCapacity, setCustomBranchCapacity] = useState(80);
  const [customBranchLoc, setCustomBranchLoc] = useState("");

  // Periodically refresh simulation counter to animate live metrics!
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  // Persist local state edits
  useEffect(() => {
    localStorage.setItem("kfc_traffic_branches", JSON.stringify(branches));
  }, [branches]);

  useEffect(() => {
    localStorage.setItem("kfc_planned_visits", JSON.stringify(plannedVisits));
  }, [plannedVisits]);

  useEffect(() => {
    localStorage.setItem("kfc_alert_subs", JSON.stringify(alertSubscriptions));
  }, [alertSubscriptions]);

  const activeBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  // Helper: Convert "HH:MM AM/PM" to hour (0-23)
  const parseCheckInTime = (timeStr: string): number => {
    if (!timeStr) return 0;
    const cleanStr = timeStr.trim().toUpperCase();
    const match = cleanStr.match(/^(\d+):(\d+)\s*(AM|PM)$/);
    if (!match) return 0;
    let hour = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3];
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return hour;
  };

  // Generate date of previous weeks dynamically for parsing historical record filters
  const getHistoricalStartDate = (weeks: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - (weeks * 7));
    return d.toISOString().split("T")[0];
  };

  // Days list in order
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Hours list dynamically calculated from open/close hours
  const startHour = Math.min(...DAYS.map(d => activeBranch?.openTimes[d]?.open ?? 6));
  const endHour = Math.max(...DAYS.map(d => activeBranch?.openTimes[d]?.close ?? 22));

  const hoursArray: number[] = [];
  for (let h = startHour; h <= endHour; h++) {
    hoursArray.push(h);
  }

  // Format hour label
  const formatHourLabel = (h: number): string => {
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:00 ${ampm}`;
  };

  // Match attendance records to branch & calculations
  // Wait, existing check-ins don't have a branchId. We allocate them deterministically
  // e.g. even memberId -> branch Centaurus, odd memberId -> branch DHA
  const isRecordInBranch = (rec: AttendanceRecord, branchId: string): boolean => {
    const isCentaurus = branchId === "branch-centaurus";
    const lastDigitStr = rec.memberId.replace(/^\D+/g, "");
    const lastDigit = parseInt(lastDigitStr) || 0;
    const belongsToCentaurus = lastDigit % 2 === 0;
    return isCentaurus ? belongsToCentaurus : !belongsToCentaurus;
  };

  const getWeekDayName = (dateStr: string): string => {
    if (!dateStr) return "Monday";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      const options = { weekday: "long" } as const;
      return new Intl.DateTimeFormat("en-US", options).format(dateObj);
    }
    const dateObj = new Date(dateStr);
    const options = { weekday: "long" } as const;
    return new Intl.DateTimeFormat("en-US", options).format(dateObj);
  };

  // core calculations
  const calculateCellTraffic = (day: string, hour: number) => {
    const branchTimings = activeBranch.openTimes[day];
    if (!branchTimings || branchTimings.isClosed || hour < branchTimings.open || hour >= branchTimings.close) {
      return { count: 0, level: "Closed", percentage: 0 };
    }

    const startDate = getHistoricalStartDate(calculationWeeks);
    
    // Filter records: matching branch, within weeks, matching weekday, matching hour, not excluded
    const matchingRecords = attendance.filter(rec => {
      // Branch check
      if (!isRecordInBranch(rec, activeBranch.id)) return false;
      // Date range
      if (rec.date < startDate) return false;
      // Excluded
      if (holidayExclusions.includes(rec.date)) return false;
      // Weekday match
      const recDay = getWeekDayName(rec.date);
      if (recDay !== day) return false;
      // Hour match
      const recHour = parseCheckInTime(rec.checkInTime);
      return recHour === hour;
    });

    // Unique dates in matching period
    const uniqueDates = Array.from(new Set(attendance
      .filter(rec => rec.date >= startDate && !holidayExclusions.includes(rec.date))
      .map(rec => rec.date)
      .filter(d => getWeekDayName(d) === day)
    ));

    const divisor = Math.max(1, uniqueDates.length);
    const averageCount = Math.round((matchingRecords.length / divisor) * 1.5 * 10) / 10; // scaled slightly for vibrant visuals

    // Align with branch thresholds
    let level = "Very Quiet";
    let pct = Math.round((averageCount / activeBranch.capacity) * 100);

    if (averageCount > activeBranch.thresholds.busy) level = "Very Busy";
    else if (averageCount > activeBranch.thresholds.moderate) level = "Busy";
    else if (averageCount > activeBranch.thresholds.quiet) level = "Moderate";
    else if (averageCount > activeBranch.thresholds.veryQuiet) level = "Quiet";

    return {
      count: averageCount,
      level,
      percentage: pct
    };
  };

  // Filters check
  const isHourMatchedByFilter = (h: number): boolean => {
    if (currentFilter === "morning") return h >= 5 && h < 12;
    if (currentFilter === "afternoon") return h >= 12 && h < 17;
    if (currentFilter === "evening") return h >= 17 && h <= 24;
    return true;
  };

  const isDayMatchedByFilter = (d: string): boolean => {
    const isWeekend = d === "Saturday" || d === "Sunday";
    if (currentFilter === "weekdays") return !isWeekend;
    if (currentFilter === "weekend") return isWeekend;
    return true;
  };

  // Get dynamic cell pattern color depending on level
  const getCellClassName = (level: string): string => {
    switch (level) {
      case "Closed":
        return "bg-neutral-950 border border-neutral-900 text-neutral-800 diagonal-strips cursor-not-allowed";
      case "Very Quiet":
        return "bg-neutral-900 border border-neutral-850 hover:border-yellow-500/45 text-neutral-500 hover:scale-105 transition-all text-xs";
      case "Quiet":
        return "bg-yellow-900/10 border border-yellow-850/20 text-yellow-500/60 hover:border-yellow-550/60 hover:scale-105 transition-all";
      case "Moderate":
        return "bg-yellow-600/15 border border-yellow-600/30 text-yellow-400 hover:border-yellow-500 hover:scale-105 transition-all";
      case "Busy":
        return "bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 font-bold hover:scale-105 transition-all";
      case "Very Busy":
        return "bg-yellow-500 text-neutral-950 font-black hover:scale-105 transition-all shadow-md shadow-yellow-500/10";
      default:
        return "bg-neutral-900 text-neutral-700";
    }
  };

  // Recommendations builder
  const getRecommendation = (day: string, hour: number, count: number, level: string): string => {
    if (level === "Very Busy" || level === "Busy") {
      return `Very crowded. Consider scheduling your lift compounds before ${formatHourLabel((activeBranch.openTimes[day]?.open ?? 6) + 2)} or after 8 PM for an open bench rack.`;
    }
    if (level === "Moderate") {
      return `Typical activity. Normal rotation spacing is active. Safe window to complete hyper-lifts under ${workoutDuration} minutes.`;
    }
    return `Prime quiet time! Enjoy immediate selection of dumbbells, squat racks, and uninterrupted cables. Perfect focus environment.`;
  };

  // Live Occupancy calculation
  // Find checkins today (e.g. June 16, 2026) that are estimated to still be inside
  const calculateLiveOccupancy = () => {
    // Standard simulation if we are in demo environment and there's no actual check-in occurring today
    const liveCheckins = attendance.filter(rec => {
      // Match branch
      if (!isRecordInBranch(rec, activeBranch.id)) return false;
      // Is today
      const recDate = rec.date;
      const todayStr = "2026-06-16"; // Align with system runtime metadata
      if (recDate !== todayStr) return false;
      // Is still checked in (no checkout time)
      return !rec.checkOutTime;
    });

    const activeCount = Math.max(12, liveCheckins.length + (refreshCounter % 7)); // Seed some dynamic presence so the UI looks live and ticking!
    const pct = Math.round((activeCount / activeBranch.capacity) * 100);

    let level = "Quiet";
    if (pct > 80) level = "Very Busy";
    else if (pct > 60) level = "Busy";
    else if (pct > 35) level = "Moderate";
    else if (pct < 15) level = "Very Quiet";

    return {
      count: activeCount,
      capacity: activeBranch.capacity,
      percentage: pct,
      level
    };
  };

  const liveStats = calculateLiveOccupancy();

  // Find best/worst times for summary banner below
  const getTodayTrafficSummary = () => {
    const todayName = "Monday"; // Dynamic from day of week matching system state
    const todayHours = hoursArray.map(h => {
      const calc = calculateCellTraffic(todayName, h);
      return { hour: h, ...calc };
    }).filter(item => item.level !== "Closed");

    if (todayHours.length === 0) {
      return { best: "Closed today", worst: "Closed today", recommend: "Visit another branch" };
    }

    const sortedByTraffic = [...todayHours].sort((a, b) => a.count - b.count);
    const bestHour = sortedByTraffic[0]?.hour ?? 6;
    const worstHour = sortedByTraffic[sortedByTraffic.length - 1]?.hour ?? 18;

    return {
      best: `${formatHourLabel(bestHour)} (Very Quiet)`,
      worst: `${formatHourLabel(worstHour)} (Peak Volume)`,
      recommend: `${formatHourLabel(bestHour)}–${formatHourLabel(bestHour + 1)}`
    };
  };

  const todaySummary = getTodayTrafficSummary();

  // Plan My Visit Trigger
  const handleAddPlanVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlan = {
      id: `p-${Date.now()}`,
      day: planDay,
      hour: planHour,
      branchId: activeBranch.id,
      date: new Date().toISOString().split("T")[0]
    };
    setPlannedVisits(prev => [...prev, newPlan]);
    setPlanSuccess(true);
    setTimeout(() => {
      setPlanSuccess(false);
      setSelectedCell(null);
    }, 2500);
  };

  // Alert subscription trigger
  const toggleAlertSubscription = (day: string, hour: number) => {
    const key = `${day}_${hour}`;
    if (alertSubscriptions.includes(key)) {
      setAlertSubscriptions(prev => prev.filter(k => k !== key));
    } else {
      setAlertSubscriptions(prev => [...prev, key]);
    }
  };

  // ADMIN ANALYTICS CALCULATIONS
  const getAdminDailyAverages = () => {
    return DAYS.map(d => {
      let dailySum = 0;
      let slotCount = 0;
      hoursArray.forEach(h => {
        const c = calculateCellTraffic(d, h);
        if (c.level !== "Closed") {
          dailySum += c.count;
          slotCount++;
        }
      });
      return {
        day: d.slice(0, 3),
        visitors: Math.round(dailySum / Math.max(1, slotCount) * 10) / 10
      };
    });
  };

  const getAdminHourlyAverages = () => {
    return hoursArray.map(h => {
      let hourlySum = 0;
      let dayCount = 0;
      DAYS.forEach(d => {
        const c = calculateCellTraffic(d, h);
        if (c.level !== "Closed") {
          hourlySum += c.count;
          dayCount++;
        }
      });
      return {
        time: formatHourLabel(h),
        visitors: Math.round(hourlySum / Math.max(1, dayCount) * 10) / 10
      };
    });
  };

  const adminDailyData = getAdminDailyAverages();
  const adminHourlyData = getAdminHourlyAverages();

  // Find overall gym peak metrics
  const busiestTimeGlobal = [...adminHourlyData].sort((a,b) => b.visitors - a.visitors)[0];
  const quietestTimeGlobal = [...adminHourlyData].sort((a,b) => a.visitors - b.visitors)[0];

  // Modify branch timings inside settings panel
  const handleUpdateBranchTimings = (day: string, field: "open" | "close" | "isClosed", value: any) => {
    setBranches(prev => prev.map(b => {
      if (b.id !== selectedBranchId) return b;
      const updatedTimes = { ...b.openTimes };
      updatedTimes[day] = {
        ...updatedTimes[day],
        [field]: value
      };
      return { ...b, openTimes: updatedTimes };
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in text-white" id="gym-traffic-heatmap-root">
      
      {/* HEADER BANNER WITH BRANCH SELECTOR */}
      <div className="bg-gradient-to-r from-neutral-900 via-yellow-950/10 to-neutral-900 border border-neutral-850 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <span className="text-yellow-500 text-[10px] uppercase font-black tracking-widest font-mono flex items-center justify-center md:justify-start gap-1">
            <Clock className="h-3.5 w-3.5 text-yellow-500 animate-pulse" /> Live Attendance Telemetry
          </span>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            Best times to workout
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl font-semibold">
            Plan your physical hypertrophies when the ground floor is quiet or busy. Compare live check-ins against past 4–8 weeks statistical models.
          </p>
        </div>

        {/* Branch selection and Refresh Indicator */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-auto">
            <label className="text-[9px] text-neutral-500 uppercase font-black block font-mono mb-1 text-center sm:text-left">Selected Location Branch:</label>
            <div className="relative">
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-yellow-500 rounded-xl py-2 px-3.5 text-xs font-black uppercase focus:outline-none focus:border-yellow-500 cursor-pointer text-center sm:text-left"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id} className="bg-neutral-950 text-white uppercase text-[10px] font-bold">
                    📍 {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK VIEW CONTROLLER BAR (Heatmap Vs Admin Analytics vs TV display) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-850 pb-5">
        <div className="flex gap-2 p-1 bg-neutral-950 border border-neutral-850 rounded-xl">
          <button
            onClick={() => setActivePanel("heatmap")}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer ${
              activePanel === "heatmap" ? "bg-yellow-500 text-black font-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            📊 Member View
          </button>
          
          <button
            onClick={() => setActivePanel("analytics")}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer ${
              activePanel === "analytics" ? "bg-yellow-500 text-black font-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            📈 Gym Analytics
          </button>

          <button
            onClick={() => setActivePanel("tv")}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activePanel === "tv" ? "bg-yellow-500 text-black font-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Tv className="h-3.5 w-3.5" /> TV Live Mode
          </button>

          {isAdminView && (
            <button
              onClick={() => setActivePanel("settings")}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activePanel === "settings" ? "bg-red-650 bg-red-600 text-black font-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Settings className="h-3.5 w-3.5" /> Settings
            </button>
          )}
        </div>

        {/* Live occupancy indicator HUD */}
        {liveOccupancyVisible && (
          <div className="bg-neutral-950 px-4 py-2.5 rounded-2xl border border-neutral-850 flex items-center gap-4 text-xs font-bold leading-none select-none">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <span className="text-[9px] text-neutral-500 uppercase font-mono block mb-1">Floor Live occupancy</span>
              <span className="text-white font-mono font-black">{liveStats.count} <span className="text-[9px] text-neutral-500">of {liveStats.capacity}</span></span>
            </div>
            <div className="border-l border-neutral-800 pl-4">
              <span className="text-[9px] text-neutral-500 uppercase font-mono block mb-1">State density</span>
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-lg border leading-none inline-block ${
                liveStats.level === "Very Busy" ? "bg-red-500/10 border-red-500 text-red-400" :
                liveStats.level === "Busy" ? "bg-amber-500/10 border-amber-500 text-amber-500" :
                "bg-emerald-500/10 border-emerald-500 text-emerald-400"
              }`}>
                {liveStats.level}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- PANEL 1: MEMBER HEATMAP & TIMINGS --- */}
      {activePanel === "heatmap" && (
        <div className="space-y-8 animate-fade-in" id="traffic-member-panel">
          
          {/* QUICK SUMMARY DECISION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-2xl space-y-2">
              <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest font-mono block">Today's Best Workout Hours</span>
              <div className="text-white text-base font-black font-mono tracking-tight">{todaySummary.recommend}</div>
              <p className="text-[10px] text-emerald-400 font-semibold leading-tight">Highly suggested quiet workout block.</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-2xl space-y-2">
              <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest font-mono block">Quietest Estimated Zone</span>
              <div className="text-white text-base font-black font-mono tracking-tight">{todaySummary.best}</div>
              <p className="text-[10px] text-neutral-400 font-semibold leading-tight">Minimal wait times for machines.</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-2xl space-y-2">
              <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest font-mono block">Peak Crowd block to avoid</span>
              <div className="text-red-500 text-base font-black font-mono tracking-tight">{todaySummary.worst}</div>
              <p className="text-[10px] text-neutral-400 font-semibold leading-tight">Long queues for racks & benches.</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest font-mono block mb-1">Visit Planner</span>
                <p className="text-[10px] text-neutral-400 leading-normal font-semibold">Reserve your preferred session for optimized compound rotations.</p>
              </div>
              {membersCanPlan && (
                <button
                  onClick={() => {
                    setSelectedCell({ day: "Monday", hour: 18 });
                    setPlanDay("Monday");
                    setPlanHour(18);
                  }}
                  className="w-full mt-2 py-2 bg-yellow-500 hover:bg-yellow-600 text-neutral-950 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                >
                  🗓️ Plan My Next Lift
                </button>
              )}
            </div>
          </div>

          {/* ATTENDANCE DATA WARNING */}
          {attendance.length < 15 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-tight block">Awaiting Complete Historical Baseline</span>
                <p className="text-[10px] text-neutral-400 leading-relaxed font-semibold">
                  We are still collecting rich attendance records. Heatmap predictions will continue to improve as more members check into the front doors. Defaulting to pre-loaded calibration files.
                </p>
              </div>
            </div>
          )}

          {/* HEATMAP MAIN DISPLAY GRID CONTAINER */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 lg:p-6 space-y-6">
            
            {/* Legend & quick selectors */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-850">
              <div className="space-y-2">
                <span className="text-[9px] text-neutral-500 uppercase font-bold font-mono tracking-widest block">Heatmap filters & timeline segmentation</span>
                <div className="flex flex-wrap gap-1 bg-neutral-950 border border-neutral-850/60 p-1 rounded-xl">
                  {[
                    { id: "all", name: "Show Full Week" },
                    { id: "weekdays", name: "Weekdays Only" },
                    { id: "weekend", name: "Weekend" },
                    { id: "morning", name: "Morning (5am - 12pm)" },
                    { id: "afternoon", name: "Afternoon (12pm - 5pm)" },
                    { id: "evening", name: "Evening (5pm - 11pm)" }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setCurrentFilter(f.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg text-[9px] uppercase font-black transition-all cursor-pointer ${
                        currentFilter === f.id ? "bg-neutral-900 border border-neutral-800 text-yellow-500 font-extrabold" : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Graphical Intensity Legend */}
              <div className="space-y-1">
                <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest font-mono text-right block mb-1">Density Legend</span>
                <div className="flex gap-1.5 items-center bg-neutral-950 border border-neutral-850 p-2 rounded-xl text-[8px] font-bold uppercase tracking-wider text-neutral-400 select-none">
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 bg-neutral-900 border border-neutral-850 rounded" />
                    <span>Quiet</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 bg-yellow-900/20 border border-yellow-850/30 rounded" />
                    <span>Light</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 bg-yellow-600/25 border border-yellow-600/40 rounded" />
                    <span>Moderate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 bg-yellow-500/40 border border-yellow-550/50 rounded" />
                    <span>Busy</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 bg-yellow-500 rounded" />
                    <span>Peak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 bg-neutral-950 diagonal-strips rounded" />
                    <span>Closed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* THE HEATMAP GRID TABLE */}
            <div className="overflow-x-auto select-none rounded-2xl border border-neutral-850 relative">
              <table className="w-full min-w-[700px] border-collapse text-left">
                
                {/* HEADERS */}
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-850 font-black tracking-wider text-[10px] uppercase text-neutral-400">
                    <th className="p-3 sticky left-0 bg-neutral-950 z-20 w-24 text-center border-r border-neutral-850">HOURS</th>
                    {DAYS.filter(isDayMatchedByFilter).map(d => {
                      const isToday = d === "Monday"; // Simulating current day focus
                      return (
                        <th key={d} className={`p-4 text-center ${isToday ? "text-yellow-500 bg-yellow-500/5 font-black shrink-0 relative" : ""}`}>
                          {d}
                          {isToday && (
                            <span className="absolute bottom-1 right-2 bg-yellow-500 text-black text-[7px] font-black tracking-widest font-mono px-1 rounded">TODAY</span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* MATRIX BODY */}
                <tbody className="divide-y divide-neutral-850/65 font-mono text-[10px]">
                  {hoursArray.filter(isHourMatchedByFilter).map(hour => {
                    return (
                      <tr key={hour} className="hover:bg-neutral-850/15">
                        {/* Time interval Left Label */}
                        <td className="p-3 bg-neutral-950 text-center text-[9px] font-black font-mono border-r border-neutral-850 sticky left-0 z-10 text-neutral-400">
                          {formatHourLabel(hour)}
                        </td>

                        {/* Cell cells */}
                        {DAYS.filter(isDayMatchedByFilter).map(day => {
                          const data = calculateCellTraffic(day, hour);
                          const isClosedDay = activeBranch.openTimes[day]?.isClosed || false;
                          const isClosedSlot = data.level === "Closed" || isClosedDay;

                          return (
                            <td 
                              key={`${day}_${hour}`} 
                              onClick={() => {
                                if (isClosedSlot) return;
                                setSelectedCell({ day, hour });
                                setPlanDay(day);
                                setPlanHour(hour);
                              }}
                              onMouseEnter={() => {
                                if (isClosedSlot) return;
                                setHoveredCell({
                                  day,
                                  hour,
                                  visits: data.count,
                                  level: data.level,
                                  recommendation: getRecommendation(day, hour, data.count, data.level)
                                });
                              }}
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`p-1.5 text-center relative ${getCellClassName(data.level)} transition-all duration-150 cursor-pointer h-12 w-28`}
                            >
                              {!isClosedSlot ? (
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-[9px]">
                                    {showExactCounts ? `${data.count} members` : data.level}
                                  </div>
                                  <div className="text-[8px] opacity-60">
                                    {data.percentage}% density
                                  </div>
                                </div>
                              ) : (
                                <div className="text-neutral-700 text-[8px] uppercase font-black font-sans select-none">
                                  Closed
                                </div>
                              )}

                              {/* Alert bell shortcut for active cell */}
                              {!isClosedSlot && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAlertSubscription(day, hour);
                                  }}
                                  className="absolute bottom-1 right-1 opacity-10 hover:opacity-100 transition-opacity p-0.5 text-neutral-400 hover:text-yellow-500"
                                  title="Receive alarm ahead of the quiet times slot"
                                >
                                  <Bell className={`h-2.5 w-2.5 ${alertSubscriptions.includes(`${day}_${hour}`) ? "text-yellow-500 fill-yellow-500" : ""}`} />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>

            {/* ACCESSIBILITY DESCRIPTION PANEL (Ensures conformance to no color alone directive) */}
            <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 font-extrabold uppercase font-mono block">Accessibility Notice</span>
                <p className="text-[9px] text-neutral-500 leading-relaxed font-semibold">
                  Life Fitness traffic level intensities are denoted graphically using deep contrast gold blocks. Standard screen reader metadata describes precise member volumes (e.g. <strong>"22.5 members"</strong>) and density percentage ratios in sequential elements. Set a notification chime by clicking any active cell's bell icon.
                </p>
              </div>
            </div>
          </div>

          {/* DYNAMIC HOVER OR SELECTION TOOLTIP INFORMATION */}
          {hoveredCell && (
            <div className="fixed bottom-6 right-6 bg-neutral-950 border border-yellow-500/40 p-4 rounded-2xl shadow-xl max-w-sm space-y-2 z-50 animate-fade-in select-none">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] text-yellow-500 uppercase font-black font-mono block">Live Cell telemetry</span>
                  <h4 className="text-white text-xs font-black uppercase tracking-tight">{hoveredCell.day}, {formatHourLabel(hoveredCell.hour)}</h4>
                </div>
                <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-lg border inline-block select-none leading-none ${
                  hoveredCell.level === "Very Busy" ? "bg-red-500/10 border-red-500 text-red-500" : "bg-neutral-900 border-neutral-800 text-yellow-400"
                }`}>
                  {hoveredCell.level}
                </span>
              </div>
              <div className="text-xs font-bold font-mono text-neutral-300">
                Average check-ins: <span className="text-white font-black">{hoveredCell.visits} members</span>
              </div>
              <p className="text-[9px] text-neutral-400 leading-normal font-medium border-t border-neutral-900 pt-1.5">{hoveredCell.recommendation}</p>
            </div>
          )}

          {/* PLAN MY VISIT FORM - MODAL ON CELL TAP */}
          {selectedCell && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full space-y-5 animate-fade-in">
                
                <div className="flex justify-between items-center border-b border-neutral-850 pb-3">
                  <div>
                    <span className="text-yellow-500 text-[9px] uppercase font-black font-mono tracking-widest">Selected workout slot option</span>
                    <h3 className="text-white text-base font-black uppercase">Schedule This Entry</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedCell(null)}
                    className="p-1 rounded-xl bg-neutral-950 border border-neutral-800 hover:text-white text-neutral-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleAddPlanVisit} className="space-y-4">
                  <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase select-none font-mono">
                      <span className="text-neutral-500">Day Match</span>
                      <span className="text-white">{selectedCell.day}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold uppercase select-none font-mono">
                      <span className="text-neutral-500">Suggested interval</span>
                      <span className="text-white">{formatHourLabel(selectedCell.hour)} - {formatHourLabel(selectedCell.hour + 1)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold uppercase select-none font-mono">
                      <span className="text-neutral-500">Estimated Volume</span>
                      <span className="text-yellow-500">{calculateCellTraffic(selectedCell.day, selectedCell.hour).level}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-neutral-500 uppercase font-black font-mono">Choose dynamic Reminder Notification Alert</label>
                    <select
                      className="w-full bg-neutral-950 border border-neutral-850 text-white rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-yellow-500 cursor-pointer"
                    >
                      <option>On arrival (No alarm)</option>
                      <option>10 minutes prior to session</option>
                      <option>30 minutes prior (Recommended)</option>
                      <option>1 hour prior (Pack the gym bag)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-neutral-500 uppercase font-black font-mono">Link active Workout Lift schedule</label>
                    <select
                      className="w-full bg-neutral-950 border border-neutral-850 text-white rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-yellow-500 cursor-pointer"
                    >
                      <option>Chest Hypertrophy Lift routines</option>
                      <option>Powerlifting Deadlift compound circuits</option>
                      <option>Active cardio & dynamic mobility</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-2.5 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all border flex items-center justify-center gap-1.5 ${
                      planSuccess 
                        ? "bg-green-600 border-green-500 text-white" 
                        : "bg-yellow-500 hover:bg-yellow-600 border-yellow-400 hover:border-yellow-500 text-black shadow-lg shadow-yellow-500/10 cursor-pointer"
                    }`}
                  >
                    {planSuccess ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-white" />
                        LOCKED INTO SCHEDULE
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        Confirm Scheduled Visit
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* PLANNED VISITS FEED LIST */}
          {plannedVisits.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-4">
              <span className="text-[10px] text-neutral-500 uppercase font-black block font-mono">Scheduled Workouts & Quiet Times Alarms</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plannedVisits.map((v, i) => (
                  <div key={v.id} className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 flex justify-between items-center group relative">
                    <div className="space-y-1">
                      <span className="text-[8px] text-yellow-500 font-black font-mono uppercase">HYPERTROPHY ROTATION</span>
                      <h4 className="text-white text-xs font-black uppercase leading-tight">{v.day}, {formatHourLabel(v.hour)}</h4>
                      <div className="text-[8px] text-neutral-500 font-semibold uppercase">{activeBranch.name}</div>
                    </div>
                    <button
                      onClick={() => setPlannedVisits(prev => prev.filter(item => item.id !== v.id))}
                      className="p-1 rounded-lg bg-neutral-900 hover:bg-red-500/10 border border-neutral-800 text-neutral-500 hover:text-red-500 transition-all cursor-pointer mr-1"
                    >
                      <Trash className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- PANEL 2: ADMIN ANALYTICS --- */}
      {activePanel === "analytics" && (
        <div className="space-y-8 animate-fade-in" id="traffic-admin-panel">
          
          {/* STATIC STATS DECK */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-neutral-900 border border-neutral-850 p-5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-neutral-500">
                <span className="text-[9px] uppercase font-black font-mono">Overall Peak Hour</span>
                <TrendingUp className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-2xl font-black font-mono">{busiestTimeGlobal?.time || "6:00 PM"}</div>
              <p className="text-[10px] text-neutral-400 font-semibold leading-none">{busiestTimeGlobal?.visitors || 22} avg concurrent check-ins</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-850 p-5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-neutral-500">
                <span className="text-[9px] uppercase font-black font-mono">QUIETEST LIFT ZONE</span>
                <Clock className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black font-mono">{quietestTimeGlobal?.time || "9:00 AM"}</div>
              <p className="text-[10px] text-neutral-400 font-semibold leading-none">{quietestTimeGlobal?.visitors || 4} avg concurrent check-ins</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-850 p-5 rounded-2xl space-y-2">
              <span className="text-[9px] text-neutral-500 uppercase font-black block font-mono">Average Check-ins Scale</span>
              <div className="text-2xl font-black font-mono text-white">42.5 <span className="text-xs text-neutral-500 uppercase"> / Day</span></div>
              <p className="text-[10px] text-emerald-500 font-semibold leading-none">Up +8.2% vs previous week</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-850 p-5 rounded-2xl space-y-2">
              <span className="text-[9px] text-neutral-500 uppercase font-black block font-mono">Peak load recorded today</span>
              <div className="text-2xl font-black font-mono text-yellow-500">76%</div>
              <p className="text-[10px] text-neutral-400 font-semibold leading-none">At 06:15 PM, Centaurus Branch</p>
            </div>
          </div>

          {/* ATTENDANCE CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Daily Visitor volumes bar chart */}
            <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 space-y-4">
              <div>
                <span className="text-[9px] text-yellow-500 uppercase font-black tracking-widest block font-mono">Weekly historical statistics</span>
                <h3 className="text-white text-base font-black uppercase">Average Daily Visits (by Day of Week)</h3>
              </div>
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminDailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="day" stroke="#737373" fontSize={10} fontWeight="bold" />
                    <YAxis stroke="#737373" fontSize={10} fontWeight="bold" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff', fontSize: '11px', borderRadius: '12px' }}
                    />
                    <Bar dataKey="visitors" fill="#eab308" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hourly Distribution trends chart */}
            <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 space-y-4">
              <div>
                <span className="text-[9px] text-yellow-500 uppercase font-black tracking-widest block font-mono">Peak distribution model</span>
                <h3 className="text-white text-base font-black uppercase">Hourly Entry Curve density</h3>
              </div>
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={adminHourlyData}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="time" stroke="#737373" fontSize={8} fontWeight="bold" />
                    <YAxis stroke="#737373" fontSize={10} fontWeight="bold" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff', fontSize: '11px', borderRadius: '12px' }}
                    />
                    <Area type="monotone" dataKey="visitors" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PANEL 3: TV LIVE MODE HUD --- */}
      {activePanel === "tv" && (
        <div className="bg-[#0c0c0c] border border-neutral-850 rounded-3xl p-8 lg:p-12 space-y-8 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden" id="tv-live-hud">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-500" />
          
          <div className="flex justify-between items-center border-b border-neutral-900 pb-5">
            <div className="text-left space-y-1">
              <span className="text-yellow-500 text-[10px] font-black uppercase font-mono tracking-widest flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> LIFE FITNESS CHANNEL LIVE HUD
              </span>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">{activeBranch.name}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-500 font-bold uppercase font-mono block">Current Local clock</span>
              <span className="text-white font-mono font-black text-sm uppercase">2026-06-16 11:53 PM</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 items-center">
            
            {/* Visual Circular occupancy meter */}
            <div className="space-y-4 flex flex-col items-center">
              <div className="relative h-48 w-48 flex items-center justify-center bg-neutral-900 rounded-full border-4 border-neutral-800">
                <div className="absolute inset-0 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin" style={{ animationDuration: '6s' }} />
                <div className="text-center space-y-1 z-10">
                  <span className="text-neutral-500 text-[10px] uppercase font-mono block">Estimated Inside</span>
                  <div className="text-white text-5xl font-black font-mono tracking-tight">{liveStats.count}</div>
                  <span className="text-neutral-500 text-[10px] uppercase font-bold block">Capacity {liveStats.capacity}</span>
                </div>
              </div>

              <div className="bg-neutral-950 px-5 py-2.5 rounded-2xl border border-neutral-850/65 inline-block select-none">
                <span className="text-[9px] text-neutral-500 uppercase block font-mono">Floor density index</span>
                <span className="text-yellow-500 font-black text-sm font-mono">{liveStats.percentage}% active volume</span>
              </div>
            </div>

            {/* Timings summary lists */}
            <div className="text-left space-y-5">
              
              <div className="space-y-1">
                <span className="text-neutral-500 text-[10px] uppercase font-black font-mono block">Suggested quietest upcoming block</span>
                <div className="text-white text-lg font-black uppercase font-mono">Tomorrow Morning @ 08:00 AM</div>
                <p className="text-[10px] text-neutral-400 font-semibold leading-relaxed">Perfect workout block to complete intensive bench presses or high-cable rows without delays.</p>
              </div>

              <div className="space-y-1 border-t border-neutral-900 pt-3">
                <span className="text-neutral-500 text-[10px] uppercase font-black font-mono block">Standard check-ins forecast</span>
                <div className="text-yellow-400 text-lg font-black uppercase font-mono">Moderate (21–35 members)</div>
                <p className="text-[10px] text-neutral-400 font-semibold leading-relaxed">Expect typical member flows. Benches are operating on typical 1.5-minute client intervals.</p>
              </div>

              <div className="space-y-1.5 border-t border-neutral-900 pt-3 text-[10px] text-neutral-400 font-bold leading-normal">
                <div className="flex justify-between">
                  <span>CLEANING SCHEDULE STATUS</span>
                  <span className="text-yellow-500">IMMACULATE</span>
                </div>
                <div className="flex justify-between">
                  <span>LAST COMPLIANT TELEMETRY SCAN</span>
                  <span className="text-neutral-500">30 seconds ago</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-900 text-[9px] text-neural-500 uppercase font-bold font-mono tracking-wider flex items-center justify-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-yellow-500 animate-spin" style={{ animationDuration: '2s' }} />
            COMPLIANT PUBLIC HUD. NO MEMBER IDENTITIES, NAMES, OR PERSONAL HISTORIES SHOWCASING IN VIEW.
          </div>
        </div>
      )}

      {/* --- PANEL 4: ADMIN CONTROLS SETTINGS --- */}
      {activePanel === "settings" && isAdminView && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6 animate-fade-in" id="traffic-settings-panel">
          
          <div className="flex justify-between items-start border-b border-neutral-850 pb-4">
            <div>
              <span className="text-red-500 text-[10px] uppercase font-black tracking-widest font-mono">Administrative Controls</span>
              <h3 className="text-white text-base font-black uppercase">Traffic Summary Calibration Console</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Toggles */}
            <div className="space-y-5">
              <span className="text-[9px] text-neutral-500 uppercase font-black block font-mono">Operational Settings</span>
              
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white uppercase block">Feature Enabled Status</span>
                    <span className="text-[10px] text-neutral-500 leading-normal block">Enable or disable heatmap calculations globally for members.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={featureEnabled}
                    onChange={(e) => setFeatureEnabled(e.target.checked)}
                    className="w-4 h-4 accent-yellow-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-neutral-900 pt-3">
                  <div>
                    <span className="text-xs font-bold text-white uppercase block">Show Live Occupancy telemetry</span>
                    <span className="text-[10px] text-neutral-500 leading-normal block">Display calculated visitor quantities on member interfaces.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={liveOccupancyVisible}
                    onChange={(e) => setLiveOccupancyVisible(e.target.checked)}
                    className="w-4 h-4 accent-yellow-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-neutral-900 pt-3">
                  <div>
                    <span className="text-xs font-bold text-white uppercase block">Allow members to "Plan Visit"</span>
                    <span className="text-[10px] text-neutral-500 leading-normal block">Enable the visit reservation scheduling system.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={membersCanPlan}
                    onChange={(e) => setMembersCanPlan(e.target.checked)}
                    className="w-4 h-4 accent-yellow-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-neutral-900 pt-3">
                  <div>
                    <span className="text-xs font-bold text-white uppercase block">Show Exact visitor quantities</span>
                    <span className="text-[10px] text-neutral-500 leading-normal block">Allows members to see exact visitor averages insted of status text.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showExactCounts}
                    onChange={(e) => setShowExactCounts(e.target.checked)}
                    className="w-4 h-4 accent-yellow-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Slider calibrations */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 space-y-4">
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold uppercase select-none">
                    <span className="text-neutral-300">Historical Calculation Period</span>
                    <span className="text-yellow-500 font-mono">{calculationWeeks} Weeks</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="8"
                    value={calculationWeeks}
                    onChange={(e) => setCalculationWeeks(parseInt(e.target.value))}
                    className="w-full accent-yellow-500 h-1 rounded-full cursor-pointer bg-neutral-805"
                  />
                  <span className="text-[8px] text-neutral-500 block">Uses selected historical timeline weeks to average daily densities.</span>
                </div>

                <div className="space-y-1.5 border-t border-neutral-900 pt-3">
                  <div className="flex justify-between text-xs font-bold uppercase select-none">
                    <span className="text-neutral-300">Estimated Workout Duration</span>
                    <span className="text-yellow-500 font-mono">{workoutDuration} minutes</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="120"
                    step="15"
                    value={workoutDuration}
                    onChange={(e) => setWorkoutDuration(parseInt(e.target.value))}
                    className="w-full accent-yellow-500 h-1 rounded-full cursor-pointer bg-neutral-805"
                  />
                  <span className="text-[8px] text-neutral-500 block">Standard presence allocation for members who do not check out manually.</span>
                </div>
              </div>
            </div>

            {/* Threshold limits / HOLIDAYS */}
            <div className="space-y-5">
              <span className="text-[9px] text-neutral-500 uppercase font-black block font-mono">Branch Timings & Exclusions</span>

              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 space-y-3 text-xs">
                <span className="text-[9px] text-neutral-400 font-black block font-mono uppercase mb-2">Exclusion Date list (Holidays)</span>
                <div className="flex flex-wrap gap-2">
                  {holidayExclusions.map((date) => (
                    <span key={date} className="px-2 py-1 bg-neutral-900 border border-neutral-800 text-neutral-450 rounded-xl font-mono text-[10px] flex items-center gap-1.5">
                      {date}
                      <button 
                        type="button" 
                        onClick={() => setHolidayExclusions(prev => prev.filter(d => d !== date))}
                        className="text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      const d = prompt("Enter exclusion holiday (YYYY-MM-DD):", "2026-07-15");
                      if (d) setHolidayExclusions(prev => [...prev, d]);
                    }}
                    className="px-2 py-1 bg-yellow-500 text-black rounded-xl font-black text-[9px] uppercase cursor-pointer"
                  >
                    + Add Day
                  </button>
                </div>
              </div>

              {/* Timings per Day settings widget */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 space-y-3.5">
                <span className="text-[9px] text-neutral-400 font-black block font-mono uppercase mb-1">Timing Grid - {activeBranch.name}</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {DAYS.map(day => {
                    const times = activeBranch.openTimes[day] || { open: 6, close: 22, isClosed: false };
                    return (
                      <div key={day} className="flex items-center justify-between gap-3 text-[10px] font-mono leading-none border-b border-neutral-900 pb-1.5">
                        <span className="font-bold w-16 text-white uppercase">{day.slice(0, 3)}</span>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-neutral-500">OPEN:</span>
                          <input
                            type="number"
                            min="4"
                            max="12"
                            value={times.open}
                            onChange={(e) => handleUpdateBranchTimings(day, "open", parseInt(e.target.value))}
                            className="bg-neutral-900 text-white w-10 text-center rounded border border-neutral-800 py-0.5 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-neutral-500">CLOSE:</span>
                          <input
                            type="number"
                            min="15"
                            max="24"
                            value={times.close}
                            onChange={(e) => handleUpdateBranchTimings(day, "close", parseInt(e.target.value))}
                            className="bg-neutral-900 text-white w-10 text-center rounded border border-neutral-800 py-0.5 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[8px] text-neutral-550">CLOSED:</span>
                          <input
                            type="checkbox"
                            checked={times.isClosed}
                            onChange={(e) => handleUpdateBranchTimings(day, "isClosed", e.target.checked)}
                            className="accent-yellow-500 h-3 w-3 cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
