import React, { useState, useMemo } from "react";
import { 
  Users, 
  UserPlus, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Trophy, 
  Activity, 
  HelpCircle, 
  Plus, 
  Edit, 
  Trash, 
  Download, 
  AlertTriangle, 
  Check, 
  X, 
  Power, 
  Settings, 
  Megaphone, 
  ShieldCheck, 
  Play, 
  Search, 
  Eye, 
  User, 
  Clock, 
  Sparkles,
  Printer
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { 
  Member, 
  UserProfile, 
  MembershipPlan, 
  MembershipApplication, 
  PaymentRecord, 
  AttendanceRecord, 
  ExerciseChallenge, 
  CompetitionAttempt, 
  ChallengeWinner, 
  MembershipCredit, 
  Announcement, 
  AuditLog, 
  GymSettings 
} from "../types";
import AdminMuscleWiki from "../components/AdminMuscleWiki";
import AdminEquipmentMapping from "../components/AdminEquipmentMapping";
import GymTrafficHeatmap from "../components/GymTrafficHeatmap";
import WhatsAppAutomationDashboard from "../components/WhatsAppAutomationDashboard";

interface AdminDashboardProps {
  settings: GymSettings;
  onUpdateSettings: (s: GymSettings) => void;
  plans: MembershipPlan[];
  onUpdatePlans: (p: MembershipPlan[]) => void;
  applications: MembershipApplication[];
  onApproveApplication: (appId: string) => void;
  onRejectApplication: (appId: string) => void;
  members: Member[];
  onAddMember: (m: Member) => void;
  onUpdateMember: (id: string, updates: Partial<Member>) => void;
  onDeleteMember: (id: string) => void;
  payments: PaymentRecord[];
  onAddPayment: (p: PaymentRecord) => void;
  onUpdatePayment: (id: string, updates: Partial<PaymentRecord>) => void;
  attendance: AttendanceRecord[];
  onAddAttendance: (record: AttendanceRecord) => void;
  onUpdateAttendance: (id: string, updates: Partial<AttendanceRecord>) => void;
  exercises: ExerciseChallenge[];
  onUpdateExercises: (ex: ExerciseChallenge[]) => void;
  attempts: CompetitionAttempt[];
  onUpdateAttemptStatus: (attemptId: string, status: CompetitionAttempt["status"]) => void;
  announcements: Announcement[];
  onAddAnnouncement: (a: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  auditLogs: AuditLog[];
  onExportCsv: (ref: string) => void;
  onSeedDemoData: () => void;
  onClearDemoData: () => void;
}

export default function AdminDashboard({
  settings,
  onUpdateSettings,
  plans,
  onUpdatePlans,
  applications,
  onApproveApplication,
  onRejectApplication,
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  payments,
  onAddPayment,
  onUpdatePayment,
  attendance,
  onAddAttendance,
  onUpdateAttendance,
  exercises,
  onUpdateExercises,
  attempts,
  onUpdateAttemptStatus,
  announcements,
  onAddAnnouncement,
  onDeleteAnnouncement,
  auditLogs,
  onExportCsv,
  onSeedDemoData,
  onClearDemoData
}: AdminDashboardProps) {

  const [activeTab, setActiveTab] = useState<"overview" | "members" | "applications" | "payments" | "attendance" | "competitions" | "announcements" | "settings" | "audit" | "musclewiki" | "equipment" | "traffic" | "whatsapp">("overview");

  // Search & Filter State
  const [memberSearch, setMemberSearch] = useState("");
  const [memberGenderFilter, setMemberGenderFilter] = useState("All");
  const [memberStatusFilter, setMemberStatusFilter] = useState("All");

  // New manual member record fields
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberGender, setNewMemberGender] = useState<"Male" | "Female">("Male");
  const [newMemberPlan, setNewMemberPlan] = useState("premium");
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);

  // Quick check-in panel fields
  const [checkInInput, setCheckInInput] = useState("");
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [overrideTargetId, setOverrideTargetId] = useState("");
  const [overrideReasonInput, setOverrideReasonInput] = useState("");

  // Printable receipt selector
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  // Inactivity alert state
  const [inactivityActiveMember, setInactivityActiveMember] = useState<string | null>(null);
  const [inactivityGeneratedMsg, setInactivityGeneratedMsg] = useState("");
  const [isInactivityGenerating, setIsInactivityGenerating] = useState(false);
  const [isCopiedMsg, setIsCopiedMsg] = useState(false);

  // New Exercise Add
  const [showAddExForm, setShowAddExForm] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExScoreType, setNewExScoreType] = useState<"Reps" | "Time">("Reps");

  // Filter lists
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) || m.id.toLowerCase().includes(memberSearch.toLowerCase()) || m.phone.includes(memberSearch);
    const matchesGender = memberGenderFilter === "All" || m.gender === memberGenderFilter;
    const matchesStatus = memberStatusFilter === "All" || m.membershipStatus === memberStatusFilter;
    return matchesSearch && matchesGender && matchesStatus;
  });

  // Calculate statistics
  const totalRevenue = payments
    .filter(p => p.paymentStatus === "Paid")
    .reduce((sum, p) => sum + p.finalPaidAmount, 0);

  const activeMembersCount = members.filter(m => m.membershipStatus === "Active").length;
  const expiredCount = members.filter(m => m.membershipStatus === "Expired").length;
  const femaleMembersCount = members.filter(m => m.gender === "Female").length;
  const maleMembersCount = members.filter(m => m.gender === "Male").length;

  // Compute chart data for Plan Breakdown Pie Chart
  const planBreakdownData = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach(m => {
      const name = m.planName || "Plan B: Premium";
      counts[name] = (counts[name] || 0) + 1;
    });
    if (Object.keys(counts).length === 0) {
      return [
        { name: "Plan B: Premium", value: 15 },
        { name: "Plan A: Basic", value: 5 }
      ];
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [members]);

  // Compute live Revenue Over Time for Cash-Flow Chart
  const revenueTrendData = useMemo(() => {
    // Sort payments by date
    const sortedPayments = [...payments]
      .filter(p => p.paymentStatus === "Paid")
      .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));

    // Aggregate by date
    const dailyMap: Record<string, number> = {};
    sortedPayments.forEach(p => {
      const d = p.paymentDate;
      dailyMap[d] = (dailyMap[d] || 0) + p.finalPaidAmount;
    });

    const items = Object.entries(dailyMap).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      amount
    }));

    if (items.length === 0) {
      return [
        { date: "Jun 1", amount: 25000 },
        { date: "Jun 5", amount: 48000 },
        { date: "Jun 10", amount: 65000 },
        { date: "Jun 15", amount: 95000 }
      ];
    }
    return items.slice(-10);
  }, [payments]);

  // Compute hourly peak traffic checks
  const hourlyPeakTrafficData = useMemo(() => {
    const hourCounts: Record<string, number> = {
      "06:30 AM": 0, "07:30 AM": 0, "08:30 AM": 0, "09:30 AM": 0,
      "11:30 AM": 0, "01:30 PM": 0, "03:30 PM": 0,
      "05:30 PM": 0, "06:30 PM": 0, "07:30 PM": 0, "08:30 PM": 0, "09:30 PM": 0
    };

    attendance.forEach(a => {
      if (!a.checkInTime) return;
      let slot = "06:30 AM";
      const match = a.checkInTime.match(/(\d+):/i);
      if (match) {
        let hr = parseInt(match[1]);
        const isPM = a.checkInTime.toLowerCase().includes("pm");
        if (hr === 12) {
          slot = isPM ? "01:30 PM" : "11:30 AM";
        } else if (isPM) {
          if (hr === 5) slot = "05:30 PM";
          else if (hr === 6) slot = "06:30 PM";
          else if (hr === 7) slot = "07:30 PM";
          else if (hr === 8) slot = "08:30 PM";
          else if (hr === 9 || hr === 10) slot = "09:30 PM";
          else slot = "03:30 PM";
        } else {
          if (hr === 6) slot = "06:30 AM";
          else if (hr === 7) slot = "07:30 AM";
          else if (hr === 8) slot = "08:30 AM";
          else if (hr === 9 || hr === 10) slot = "09:30 AM";
        }
      }
      if (hourCounts[slot] !== undefined) {
        hourCounts[slot]++;
      }
    });

    return Object.entries(hourCounts).map(([hour, count]) => ({ hour, count }));
  }, [attendance]);

  // Handle manual member creation
  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberPhone.trim()) return;

    const chosenPlan = plans.find(p => p.planId === newMemberPlan) || plans[0];
    const newId = `KFC-${100 + members.length + 1}`;
    
    const today = new Date();
    const expiry = new Date();
    expiry.setMonth(today.getMonth() + 1);

    const m: Member = {
      id: newId,
      fullName: newMemberName,
      fatherName: "Muhammad Khan",
      phone: newMemberPhone,
      whatsApp: newMemberPhone,
      gender: newMemberGender,
      dob: "1998-01-01",
      address: "Wasar Road, Mandi Bahauddin",
      emergencyContactName: "Relative",
      emergencyContactNumber: newMemberPhone,
      bloodGroup: "O+",
      photoUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=150",
      planId: chosenPlan.planId,
      planName: chosenPlan.name,
      durationMonths: 1,
      membershipStatus: "Active",
      joinedDate: today.toISOString().split("T")[0],
      expiryDate: expiry.toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onAddMember(m);
    
    // Log active automated payment
    const paymentId = `pay-${Date.now()}`;
    const pRecord: PaymentRecord = {
      paymentId,
      receiptNo: `REC-2026-00${payments.length + 1}`,
      memberId: m.id,
      memberName: m.fullName,
      planName: m.planName,
      duration: 1,
      originalPrice: chosenPlan.price1m,
      discountType: "None",
      discountAmount: 0,
      finalPaidAmount: chosenPlan.price1m,
      paymentMethod: "Cash at Gym",
      paymentStatus: "Paid",
      paymentDate: today.toISOString().split("T")[0],
      receivedBy: "System Admin",
      createdAt: new Date().toISOString()
    };
    onAddPayment(pRecord);

    setNewMemberName("");
    setNewMemberPhone("");
    setShowAddMemberForm(false);
  };

  // Automated Quick Scan Attendance logic
  const handleCheckInScan = () => {
    setAttendanceMessage("");
    setOverrideTargetId("");

    const target = members.find(m => m.id === checkInInput || m.phone === checkInInput);
    if (!target) {
      setAttendanceMessage("Member record not found.");
      return;
    }

    if (target.membershipStatus === "Expired" || target.membershipStatus === "Suspended") {
      setAttendanceMessage(`Scan Bloqued: Membership is ${target.membershipStatus}. Overrule required.`);
      setOverrideTargetId(target.id);
      return;
    }

    // Success check-in logic
    const recordId = `record-${Date.now()}`;
    const rec: AttendanceRecord = {
      recordId,
      memberId: target.id,
      memberName: target.fullName,
      gender: target.gender,
      date: new Date().toISOString().split("T")[0],
      checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      staffId: "admin-s1",
      staffName: "Admin Assistant",
      status: "Present"
    };

    onAddAttendance(rec);
    setAttendanceMessage(`Checked In: ${target.fullName} (${target.id}) success.`);
    setCheckInInput("");
  };

  // Perform override for expired check-ins
  const handleOverrideCheckIn = () => {
    if (!overrideTargetId || !overrideReasonInput.trim()) return;
    const target = members.find(m => m.id === overrideTargetId);
    if (!target) return;

    const recordId = `record-${Date.now()}`;
    const rec: AttendanceRecord = {
      recordId,
      memberId: target.id,
      memberName: target.fullName,
      gender: target.gender,
      date: new Date().toISOString().split("T")[0],
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      staffId: "admin-s1",
      staffName: "Admin Manager",
      status: "Present",
      overrideReason: overrideReasonInput
    };

    onAddAttendance(rec);
    setAttendanceMessage(`Overriden Checked In: ${target.fullName} (${target.id}) logged with reason.`);
    setCheckInInput("");
    setOverrideTargetId("");
    setOverrideReasonInput("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* HUD HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-white font-black text-3xl uppercase tracking-tighter">Gym Control Room</h1>
          <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">{settings.gymName} Administrative Console</p>
        </div>

        {/* Horizontal Navigation Pills */}
        <div className="flex flex-wrap gap-2 text-xs font-bold uppercase shrink-0">
          {[
            { id: "overview", name: "Overview" },
            { id: "members", name: "Members" },
            { id: "applications", name: "Applications" },
            { id: "payments", name: "Payments" },
            { id: "attendance", name: "Attendance Check" },
            { id: "competitions", name: "Attempts" },
            { id: "announcements", name: "Notices" },
            { id: "settings", name: "Gym Settings" },
            { id: "musclewiki", name: "MuscleWiki Integration" },
            { id: "equipment", name: "Exercise Equipment Mapping" },
            { id: "traffic", name: "Traffic Heatmap" },
            { id: "whatsapp", name: "🍀 WhatsApp Automation" }
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === tb.id 
                  ? "bg-red-650 bg-red-600 text-black font-black shadow-md shadow-yellow-500/10" 
                  : "bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-white"
              }`}
            >
              {tb.name}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW MODULE */}
      {activeTab === "overview" && (
        <div className="space-y-10">
          {/* STATS DECK */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-5 space-y-1">
              <span className="text-neutral-500 text-[10px] font-black uppercase">Active Members:</span>
              <span className="font-mono text-3xl font-black text-white block">{activeMembersCount}</span>
              <span className="text-[10px] text-neutral-500 block">Total roster list: {members.length}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-5 space-y-1">
              <span className="text-neutral-500 text-[10px] font-black uppercase">Pending Applications:</span>
              <span className="font-mono text-3xl font-black text-yellow-500 block">{applications.filter(a => a.status === "Pending").length}</span>
              <span className="text-[10px] text-neutral-500 block">Requires manual check</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-5 space-y-1">
              <span className="text-neutral-500 text-[10px] font-black uppercase">Today's Attendance:</span>
              <span className="font-mono text-3xl font-black text-white block">
                {attendance.filter(a => a.date === new Date().toISOString().split("T")[0]).length}
              </span>
              <span className="text-[10px] text-neutral-5050 block text-neutral-500">Separated Male/Female counts</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-5 space-y-1">
              <span className="text-neutral-500 text-[10px] font-black uppercase">System Revenue logs:</span>
              <span className="font-mono text-2xl font-black text-green-500 block">Rs. {totalRevenue.toLocaleString()}</span>
              <span className="text-[10px] text-neutral-500 block">Invoices logged: {payments.length}</span>
            </div>
          </div>

          {/* DYNAMIC CHARTS DECK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. Cash-Flow & Gross Revenue Trend */}
            <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-850 pb-3">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-green-500 animate-pulse" />
                  Cash-Flow & Gross Revenues History
                </h3>
                <span className="text-[10px] text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Live Register</span>
              </div>
              <div className="h-64 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", borderRadius: "12px", color: "#fff" }}
                      formatter={(val: number) => [`Rs. ${val.toLocaleString()}`, "Revenue"]}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Plan Popularity (Live Pie Chart) */}
            <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-850 pb-3">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-red-500" />
                  Roster Plan Popularity distribution
                </h3>
                <span className="text-[10px] text-neutral-500 font-mono">Real-time counts</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-64">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {planBreakdownData.map((entry, index) => {
                          const COLORS = ["#dc2626", "#eab308", "#3b82f6", "#a855f7"];
                          return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                        })}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", borderRadius: "12px", color: "#fff" }}
                        formatter={(val: number) => [`${val} Athletes`, "Count"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs space-y-2.5 font-semibold text-neutral-350">
                  {planBreakdownData.map((entry, index) => {
                    const COLORS = ["#dc2626", "#eab308", "#3b82f6", "#a855f7"];
                    return (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate max-w-[180px] text-neutral-350">{entry.name}: <span className="font-mono text-white font-bold">{entry.value}</span></span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Hourly Peak Traffic Checks (Gym Attendance Density) */}
            <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-850 pb-3">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Daily Capacity Peak Load (Traffic Analysis)
                </h3>
                <span className="text-[10px] text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded uppercase font-bold">Density Meter</span>
              </div>
              <div className="h-64 w-full text-[10px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyPeakTrafficData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="hour" stroke="#6b7280" tickLine={false} />
                    <YAxis stroke="#6b7280" allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", borderRadius: "12px", color: "#fff" }}
                      formatter={(val: number) => [`${val} Check-ins`, "Frequency"]}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-neutral-500 text-center leading-normal italic font-semibold">
                This graph aggregates historical swipe-ins to identify peak training times in morning vs evening male/female slots.
              </p>
            </div>

            {/* 4. Gender Athlete Roster Splits layout */}
            <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-neutral-850 pb-3">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-pink-500" />
                  Gender Athlete Roster Split Dynamics
                </h3>
                <span className="text-[10px] text-[10px] text-neutral-550 block text-neutral-500">Live Census</span>
              </div>
              <div className="space-y-5 pt-2">
                <div className="space-y-2 text-xs font-bold uppercase">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-600" />Male Athletes ({maleMembersCount})</span>
                    <span className="text-white font-bold">{Math.round((maleMembersCount / members.length) * 100) || 60}%</span>
                  </div>
                  <div className="w-full bg-neutral-950 h-3.5 rounded-full overflow-hidden border border-neutral-850/40 p-0.5">
                    <div className="bg-red-600 h-full rounded-full transition-all duration-1000" style={{ width: `${(maleMembersCount / members.length) * 100 || 60}%` }} />
                  </div>
                </div>
                
                <div className="space-y-2 text-xs font-bold uppercase">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-pink-500" />Female Athletes ({femaleMembersCount})</span>
                    <span className="text-white font-bold">{Math.round((femaleMembersCount / members.length) * 100) || 40}%</span>
                  </div>
                  <div className="w-full bg-neutral-950 h-3.5 rounded-full overflow-hidden border border-neutral-850/40 p-0.5">
                    <div className="bg-pink-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(femaleMembersCount / members.length) * 100 || 40}%` }} />
                  </div>
                </div>

                <div className="bg-neutral-950/40 border border-neutral-850/40 p-4 rounded-2xl text-[11px] leading-relaxed text-neutral-450 space-y-1">
                  <span className="text-red-500 text-[9px] font-black uppercase tracking-widest block">Operational Advantage:</span>
                  <p className="text-neutral-400 font-semibold leading-normal">
                    This distribution supports trainers in deploying female personal coaching plans and balancing equipment accessibility for female timing schedules (11:00 AM - 4:00 PM).
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* ATTENDANCE QUICK LOG CONSOLE */}
            <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 space-y-4">
              <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-red-500" />
                Quick Entrance Attendance Scan Logger
              </h3>
              <p className="text-xs text-neutral-450 text-neutral-400">Enter a Member ID (e.g., KFC-101) or standard phone number to record check-in logs immediately.</p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={checkInInput}
                  onChange={(e) => setCheckInInput(e.target.value)}
                  placeholder="ID or mobile digits"
                  className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none"
                />
                <button 
                  onClick={handleCheckInScan}
                  className="bg-red-600 hover:bg-red-700 text-black font-black px-6 py-3 rounded-xl uppercase text-xs cursor-pointer transition-all"
                >
                  Log Check-In
                </button>
              </div>

              {attendanceMessage && (
                <p className="text-xs font-bold text-yellow-500 mt-2 p-3 bg-neutral-950 rounded-xl border border-neutral-850/50">
                  {attendanceMessage}
                </p>
              )}

              {/* Overrule Panel */}
              {overrideTargetId && (
                <div className="p-4 bg-yellow-950/20 border border-yellow-800/20 rounded-2xl text-xs space-y-3">
                  <span className="text-yellow-400 font-extrabold uppercase flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 animate-pulse" />
                    Overrule Expiry restrictions
                  </span>
                  <input
                    type="text"
                    value={overrideReasonInput}
                    onChange={(e) => setOverrideReasonInput(e.target.value)}
                    placeholder="Enter overrule reasoning (e.g. Cash Handed at Desck)"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white"
                  />
                  <button
                    onClick={handleOverrideCheckIn}
                    className="bg-yellow-500 text-black font-extrabold px-4 py-2 rounded-lg leading-none cursor-pointer hover:bg-yellow-400 transition-colors"
                  >
                    Force Log Override Check-in
                  </button>
                </div>
              )}
            </div>

            {/* RETENTION HUB & PROACTIVE ENGAGEMENT ASSISTANT */}
            <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-850 pb-3">
                <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-red-500" />
                  Retention Hub & Inactivity Alerts
                </h3>
                <span className="text-[10px] bg-red-650/15 text-red-500 border border-red-500/10 px-2 py-0.5 rounded font-black font-mono">
                  CHURN CONTROL
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-normal">
                Identify registered members idle for 4+ days. Generate region-optimized motivational messages featuring local athletic terms to proactive-forward via WhatsApp.
              </p>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {members.slice(2, 6).map((m) => {
                  const isCurrentTarget = inactivityActiveMember === m.id;
                  return (
                    <div 
                      key={m.id} 
                      className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                        isCurrentTarget 
                          ? "bg-red-500/10 border-red-500/30" 
                          : "bg-neutral-950/40 border-neutral-850/60 hover:border-neutral-800"
                      }`}
                    >
                      <div className="space-y-1 truncate max-w-[55%]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-red-500 font-extrabold">{m.id}</span>
                          <span className="text-white font-black uppercase text-xs truncate">{m.fullName.split(" ")[0]}</span>
                        </div>
                        <span className="text-[9px] text-neutral-500 font-mono block">Last checked-in: 4 days ago</span>
                      </div>

                      <button
                        onClick={() => {
                          // Local generator logic
                          setIsInactivityGenerating(true);
                          setInactivityActiveMember(m.id);
                          setTimeout(() => {
                            const name = m.fullName.split(" ")[0].toUpperCase();
                            const timingTag = m.gender === "Female" ? "LADIES POWER SHIFT" : "EVENING PEAK GRIND";
                            const output = `⚡ *LIFE FITNESS APEX RETENTION DRILL* ⚡\n\nAssalam-o-Alaikum, *${name}*! ⚔️\n\nYour spot in the *${timingTag}* slot at Life Fitness Mandi Bahauddin is looking empty! You have logged 0 check-ins inside the last 4 days.\n\nDon't let progress slip back. Grind is temporary, but the crown is forever. Scan your gate pass tomorrow to reactive your workout streak and gain bonus +55 Lounge XP.\n\n— *Coach Shehzad, Technical Advisor*`;
                            setInactivityGeneratedMsg(output);
                            setIsInactivityGenerating(false);
                          }, 600);
                        }}
                        disabled={isInactivityGenerating && isCurrentTarget}
                        className="bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-red-500/20 text-neutral-300 hover:text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer font-mono shrink-0 transition-all active:scale-95"
                      >
                        {isInactivityGenerating && isCurrentTarget ? "Thinking..." : "Synthesize AI Prompt"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Generated alert output frame */}
              {inactivityGeneratedMsg && inactivityActiveMember && (
                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 space-y-3.5 animate-fade-in">
                  <div className="flex justify-between items-center text-[10px] text-neutral-500 uppercase font-black border-b border-neutral-900 pb-2">
                    <span>⚡ AI WhatsApp Broadcast Message</span>
                    <button 
                      onClick={() => {
                        const m = members.find(u => u.id === inactivityActiveMember);
                        if (m) {
                          const waUrl = `https://wa.me/${m.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(inactivityGeneratedMsg)}`;
                          window.open(waUrl, "_blank", "referrer");
                        } else {
                          navigator.clipboard.writeText(inactivityGeneratedMsg);
                          setIsCopiedMsg(true);
                          setTimeout(() => setIsCopiedMsg(false), 2500);
                        }
                      }}
                      className="text-red-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none font-bold"
                    >
                      {isCopiedMsg ? "Copied!" : "Instant Forward"}
                    </button>
                  </div>

                  <pre className="text-[10px] text-neutral-300 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {inactivityGeneratedMsg}
                  </pre>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inactivityGeneratedMsg);
                        setIsCopiedMsg(true);
                        setTimeout(() => setIsCopiedMsg(false), 2500);
                      }}
                      className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      {isCopiedMsg ? "✓ Copy Successful!" : "Copy message text"}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MEMBER LIST TAB */}
      {activeTab === "members" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-white font-extrabold text-lg uppercase">Gym Member roster (Total: {members.length})</h2>
            <button
              onClick={() => setShowAddMemberForm(!showAddMemberForm)}
              className="bg-red-600 hover:bg-red-700 text-black font-black text-xs uppercase px-4 py-2.5 rounded-lg flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Member Manually
            </button>
          </div>

          {showAddMemberForm && (
            <form onSubmit={handleAddNewMember} className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-bold uppercase">
              <div className="space-y-1">
                <span className="text-neutral-400">Full Name</span>
                <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Full Name" className="w-full p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-white font-bold" />
              </div>
              <div className="space-y-1">
                <span className="text-neutral-400">Phone Number</span>
                <input type="tel" value={newMemberPhone} onChange={(e) => setNewMemberPhone(e.target.value)} placeholder="03xxxxxxxxx" className="w-full p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-white font-mono" />
              </div>
              <div className="space-y-1">
                <span className="text-neutral-400">Timing Separation</span>
                <select value={newMemberGender} onChange={(e) => setNewMemberGender(e.target.value as any)} className="w-full p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-white">
                  <option value="Male">Male timings</option>
                  <option value="Female">Female TIMINGS</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-neutral-400">Membership Category</span>
                <select value={newMemberPlan} onChange={(e) => setNewMemberPlan(e.target.value)} className="w-full p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-white">
                  <option value="premium">Plan B: Premium Custom</option>
                  <option value="basic">Plan A: Basic Weight</option>
                </select>
              </div>
              <button type="submit" className="sm:col-span-4 py-3 bg-red-600 text-black font-black rounded-lg uppercase">Register manual member & generate initial ID</button>
            </form>
          )}

          {/* Search Bar & Filters */}
          <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-850 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2">
              <Search className="h-4.5 w-4.5 text-neutral-500 shrink-0" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search by ID, name, or phone digits..."
                className="bg-transparent border-none text-white text-xs w-full focus:outline-none"
              />
            </div>
            <select value={memberGenderFilter} onChange={(e) => setMemberGenderFilter(e.target.value)} className="p-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-bold uppercase text-neutral-300">
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select value={memberStatusFilter} onChange={(e) => setMemberStatusFilter(e.target.value)} className="p-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-bold uppercase text-neutral-300">
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Frozen">Frozen</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* TABLE DISPLAY */}
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-neutral-950 text-neutral-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Profile Card / Id</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Timing</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 bg-neutral-900/40 text-neutral-300">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-900 transition-colors">
                    <td className="p-4 font-mono text-red-500 font-bold">{m.id}</td>
                    <td className="p-4">
                      <div className="flex gap-2 items-center">
                        <img src={m.photoUrl} alt={m.fullName} className="h-6 w-6 rounded-full object-cover shrink-0" />
                        <span className="font-bold text-white uppercase">{m.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono">{m.phone}</td>
                    <td className="p-4 uppercase text-[10px]">{m.gender}</td>
                    <td className="p-4 font-mono text-neutral-450">{m.expiryDate}</td>
                    <td className="p-4">
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${m.membershipStatus === "Active" ? "bg-green-600/10 border-green-500/20 text-green-400" : "bg-red-650/10 border border-red-500/20 text-red-500"}`}>
                        {m.membershipStatus}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => {
                          const ext = prompt("Enter additional months to extend (e.g. 1 or 3):");
                          if (!ext) return;
                          const count = Number(ext);
                          if (isNaN(count)) return;
                          
                          const d = new Date(m.expiryDate);
                          d.setMonth(d.getMonth() + count);
                          onUpdateMember(m.id, { expiryDate: d.toISOString().split("T")[0], membershipStatus: "Active" });
                        }}
                        className="text-xs bg-neutral-950 hover:bg-neutral-900 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-white font-bold"
                      >
                        Renew
                      </button>
                      <button
                        onClick={() => {
                          const action = m.membershipStatus === "Frozen" ? "Active" : "Frozen";
                          onUpdateMember(m.id, { membershipStatus: action });
                        }}
                        className="text-xs bg-neutral-950 hover:bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-850 text-neutral-400 font-bold"
                      >
                        {m.membershipStatus === "Frozen" ? "Unfreeze" : "Freeze"}
                      </button>
                      <button
                        onClick={() => onDeleteMember(m.id)}
                        className="text-red-500 hover:text-red-400 font-black"
                      >
                        <Trash className="h-4.5 w-4.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MEMBERSHIP APPLICATIONS TAB */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          <h2 className="text-white font-extrabold text-lg uppercase">Prospective Registration Submissions ({applications.length})</h2>
          
          <div className="grid grid-cols-1 gap-4">
            {applications.filter(a => a.status === "Pending").length === 0 ? (
              <div className="py-12 bg-neutral-900 border border-neutral-850 rounded-3xl text-center text-neutral-500 text-sm">
                No pending registration requests waiting for administrative review.
              </div>
            ) : (
              applications.filter(a => a.status === "Pending").map((app) => (
                <div key={app.applicationId} className="bg-neutral-900 border border-neutral-850 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in uppercase font-bold text-xs">
                  <div className="flex gap-4 items-center">
                    <img src={app.photoUrl} alt={app.fullName} className="h-10 w-10 rounded-full object-cover shrink-0 bg-neutral-950" />
                    <div>
                      <span className="text-[10px] text-red-500 font-mono italic">App No: {app.applicationId}</span>
                      <h3 className="text-white font-black text-sm uppercase leading-tight">{app.fullName}</h3>
                      <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
                        Fathers: {app.fatherName} • Mobile: {app.phone} • CNIC: {app.cnic || "None"}
                      </p>
                    </div>
                  </div>

                  <div className="text-left md:text-right space-y-1">
                    <span className="text-neutral-500 block">Plan Selection:</span>
                    <span className="text-white font-bold">{app.durationMonths} Month(s) {app.planId === "premium" ? "Premium" : "Basic"}</span>
                    {app.medicalNotes && <p className="text-[10px] italic text-red-400 lowercase font-medium">Notes: {app.medicalNotes}</p>}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onApproveApplication(app.applicationId)}
                      className="bg-green-650 bg-green-600 hover:bg-green-700 text-white font-black px-4 py-2 rounded-lg"
                    >
                      Approve & Gen ID
                    </button>
                    <button
                      onClick={() => onRejectApplication(app.applicationId)}
                      className="bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-neutral-450 px-3 py-2 rounded-lg"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* BILLINGS & TRANSACTIONS TAB */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
            <h2 className="text-white font-extrabold text-lg uppercase">System Payment Receipts ({payments.length})</h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-950 text-neutral-500 font-bold uppercase">
                  <th className="p-4">Receipt No</th>
                  <th className="p-4">Member ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Paid Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 bg-neutral-900/40 text-neutral-300 uppercase leading-normal">
                {payments.map((p) => (
                  <tr key={p.paymentId}>
                    <td className="p-4 font-mono text-red-500 font-bold">{p.receiptNo}</td>
                    <td className="p-4 font-mono">{p.memberId}</td>
                    <td className="p-4 font-bold text-white">{p.memberName}</td>
                    <td className="p-4 font-medium text-neutral-450">{p.paymentMethod}</td>
                    <td className="p-4 font-mono">Rs. {p.finalPaidAmount.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${p.paymentStatus === "Paid" ? "bg-green-650/10 border border-green-500/20 text-green-400" : "bg-yellow-600/10 border border-yellow-500/20 text-yellow-500"}`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="text-red-500 hover:text-red-400 bg-neutral-950 p-2 border border-neutral-850 rounded-lg inline-block"
                      >
                        <Printer className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PRINTABLE RECEIPT MODAL OVERLAY */}
          {selectedReceipt && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div id="receipt-print-area" className="bg-white text-black p-8 rounded-3xl max-w-md w-full space-y-6 font-mono text-[11px] leading-relaxed border border-neutral-350">
                <div className="text-center space-y-1">
                  <h1 className="font-sans font-black text-xl uppercase tracking-tighter text-red-600 leading-none">{settings.gymName}</h1>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase">Wasar Road, Mandi Bahauddin</p>
                  <p className="text-[9px] text-neutral-500 font-bold block">Hotline: 0344 3292360</p>
                </div>

                <div className="border-y border-dashed border-neutral-300 py-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Receipt No:</span>
                    <span className="font-bold">{selectedReceipt.receiptNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Member Id:</span>
                    <span className="font-bold">{selectedReceipt.memberId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client Name:</span>
                    <span className="font-bold uppercase">{selectedReceipt.memberName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Selected Plan:</span>
                    <span className="font-bold uppercase">{selectedReceipt.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Date:</span>
                    <span className="font-bold">{selectedReceipt.paymentDate}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs">
                    <span>Original Cost:</span>
                    <span className="font-bold font-sans">Rs. {selectedReceipt.originalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-sans">
                    <span>System Discount:</span>
                    <span>Rs. {selectedReceipt.discountAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold font-sans border-t pt-2 text-red-600">
                    <span>Final Paid In Cash:</span>
                    <span>Rs. {selectedReceipt.finalPaidAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-center pt-6 space-y-4">
                  <div className="border-t border-dashed border-neutral-300 pt-6 flex justify-between px-4 text-[9px] text-neutral-400">
                    <span>Received By: {selectedReceipt.receivedBy}</span>
                    <span className="border-b border-black w-24">Staff Signature</span>
                  </div>
                  <p className="text-[9px] text-neutral-400">Thank you for joining. Lift heavy safely!</p>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-black font-black uppercase text-xs rounded-xl transition-all"
                  >
                    Close Slip Preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ATTENDANCE RECORDS DECK */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-white font-extrabold text-lg uppercase">Daily Attendance Check logs</h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-850">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-950 text-neutral-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Member ID</th>
                  <th className="p-4">Member Name</th>
                  <th className="p-4">Checked-In</th>
                  <th className="p-4">Override Reason</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 bg-neutral-900/40 text-neutral-300 uppercase leading-normal">
                {attendance.slice().reverse().map((att) => (
                  <tr key={att.recordId}>
                    <td className="p-4 font-mono font-bold text-neutral-400">{att.date}</td>
                    <td className="p-4 font-mono text-red-500 font-bold">{att.memberId}</td>
                    <td className="p-4 text-white font-extrabold">{att.memberName}</td>
                    <td className="p-4 font-mono">{att.checkInTime}</td>
                    <td className="p-4 italic text-yellow-500 text-[10px] font-semibold lowercase">{att.overrideReason || "Standard checked-in scan"}</td>
                    <td className="p-4">
                      <span className="text-[9.5px] uppercase font-mono tracking-widest text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full font-bold">
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPETITION ATTEMPTS REVIEW */}
      {activeTab === "competitions" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-white font-extrabold text-lg uppercase">Trainer Tournament verification queue</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {attempts.map((att) => (
              <div key={att.attemptId} className="bg-neutral-900 border border-neutral-850 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in font-bold text-xs uppercase">
                <div className="flex gap-4 items-center">
                  <div className="h-10 w-10 rounded-full overflow-hidden border border-neutral-850 bg-neutral-950 shrink-0">
                    <img src={att.photoUrl || "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=150"} alt={att.memberName} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[9px] text-red-500 font-mono font-extrabold">{att.memberId}</span>
                    <h3 className="text-white font-black text-sm uppercase mt-0.5">{att.memberName}</h3>
                    <p className="text-[10px] text-neutral-500 block leading-normal mt-1">Exercise: {att.exerciseName} ({att.gender})</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-neutral-500 block">Submitted Score Performance:</span>
                  <span className="text-red-500 font-mono text-base font-black leading-none">{att.scoreDisplay}</span>
                  <span className="text-[9px] text-neutral-500 block">Trainer log: {att.staffName}</span>
                </div>

                <div className="flex gap-2">
                  {att.status === "Pending" ? (
                    <>
                      <button
                        onClick={() => onUpdateAttemptStatus(att.attemptId, "Approved")}
                        className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-3 py-2 rounded-lg"
                      >
                        Approve Display
                      </button>
                      <button
                        onClick={() => onUpdateAttemptStatus(att.attemptId, "Rejected")}
                        className="bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-neutral-500 px-3 py-2 rounded-lg"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-2 rounded-lg border ${
                      att.status === "Approved" ? "bg-green-650/10 border-green-500/20 text-green-400" :
                      "bg-red-950/20 border-red-900/30 text-red-500"
                    }`}>
                      {att.status} Status
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS TAB */}
      {activeTab === "announcements" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-900">
            <h2 className="text-white font-extrabold text-lg uppercase">Active Bulletins noticeboard</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-neutral-900 p-5 rounded-2xl border border-neutral-850 flex justify-between items-start gap-4">
                <div className="space-y-2 leading-relaxed uppercase font-bold text-xs">
                  <h3 className="text-white text-sm font-black tracking-tight">{ann.title}</h3>
                  <p className="text-neutral-400 text-[11px] leading-relaxed font-semibold lowercase first-letter:uppercase">{ann.content}</p>
                  <span className="text-[10px] text-neutral-500 font-mono font-bold block">{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => onDeleteAnnouncement(ann.id)}
                  className="text-red-500 bg-neutral-950 p-2.5 border border-neutral-850 rounded-lg"
                >
                  <Trash className="h-4.5 w-4.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SETTINGS AND PILOT TESTING DATA RESET */}
      {activeTab === "settings" && (
        <div className="space-y-8 max-w-3xl">
          <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-white font-black uppercase text-base tracking-tight pb-3 border-b border-neutral-850">Website Contact & Maps Pointer Configuration</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs uppercase font-bold text-neutral-400">
              <div className="space-y-1.5">
                <span>Gym Name</span>
                <input type="text" value={settings.gymName} onChange={(e) => onUpdateSettings({ ...settings, gymName: e.target.value })} className="w-full px-3.5 py-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-white font-bold" />
              </div>
              <div className="space-y-1.5">
                <span>Hotline Phone</span>
                <input type="text" value={settings.phone} onChange={(e) => onUpdateSettings({ ...settings, phone: e.target.value })} className="w-full px-3.5 py-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-white font-mono" />
              </div>
              <div className="space-y-1.5">
                <span>WhatsApp Admin Number</span>
                <input type="text" value={settings.whatsApp} onChange={(e) => onUpdateSettings({ ...settings, whatsApp: e.target.value })} className="w-full px-3.5 py-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-white font-mono" />
              </div>
              <div className="space-y-1.5">
                <span>Google Maps satellite Url</span>
                <input type="text" value={settings.googleMapsUrl} onChange={(e) => onUpdateSettings({ ...settings, googleMapsUrl: e.target.value })} className="w-full px-3.5 py-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-white font-mono text-[10px]" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <span>Physical Hub Address</span>
                <input type="text" value={settings.location} onChange={(e) => onUpdateSettings({ ...settings, location: e.target.value })} className="w-full px-3.5 py-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-white font-bold" />
              </div>
            </div>
          </div>

          {/* PILOT DEVELOPER SIMULATION TOOL PANEL */}
          <div className="bg-red-950/10 border border-red-900/20 rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-red-500 font-black uppercase text-base tracking-tight">Pilot Testing & Demo Data Seed Control</h3>
            <p className="text-neutral-400 text-xs leading-relaxed font-semibold">
              During evaluation, use the controls below to toggle mock entries instantly. Demolition wipes clean all 
              records tagged as `isDemo: true` instantly from active stores.
            </p>

            <div className="flex gap-3 text-xs uppercase font-bold text-white pt-2">
              <button
                onClick={() => {
                  onSeedDemoData();
                  alert("Demo system entities successfully seeded!");
                }}
                className="bg-green-600 hover:bg-green-700 font-extrabold px-6 py-3.5 rounded-xl shadow-md cursor-pointer"
              >
                Inoculate Mock Demo Data (20 Members)
              </button>
              <button
                onClick={() => {
                  onClearDemoData();
                  alert("Clean slate executed successfully.");
                }}
                className="bg-danger-red hover:opacity-90 text-white font-black px-6 py-3.5 rounded-xl pointer-events-auto transition-all"
              >
                Demolish All Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "musclewiki" && (
        <AdminMuscleWiki />
      )}

      {activeTab === "equipment" && (
        <AdminEquipmentMapping />
      )}

      {activeTab === "traffic" && (
        <div className="animate-fade-in text-white/90">
          <GymTrafficHeatmap attendance={attendance} isAdminView={true} />
        </div>
      )}

      {activeTab === "whatsapp" && (
        <div className="animate-fade-in text-white/90">
          <WhatsAppAutomationDashboard 
            members={members} 
            workoutPlans={plans} 
            gymSettings={settings} 
          />
        </div>
      )}
    </div>
  );
}
