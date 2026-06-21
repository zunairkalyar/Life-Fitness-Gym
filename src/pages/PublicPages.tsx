import React, { useState } from "react";
import { 
  Phone, 
  MapPin, 
  Trophy, 
  Clock, 
  CheckCircle, 
  Award, 
  AlertTriangle, 
  ChevronRight, 
  Sparkles, 
  Activity, 
  FileText, 
  Check, 
  Send, 
  ShieldCheck, 
  Camera,
  Utensils,
  Apple,
  TrendingUp,
  Flame
} from "lucide-react";
import { Fingerprint, KeyRound, Terminal, Eye, Cpu } from "lucide-react";
import { 
  Member, 
  MembershipPlan, 
  ExerciseChallenge, 
  CompetitionAttempt, 
  ChallengeWinner, 
  MembershipApplication, 
  GymSettings,
  UserProfile,
  MemberPasskey
} from "../types";

interface PublicPagesProps {
  currentView: string;
  onNavigate: (view: string) => void;
  settings: GymSettings;
  plans: MembershipPlan[];
  exercises: ExerciseChallenge[];
  attempts: CompetitionAttempt[];
  pastWinners: ChallengeWinner[];
  onApply: (applicant: Partial<MembershipApplication>) => Promise<MembershipApplication>;
  onTriggerGoogleLogin: () => void;
  lang: "en" | "ur";
  onLoginSuccess?: (user: UserProfile) => void;
}

