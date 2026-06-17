import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PublicPages from "./pages/PublicPages";
import MemberPortal from "./pages/MemberPortal";
import TvDisplay from "./pages/TvDisplay";
import AdminDashboard from "./pages/AdminDashboard";
import QrMachineInspect from "./components/QrMachineInspect";

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
  Announcement, 
  AuditLog, 
  GymSettings 
} from "./types";

import { 
  defaultSettings, 
  defaultPlans, 
  defaultExercises, 
  demoMembers, 
  demoPastWinners, 
  demoAttempts, 
  demoPayments, 
  demoAttendance, 
  demoAnnouncements 
} from "./data/demoData";

// Safe local storage load utilities
const loadState = <T,>(key: string, defaultValue: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (err) {
    console.warn(`Local Storage retrieval error on ${key}:`, err);
    return defaultValue;
  }
};

const saveState = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Local Storage write error on ${key}:`, err);
  }
};

export default function App() {
  
  // PRIMARY APP STATE MACHINES
  const [currentView, setCurrentView] = useState<string>(() => loadState("kfc_view", "home"));
  const [lang, setLang] = useState<"en" | "ur">(() => loadState("kfc_lang", "en"));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => loadState("kfc_user", null));

  // DATABASES
  const [settings, setSettings] = useState<GymSettings>(() => loadState("kfc_settings", defaultSettings));
  const [plans, setPlans] = useState<MembershipPlan[]>(() => loadState("kfc_plans", defaultPlans));
  const [members, setMembers] = useState<Member[]>(() => loadState("kfc_members", demoMembers));
  const [payments, setPayments] = useState<PaymentRecord[]>(() => loadState("kfc_payments", demoPayments));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadState("kfc_attendance", demoAttendance));
  const [exercises, setExercises] = useState<ExerciseChallenge[]>(() => loadState("kfc_exercises", defaultExercises));
  const [attempts, setAttempts] = useState<CompetitionAttempt[]>(() => loadState("kfc_attempts", demoAttempts));
  const [pastWinners, setPastWinners] = useState<ChallengeWinner[]>(() => loadState("kfc_winners", demoPastWinners));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => loadState("kfc_announcements", demoAnnouncements));
  const [applications, setApplications] = useState<MembershipApplication[]>(() => loadState("kfc_applications", []));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadState("kfc_audits", []));

  // Modal selector for testing emails/accounts in Google Login preview flows
  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState(false);
  const [scannedMachineId, setScannedMachineId] = useState<string | null>(null);

  // Auto-sync state machines to client localStorage
  useEffect(() => { saveState("kfc_view", currentView); }, [currentView]);
  useEffect(() => { saveState("kfc_lang", lang); }, [lang]);
  useEffect(() => { saveState("kfc_user", currentUser); }, [currentUser]);
  useEffect(() => { saveState("kfc_settings", settings); }, [settings]);
  useEffect(() => { saveState("kfc_plans", plans); }, [plans]);
  useEffect(() => { saveState("kfc_members", members); }, [members]);
  useEffect(() => { saveState("kfc_payments", payments); }, [payments]);
  useEffect(() => { saveState("kfc_attendance", attendance); }, [attendance]);
  useEffect(() => { saveState("kfc_exercises", exercises); }, [exercises]);
  useEffect(() => { saveState("kfc_attempts", attempts); }, [attempts]);
  useEffect(() => { saveState("kfc_winners", pastWinners); }, [pastWinners]);
  useEffect(() => { saveState("kfc_announcements", announcements); }, [announcements]);
  useEffect(() => { saveState("kfc_applications", applications); }, [applications]);
  useEffect(() => { saveState("kfc_audits", auditLogs); }, [auditLogs]);

  // Synchronously restore the server HTTP-only session on boot
  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("No active session");
      })
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          if (data.user.role === "member") {
            const matched = [...members, ...demoMembers].find(m => m.email === data.user.email);
            const targetId = matched?.id || "KFC-101";
            localStorage.setItem("temp_portal_m_id", targetId);
          }
        }
      })
      .catch(() => {
        // Safe to ignore if no session cookie exists yet
      });
  }, []);

  // Intercept QR Code scanned machine paths on load
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/equipment/")) {
      const parts = path.split("/");
      const machineId = parts[parts.length - 1];
      if (machineId) {
        setScannedMachineId(machineId);
        setCurrentView("qr-machine-page");
      }
    }
  }, []);

  // Process incoming secure WhatsApp deep links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    if (viewParam === "member-workouts") {
      // Clear the query parameters to keep the URL address bar clean and premium
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Keep track of redirect intent
      sessionStorage.setItem("lf_redirect_to_workouts", "true");
      
      if (currentUser && currentUser.role === "member") {
        setCurrentView("member-portal");
      } else {
        // Push user to login screen first, after login successful it will redirect to workouts
        setCurrentView("member-login");
      }
    }
  }, [currentUser]);

  // Logging utility for administrator auditing list
  const logAction = (action: string, performedBy: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: `user-${Date.now()}`,
      userName: performedBy,
      action,
      details,
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Google Login selector triggers
  const handleTriggerGoogleLogin = () => {
    setShowGoogleLoginModal(true);
  };

  // Perform virtual login setup
  const executeLoginChoice = (role: "SuperAdmin" | "Member1" | "Member2") => {
    setShowGoogleLoginModal(false);
    
    if (role === "SuperAdmin") {
      const user: UserProfile = {
        uid: "uid-sa-1",
        email: settings.initialAdminEmail || "zunairkalyar10@gmail.com",
        name: "Zunair Kalyar",
        role: "super_admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCurrentUser(user);
      fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user })
      }).catch(err => console.warn("Sa login session sync err:", err));
      logAction("Staff Authentication Login", user.name, "Super Admin unlocked dashboard entry");
      setCurrentView("admin");
    } else if (role === "Member1") {
      const firstMem = members[0] || demoMembers[0];
      const user: UserProfile = {
        uid: "uid-m-1",
        email: "member1@kalyarfitness.com",
        name: firstMem.fullName,
        role: "member",
        memberId: firstMem.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      // Keep track of active portal target via localStorage or memory
      localStorage.setItem("temp_portal_m_id", firstMem.id);
      setCurrentUser(user);
      fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user })
      }).catch(err => console.warn("M1 login session sync err:", err));
      logAction("Member Authentication Login", user.name, `Member checked digital ID ${firstMem.id}`);
      setCurrentView("member-portal");
    } else {
      const secondMem = members[1] || demoMembers[1];
      const user: UserProfile = {
        uid: "uid-m-2",
        email: "member2@kalyarfitness.com",
        name: secondMem.fullName,
        role: "member",
        memberId: secondMem.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("temp_portal_m_id", secondMem.id);
      setCurrentUser(user);
      fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user })
      }).catch(err => console.warn("M2 login session sync err:", err));
      logAction("Member Authentication Login", user.name, `Member checked digital ID ${secondMem.id}`);
      setCurrentView("member-portal");
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      logAction("User Logout", currentUser.name, "Voluntary portal disconnection logged");
    }
    localStorage.removeItem("temp_portal_m_id");
    setCurrentUser(null);
    fetch("/api/auth/logout", { method: "POST" })
      .catch(err => console.warn("Logout session sync error:", err));
    setCurrentView("home");
  };

  // Submissions handler for online applications
  const handleApplySubmission = async (applicantInputs: Partial<MembershipApplication>): Promise<MembershipApplication> => {
    const appId = `APP-${1000 + applications.length + 1}`;
    
    const app: MembershipApplication = {
      applicationId: appId,
      fullName: applicantInputs.fullName || "Candidate Guest",
      fatherName: applicantInputs.fatherName || "Father Name",
      phone: applicantInputs.phone || "03000000000",
      whatsApp: applicantInputs.whatsApp || applicantInputs.phone || "03000000000",
      gender: applicantInputs.gender || "Male",
      dob: applicantInputs.dob || "1995-01-01",
      address: applicantInputs.address || "Mandi Bahauddin",
      emergencyContactName: applicantInputs.emergencyContactName || "Guardian",
      emergencyContactNumber: applicantInputs.emergencyContactNumber || "03000000000",
      bloodGroup: applicantInputs.bloodGroup || "O+",
      cnic: applicantInputs.cnic || "",
      photoUrl: applicantInputs.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
      planId: applicantInputs.planId || "premium",
      durationMonths: applicantInputs.durationMonths || 1,
      timingPreference: applicantInputs.gender === "Female" ? "Female Only Mid-Day" : "Male Morning",
      medicalNotes: applicantInputs.medicalNotes || "none",
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    setApplications(prev => [app, ...prev]);
    logAction("Membership Application Filed", app.fullName, `Candidate registered prospective submission details`);
    return app;
  };

  // Action: Approve registration -> turns into premium member & logs billing
  const handleApproveApplication = (appId: string) => {
    const target = applications.find(a => a.applicationId === appId);
    if (!target) return;

    // Generate member details
    const newId = `KFC-${100 + members.length + 1}`;
    const today = new Date();
    
    // expiry calculation
    const expiry = new Date();
    expiry.setMonth(today.getMonth() + target.durationMonths);

    const newMem: Member = {
      id: newId,
      fullName: target.fullName,
      fatherName: target.fatherName,
      phone: target.phone,
      whatsApp: target.whatsApp,
      gender: target.gender,
      dob: target.dob,
      address: target.address,
      emergencyContactName: target.emergencyContactName,
      emergencyContactNumber: target.emergencyContactNumber,
      bloodGroup: target.bloodGroup,
      photoUrl: target.photoUrl,
      planId: target.planId,
      planName: target.planId === "premium" ? "Plan B: Premium" : "Plan A: Basic",
      durationMonths: target.durationMonths,
      membershipStatus: "Active",
      joinedDate: today.toISOString().split("T")[0],
      expiryDate: expiry.toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Calculate premium / basic price values
    const selectedPlanConfig = plans.find(p => p.planId === target.planId) || defaultPlans[0];
    const originalRate = target.durationMonths === 1 ? selectedPlanConfig.price1m : selectedPlanConfig.price3m;
    const finalBill = originalRate * target.durationMonths;

    const receipt: PaymentRecord = {
      paymentId: `pay-${Date.now()}`,
      receiptNo: `REC-2026-00${payments.length + 1}`,
      memberId: newMem.id,
      memberName: newMem.fullName,
      planName: newMem.planName,
      duration: target.durationMonths,
      originalPrice: finalBill,
      discountType: "None",
      discountAmount: 0,
      finalPaidAmount: finalBill,
      paymentMethod: "Cash at Gym",
      paymentStatus: "Paid",
      paymentDate: today.toISOString().split("T")[0],
      receivedBy: currentUser?.name || "Desk Registrar",
      createdAt: new Date().toISOString()
    };

    setMembers(prev => [newMem, ...prev]);
    setPayments(prev => [receipt, ...prev]);
    
    // Set status
    setApplications(prev => prev.map(a => a.applicationId === appId ? { ...a, status: "Approved" } : a));
    logAction("Approve Candidate Application", "Administrator", `Created member profile card ${newMem.id} and cash billing slip`);
  };

  const handleRejectApplication = (appId: string) => {
    setApplications(prev => prev.map(a => a.applicationId === appId ? { ...a, status: "Rejected" } : a));
    logAction("Reject Application Detail", "Administrator", `Application ${appId} was marked decline`);
  };

  // Pilot Testing Handlers
  const handleSeedDemoData = () => {
    setSettings(defaultSettings);
    setPlans(defaultPlans);
    setMembers(demoMembers);
    setPayments(demoPayments);
    setAttendance(demoAttendance);
    setExercises(defaultExercises);
    setAttempts(demoAttempts);
    setPastWinners(demoPastWinners);
    setAnnouncements(demoAnnouncements);
    logAction("Demo Environment Seed", "Pilot Developer", "Inoculated standard 20 robust member cards, historical invoices & attendance check logs");
  };

  const handleClearDemoData = () => {
    setMembers([]);
    setPayments([]);
    setAttendance([]);
    setAttempts([]);
    setApplications([]);
    setAnnouncements([]);
    setAuditLogs([]);
    logAction("Wipe Clean Slate", "Developer Clear", "Cleared all member history registers");
  };

  const handleExportCsv = (ref: string) => {
    alert(`CSV downloaded: ${ref}_register_export_2026.csv`);
  };

  const handlePasskeyLoginSuccess = (user: UserProfile) => {
    if (user.role === "member") {
      const matchEmail = user.email;
      const matched = [...members, ...demoMembers].find(m => m.email === matchEmail);
      const targetId = matched?.id || "KFC-101";
      const finalUser = { ...user, memberId: targetId };

      localStorage.setItem("temp_portal_m_id", targetId);
      setCurrentUser(finalUser);
      fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: finalUser })
      }).catch(err => console.warn("Passkey login session sync err:", err));
      logAction("Biometric Passkey Authentication Login", user.name, `Member checked digital ID ${targetId}`);
      setCurrentView("member-portal");
    } else {
      setCurrentUser(user);
      fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user })
      }).catch(err => console.warn("Staff Passkey login session sync err:", err));
      logAction("Staff Biometric Authentication Login", user.name, `${user.role} unlocked control dashboard via Passkey assertion`);
      setCurrentView("admin");
    }
  };

  // Switch navigation blocks
  const renderPrimaryRouteComponent = () => {
    switch (currentView) {
      case "member-portal": {
        if (!currentUser || currentUser.role !== "member") {
          return (
            <div className="py-20 text-center text-xs font-bold text-neutral-400">
              Access Denied. Please authenticate Member profile first.
            </div>
          );
        }
        const tempId = localStorage.getItem("temp_portal_m_id") || demoMembers[0].id;
        const activeMemRecord = members.find(m => m.id === tempId) || demoMembers[0];
        if (!activeMemRecord) {
          return (
            <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
              <p className="text-sm text-neutral-400 font-bold uppercase">Member profile card missing from active database.</p>
              <button onClick={handleLogout} className="bg-red-650 hover:bg-red-700 text-white text-xs px-4 py-2 font-black uppercase rounded-lg">Sign Out</button>
            </div>
          );
        }
        return (
          <MemberPortal
            member={activeMemRecord}
            payments={payments.filter(p => p.memberId === activeMemRecord.id)}
            attendance={attendance.filter(a => a.memberId === activeMemRecord.id)}
            attempts={attempts.filter(at => at.memberId === activeMemRecord.id)}
            credits={[]}
            announcements={announcements}
            settings={settings}
            onLogout={handleLogout}
            onUpdateMember={(updated) => setMembers(prev => prev.map(m => m.id === updated.id ? updated : m))}
          />
        );
      }

      case "admin": {
        if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "super_admin")) {
          return (
            <div className="py-20 text-center text-sm font-bold text-neutral-400">
              Access Denied. Admin level security verified credentials required.
            </div>
          );
        }
        return (
          <AdminDashboard
            settings={settings}
            onUpdateSettings={setSettings}
            plans={plans}
            onUpdatePlans={setPlans}
            applications={applications}
            onApproveApplication={handleApproveApplication}
            onRejectApplication={handleRejectApplication}
            members={members}
            onAddMember={(m) => setMembers(prev => [m, ...prev])}
            onUpdateMember={(id, updates) => setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))}
            onDeleteMember={(id) => setMembers(prev => prev.filter(m => m.id !== id))}
            payments={payments}
            onAddPayment={(p) => setPayments(prev => [p, ...prev])}
            onUpdatePayment={(id, updates) => setPayments(prev => prev.map(p => p.paymentId === id ? { ...p, ...updates } : p))}
            attendance={attendance}
            onAddAttendance={(rec) => setAttendance(prev => [...prev, rec])}
            onUpdateAttendance={(id, updates) => setAttendance(prev => prev.map(a => a.recordId === id ? { ...a, ...updates } : a))}
            exercises={exercises}
            onUpdateExercises={setExercises}
            attempts={attempts}
            onUpdateAttemptStatus={(attemptId, status) => setAttempts(prev => prev.map(at => at.attemptId === attemptId ? { ...at, status } : at))}
            announcements={announcements}
            onAddAnnouncement={(ann) => setAnnouncements(prev => [ann, ...prev])}
            onDeleteAnnouncement={(id) => setAnnouncements(prev => prev.filter(a => a.id !== id))}
            auditLogs={auditLogs}
            onExportCsv={handleExportCsv}
            onSeedDemoData={handleSeedDemoData}
            onClearDemoData={handleClearDemoData}
          />
        );
      }

      case "tv":
        return (
          <TvDisplay
            settings={settings}
            plans={plans}
            exercises={exercises}
            attempts={attempts}
            pastWinners={pastWinners}
            announcements={announcements}
            memberList={members}
            attendance={attendance}
            onExit={() => setCurrentView("leaderboard")}
          />
        );

      default:
        // Render one of the standard public views
        return (
          <PublicPages
            currentView={currentView}
            onNavigate={setCurrentView}
            settings={settings}
            plans={plans}
            exercises={exercises}
            attempts={attempts}
            pastWinners={pastWinners}
            onApply={handleApplySubmission}
            onTriggerGoogleLogin={handleTriggerGoogleLogin}
            lang={lang}
            onLoginSuccess={handlePasskeyLoginSuccess}
          />
        );
    }
  };

  // Prepare safe profile reference for Navbar component signature matching (role: UserRole)
  const preparedNavbarUser = currentUser ? {
    email: currentUser.email,
    uid: currentUser.uid,
    role: currentUser.role
  } : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-500 selection:text-white flex flex-col justify-between">
      
      {/* HEADER NAVIGATION */}
      {currentView !== "tv" && (
        <Navbar
          currentView={currentView}
          onNavigate={setCurrentView}
          currentUser={preparedNavbarUser}
          onLogout={handleLogout}
          gymName={settings.gymName}
        />
      )}

      {/* DYNAMIC SCENARIO RENDERER */}
      <div className="flex-1">
        {renderPrimaryRouteComponent()}
      </div>

      {/* FOOTER */}
      {currentView !== "tv" && (
        <Footer
          onNavigate={setCurrentView}
          gymName={settings.gymName}
          address={settings.location}
          phone={settings.phone}
          whatsApp={settings.whatsApp}
        />
      )}

      {/* MODAL: GOOGLE ACCOUNT SELECTION SIMULATOR */}
      {showGoogleLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-6">
            <div className="text-center space-y-2">
              <span className="text-red-500 text-[10px] font-black uppercase tracking-widest block font-mono">Continuous Sandbox testing</span>
              <h3 className="text-white text-lg font-black uppercase tracking-tight">Select Test Google Account</h3>
              <p className="text-xs text-neutral-400">
                To test the complete workflow (registration triggers, payments, trainer checks, TV views), select one of the following virtual accounts.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => executeLoginChoice("SuperAdmin")}
                className="w-full text-left p-3.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center gap-3 active:scale-98 transition-all"
              >
                <div className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center font-extrabold text-[11px] uppercase">
                  SA
                </div>
                <div>
                  <span className="text-white font-black text-xs uppercase block">Zunair Kalyar</span>
                  <span className="text-[10px] text-neutral-500 block">zunairkalyar10@gmail.com (Super Admin)</span>
                </div>
              </button>

              <button
                onClick={() => executeLoginChoice("Member1")}
                className="w-full text-left p-3.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center gap-3 active:scale-98 transition-all"
              >
                <div className="h-8 w-8 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center font-bold text-xs uppercase">
                  M1
                </div>
                <div>
                  <span className="text-white font-bold text-xs uppercase block">Zunair Kalyar</span>
                  <span className="text-[10px] text-neutral-500 block">Digital id card: KFC-101</span>
                </div>
              </button>

              <button
                onClick={() => executeLoginChoice("Member2")}
                className="w-full text-left p-3.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center gap-3 active:scale-98 transition-all"
              >
                <div className="h-8 w-8 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center font-bold text-xs uppercase">
                  M2
                </div>
                <div>
                  <span className="text-white font-bold text-xs uppercase block">Kamran Kalyar</span>
                  <span className="text-[10px] text-neutral-500 block">Digital id card: KFC-102</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowGoogleLoginModal(false)}
              className="w-full py-3.5 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 font-extrabold text-xs uppercase rounded-xl border border-neutral-800 transition-all text-center"
            >
              Cancel Login
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