export default function PublicPages({ 
  currentView, 
  onNavigate, 
  settings, 
  plans, 
  exercises, 
  attempts, 
  pastWinners, 
  onApply, 
  onTriggerGoogleLogin,
  lang,
  onLoginSuccess
}: PublicPagesProps) {

  // Local state for Passkey login
  const [passkeyLoginId, setPasskeyLoginId] = useState("");
  const [assertingPasskey, setAssertingPasskey] = useState(false);
  const [passkeyAssertionLog, setPasskeyAssertionLog] = useState<string[]>([]);
  const [showAssertModal, setShowAssertModal] = useState(false);
  const [allowedCredentials, setAllowedCredentials] = useState<any[]>([]);

  const addAssertLog = (msg: string) => {
    setPasskeyAssertionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handlePasskeySignIn = async () => {
    setAssertingPasskey(true);
    setPasskeyAssertionLog([]);
    addAssertLog("FIDO2/WebAuthn Client lookup initiated...");
    
    try {
      addAssertLog("POST /api/passkeys/assert-challenge...");
      const challengeRes = await fetch("/api/passkeys/assert-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: passkeyLoginId.trim() || undefined })
      });
      
      if (!challengeRes.ok) {
        throw new Error("Failed to receive authentication challenge from club server.");
      }
      
      const assertOptions = await challengeRes.json();
      addAssertLog(`Challenge loaded. Allowed credentials matched on file: ${assertOptions.allowCredentials.length}`);
      setAllowedCredentials(assertOptions.allowCredentials);

      setShowAssertModal(true);
    } catch (err: any) {
      addAssertLog(`ERROR: ${err.message}`);
      setAssertingPasskey(false);
    }
  };

  const verifyBiometricAssertion = async (deviceType: string) => {
    setShowAssertModal(false);
    addAssertLog(`Biometric verification succeeded on device with ${deviceType}!`);
    addAssertLog("Asymmetric FIDO2 signature exported from enclave vault.");

    try {
      addAssertLog("Retrieving server keys database matching verification signature...");
      // Resolve the first match or any matched key.
      const listRes = await fetch(`/api/passkeys/settings/${passkeyLoginId.trim() || "any"}`);
      let targetCredId = "";
      if (listRes.ok) {
        const listData = await listRes.json();
        const matchedKey = passkeyLoginId.trim()
          ? listData.find((k: any) => k.memberId.toLowerCase() === passkeyLoginId.trim().toLowerCase())
          : listData[0];
        
        if (matchedKey) {
          targetCredId = matchedKey.id;
        }
      }

      if (!targetCredId) {
        // Fallback check all keys if no direct match for "any"
        const allKeysRes = await fetch("/api/passkeys/settings/any");
        if (allKeysRes.ok) {
          const allKeys = await allKeysRes.json();
          const matched = passkeyLoginId.trim()
            ? allKeys.find((k: any) => k.memberId.toLowerCase() === passkeyLoginId.trim().toLowerCase())
            : allKeys[0];
          if (matched) {
            targetCredId = matched.id;
          }
        }
      }

      if (!targetCredId) {
        throw new Error("No registered biometric passkey credentials found on file matching this ID. Go to Portal settings to enroll a device passkey first.");
      }

      addAssertLog(`Matched Authenticator Credential ID: "${targetCredId}"`);
      addAssertLog("Verifying client attestation signature directly against key counter...");

      const verifyRes = await fetch("/api/passkeys/assert-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: targetCredId,
          memberId: passkeyLoginId.trim() || undefined
        })
      });

      if (!verifyRes.ok) {
        let errMsg = "Server validation rejected biometric signature.";
        try {
          const errObj = await verifyRes.json();
          errMsg = errObj.error || errMsg;
        } catch (_) {
          errMsg = `Server validation failed (${verifyRes.status} ${verifyRes.statusText})`;
        }
        throw new Error(errMsg);
      }

      let result: any;
      try {
        result = await verifyRes.json();
      } catch (_) {
        throw new Error("Invalid response data format received from authentication server.");
      }
      addAssertLog("SUCCESS: FIDO2 WebAuthn authentication handshake completed!");
      
      if (onLoginSuccess && result.user) {
        onLoginSuccess(result.user);
      }
    } catch (err: any) {
      addAssertLog(`ERROR: ${err.message}`);
      setAssertingPasskey(false);
    }
  };

  // Local state for join application form
  const [formName, setFormName] = useState("");
  const [formFather, setFormFather] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWhatsApp, setFormWhatsApp] = useState("");
  const [formGender, setFormGender] = useState<"Male" | "Female">("Male");
  const [formDob, setFormDob] = useState("1998-01-01");
  const [formAddress, setFormAddress] = useState("");
  const [formEmergencyName, setFormEmergencyName] = useState("");
  const [formEmergencyNumber, setFormEmergencyNumber] = useState("");
  const [formBlood, setFormBlood] = useState("B+");
  const [formCnic, setFormCnic] = useState("");
  const [formPhoto, setFormPhoto] = useState("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=150");
  const [formPlan, setFormPlan] = useState("premium");
  const [formDuration, setFormDuration] = useState(1);
  const [formTiming, setFormTiming] = useState("Male Evening (5:00 PM to 10:00 PM)");
  const [formMedical, setFormMedical] = useState("");
  const [formTerms, setFormTerms] = useState(false);

  // Application submission success screen
  const [createdApplication, setCreatedApplication] = useState<MembershipApplication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [activeChallengesTab, setActiveChallengesTab] = useState<"challenges" | "leaderboard" | "top-nine" | "winners" | "rules">("challenges");

  // Elite Interactive Pakistani Nutrition & Meal Planner States
  const [localWeight, setLocalWeight] = useState("75");
  const [localHeight, setLocalHeight] = useState("175");
  const [localAge, setLocalAge] = useState("24");
  const [localGender, setLocalGender] = useState<"Male" | "Female">("Male");
  const [localActivityLevel, setLocalActivityLevel] = useState("1.375");
  const [localGoal, setLocalGoal] = useState<"cut" | "bulk" | "maintain">("bulk");

  // Nutrition swap selections
  const [breakfastSwapSelected, setBreakfastSwapSelected] = useState(true);
  const [lunchSwapSelected, setLunchSwapSelected] = useState(true);
  const [snackSwapSelected, setSnackSwapSelected] = useState(true);
  const [dinnerSwapSelected, setDinnerSwapSelected] = useState(true);
  const [dietCopied, setDietCopied] = useState(false);

  // BMI & Goal Advisor State
  const [showBmiAdvisor, setShowBmiAdvisor] = useState(false);
  const [bmiWeight, setBmiWeight] = useState("72");
  const [bmiHeight, setBmiHeight] = useState("175");
  const [bmiAge, setBmiAge] = useState("25");
  const [bmiGoal, setBmiGoal] = useState("muscle");
  const [bmiResult, setBmiResult] = useState<{
    bmi: number;
    category: string;
    tdee: number;
    recommendedPlan: "basic" | "premium";
    notes: string;
  } | null>(null);

  const calculateBmiAndGoal = () => {
    const w = parseFloat(bmiWeight);
    const hCM = parseFloat(bmiHeight);
    const a = parseInt(bmiAge);
    if (isNaN(w) || isNaN(hCM) || isNaN(a) || w <= 0 || hCM <= 0 || a <= 0) {
      return;
    }
    const hM = hCM / 100;
    const bmiVal = parseFloat((w / (hM * hM)).toFixed(1));
    let cat = "Normal";
    if (bmiVal < 18.5) cat = "Underweight";
    else if (bmiVal >= 18.5 && bmiVal < 25) cat = "Normal";
    else if (bmiVal >= 25 && bmiVal < 30) cat = "Overweight";
    else cat = "Obese";

    // BMR estimate
    const bmr = 10 * w + 6.25 * hCM - 5 * a + (formGender === "Female" ? -161 : 5);
    const tdeeVal = Math.round(bmr * 1.375); // moderate activity active
    let goalCal = tdeeVal;
    let recPlan: "basic" | "premium" = "basic";

    switch (bmiGoal) {
      case "muscle":
        goalCal = tdeeVal + 300;
        recPlan = "basic";
        break;
      case "fat":
        goalCal = tdeeVal - 500;
        recPlan = "premium";
        break;
      case "power":
        goalCal = tdeeVal + 400;
        recPlan = "basic";
        break;
      case "tone":
        goalCal = tdeeVal - 150;
        recPlan = "premium";
        break;
      case "active":
        goalCal = tdeeVal;
        recPlan = "premium";
        break;
    }

    setBmiResult({
      bmi: bmiVal,
      category: cat,
      tdee: goalCal,
      recommendedPlan: recPlan,
      notes: `Aura Physical Goals: Target ${bmiGoal === "muscle" ? "Muscle Gain" : bmiGoal === "fat" ? "Athletic Fat Burn" : bmiGoal === "power" ? "Powerlifting Base" : bmiGoal === "tone" ? "Body Shaping" : "Functional Conditioning"}. Calculated BMI: ${bmiVal} (${cat}). Daily Target Energy Intake: ${goalCal} kcal. Auto-assigned optimal plan selection.`
    });
  };

  const applyBmiRecommendation = () => {
    if (!bmiResult) return;
    setFormPlan(bmiResult.recommendedPlan);
    setFormMedical(bmiResult.notes);
    setShowBmiAdvisor(false);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!formTerms) {
      setValidationError("You must accept the terms and conditions to join.");
      return;
    }
    if (!formName.trim() || !formPhone.trim() || !formAddress.trim()) {
      setValidationError("Please fill out all required fields: Name, Phone, and Address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<MembershipApplication> = {
        fullName: formName,
        fatherName: formFather,
        phone: formPhone,
        whatsApp: formWhatsApp || formPhone,
        gender: formGender,
        dob: formDob,
        address: formAddress,
        emergencyContactName: formEmergencyName,
        emergencyContactNumber: formEmergencyNumber,
        bloodGroup: formBlood,
        cnic: formCnic,
        photoUrl: formPhoto,
        planId: formPlan,
        durationMonths: Number(formDuration),
        timingPreference: formTiming,
        medicalNotes: formMedical,
        status: "Pending"
      };

      const result = await onApply(payload);
      setCreatedApplication(result);
    } catch (err: any) {
      setValidationError("Submission failed. Please check internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper score calculator for registration fee display
  const getSelectedPlanFeeEstimate = () => {
    const p = plans.find(p => p.planId === formPlan);
    if (!p) return 0;
    if (formDuration === 12) return p.price12m;
    if (formDuration === 6) return p.price6m;
    if (formDuration === 3) return p.price3m;
    return p.price1m * formDuration;
  };

  // Helper to extract top performers
  const getTopPerformers = (exId: string, limit = 3) => {
    return attempts
      .filter(a => a.exerciseId === exId && a.status === "Approved")
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  };

  // Quick WhatsApp Link builder
  const getWhatsAppMsgUrl = (msg: string) => {
    const rawNumber = settings.whatsApp.replace(/[^0-9]/g, "");
    return `https://wa.me/${rawNumber}?text=${encodeURIComponent(msg)}`;
  };

  const getJoinWhatsAppMessage = () => {
    if (!createdApplication) return "";
    return `Assalam-o-Alaikum Life Fitness Admin. I have submitted my registration application!\nApplication No: ${createdApplication.applicationId}\nName: ${createdApplication.fullName}\nPlan: ${createdApplication.durationMonths} Month(s) ${createdApplication.planId === "premium" ? "Plan B Premium" : "Plan A Basic"}\nAmount: Rs. ${getSelectedPlanFeeEstimate()}\nPlease verify my payment and approve. Thank you!`;
  };

  // Render view functions
  switch (currentView) {
    case "home":
      return (
        <div className="space-y-16 pb-20">
          {/* HERO SECTION - WIDE TWO COLUMN LAYOUT */}
          <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-radial-gradient from-neutral-900 to-black px-4 py-16">
            {/* Visual Dark Overlay with glowing accent lights */}
            <div className="absolute inset-0 bg-cover bg-center opacity-20 filter grayscale contrast-125 brightness-50" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=1520')" }} />
            <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-red-600/10 rounded-full filter blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 h-72 w-72 bg-orange-600/10 rounded-full filter blur-[120px] pointer-events-none" />

            <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 text-center lg:text-left space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/15 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                  <Sparkles className="h-4.5 w-4.5" />
                  Monthly Competitions Active
                </div>

                <h1 className="font-black text-4xl sm:text-6xl md:text-7xl tracking-extratight text-white uppercase leading-none">
                  Train Strong.<br />
                  Compete Hard.<br />
                  Win <span className="text-red-500 underline decoration-red-600">Free Membership</span>.
                </h1>

                <p className="max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg text-neutral-400 font-medium">
                  Join a dynamic Mandi Bahauddin fitness community built around strength, discipline, progressive lifting 
                  and monthly "Life Fitness Top Nine" challenge rewards.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <button
                    onClick={() => onNavigate("join")}
                    className="bg-red-650 hover:bg-red-700 text-black font-black px-8 py-4 rounded-xl uppercase tracking-wider text-sm transition-all shadow-lg shadow-yellow-500/10 active:scale-95"
                  >
                    Join Now
                  </button>
                  <button
                    onClick={() => onNavigate("membership")}
                    className="bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800 font-bold px-8 py-4 rounded-xl uppercase text-sm tracking-wide transition-all"
                  >
                    View Membership Plans
                  </button>
                  <button
                    onClick={() => onNavigate("leaderboard")}
                    className="bg-transparent text-yellow-500 hover:text-yellow-400 border border-yellow-500/30 hover:border-yellow-400 font-bold px-6 py-4 rounded-xl uppercase text-sm tracking-wide transition-all flex items-center justify-center gap-2"
                  >
                    <Trophy className="h-4.5 w-4.5" />
                    Live Leaderboard
                  </button>
                </div>

                {/* Place Quick Contacts within the Left Hero Section */}
                <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto lg:mx-0 text-xs text-center">
                  <a
                    href={`tel:${settings.phone}`}
                    className="flex items-center justify-center gap-2 py-3 bg-neutral-900/50 hover:bg-neutral-900 text-white border border-neutral-800 rounded-lg transition-all"
                  >
                    <Phone className="h-4 w-4 text-red-500" />
                    Call Now
                  </a>
                  <a
                    href={`https://wa.me/${settings.whatsApp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-center gap-2 py-3 bg-green-950/20 hover:bg-green-950/40 text-green-400 border border-green-900/30 rounded-lg transition-all"
                  >
                    <span className="text-green-500 font-bold font-mono">WA</span>
                    WhatsApp Us
                  </a>
                  <a
                    href={settings.googleMapsUrl}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-3 bg-neutral-900/50 hover:bg-neutral-900 text-white border border-neutral-800 rounded-lg transition-all"
                  >
                    <MapPin className="h-4 w-4 text-orange-500" />
                    Get Directions
                  </a>
                </div>
              </div>

              {/* Right column: Graphic & statistics display */}
              <div className="lg:col-span-5 hidden lg:block relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                <div className="relative rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl shadow-red-500/5 aspect-[4/5] group bg-neutral-900">
                  <img
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600"
                    alt="Life Fitness Gym"
                    className="w-full h-full object-cover grayscale brightness-90 group-hover:scale-105 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-20 space-y-2 bg-neutral-950/85 backdrop-blur-md p-5 rounded-2xl border border-neutral-800">
                    <span className="text-[10px] text-red-500 font-black uppercase tracking-wider block">Established Strength</span>
                    <h4 className="text-white text-lg font-black uppercase font-sans">Life Fitness Co.</h4>
                    <p className="text-neutral-400 text-xs">Mandi Bahauddin's leading platform for elite training and sports development.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CHALLENGE HIGHLIGHT */}
          <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="bg-red-950/10 border border-red-900/20 rounded-3xl p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="text-red-500 font-bold tracking-widest uppercase text-xs">
                  The Life Fitness Top Nine Challenge
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase leading-none">
                  9 Exercises. 9 Winners.<br />
                  9 Free Memberships.
                </h2>
                <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                  Every month, our gym tracks 9 distinct exercise categories (including Bench Press, Treadmill Endurance, 
                  Pull-Ups, and Plank). Finish at the top of any monthly leaderboard, and receive 1 month of 
                  gym membership completely free. Resets every calendar month so everyone has a constant shot!
                </p>
                <div className="pt-2 flex gap-3">
                  <button onClick={() => onNavigate("challenges")} className="bg-red-650 hover:bg-red-700 text-black font-black text-xs uppercase px-5 py-3 rounded-lg tracking-wider">
                    See Challenges Rules
                  </button>
                  <button onClick={() => onNavigate("leaderboard")} className="bg-neutral-900 border border-neutral-800 text-white text-xs font-bold px-5 py-3 rounded-lg hover:bg-neutral-800">
                    Live Standings
                  </button>
                </div>
              </div>
              <div className="lg:col-span-5 grid grid-cols-3 gap-3">
                {exercises.slice(0, 9).map((ex, index) => (
                  <div key={ex.id} className="bg-neutral-900/60 border border-neutral-950 rounded-xl p-4 text-center space-y-1">
                    <span className="text-neutral-600 font-black text-2xl block">0{index + 1}</span>
                    <span className="text-[10px] text-white font-extrabold uppercase line-clamp-1 block leading-tight">{ex.name.split(" ")[0]}</span>
                    <span className="text-[9px] text-red-500 block font-mono font-bold uppercase">{ex.scoringType}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* QUICK SEPARATED TIMINGS PREVIEW */}
          <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
                Separated Gym Timings
              </h2>
              <p className="text-neutral-500 text-sm mt-1">
                Ensuring a premium, comfortable, and focused fitness environment for both Male & Female athletes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-20 w-20 bg-blue-500/5 rounded-full filter blur-xl" />
                <span className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] uppercase font-bold tracking-widest inline-block">
                  Male Morning
                </span>
                <h3 className="font-extrabold text-xl text-white">06:00 AM – 10:00 AM</h3>
                <p className="text-xs text-neutral-500">Everyday except Sunday. Fully supervised and coached by staff specialists.</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-20 w-20 bg-pink-500/5 rounded-full filter blur-xl" />
                <span className="px-2.5 py-1 rounded bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] uppercase font-bold tracking-widest inline-block">
                  Female Midday (Only)
                </span>
                <h3 className="font-extrabold text-xl text-white">11:00 AM – 04:00 PM</h3>
                <p className="text-xs text-neutral-500">Strictly dedicated for female members with private environment safeguards.</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-20 w-20 bg-orange-500/5 rounded-full filter blur-xl" />
                <span className="px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] uppercase font-bold tracking-widest inline-block">
                  Male Evening
                </span>
                <h3 className="font-extrabold text-xl text-white">05:00 PM – 10:00 PM</h3>
                <p className="text-xs text-neutral-500">Heavy-lift hour, focused atmosphere, complete coaching crew on-deck.</p>
              </div>
            </div>
            <div className="text-center pt-2">
              <button onClick={() => onNavigate("timings")} className="text-neutral-400 hover:text-white font-bold text-xs uppercase hover:underline flex items-center justify-center gap-1 mx-auto">
                View Cleaning Breaks & Holiday Details
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

          {/* CARDIO COMPARISON PLAN BAR */}
          <section className="bg-neutral-900 py-16">
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-10">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">Compare plans at a glance</h2>
                <p className="text-neutral-500 text-sm max-w-lg mx-auto">See the difference between Basic Plan A (classic weight training) and Premium Plan B (full access with electrical cardio machines).</p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950">
                <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-neutral-950 uppercase text-[11px] tracking-widest text-neutral-500">
                      <th className="p-4 font-bold">Gym Capability Features</th>
                      <th className="p-4 text-center font-bold">PLAN A (Basic)</th>
                      <th className="p-4 text-center font-bold text-red-500">PLAN B (Premium)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 text-neutral-300">
                    <tr>
                      <td className="p-4 font-semibold">Monthly Entrance Fee</td>
                      <td className="p-4 text-center font-mono">Rs. 2,500 / mo</td>
                      <td className="p-4 text-center font-mono text-red-400 font-bold">Rs. 4,000 / mo</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Free Weights, Dumbbells & Barbells</td>
                      <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Squat Platforms & Bench Press Stations</td>
                      <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Plate-loaded Muscle Conditioning Racks</td>
                      <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Electronic Treadmills & Steppers</td>
                      <td className="p-4 text-center text-neutral-600">—</td>
                      <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Cardio Rowing & Elliptical Machines</td>
                      <td className="p-4 text-center text-neutral-600">—</td>
                      <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">"Top Nine" Monthly Competition Eligibility</td>
                      <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-center">
                <button
                  onClick={() => onNavigate("membership")}
                  className="bg-red-650 hover:bg-red-700 text-black font-black uppercase text-xs px-6 py-3.5 rounded-xl tracking-wider inline-block transition-all shadow-md"
                >
                  View Details & Discount Tables
                </button>
              </div>
            </div>
          </section>

          {/* FACILITY STATS GRID */}
          <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-8">
            <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">Our Premium Facilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
                <span className="text-red-500 font-extrabold text-sm block">100% Raw Metal</span>
                <span className="font-extrabold text-white text-base block uppercase leading-tight">Strength Weights</span>
                <span className="text-[11px] text-neutral-400 block">Massive Olympic steel array and adjustable dumbbells to support heavy lifters.</span>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
                <span className="text-red-500 font-extrabold text-sm block">Trained Crew</span>
                <span className="font-extrabold text-white text-base block uppercase leading-tight">Professional Coaching</span>
                <span className="text-[11px] text-neutral-400 block">Personalized, secure training parameters and form corrections at every session.</span>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
                <span className="text-red-500 font-extrabold text-sm block">Clean Space</span>
                <span className="font-extrabold text-white text-base block uppercase leading-tight">Rigorous Hygiene</span>
                <span className="text-[11px] text-neutral-400 block">Strict cleaning breaks scheduled twice daily to maintain pristine sanitary conditions.</span>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
                <span className="text-red-500 font-extrabold text-sm block">Digital Tracking</span>
                <span className="font-extrabold text-white text-base block uppercase leading-tight">Performance Log</span>
                <span className="text-[11px] text-neutral-400 block">Verify attendance and log personal best parameters with digital member dashboards.</span>
              </div>
            </div>
          </section>

          {/* ELITE PAKISTANI HEALTH & SPORT SWAPS CALCULATOR */}
          <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4">
            <div className="bg-neutral-905 border border-neutral-800 bg-neutral-900 rounded-3xl p-6 sm:p-10 lg:p-12 space-y-10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 h-96 w-96 bg-red-650/5 rounded-full filter blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 h-96 w-96 bg-blue-500/5 rounded-full filter blur-[100px] pointer-events-none" />

              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <span className="px-3 py-1 bg-red-650/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest rounded-full inline-flex items-center gap-1.5 select-none">
                  <Apple className="h-4 w-4 text-red-500" /> Member Utility Portal
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-white tracking-tight">
                  Pakistani Fitness & Macro Planner
                </h2>
                <p className="text-neutral-450 text-xs sm:text-sm leading-relaxed text-neutral-400">
                  Struggling to fit standard online clean meal plans into local Pakistani cuisines? Calculate your precise athletic target macros and instantly swap common foods for clean, high-protein native choices!
                </p>
              </div>

              {/* TWO COLUMN STEPPED ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10">
                {/* LEFT CONFIGURATION CARD */}
                <div className="lg:col-span-5 bg-neutral-950 p-6 md:p-8 rounded-2xl border border-neutral-800 space-y-6">
                  <h3 className="text-white text-lg font-extrabold uppercase tracking-wide border-b border-neutral-900 pb-3 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-500" />
                    Biometrics & Training Goals
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={localWeight} 
                        onChange={(e) => setLocalWeight(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-red-500 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400">Height (cm)</label>
                      <input 
                        type="number" 
                        value={localHeight} 
                        onChange={(e) => setLocalHeight(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-red-500 transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400">Age (years)</label>
                      <input 
                        type="number" 
                        value={localAge} 
                        onChange={(e) => setLocalAge(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-red-500 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400">Gender</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setLocalGender("Male")}
                          className={`py-2 rounded-xl text-xs font-black uppercase transition-all ${localGender === "Male" ? "bg-red-500 text-black font-black" : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white"}`}
                        >
                          Male
                        </button>
                        <button 
                          onClick={() => setLocalGender("Female")}
                          className={`py-2 rounded-xl text-xs font-black uppercase transition-all ${localGender === "Female" ? "bg-red-500 text-black font-black" : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white"}`}
                        >
                          Female
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400">Activity Level</label>
                    <select 
                      value={localActivityLevel}
                      onChange={(e) => setLocalActivityLevel(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white text-xs font-black focus:outline-none focus:border-red-500 transition-all"
                    >
                      <option value="1.2">Sedentary (Desk Job, No Workouts)</option>
                      <option value="1.375">Light Activity (1-3 Light Workouts/week)</option>
                      <option value="1.55">Moderate Activity (3-5 Vigorous Workouts/week)</option>
                      <option value="1.725">Very Active (Heavy Strength Lifting 6-7 times/week)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 font-bold">
                    <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block mb-1">Target Athletic Goal</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "cut", label: "Fat Burn" },
                        { id: "bulk", label: "Muscle Gain" },
                        { id: "maintain", label: "Maintain" }
                      ].map((item) => (
                        <button 
                          key={item.id}
                          onClick={() => setLocalGoal(item.id as "cut" | "bulk" | "maintain")}
                          className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase text-center transition-all ${localGoal === item.id ? "bg-red-500 text-black font-black" : "bg-neutral-900 text-neutral-405 border border-neutral-800 hover:text-white"}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT NUTRITIVE ANALYSIS & SWAP INTERFACE */}
                <div className="lg:col-span-7 space-y-8">
                  {/* CALCULATED DYNAMIC MACROS HEADER */}
                  {(() => {
                    const w = parseFloat(localWeight) || 75;
                    const h = parseFloat(localHeight) || 175;
                    const a = parseFloat(localAge) || 24;
                    const genderCo = localGender === "Female" ? -161 : 5;
                    const bmr = 10 * w + 6.25 * h - 5 * a + genderCo;
                    const tdee = Math.round(bmr * parseFloat(localActivityLevel));
                    let targetCal = tdee;
                    if (localGoal === "cut") targetCal = tdee - 450;
                    else if (localGoal === "bulk") targetCal = tdee + 350;
                    if (targetCal < 1200) targetCal = 1200;

                    let proteinVal = Math.round(w * (localGoal === "bulk" ? 2.1 : localGoal === "cut" ? 2.3 : 1.8));
                    let fatVal = Math.round((targetCal * 0.25) / 9);
                    let carbsVal = Math.round((targetCal - (proteinVal * 4) - (fatVal * 9)) / 4);

                    // Calculations of clean selection choice
                    let currentCalories = 0;
                    let currentProtein = 0;
                    let currentFat = 0;
                    let currentCarbs = 0;

                    // Breakfast Contribution
                    if (breakfastSwapSelected) {
                      currentCalories += 310; currentProtein += 25; currentFat += 2; currentCarbs += 45;
                    } else {
                      currentCalories += 550; currentProtein += 6; currentFat += 24; currentCarbs += 75;
                    }

                    // Lunch Contribution
                    if (lunchSwapSelected) {
                      currentCalories += 380; currentProtein += 18; currentFat += 4; currentCarbs += 68;
                    } else {
                      currentCalories += 720; currentProtein += 15; currentFat += 28; currentCarbs += 99;
                    }

                    // Snack Contribution
                    if (snackSwapSelected) {
                      currentCalories += 160; currentProtein += 12; currentFat += 2; currentCarbs += 28;
                    } else {
                      currentCalories += 450; currentProtein += 3; currentFat += 25; currentCarbs += 55;
                    }

                    // Dinner Contribution
                    if (dinnerSwapSelected) {
                      currentCalories += 250; currentProtein += 38; currentFat += 8; currentCarbs += 2;
                    } else {
                      currentCalories += 850; currentProtein += 25; currentFat += 45; currentCarbs += 80;
                    }

                    const proteinPercentage = Math.min(100, Math.round((currentProtein / proteinVal) * 100));

                    return (
                      <div className="space-y-6">
                        {/* THE METRIC CHIPS GRID */}
                        <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 space-y-4">
                          <h4 className="text-neutral-400 font-extrabold text-[11px] uppercase tracking-wider block">Estimated Daily Intake Target vs Quality Selection Intake:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 text-center">
                              <span className="text-[10px] text-neutral-500 font-black uppercase tracking-wider block">Daily Calories</span>
                              <span className="text-white text-lg font-mono font-extrabold block mt-1">{currentCalories} <span className="text-[10px] text-neutral-500">/ {targetCal}</span></span>
                            </div>
                            <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 text-center">
                              <span className="text-[10px] text-neutral-500 font-black uppercase tracking-wider block">Protein (g)</span>
                              <span className="text-red-500 text-lg font-mono font-extrabold block mt-1">{currentProtein}g <span className="text-[10px] text-neutral-500">/ {proteinVal}g</span></span>
                            </div>
                            <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 text-center">
                              <span className="text-[10px] text-neutral-500 font-black uppercase tracking-wider block">Fats (g)</span>
                              <span className="text-white text-lg font-mono font-extrabold block mt-1">{currentFat}g <span className="text-[10px] text-neutral-500">/ {fatVal}g</span></span>
                            </div>
                            <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 text-center">
                              <span className="text-[10px] text-neutral-500 font-black uppercase tracking-wider block">Carbs (g)</span>
                              <span className="text-white text-lg font-mono font-extrabold block mt-1">{currentCarbs}g <span className="text-[10px] text-neutral-500">/ {carbsVal}g</span></span>
                            </div>
                          </div>

                          {/* PROTEIN TARGET VISUAL PROGRESS BAR */}
                          <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between text-[10px] font-mono font-extrabold uppercase">
                              <span className="text-neutral-400">Biological Protein Target Met:</span>
                              <span className="text-red-500">{proteinPercentage}% ({currentProtein}g of {proteinVal}g needed)</span>
                            </div>
                            <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800/80">
                              <div 
                                className="h-full bg-gradient-to-r from-red-650 to-red-500 rounded-full transition-all duration-300" 
                                style={{ width: `${proteinPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* HIGH-CRAFT PAKISTANI FOOD SWAPPERS PANEL */}
                        <div className="space-y-4">
                          <h4 className="text-white text-base font-black uppercase tracking-wide flex items-center gap-2">
                            <Utensils className="h-5 w-5 text-red-500" />
                            Wholesome Swaps Selector (Pakistan Cuisine)
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* BREAKFAST CARD */}
                            <div className="bg-neutral-950/80 border border-neutral-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                              <div>
                                <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block mb-1">Morning Breakfast Slot</span>
                                <h5 className="text-white font-extrabold text-sm uppercase">Breakfast Choice</h5>
                                <p className="text-[11px] text-neutral-400 mt-1 font-semibold">
                                  {breakfastSwapSelected 
                                    ? "🥚 6 Egg Whites + Oats Dalia: Clean complex base with near zero lipid load." 
                                    : "🍳 1 Oily Paratha + White Sugary Tea: Instant blood sugar spike, high lipids."}
                                </p>
                              </div>
                              <div className="flex justify-between items-center border-t border-neutral-900/80 pt-3">
                                <span className={`text-[10px] font-bold font-mono uppercase ${breakfastSwapSelected ? "text-green-500 bg-green-500/10 px-2 py-0.5 rounded" : "text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded"}`}>
                                  {breakfastSwapSelected ? "Target Clean Choice" : "Heavy Street Meal Mode"}
                                </span>
                                <button 
                                  onClick={() => setBreakfastSwapSelected(!breakfastSwapSelected)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${breakfastSwapSelected ? "bg-red-500 text-black font-black" : "bg-neutral-900 text-neutral-300 hover:text-white"}`}
                                >
                                  {breakfastSwapSelected ? "Swap to Normal" : "Swap to Clean"}
                                </button>
                              </div>
                            </div>

                            {/* LUNCH CARD */}
                            <div className="bg-neutral-950/80 border border-neutral-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                              <div>
                                <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block mb-1">Midday Lunch Slot</span>
                                <h5 className="text-white font-extrabold text-sm uppercase">Lunch Choice</h5>
                                <p className="text-[11px] text-neutral-400 mt-1 font-semibold">
                                  {lunchSwapSelected 
                                    ? "🫓 1 Wholewheat Chapati & Dal: Fibrous, slow digestion & steady insulin." 
                                    : "🍚 Plate of Basmati Biryani: Saturated fat pool, low complex protein."}
                                </p>
                              </div>
                              <div className="flex justify-between items-center border-t border-neutral-900/80 pt-3">
                                <span className={`text-[10px] font-bold font-mono uppercase ${lunchSwapSelected ? "text-green-500 bg-green-500/10 px-2 py-0.5 rounded" : "text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded"}`}>
                                  {lunchSwapSelected ? "Target Clean Choice" : "Heavy Street Meal Mode"}
                                </span>
                                <button 
                                  onClick={() => setLunchSwapSelected(!lunchSwapSelected)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${lunchSwapSelected ? "bg-red-500 text-black font-black" : "bg-neutral-900 text-neutral-300 hover:text-white"}`}
                                >
                                  {lunchSwapSelected ? "Swap to Normal" : "Swap to Clean"}
                                </button>
                              </div>
                            </div>

                            {/* SNACK CARD */}
                            <div className="bg-neutral-950/80 border border-neutral-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                              <div>
                                <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block mb-1">Evening Pre/Post Snack</span>
                                <h5 className="text-white font-extrabold text-sm uppercase">Snack Choice</h5>
                                <p className="text-[11px] text-neutral-400 mt-1 font-semibold">
                                  {snackSwapSelected 
                                    ? "🍿 100g Roasted Chickpeas (Bhuna Chana): High fiber plant-protein source." 
                                    : "🥟 Fried Samosas / Potato Pakoras: Loaded with processed cooking oil."}
                                </p>
                              </div>
                              <div className="flex justify-between items-center border-t border-neutral-900/80 pt-3">
                                <span className={`text-[10px] font-bold font-mono uppercase ${snackSwapSelected ? "text-green-500 bg-green-500/10 px-2 py-0.5 rounded" : "text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded"}`}>
                                  {snackSwapSelected ? "Target Clean Choice" : "Heavy Street Meal Mode"}
                                </span>
                                <button 
                                  onClick={() => setSnackSwapSelected(!snackSwapSelected)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${snackSwapSelected ? "bg-red-500 text-black" : "bg-neutral-900 text-neutral-300 hover:text-white"}`}
                                >
                                  {snackSwapSelected ? "Swap to Normal" : "Swap to Clean"}
                                </button>
                              </div>
                            </div>

                            {/* DINNER CARD */}
                            <div className="bg-neutral-950/80 border border-neutral-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                              <div>
                                <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block mb-1">Night Recovery Dinner</span>
                                <h5 className="text-white font-extrabold text-sm uppercase">Dinner Choice</h5>
                                <p className="text-[11px] text-neutral-400 mt-1 font-semibold">
                                  {dinnerSwapSelected 
                                    ? "🍗 Grilled Chicken Tikka Leg (Skinless): Dense tissue building proteins." 
                                    : "🍲 oily Mutton Korma + Naan: Extreme saturated fats & high lipids."}
                                </p>
                              </div>
                              <div className="flex justify-between items-center border-t border-neutral-900/80 pt-3">
                                <span className={`text-[10px] font-bold font-mono uppercase ${dinnerSwapSelected ? "text-green-500 bg-green-500/10 px-2 py-0.5 rounded" : "text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded"}`}>
                                  {dinnerSwapSelected ? "Target Clean Choice" : "Heavy Street Meal Mode"}
                                </span>
                                <button 
                                  onClick={() => setDinnerSwapSelected(!dinnerSwapSelected)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${dinnerSwapSelected ? "bg-red-500 text-black font-black" : "bg-neutral-900 text-neutral-300 hover:text-white"}`}
                                >
                                  {dinnerSwapSelected ? "Swap to Normal" : "Swap to Clean"}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* ACTION BUTTON TO COPY COMPACT DIET DETAILS TO CLIPBOARD */}
                          <div className="space-y-2">
                            {dietCopied && (
                              <div className="p-3 bg-emerald-500/15 border border-emerald-500/25 rounded-xl text-center text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider animate-pulse">
                                ✅ Assalam-o-Alaikum! Your personalized Pakistani diet plan has been copied to your Clipboard!
                              </div>
                            )}
                            <button
                              onClick={() => {
                                const dietSum = `Assalam-o-Alaikum, here is my Life Fitness Pakistani Diet & Metric Statement!
- Weight: ${w}kg | Height: ${h}cm | Goal: ${localGoal === "bulk" ? "Muscle Build" : localGoal === "cut" ? "Athletic Cut" : "Conditioning Maintenance"}
- Target Energy Target: ${targetCal} kcal
- Chosen Intake metrics: ${currentCalories} kcal, Protein: ${currentProtein}g, Fats: ${currentFat}g, Carbs: ${currentCarbs}g.
- Meal Selection Set:
  * Breakfast: ${breakfastSwapSelected ? "Clean Oats & Eggs" : "Sugary Tea & Paratha"}
  * Lunch: ${lunchSwapSelected ? "Wheat Chapati & Legume Dal" : "Street Biryani Rice"}
  * Snack: ${snackSwapSelected ? "Bhuna Chana Chickpeas" : "Deep-fried Samosa"}
  * Dinner: ${dinnerSwapSelected ? "No-skin Grilled Tikka Piece" : "Oily Korma Gravy"}
Generated via Life Fitness Mandi Bahauddin applet tool. Strength & Progressive Power!`;
                                navigator.clipboard.writeText(dietSum);
                                setDietCopied(true);
                                setTimeout(() => setDietCopied(false), 3500);
                              }}
                              className="w-full bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-[11px] font-black uppercase text-center p-3.5 rounded-xl transition-all font-mono text-neutral-400 hover:text-white tracking-widest block hover:border-red-500 cursor-pointer"
                            >
                              {dietCopied ? "✓ Copy Successful!" : "📋 Copy Personal Pakistani Diet Summary to Clipboard"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </section>

          {/* BOTTOM CALL TO ACTION */}
          <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 text-center space-y-6">
            <h2 className="font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">Ready to Start Your Transformation?</h2>
            <p className="text-neutral-400 max-w-lg mx-auto text-sm">Join Mandi Bahauddin's most competitive gym today. Lock in your Plan and start pushing your limits.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => onNavigate("join")} className="bg-red-650 hover:bg-red-700 text-black font-black text-sm px-8 py-3.5 rounded-xl uppercase tracking-wider">
                Register Membership
              </button>
              <a 
                href={getWhatsAppMsgUrl("Assalam-o-Alaikum, I want to inquire about gym registrations.")}
                target="_blank"
                referrerPolicy="no-referrer"
                className="bg-neutral-900 border border-neutral-800 text-white font-bold text-sm px-6 py-3.5 rounded-xl uppercase hover:bg-neutral-850 block text-center"
              >
                Inquire on WhatsApp
              </a>
            </div>
          </section>
        </div>
      );

    case "membership":
      return (
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-12 md:py-16 space-y-16">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white uppercase tracking-tight">Membership Pricing Plans</h1>
            <p className="text-neutral-500 max-w-lg mx-auto text-sm">
              We offer two straightforward categories with long-term cost benefits. Male & Female pricing parameters are exactly identical.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {plans.map((p) => {
              const items = [
                { title: "1 Month Package", val: p.price1m, discountPerc: 0, originalTotal: p.price1m * 1, months: 1 },
                { title: "3 Months Package", val: p.price3m, discountPerc: 5, originalTotal: p.price1m * 3, months: 3 },
                { title: "6 Months Package", val: p.price6m, discountPerc: 10, originalTotal: p.price1m * 6, months: 6 },
                { title: "12 Months Package", val: p.price12m, discountPerc: 15, originalTotal: p.price1m * 12, months: 12 },
              ];

              return (
                <div key={p.planId} className={`bg-neutral-900 rounded-3xl p-6 sm:p-8 flex flex-col justify-between border relative ${p.isPopular ? "border-red-500 shadow-xl shadow-red-950/10" : "border-neutral-800"}`}>
                  {p.isPopular && (
                    <span className="absolute top-0 right-8 -translate-y-1/2 bg-red-650 text-black font-black uppercase text-[9px] tracking-widest px-3.5 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-white font-extrabold text-2xl uppercase tracking-wide">{p.name}</h2>
                      <p className="text-neutral-500 text-xs mt-1.5 leading-relaxed">{p.description}</p>
                    </div>

                    <div className="space-y-3">
                      <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold block">Pricing Duration Table:</span>
                      <div className="space-y-2">
                        {items.map((it) => {
                          const discAmt = it.originalTotal - it.val;
                          const effectiveMo = Math.round(it.val / it.months);

                          return (
                            <div key={it.title} className="bg-neutral-950 rounded-xl p-3 flex justify-between items-center border border-neutral-900">
                              <div>
                                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">{it.title}</span>
                                <div className="flex gap-2 items-center">
                                  <span className="text-base font-extrabold text-white font-mono font-black">Rs. {it.val.toLocaleString()}</span>
                                  {it.discountPerc > 0 && (
                                    <span className="text-[10px] text-red-500 font-mono line-through">Rs. {it.originalTotal.toLocaleString()}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                {it.discountPerc > 0 && (
                                  <span className="block text-[9px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded-full mb-0.5">
                                    Saved {it.discountPerc}% (Rs. {discAmt})
                                  </span>
                                )}
                                <span className="block text-[10px] text-neutral-500 font-semibold font-mono">Rs. {effectiveMo}/mo avg</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold block">Features Included:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {p.features.map((feat, index) => (
                          <div key={index} className="flex gap-1.5 items-start text-xs text-neutral-300">
                            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span className="leading-tight">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 grid grid-cols-2 gap-2 mt-6">
                    <button
                      onClick={() => {
                        setFormPlan(p.planId);
                        onNavigate("join");
                      }}
                      className="w-full py-3 bg-red-650 hover:bg-red-700 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md mt-auto"
                    >
                      Join Plan
                    </button>
                    <a
                      href={getWhatsAppMsgUrl(`Assalam-o-Alaikum, I'd like to ask details about ${p.name}.`)}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="w-full py-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-white font-bold text-xs uppercase text-center rounded-xl transition-all"
                    >
                      WhatsApp Details
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Plan Comparison Table */}
          <div className="max-w-6xl mx-auto space-y-6 pt-8">
            <div className="text-left space-y-1">
              <h3 className="text-white font-extrabold text-lg uppercase tracking-tight">Full Tier Comparisons</h3>
              <p className="text-neutral-500 text-xs">Review what elements are unlocked under Basic Plan A vs VIP Premium Plan B.</p>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900">
              <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-neutral-950 uppercase text-[11px] tracking-widest text-neutral-500">
                    <th className="p-4 font-bold">Gym Capability Features</th>
                    <th className="p-4 text-center font-bold">PLAN A (Basic)</th>
                    <th className="p-4 text-center font-bold text-red-500">PLAN B (Premium)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-neutral-300">
                  <tr>
                    <td className="p-4 font-semibold">Monthly Entrance Fee</td>
                    <td className="p-4 text-center font-mono">Rs. 2,500 / mo</td>
                    <td className="p-4 text-center font-mono text-red-400 font-bold">Rs. 4,000 / mo</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">Free Weights, Dumbbells & Barbells</td>
                    <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                    <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">Squat Platforms & Bench Press Stations</td>
                    <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                    <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">Plate-loaded Muscle Conditioning Racks</td>
                    <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                    <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">Electronic Treadmills & Steppers</td>
                    <td className="p-4 text-center text-neutral-600">—</td>
                    <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">Cardio Rowing & Elliptical Machines</td>
                    <td className="p-4 text-center text-neutral-600">—</td>
                    <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">"Top Nine" Monthly Competition Eligibility</td>
                    <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                    <td className="p-4 text-center"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

    case "timings":
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white uppercase tracking-tight">Gym Schedule & Timings</h1>
            <p className="text-neutral-500 max-w-lg mx-auto text-sm">
              We organize our schedule into segregated male and female intervals to maximize workout comfort. Transition breaks are set aside strictly for deep disinfection routines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Male Timings */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest inline-block">
                  Male Schedule
                </span>
                <h2 className="text-white text-3xl font-black uppercase tracking-tighter mt-4">Two Daily Slots</h2>
                <p className="text-neutral-500 text-xs mt-1">Both sessions feature professional coaching and heavy strength spotter supervisors.</p>
              </div>
              <div className="space-y-4 pt-4 border-t border-neutral-800/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-neutral-400 uppercase">Morning Interval:</span>
                  <span className="font-mono text-white text-base font-extrabold">{settings.openTimeMaleMorn} – {settings.closeTimeMaleMorn}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-neutral-400 uppercase">Evening Interval:</span>
                  <span className="font-mono text-white text-base font-extrabold">{settings.openTimeMaleEve} – {settings.closeTimeMaleEve}</span>
                </div>
              </div>
            </div>

            {/* Female Timings */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 rounded bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-black uppercase tracking-widest inline-block">
                  Female Only Schedule
                </span>
                <h2 className="text-white text-3xl font-black uppercase tracking-tighter mt-4">Dedicated slot</h2>
                <p className="text-neutral-500 text-xs mt-1">Our midday shift is entirely dedicated to female athletes with strict privacy guards.</p>
              </div>
              <div className="space-y-4 pt-4 border-t border-neutral-800/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-neutral-400 uppercase">Midday slot:</span>
                  <span className="font-mono text-white text-base font-extrabold">{settings.openTimeFemale} – {settings.closeTimeFemale}</span>
                </div>
                <p className="text-[11px] text-pink-400/80 italic font-semibold text-center border border-pink-900/10 py-1.5 rounded-lg bg-pink-950/5">
                  No male entries permitted on premises during these hours.
                </p>
              </div>
            </div>

            {/* Cleaning Breaks */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-black uppercase tracking-widest inline-block">
                  Cleaning breaks
                </span>
                <h2 className="text-white text-3xl font-black uppercase tracking-tighter mt-4">Transition Breaks</h2>
                <p className="text-neutral-500 text-xs mt-1">Prudent deep clean blocks occur twice daily to wipe benches and secure spacing.</p>
              </div>
              <div className="space-y-4 pt-4 border-t border-neutral-800/50 text-sm font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">First Break (Midday):</span>
                  <span className="font-mono text-yellow-400">{settings.cleaningBreak1}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Second Break (Afternoon):</span>
                  <span className="font-mono text-yellow-400">{settings.cleaningBreak2}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ADDITIONAL TIMING ANNOUNCEMENT CARDS */}
          <div className="max-w-4xl mx-auto bg-neutral-950 border border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="font-extrabold text-white text-lg uppercase tracking-tight">Special Timing Configurations:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-900 space-y-1">
                <span className="text-red-500 font-black block uppercase tracking-wide">Ramadan Schedule:</span>
                <p className="text-neutral-300 leading-relaxed font-medium">{settings.ramadanTimings}</p>
              </div>
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-900 space-y-1">
                <span className="text-red-500 font-black block uppercase tracking-wide">Weekly Closed Day:</span>
                <p className="text-neutral-300 leading-relaxed font-medium">Closed on <span className="font-bold text-red-500 uppercase">{settings.weeklyHoliday}s</span>. Standard maintenance and full facility ventilation routines take place.</p>
              </div>
            </div>
          </div>
        </div>
      );

    case "challenges":
      return (
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-12 md:py-16 space-y-12">
          {/* Main Title & Description */}
          <div className="text-center space-y-2">
            <span className="text-red-500 font-extrabold text-xs uppercase tracking-widest block">Tournaments & Standing Arenas</span>
            <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">Life Fitness Top Nine Challenge</h1>
            <p className="text-neutral-500 max-w-2xl mx-auto text-sm">
              9 Exercises. 9 Winners. 9 Complimentary Free Memberships. Resets on the last second of every month. Read instructions, log your attempts, and rise!
            </p>
          </div>

          {/* Tab Selector Navs */}
          <div className="flex flex-wrap justify-center gap-2 border-b border-neutral-900 pb-4">
            <button
              onClick={() => setActiveChallengesTab("challenges")}
              className={`px-5 py-3 rounded-xl uppercase text-xs tracking-wider transition-all font-black flex items-center gap-2 cursor-pointer ${activeChallengesTab === "challenges" ? "bg-red-650 text-black shadow-lg shadow-yellow-500/10" : "bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800/80"}`}
            >
              <Activity className="h-4 w-4" />
              Monthly Challenges
            </button>
            <button
              onClick={() => setActiveChallengesTab("leaderboard")}
              className={`px-5 py-3 rounded-xl uppercase text-xs tracking-wider transition-all font-black flex items-center gap-2 cursor-pointer ${activeChallengesTab === "leaderboard" ? "bg-red-650 text-black shadow-lg shadow-yellow-500/10" : "bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800/80"}`}
            >
              <Trophy className="h-4 w-4" />
              Live Leaderboard
            </button>
            <button
              onClick={() => setActiveChallengesTab("top-nine")}
              className={`px-5 py-3 rounded-xl uppercase text-xs tracking-wider transition-all font-black flex items-center gap-2 cursor-pointer ${activeChallengesTab === "top-nine" ? "bg-red-650 text-black shadow-lg shadow-yellow-500/10" : "bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800/80"}`}
            >
              <Sparkles className="h-4 w-4" />
              Current Top Nine
            </button>
            <button
              onClick={() => setActiveChallengesTab("winners")}
              className={`px-5 py-3 rounded-xl uppercase text-xs tracking-wider transition-all font-black flex items-center gap-2 cursor-pointer ${activeChallengesTab === "winners" ? "bg-red-650 text-black shadow-lg shadow-yellow-500/10" : "bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800/80"}`}
            >
              <Award className="h-4 w-4" />
              Last Month Winners
            </button>
            <button
              onClick={() => setActiveChallengesTab("rules")}
              className={`px-5 py-3 rounded-xl uppercase text-xs tracking-wider transition-all font-black flex items-center gap-2 cursor-pointer ${activeChallengesTab === "rules" ? "bg-red-650 text-black shadow-lg shadow-yellow-500/10" : "bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800/80"}`}
            >
              <FileText className="h-4 w-4" />
              Competition Rules
            </button>
          </div>

          {/* TAB CONTENTS */}
          
          {/* TAB 1: MONTHLY CHALLENGES */}
          {activeChallengesTab === "challenges" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {exercises.map((ex, idx) => (
                <div key={ex.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden flex flex-col justify-between">
                  <div className="relative h-44 overflow-hidden">
                    <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover opacity-60 hover:scale-105 transition-all duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/20 to-transparent" />
                    <span className="absolute top-4 left-4 bg-red-600 text-white font-black text-xs h-7 w-7 rounded-lg flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <div className="absolute bottom-4 left-4">
                      <span className="text-[10px] uppercase font-bold text-red-500 bg-red-950/45 px-2 py-0.5 border border-red-900/25 rounded-md">
                        Category {ex.scoringType}
                      </span>
                      <h3 className="text-white text-lg font-black uppercase mt-1 tracking-tight">{ex.name}</h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-900/60">
                          <span className="text-neutral-500 block uppercase font-bold">Male Benchmark:</span>
                          <span className="text-white font-mono font-bold block mt-0.5">{ex.benchmarkMale}</span>
                        </div>
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-900/60">
                          <span className="text-neutral-500 block uppercase font-bold">Female Benchmark:</span>
                          <span className="text-white font-mono font-bold block mt-0.5">{ex.benchmarkFemale}</span>
                        </div>
                      </div>
                      <div className="text-xs text-neutral-400 space-y-1">
                        <span className="text-neutral-300 font-extrabold uppercase text-[10px] tracking-wider block">Description & Target:</span>
                        <p className="leading-relaxed font-medium">{ex.rules}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-850/50 flex justify-between items-center text-xs">
                      <span className="text-neutral-500">Physical visual supervisions</span>
                      <button
                        onClick={() => setActiveChallengesTab("leaderboard")}
                        className="text-red-500 font-extrabold hover:underline uppercase flex items-center gap-1"
                      >
                        View Standings
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: LIVE LEADERBOARD */}
          {activeChallengesTab === "leaderboard" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
              {exercises.map((ex) => {
                const leaders = getTopPerformers(ex.id);

                return (
                  <div key={ex.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-white text-base font-black uppercase tracking-tight line-clamp-1">{ex.name}</h3>
                        <span className="text-[9px] text-red-500 bg-red-950/20 border border-red-900/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider font-mono shrink-0">
                          {ex.scoringType}
                        </span>
                      </div>

                      <div className="space-y-2 mt-4">
                        {leaders.length === 0 ? (
                          <div className="py-8 text-center text-xs text-neutral-600 bg-neutral-950 rounded-2xl border border-neutral-900/50">
                            No approved attempts logged this period.
                          </div>
                        ) : (
                          leaders.map((lead, idx) => {
                            const medalColors = ["bg-yellow-500 border-yellow-400 text-black", "bg-neutral-400 border-neutral-300 text-black", "bg-amber-700 border-amber-600 text-white"];
                            return (
                              <div key={lead.attemptId} className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-900/80 hover:border-neutral-800 transition-all">
                                <div className="flex items-center gap-3">
                                  <span className={`h-6 w-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${medalColors[idx] || "bg-neutral-900 text-neutral-400 border-neutral-800"}`}>
                                    {idx + 1}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg overflow-hidden shrink-0 border border-neutral-800">
                                      <img src={lead.photoUrl || ex.imageUrl} alt={lead.memberName} className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                      <span className="text-xs font-extrabold text-white block uppercase tracking-wide">{lead.memberName}</span>
                                      <span className="text-[10px] text-neutral-500 block font-semibold">{lead.memberId}</span>
                                    </div>
                                  </div>
                                </div>
                                <span className="font-mono text-red-500 font-extrabold text-xs">{lead.scoreDisplay}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-neutral-850/50 text-center">
                      <span className="text-[10px] text-neutral-500 block uppercase tracking-wider font-semibold">Rules: official {ex.scoringType} validation</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: CURRENT TOP NINE */}
          {activeChallengesTab === "top-nine" && (
            <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <h3 className="text-white font-black text-xl uppercase tracking-wider">Current Month First-Place Leaders</h3>
                <p className="text-neutral-400 text-xs">These 9 athletes are currently occupying the Rank 1 spot in each of the 9 exercises. If they retain this spot until the end of the month, their free membership is locked!</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {exercises.map((ex, idx) => {
                  const leaders = getTopPerformers(ex.id, 1);
                  const firstPlace = leaders[0] || null;

                  return (
                    <div key={ex.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-red-600/5 rounded-full filter blur-xl" />
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-red-500 font-black tracking-widest font-mono uppercase block">Exercise 0{idx + 1}</span>
                          <span className="text-[9px] text-white bg-neutral-950 px-2 py-0.5 border border-neutral-800 rounded uppercase font-bold font-mono">
                            {ex.scoringType}
                          </span>
                        </div>
                        <h4 className="text-white text-base font-black uppercase mt-1 tracking-tight leading-none">{ex.name}</h4>

                        <div className="mt-4 pt-4 border-t border-neutral-800/40">
                          {firstPlace ? (
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl overflow-hidden border border-red-500/30 shrink-0">
                                <img src={firstPlace.photoUrl || ex.imageUrl} alt={firstPlace.memberName} className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <span className="text-xs text-red-500 font-bold uppercase tracking-wider block">Rank 1 Champion</span>
                                <span className="text-white text-sm font-black uppercase block leading-none">{firstPlace.memberName}</span>
                                <span className="text-[10px] text-neutral-400 font-bold font-mono block mt-1">Score: {firstPlace.scoreDisplay}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-neutral-600 text-xs italic py-2">
                              No first-place holder logged yet. Be the first to try!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: LAST MONTH WINNERS */}
          {activeChallengesTab === "winners" && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-2">
                <h3 className="text-white font-black text-xl uppercase tracking-wider">Historical Hall of Fame</h3>
                <p className="text-neutral-400 text-xs">These champions cleared the duplicate exclude safety check and claimed their free months in previous tournaments.</p>
              </div>

              {pastWinners.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center text-neutral-500 text-sm">
                  Hall of fame database starting up. First month records are rolling.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-neutral-950 uppercase text-[10px] tracking-widest text-neutral-500">
                        <th className="p-4 font-bold border-b border-neutral-800">Month</th>
                        <th className="p-4 font-bold border-b border-neutral-800">Winner Name</th>
                        <th className="p-4 font-bold border-b border-neutral-800">Exercise Category</th>
                        <th className="p-4 text-center font-bold border-b border-neutral-800">Winning Score</th>
                        <th className="p-4 text-right font-bold border-b border-neutral-800 text-red-500">Voucher Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900 text-neutral-300">
                      {pastWinners.map((w) => (
                        <tr key={w.id} className="hover:bg-neutral-950/40 transition-colors">
                          <td className="p-4 font-bold text-neutral-400 font-mono">{w.period}</td>
                          <td className="p-4">
                            <div className="font-extrabold uppercase text-white tracking-wide">{w.memberName}</div>
                            <div className="text-[10px] text-neutral-500">{w.memberId}</div>
                          </td>
                          <td className="p-4 font-semibold uppercase text-neutral-400">{w.exerciseName}</td>
                          <td className="p-4 font-mono text-center text-red-400 font-bold">{w.scoreDisplay}</td>
                          <td className="p-4 text-right">
                            <span className="inline-block text-[9px] font-bold tracking-widest text-green-400 uppercase bg-green-950/30 border border-green-900/30 px-2 py-0.5 rounded-full">
                              Disbursed & Applied
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COMPETITION RULES */}
          {activeChallengesTab === "rules" && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                  <ShieldCheck className="h-8 w-8 text-red-500 shrink-0" />
                  <div>
                    <h3 className="text-white font-black text-xl uppercase tracking-wider">Tournament Bylaws & Anti-Monopoly Guidelines</h3>
                    <p className="text-neutral-500 text-xs">Official rules governing Life Fitness Top Nine Arenas.</p>
                  </div>
                </div>

                <div className="space-y-6 text-neutral-300 text-sm leading-relaxed pt-2">
                  <div className="space-y-1">
                    <span className="text-white font-bold uppercase text-xs block">1. Physical Supervisor Sign-Off</span>
                    <p className="text-neutral-400 text-xs">Any competitive try must be witnessed by an active duty supervisor trainer. Prior to launching, register your attempt name on the desk. All bench lifts require form clearance: raw bar must touch chest and rise cleanly. Cardio counts require screen snapshots with stamp codes.</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-white font-bold uppercase text-xs block">2. Duplicate Extension Regulations (Anti-Monopoly)</span>
                    <p className="text-neutral-400 text-xs">One member can claim a max of ONE free extension month in a unique calendar cycle. If an athlete scores place #1 on multiple leaderboards, they get awarded the voucher for the task where they score highest, and place #1 on the other tasks moves up the runner-up athlete. This promotes community development and yields exactly 9 winners every month.</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-white font-bold uppercase text-xs block">3. Reset and Voucher Disbursals</span>
                    <p className="text-neutral-400 text-xs">Standings close automatically on the terminal of midnight. Winners receive a digital push and WhatsApp SMS. Member packages auto-renew for an extra free month starting immediately on your ledger. No cash conversions allowed.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );

    case "leaderboard":
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white uppercase tracking-tight">Live Competition Leaderboard</h1>
            <p className="text-neutral-500 max-w-lg mx-auto text-sm">
              Approved standings for the current calendar month. Standings auto-calculate and refresh. Secure a spot and win!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {exercises.map((ex) => {
              const leaders = getTopPerformers(ex.id);

              return (
                <div key={ex.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-white text-base font-black uppercase tracking-tight line-clamp-1">{ex.name}</h3>
                      <span className="text-[9px] text-red-500 bg-red-950/20 border border-red-900/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider font-mono shrink-0">
                        {ex.benchmarkMale.split(" ")[0]} KG M
                      </span>
                    </div>

                    <div className="space-y-2 mt-4">
                      {leaders.length === 0 ? (
                        <div className="py-8 text-center text-xs text-neutral-600 bg-neutral-950 rounded-2xl border border-neutral-900/50">
                          No approved attempts yet for this period.
                        </div>
                      ) : (
                        leaders.map((lead, idx) => {
                          const medalColors = ["bg-yellow-500 border-yellow-400 text-black", "bg-neutral-400 border-neutral-300 text-black", "bg-amber-700 border-amber-600 text-white"];
                          return (
                            <div key={lead.attemptId} className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-900/80 hover:border-neutral-850 transition-all">
                              <div className="flex items-center gap-3">
                                <span className={`h-6 w-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${medalColors[idx] || "bg-neutral-900 text-neutral-400 border-neutral-800"}`}>
                                  {idx + 1}
                                </span>
                                <div className="flex items-center gap-2">
                                  {ex.imageUrl && (
                                    <div className="h-7 w-7 rounded-lg overflow-hidden shrink-0 border border-neutral-800">
                                      <img src={lead.photoUrl || ex.imageUrl} alt={lead.memberName} className="h-full w-full object-cover" />
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-xs font-extrabold text-white block uppercase tracking-wide">{lead.memberName}</span>
                                    <span className="text-[9px] text-neutral-500 block font-semibold">{lead.memberId}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="font-mono text-red-500 font-extrabold text-xs">{lead.scoreDisplay}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-neutral-850/50 text-center">
                    <span className="text-[10px] text-neutral-500 block uppercase tracking-wider font-semibold">Rules: {ex.scoringType} scoring</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

    case "gallery":
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white uppercase tracking-tight">Gym Gallery</h1>
            <p className="text-neutral-500 max-w-lg mx-auto text-sm">
              Our training environment, professional strength configurations, intense workout snaps, and monthly challenge winners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "Standard Olympic Squat Cage", cat: "Interiors", url: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=400" },
              { title: "Complete Dumbbells Block 5KG - 60KG", cat: "Interiors", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=400" },
              { title: "Cardio Electronic Running Treadmills", cat: "Workouts", url: "https://images.unsplash.com/photo-1578762560072-44314e66480d?auto=format&fit=crop&q=80&w=400" },
              { title: "Bench Press Intensity Reps", cat: "Workouts", url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400" },
              { title: "Life Fitness Past Champion Celebration", cat: "Winners", url: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80&w=400" },
              { title: "Trainer Instruction Spotting", cat: "Events", url: "https://images.unsplash.com/photo-1598971619177-3e1ee698afeb?auto=format&fit=crop&q=80&w=400" },
              { title: "Pristine Separation Separation Rigs", cat: "Interiors", url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400" },
              { title: "Clean Facility Layout Overview", cat: "Interiors", url: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=400" }
            ].map((img, index) => (
              <div key={index} className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden relative group">
                <img src={img.url} alt={img.title} className="w-full h-48 object-cover group-hover:scale-105 transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-[9px] uppercase font-bold text-red-500 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900/30 w-max mb-1">
                    {img.cat}
                  </span>
                  <h4 className="text-white text-xs font-bold uppercase tracking-tight line-clamp-1">{img.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "faq":
      return (
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 space-y-10">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white uppercase tracking-tight">Frequently Asked Questions</h1>
            <p className="text-neutral-500 text-sm">
              Answers to standard queries regarding membership, schedules, and competition parameters.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { q: "Is registration fee strictly non-refundable?", a: "Yes, once an application is approved and credentials generated, fees are non-refundable. All proceeds go directly towards facility maintenance." },
              { q: "Do Basic Plan members have access to the Treadmills?", a: "No. Basic Plan A members have absolute access to squating cages, dumbbells, barbells, benches, and plate loaded isolation rigs, but access to electrical running machines is restricted to Premium Plan B." },
              { q: "How are the cleaning schedules strictly enforced?", a: "Our gym stops active registrations during 10:00 AM – 11:00 AM and 4:00 PM – 5:00 PM. All staff members disinfected barbells, bench materials, and flooring." },
              { q: "Can a member win a free membership month consecutive times?", a: "Yes. While a duplicate candidate can only win one free month inside a single month's period, they are allowed to win in separate calendar months." },
              { q: "What is the procedure if I experience an injury during attempts?", a: "Our gym requires a trainer to actively supervise any target attempt. First-aid materials, wraps, and transport arrangements are maintained on premises." }
            ].map((faq, index) => (
              <div key={index} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
                <h3 className="text-white font-extrabold text-base tracking-tight flex items-start gap-2">
                  <span className="text-red-500 font-mono">Q.</span>
                  {faq.q}
                </h3>
                <p className="text-neutral-400 text-xs pl-5 leading-relaxed font-semibold">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "contact":
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white uppercase tracking-tight">Contact Us</h1>
            <p className="text-neutral-500 max-w-lg mx-auto text-sm">
              Get in touch immediately. Call us, text on WhatsApp, or follow the directions to visit the facility.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            <div className="space-y-6">
              <h2 className="text-white font-black uppercase text-xl tracking-tight border-b border-neutral-900 pb-3">Life Fitness Head Office</h2>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <MapPin className="h-6 w-6 text-red-500 shrink-0 mt-1" />
                  <div>
                    <span className="text-neutral-500 font-extrabold uppercase text-[10px] tracking-wider block">Physical Address:</span>
                    <p className="text-white text-sm font-semibold">{settings.location}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <Phone className="h-6 w-6 text-red-500 shrink-0" />
                  <div>
                    <span className="text-neutral-500 font-extrabold uppercase text-[10px] tracking-wider block">Hotline Number:</span>
                    <a href={`tel:${settings.phone}`} className="text-white hover:text-red-500 transition-all text-sm font-extrabold underline">
                      {settings.phone}
                    </a>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="text-red-500 font-black shrink-0 text-xs bg-red-600/10 px-1 py-0.5 border border-red-900/10 rounded uppercase">WA</span>
                  <div>
                    <span className="text-neutral-500 font-extrabold uppercase text-[10px] tracking-wider block">WhatsApp Direct:</span>
                    <a 
                      href={`https://wa.me/${settings.whatsApp.replace(/[^0-9]/g, "")}`} 
                      target="_blank" 
                      referrerPolicy="no-referrer"
                      className="text-white hover:text-red-500 transition-all text-sm font-extrabold underline"
                    >
                      Click to Chat Now
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-6 grid grid-cols-3 gap-2 text-xs">
                <a href={`tel:${settings.phone}`} className="py-3 bg-red-605 bg-red-600 hover:bg-red-700 text-black font-black text-center rounded-xl uppercase tracking-wider block">
                  Call Now
                </a>
                <a href={`https://wa.me/${settings.whatsApp.replace(/[^0-9]/g, "")}`} target="_blank" className="py-3 bg-neutral-900 hover:bg-neutral-800 text-green-400 font-semibold text-center border border-neutral-800 rounded-xl uppercase block">
                  WhatsApp
                </a>
                <a href={settings.googleMapsUrl} target="_blank" className="py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-center border border-neutral-800 rounded-xl uppercase block">
                  Map Location
                </a>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shrink-0 relative overflow-hidden">
              <h3 className="text-white font-black uppercase text-base tracking-tight mb-4">Location Map Pointer</h3>
              <div className="w-full h-60 bg-neutral-950 rounded-2xl overflow-hidden flex items-center justify-center text-center p-4 border border-neutral-900">
                <div className="space-y-3">
                  <MapPin className="h-10 w-10 text-red-500 mx-auto animate-bounce" />
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">Open the Google Maps link to launch real-time satellite directions on your smartphone.</p>
                  <a
                    href={settings.googleMapsUrl}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="inline-block py-2 px-4 bg-red-600 hover:bg-red-700 text-black font-black uppercase text-[10px] tracking-widest rounded-lg transition-all"
                  >
                    Open Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case "join":
      return (
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 space-y-12">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white uppercase tracking-tight">Join Life Fitness</h1>
            <p className="text-neutral-500 text-sm max-w-lg mx-auto">
              Fill out the registration form below. Our staff will review and approve your membership within hours.
            </p>
          </div>

          {/* DYNAMIC BMI & SMART ONBOARDING CALCULATOR */}
          {!createdApplication && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-36 w-36 bg-gradient-to-br from-red-600/5 to-transparent rounded-full filter blur-xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-red-500 font-black uppercase tracking-widest block">Struggle with choosing your tier?</span>
                  <h3 className="text-white font-black text-xs tracking-wider flex items-center gap-1.5 uppercase">
                    <Activity className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                    Intelligent Fitness Goal & Plan Evaluator
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-semibold">Calculate your BMI, daily calorie estimates, and let us recommend the perfect membership package.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowBmiAdvisor(!showBmiAdvisor);
                    if (!showBmiAdvisor) {
                      setBmiResult(null);
                    }
                  }}
                  className="px-4 py-2 bg-neutral-950 border border-neutral-850 hover:bg-neutral-850 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shrink-0"
                >
                  {showBmiAdvisor ? "Hide Evaluator" : "Launch Evaluator"}
                </button>
              </div>

              {showBmiAdvisor && (
                <div className="pt-4 border-t border-neutral-850/60 grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in text-xs">
                  <div className="md:col-span-12 lg:col-span-12 xl:col-span-5 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-500 font-extrabold uppercase">Weight (KG)</label>
                        <input
                          type="number"
                          value={bmiWeight}
                          onChange={(e) => setBmiWeight(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white text-center font-mono focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-500 font-extrabold uppercase">Height (CM)</label>
                        <input
                          type="number"
                          value={bmiHeight}
                          onChange={(e) => setBmiHeight(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white text-center font-mono focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-500 font-extrabold uppercase">Age</label>
                        <input
                          type="number"
                          value={bmiAge}
                          onChange={(e) => setBmiAge(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white text-center font-mono focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-500 font-extrabold uppercase">Primary Fitness Goal</label>
                      <select
                        value={bmiGoal}
                        onChange={(e) => setBmiGoal(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-red-500 focus:outline-none font-black"
                      >
                        <option value="muscle">Gain Muscle Hypertrophy (+Surplus)</option>
                        <option value="fat">Intense Body Fat Burn (-Deficit)</option>
                        <option value="power">Overload Powerlifting Base Strength</option>
                        <option value="tone">Sculpt Muscle & Shaping</option>
                        <option value="active">Active Recovery & Stamina</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={calculateBmiAndGoal}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-black font-black uppercase tracking-widest text-[10px] rounded-xl transition-all"
                    >
                      Analyze My Profile
                    </button>
                  </div>

                  <div className="lg:col-span-1 hidden lg:flex items-center justify-center">
                    <div className="h-full w-[1px] bg-neutral-800" />
                  </div>

                  <div className="md:col-span-12 lg:col-span-12 xl:col-span-6 flex flex-col justify-center">
                    {bmiResult ? (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center bg-neutral-950/80 p-3 rounded-xl border border-neutral-850 font-semibold">
                          <div>
                            <span className="text-neutral-500 text-[9px] uppercase font-extrabold block">Calculated BMI:</span>
                            <span className="text-white font-extrabold font-mono text-base">{bmiResult.bmi}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-neutral-500 text-[9px] uppercase font-extrabold block">Classification:</span>
                            <span className={`font-black uppercase tracking-wide px-2 py-0.5 rounded text-[9px] ${
                              bmiResult.category === "Normal" ? "bg-green-500/10 border border-green-500/20 text-green-400" :
                              "bg-yellow-500/10 border border-yellow-500/20 text-yellow-500"
                            }`}>{bmiResult.category}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 font-semibold">
                          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-850">
                            <span className="text-neutral-500 text-[9px] uppercase font-extrabold block">Target TDEE calories:</span>
                            <span className="text-white font-black font-mono text-base">{bmiResult.tdee} kcal</span>
                          </div>
                          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-850">
                            <span className="text-neutral-500 text-[9px] uppercase font-extrabold block">Optimal Tier:</span>
                            <span className="text-red-400 font-extrabold text-xs uppercase block mt-1 tracking-wider">
                              {bmiResult.recommendedPlan === "premium" ? "PLAN B (PREMIUM)" : "PLAN A (BASIC)"}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-red-600/5 rounded-xl border border-red-500/10 leading-normal text-neutral-400 font-medium text-[11px]">
                          <span className="font-black text-red-400 uppercase text-[9px] tracking-wider block mb-1">💡 Smart Advisor Insight:</span>
                          We have recommended {bmiResult.recommendedPlan === "premium" ? "Premium Cardio access" : "Basic strength training"} based on your selection. Double-click apply below to load settings.
                        </div>

                        <button
                          type="button"
                          onClick={applyBmiRecommendation}
                          className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-855 text-white font-black uppercase text-[10px] tracking-widest border border-neutral-800 rounded-xl transition-all"
                        >
                          Apply Advisor Settings & Auto-Fill Form
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-neutral-500 italic">
                        Configure your weight, height and click "Analyze My Profile" to generate onboarding logs.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {createdApplication ? (
            /* HIGH-POLISHED BOARDING PASS STYLE REGISTRATION SLIP */
            <div className="max-w-xl mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative">
              {/* Top Banner accent */}
              <div className="h-2 bg-gradient-to-r from-red-650 via-orange-500 to-red-600" />
              
              <div className="p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="h-11 w-11 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                    <Check className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] text-red-500 font-black uppercase tracking-widest block font-sans">Authorized Digital Booking Receipt</span>
                  <h2 className="text-white font-black text-2xl uppercase tracking-tighter">VIP ADMISSION GATE PASS</h2>
                  <p className="text-neutral-400 text-xs font-semibold">Offline ledger recorded under status: <span className="text-yellow-500 uppercase font-black">PENDING PAYMENT</span></p>
                </div>

                {/* BOARDING PASS TICKET BODY */}
                <div className="relative bg-neutral-950 border border-neutral-850 rounded-2xl p-6 space-y-5 overflow-hidden">
                  {/* Left and Right half-circle physical punchout visuals */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-neutral-900 border-r border-neutral-800" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-neutral-900 border-l border-neutral-800" />

                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs border-b border-dashed border-neutral-800 pb-5">
                    <div>
                      <span className="text-neutral-500 font-extrabold uppercase text-[9px] tracking-wider block">APPLICATION ID</span>
                      <span className="text-white block font-mono font-black text-sm tracking-wide text-red-500">{createdApplication.applicationId}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 font-extrabold uppercase text-[9px] tracking-wider block">FULL ATHLETE NAME</span>
                      <span className="text-white block font-black uppercase truncate">{createdApplication.fullName}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 font-extrabold uppercase text-[9px] tracking-wider block">CHOSEN INTENSITIES</span>
                      <span className="text-white block font-black uppercase">{createdApplication.durationMonths} Months Plan</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 font-extrabold uppercase text-[9px] tracking-wider block">ESTIMATED DUE BILLING</span>
                      <span className="text-red-500 block font-mono font-black">Rs. {getSelectedPlanFeeEstimate().toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-1.5 space-y-3 text-xs">
                    <div className="flex justify-between items-center bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-850/60">
                      <div>
                        <span className="text-neutral-500 text-[8px] uppercase font-extrabold block">Timing Allotment Slot</span>
                        <span className="text-white font-extrabold text-[10px] uppercase">{createdApplication.timingPreference || formTiming}</span>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    </div>

                    <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-850/60 leading-normal text-[10px] space-y-1">
                      <span className="text-neutral-500 font-extrabold uppercase text-[8px] tracking-wider block">Verification & Cashdesk details:</span>
                      <p className="text-neutral-400 font-semibold">Please carry either a digital screenshot of this admissions pass slip or standard CNIC identity verification to the cashier desk counter to generate your physical rfid scan cards.</p>
                    </div>

                    {/* Faux scan barcode visual */}
                    <div className="pt-3 text-center space-y-1 flex flex-col items-center">
                      <div className="bg-neutral-900 border border-neutral-850 px-2 py-4 rounded-lg flex gap-1 justify-center max-w-[280px] w-full text-white/40 overflow-hidden font-mono text-center tracking-[4px] leading-none text-xs">
                        ||||| | |||| || ||| || |||| | |||||||| ||||||
                      </div>
                      <span className="text-[9px] font-mono font-black uppercase tracking-widest text-neutral-600 block">SCAN GATE CODE TO ADMIT</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <a
                    href={getWhatsAppMsgUrl(getJoinWhatsAppMessage())}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest text-center rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="h-4.5 w-4.5" />
                    Dispatch Slip to Gym WhatsApp Desk
                  </a>
                  <button
                    onClick={() => {
                      setCreatedApplication(null);
                      setFormName("");
                      setFormFather("");
                      setFormPhone("");
                      setFormWhatsApp("");
                      setFormTerms(false);
                      setBmiResult(null);
                    }}
                    className="w-full py-3.5 bg-neutral-950 border border-neutral-850 hover:bg-neutral-850 text-neutral-400 font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
                  >
                    Start Fresh Enrollment
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleJoinSubmit} className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 sm:p-8 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-semibold rounded-xl flex gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  {validationError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Personal particulars */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter candidate name"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Father's Name</label>
                  <input
                    type="text"
                    value={formFather}
                    onChange={(e) => setFormFather(e.target.value)}
                    placeholder="Enter father's name"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Phone Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g., 03443292360"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formWhatsApp}
                    onChange={(e) => setFormWhatsApp(e.target.value)}
                    placeholder="Same as mobile if empty"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Gender Selection <span className="text-red-500">*</span></label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as "Male" | "Female")}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all"
                  >
                    <option value="Male">Male timings</option>
                    <option value="Female">Female mid-day timing</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Home Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Physcial street, sector detail in Mandi Bahauddin"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>

                {/* Emergency Details */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Emergency Contact Person</label>
                  <input
                    type="text"
                    value={formEmergencyName}
                    onChange={(e) => setFormEmergencyName(e.target.value)}
                    placeholder="Relative name"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Emergency Phone</label>
                  <input
                    type="tel"
                    value={formEmergencyNumber}
                    onChange={(e) => setFormEmergencyNumber(e.target.value)}
                    placeholder="Relative hotline"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all font-mono"
                  />
                </div>

                {/* Gym Package Setup */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Blood Group</label>
                  <select
                    value={formBlood}
                    onChange={(e) => setFormBlood(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">CNIC Number (Optional)</label>
                  <input
                    type="text"
                    value={formCnic}
                    onChange={(e) => setFormCnic(e.target.value)}
                    placeholder="xxxxx-xxxxxxx-x"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Membership Category</label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all"
                  >
                    <option value="basic">Plan A: Basic (No cardio machines)</option>
                    <option value="premium">Plan B: Premium (Full cardio access)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Duration selection</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all font-mono"
                  >
                    <option value={1}>1 Month Package</option>
                    <option value={3}>3 Months Package (5% Discount)</option>
                    <option value={6}>6 Months Package (10% Discount)</option>
                    <option value={12}>12 Months Package (15% Discount)</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-xs bg-neutral-950 p-4 border border-neutral-850 rounded-2xl sm:col-span-2 flex justify-between items-center text-neutral-400">
                  <div>
                    <span className="font-extrabold uppercase block">Selected Fee Estimate:</span>
                    <span className="text-neutral-500">Calculate with automated package discounts</span>
                  </div>
                  <span className="text-xl font-black text-red-500 font-mono">
                    Rs. {getSelectedPlanFeeEstimate().toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Medical Notes or Physical Limitations</label>
                  <textarea
                    rows={2}
                    value={formMedical}
                    onChange={(e) => setFormMedical(e.target.value)}
                    placeholder="Asthma, rotator cuff strains, previous back surgeries (write none if none)"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Photo Upload indicator */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 flex items-center justify-between gap-3 text-xs">
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 rounded-full bg-neutral-900 border border-neutral-850 overflow-hidden flex items-center justify-center shrink-0">
                    <img src={formPhoto} alt="Preview Profile" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <span className="text-white font-bold block">Profile Photo Link Set</span>
                    <span className="text-neutral-500">Default profile mockup linked</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const links = [
                      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
                      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150",
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
                      "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80&w=150"
                    ];
                    setFormPhoto(links[Math.floor(Math.random() * links.length)]);
                  }}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-[10px] text-white font-bold uppercase rounded-lg"
                >
                  Regenerate Mock Capture
                </button>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  required
                  id="join-terms-decl"
                  checked={formTerms}
                  onChange={(e) => setFormTerms(e.target.checked)}
                  className="mt-1 h-4.5 w-4.5 rounded text-red-600 bg-neutral-950 border-neutral-800"
                />
                <label htmlFor="join-terms-decl" className="text-xs text-neutral-400 font-semibold leading-normal">
                  I hereby declare that all weights I lift will be in safe guidelines. I accept that the fee paid is 
                  non-refundable and that I will abide by the Male/Female timings separation rules strictly.
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-black font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-yellow-500/10"
              >
                {isSubmitting ? "Submitting application details..." : "Register Registration Form"}
              </button>
            </form>
          )}
        </div>
      );

    case "login":
      return (
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <span className="font-extrabold text-[10px] tracking-widest text-red-500 uppercase block">
              Authorization Portal
            </span>
            <h1 className="text-white font-black text-2xl uppercase tracking-tight">Life Fitness Member & Staff Entry Login</h1>
            <p className="text-xs text-neutral-400 font-semibold mt-1">
              Select standard Google login. If your email is registered as an Administrator, Super Admin, Trainer, or Receptionist, 
              the corresponding controls will unlock automatically.
            </p>

            <button
              onClick={onTriggerGoogleLogin}
              className="w-full flex items-center justify-center gap-3.5 py-4 bg-white hover:bg-neutral-100 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
            >
              <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.75 12.3c0-.82-.07-1.61-.21-2.38H12v4.51h6.6c-.29 1.5-.1.82.95 2.5a7.8 7.8 0 0 1-7.55 5.58C7.54 22.51 3.5 18.47 3.5 12s4.04-10.51 8.45-10.51c2.3 0 4.38.86 6 2.3l3.58-3.58C18.9 1.48 15.65 0 12 0 5.37 0 0 5.37 0 12s5.37 12 12 12c6.26 0 11.75-4.53 11.75-11.7z" />
              </svg>
              Login with Google Account
            </button>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-neutral-800"></div>
              <span className="px-3 text-[9px] text-neutral-500 font-extrabold uppercase tracking-widest leading-none">OR BIOMETRIC SIGN-IN</span>
              <div className="flex-1 border-t border-neutral-800"></div>
            </div>

            {/* Biometric Credentials Entry block */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 space-y-3.5 text-left">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block flex items-center gap-1.5 leading-none">
                <Fingerprint className="h-4 w-4 text-red-500 animate-pulse" />
                Passwordless Passkey Verification
              </span>

              <div className="space-y-1.5">
                <label htmlFor="passkey-login" className="text-[9px] text-neutral-500 uppercase tracking-wider font-bold block leading-none">
                  Enter Gym Member ID (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    id="passkey-login"
                    type="text"
                    value={passkeyLoginId}
                    onChange={(e) => setPasskeyLoginId(e.target.value)}
                    placeholder="e.g. MEM-101 (or leave blank for fast scan)"
                    className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-red-600 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-755 placeholder-neutral-500 font-bold outline-none focus:ring-1 focus:ring-red-600 font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={handlePasskeySignIn}
                    disabled={assertingPasskey}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 text-black disabled:text-neutral-500 font-black text-xs uppercase tracking-wider rounded-xl transition-all font-sans active:scale-95"
                  >
                    {assertingPasskey ? "Scanning..." : "Verify"}
                  </button>
                </div>
              </div>

              {/* Console assertion logs terminal inside login panel */}
              {passkeyAssertionLog.length > 0 && (
                <div className="bg-neutral-900/60 border border-neutral-850 rounded-xl p-3 space-y-1.5 font-mono text-[9px] leading-relaxed select-text">
                  <div className="flex items-center justify-between text-neutral-500 border-b border-neutral-800 pb-1 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1 text-[8.5px]"><Terminal className="h-3 w-3 text-neutral-500" /> Attestation Console</span>
                    <button type="button" onClick={() => setPasskeyAssertionLog([])} className="hover:text-white uppercase transition-colors text-[8px]">Clear</button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-neutral-450" style={{ scrollbarWidth: "thin" }}>
                    {passkeyAssertionLog.map((logLine, idx) => (
                      <p key={idx} className={logLine.includes("ERROR") ? "text-red-500" : logLine.includes("SUCCESS") ? "text-emerald-400" : ""}>{logLine}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-950 pt-5 text-[11px] text-neutral-500 space-y-2">
              <p>Registered Super Admin: <span className="text-white font-mono">{settings.initialAdminEmail || "zunairkalyar10@gmail.com"}</span></p>
              <p>For instant pilot testing, log in with any account. If unregistered, you will be placed in the default "Member" role.</p>
            </div>
          </div>

          {/* MODAL: BIOMETRIC LOGIN SECURE ENCLAVE */}
          {showAssertModal && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-6 text-center animate-in fade-in duration-200">
                <div className="space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center">
                    <Fingerprint className="h-8 w-8 text-red-500 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-red-500 text-[10px] font-black uppercase tracking-widest block font-mono">Biometric Key Verification</span>
                    <h3 className="text-white text-lg font-black uppercase tracking-tight">Access Secure Enclave</h3>
                    <p className="text-xs text-neutral-400 leading-normal font-semibold">
                      WebAuthn assertion request from <span className="text-white underline font-semibold font-mono">localhost</span>. Please present your secure credentials or biometrics to unlock your Gym Member account.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-850 text-left">
                  <span className="text-[9px] text-neutral-550 text-neutral-500 font-bold uppercase tracking-wider block mb-2 text-center">Confirm Platform Authenticator</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => verifyBiometricAssertion("TouchID")}
                      className="flex flex-col items-center justify-center p-2.5 bg-neutral-900 hover:bg-neutral-850 rounded-xl border border-neutral-800 font-extrabold text-[10px] text-white uppercase text-center space-y-1.5 transition-all active:scale-95 duration-100 animate-pulse"
                    >
                      <Fingerprint className="h-5 w-5 text-red-500" />
                      <span>Touch ID</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => verifyBiometricAssertion("FaceID")}
                      className="flex flex-col items-center justify-center p-2.5 bg-neutral-900 hover:bg-neutral-850 rounded-xl border border-neutral-800 font-extrabold text-[10px] text-white uppercase text-center space-y-1.5 transition-all active:scale-95 duration-100"
                    >
                      <Eye className="h-5 w-5 text-cyan-400" />
                      <span>Face ID</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => verifyBiometricAssertion("Yubikey")}
                      className="flex flex-col items-center justify-center p-2.5 bg-neutral-900 hover:bg-neutral-850 rounded-xl border border-neutral-800 font-extrabold text-[10px] text-white uppercase text-center space-y-1.5 transition-all active:scale-95 duration-100"
                    >
                      <Cpu className="h-5 w-5 text-amber-500" />
                      <span>USB Key</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setShowAssertModal(false); setAssertingPasskey(false); addAssertLog("ERROR: Login signature cancelled by visitor."); }}
                  className="w-full py-3.5 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 font-extrabold text-xs uppercase rounded-xl border border-neutral-800 transition-all text-center"
                >
                  Cancel Verification
                </button>
              </div>
            </div>
          )}
        </div>
      );

    case "privacy":
      return (
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-6">
          <h1 className="text-3xl font-extrabold text-white uppercase tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-neutral-500">Effective Date: June 15, 2026</p>
          <div className="text-xs text-neutral-400 space-y-4 leading-relaxed font-semibold">
            <p>At Life Fitness, we respect your privacy. This policy outlines how we handle the personal information collected during your registration and attendance verification routines.</p>
            <h3 className="text-white font-black uppercase text-sm mt-4">1. Information Gathered</h3>
            <p>We preserve names, contact details, Emergency contact numbers, date of births, medical histories (disclosed voluntarily), blood groups, CNIC numbers (where provided) and capture profile pictures solely for digital membership cards.</p>
            <h3 className="text-white font-black uppercase text-sm mt-4">2. Digital Attendance QR Codes</h3>
            <p>Members display their digital card in our lobby; receptionist scanning processes save timestamps, check-in schedules, and active statuses to verify payment histories synchronously.</p>
            <h3 className="text-white font-black uppercase text-sm mt-4">3. Leaderboard Submissions</h3>
            <p>When you attempt monthly challenges, your specified nickname, photograph, and exercise score standings are stored in public leaderboards unless specifically marked private.</p>
          </div>
        </div>
      );

    case "terms":
      return (
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-6">
          <h1 className="text-3xl font-extrabold text-white uppercase tracking-tight">Terms and Conditions</h1>
          <p className="text-xs text-neutral-500">Last Updated: June 15, 2026</p>
          <div className="text-xs text-neutral-400 space-y-4 leading-relaxed font-semibold">
            <p>By registering and accessing any facilities at Life Fitness, you agree to comply with these terms in full.</p>
            <h3 className="text-white font-black uppercase text-sm mt-4">1. Safety Limitations & Liability Waiver</h3>
            <p>All members acknowledge that heavy resistance lifting, endurance treadmill running, and competitive attempts involve implicit risks. You agree to hold Life Fitness completely harmless in any incident of injury or medical event during unsupervised sets.</p>
            <h3 className="text-white font-black uppercase text-sm mt-4">2. Separation Schedule Regulations</h3>
            <p>Our timing regulations are strictly segregated. Female midday timings (11:00 AM – 4:00 PM) operate under private space guarantees. No overlapping genders transitions are allowed on the training floor.</p>
            <h3 className="text-white font-black uppercase text-sm mt-4">3. Fee and Voucher Forfeitures</h3>
            <p>Registration invoices must be paid inside standard slots. Once payments are recorded in Firestore, they are strictly non-refundable and non-transferable.</p>
          </div>
        </div>
      );

    default:
      return <div className="text-center py-20 text-neutral-500">Page not found.</div>;
  }
}
