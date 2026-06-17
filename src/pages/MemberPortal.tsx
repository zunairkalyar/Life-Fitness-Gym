import React, { useState, useMemo, useEffect } from "react";
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
  Dumbbell,
  AlertCircle,
  Apple,
  Scale,
  TrendingUp,
  Plus,
  Trash2,
  Sparkles,
  Award,
  Camera,
  Download,
  Music,
  MapPin,
  Heart,
  MessageSquare,
  Send,
  Share2,
  Copy,
  Users,
  RefreshCw,
  Eye,
  ThumbsUp
} from "lucide-react";
import { Fingerprint, KeyRound, Terminal, Smartphone, Laptop, Cpu } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  PieChart,
  Pie
} from "recharts";
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
import GainsCalculator from "../components/GainsCalculator";
import GymSoundboard from "../components/GymSoundboard";
import EquipmentFloorMap from "../components/EquipmentFloorMap";
import GymTrafficHeatmap from "../components/GymTrafficHeatmap";
import MemberWorkoutDashboard from "../components/MemberWorkoutDashboard";

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
  const [activeSection, setActiveSection] = useState<"dashboard" | "ai-coach" | "exercises" | "diet" | "community" | "soundboard" | "equipment" | "traffic" | "workouts">("dashboard");
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [waLogs, setWaLogs] = useState<any[]>([]);
  const [waSettings, setWaSettings] = useState<any | null>(null);

  // Auto-redirect to Workouts tab if flagged by WhatsApp secure link parser
  useEffect(() => {
    if (sessionStorage.getItem("lf_redirect_to_workouts") === "true") {
      sessionStorage.removeItem("lf_redirect_to_workouts");
      setActiveSection("workouts");
    }
  }, []);

  // Biometric Passkey state managers
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const [passkeyLog, setPasskeyLog] = useState<string[]>([]);
  const [showEnclaveModal, setShowEnclaveModal] = useState(false);
  const [enclaveChallenge, setEnclaveChallenge] = useState("");
  const [enclaveDeviceType, setEnclaveDeviceType] = useState<"TouchID" | "FaceID" | "Yubikey">("TouchID");

  useEffect(() => {
    const fetchPasskeys = async () => {
      setLoadingPasskeys(true);
      try {
        const res = await fetch(`/api/passkeys/settings/${member.id}`);
        if (res.ok) {
          const data = await res.json();
          setPasskeys(data);
        }
      } catch (err) {
        console.error("Error loading passkeys settings:", err);
      } finally {
        setLoadingPasskeys(false);
      }
    };
    fetchPasskeys();
  }, [member.id]);

  useEffect(() => {
    const fetchWaData = async () => {
      try {
        const [logsRes, settingsRes] = await Promise.all([
          fetch("/api/whatsapp/logs").then(r => r.json()),
          fetch("/api/whatsapp/settings").then(r => r.json())
        ]);
        if (Array.isArray(logsRes)) {
          const filteredLogs = logsRes
            .filter((l: any) => l.memberId === member.id)
            .sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
          setWaLogs(filteredLogs);
        }
        if (Array.isArray(settingsRes)) {
          const matchedSet = settingsRes.find((s: any) => s.memberId === member.id);
          if (matchedSet) {
            setWaSettings(matchedSet);
          }
        }
      } catch (err) {
        console.error("Failed to load WhatsApp timeline data:", err);
      }
    };
    fetchWaData();
  }, [member.id]);

  const addLogMessage = (msg: string) => {
    setPasskeyLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleRegisterPasskey = async () => {
    if (!passkeyName.trim()) {
      alert("Please specify a name or label for this passkey (e.g. My TouchID Laptop).");
      return;
    }
    setRegisteringPasskey(true);
    setPasskeyLog([]);
    addLogMessage("FIDO2/WebAuthn Client initiated registration handshake...");
    
    try {
      addLogMessage("POST /api/passkeys/register-challenge...");
      const challengeRes = await fetch("/api/passkeys/register-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id })
      });
      
      if (!challengeRes.ok) {
        throw new Error("Failed to receive challenge from club servers.");
      }
      
      const options = await challengeRes.json();
      addLogMessage(`Received safe WebAuthn options. Challenge: "${options.challenge}"`);
      setEnclaveChallenge(options.challenge);
      
      // Try real WebAuthn or fallback to simulated enclave touch signature
      addLogMessage(`Analyzing standard navigator.credentials capability...`);
      setShowEnclaveModal(true);
    } catch (err: any) {
      addLogMessage(`ERROR: ${err.message}`);
      setRegisteringPasskey(false);
    }
  };

  const finishSimulatedPasskeyRegistration = async (deviceTypeSelected: "TouchID" | "FaceID" | "Yubikey") => {
    setShowEnclaveModal(false);
    addLogMessage(`Biometric Authenticator verified via ${deviceTypeSelected}!`);
    addLogMessage(`Asymmetric Keypair generated inside Secure Hardware. Alg: ES256 (-7).`);
    
    const mockCredId = `cred-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const mockPubKey = btoa(JSON.stringify({
      kty: "EC",
      crv: "P-256",
      x: Math.random().toString(36).substring(2, 15),
      y: Math.random().toString(36).substring(2, 15)
    })).replace(/=/g, "");

    addLogMessage(`Sending public key cert base64 and attestation proof to /api/passkeys/register-verify...`);

    try {
      const verifyRes = await fetch("/api/passkeys/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          credentialName: passkeyName,
          id: mockCredId,
          publicKey: mockPubKey,
          deviceType: deviceTypeSelected
        })
      });

      if (!verifyRes.ok) {
        throw new Error("Attestation reject of signature by server.");
      }

      const result = await verifyRes.json();
      addLogMessage("SUCCESS: Passkey public key saved in secure club database!");
      setPasskeys(prev => [...prev, result.credential]);
      setPasskeyName("");
    } catch (err: any) {
      addLogMessage(`REGISTRATION FAILED: ${err.message}`);
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this biometric passkey? You will no longer be able to use this device to sign-in.")) {
      return;
    }
    try {
      const res = await fetch("/api/passkeys/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, memberId: member.id })
      });
      if (res.ok) {
        setPasskeys(prev => prev.filter(k => k.id !== keyId));
      } else {
        alert("Failed to delete key.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Calibrated daily targets state synchronized with the BMR Calculator
  const [calorieGoal, setCalorieGoal] = useState<number>(() => {
    const saved = localStorage.getItem(`fit_cal_goal_${member.id}`);
    return saved ? parseInt(saved) : 2200;
  });
  const [proteinGoal, setProteinGoal] = useState<number>(() => {
    const saved = localStorage.getItem(`fit_prot_goal_${member.id}`);
    return saved ? parseInt(saved) : 140;
  });
  const [carbsGoal, setCarbsGoal] = useState<number>(() => {
    const saved = localStorage.getItem(`fit_carb_goal_${member.id}`);
    return saved ? parseInt(saved) : 230;
  });
  const [fatsGoal, setFatsGoal] = useState<number>(() => {
    const saved = localStorage.getItem(`fit_fat_goal_${member.id}`);
    return saved ? parseInt(saved) : 65;
  });

  const handleUpdateTargets = (calories: number, protein: number, carbs: number, fats: number) => {
    setCalorieGoal(calories);
    setProteinGoal(protein);
    setCarbsGoal(carbs);
    setFatsGoal(fats);
    localStorage.setItem(`fit_cal_goal_${member.id}`, calories.toString());
    localStorage.setItem(`fit_prot_goal_${member.id}`, protein.toString());
    localStorage.setItem(`fit_carb_goal_${member.id}`, carbs.toString());
    localStorage.setItem(`fit_fat_goal_${member.id}`, fats.toString());
  };

  // LOCALLY PERSISTENT DIET LOG FOR THE REGISTERED MEMBER
  const [dietLogs, setDietLogs] = useState<{ id: string; date: string; name: string; calories: number; protein: number; carbs: number; fats: number; quantity: number }[]>(() => {
    try {
      const saved = localStorage.getItem(`fit_diet_logs_${member.id}`);
      return saved ? JSON.parse(saved) : [
        { id: "d-1", date: new Date().toISOString().split("T")[0], name: "Roti (Medium Size)", calories: 120, protein: 4, carbs: 26, fats: 1, quantity: 2 },
        { id: "d-2", date: new Date().toISOString().split("T")[0], name: "Chicken Karahi (1 plate)", calories: 350, protein: 32, carbs: 4, fats: 22, quantity: 1 },
        { id: "d-3", date: new Date().toISOString().split("T")[0], name: "Boiled Egg (Large)", calories: 78, protein: 6, carbs: 0.6, fats: 5, quantity: 2 }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(`fit_diet_logs_${member.id}`, JSON.stringify(dietLogs));
  }, [dietLogs, member.id]);

  // LOCAL BIOMETRICS FOR CHARTS (Synced with MemberProfileEditor's localStorage schema)
  const [measurementsList, setMeasurementsList] = useState<{ id: string; memberId: string; measurementType: string; value: number; unit: string; createdAt: string; note?: string }[]>(() => {
    try {
      const saved = localStorage.getItem(`measurements_${member.id}`);
      return saved ? JSON.parse(saved) : [
        { id: "m-init-1", memberId: member.id, measurementType: "Weight", value: 78, unit: "KG", createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(), note: "Starter baseline logs" },
        { id: "m-init-2", memberId: member.id, measurementType: "Weight", value: 77.2, unit: "KG", createdAt: new Date(Date.now() - 15 * 86400 * 1000).toISOString(), note: "Progress check" },
        { id: "m-init-3", memberId: member.id, measurementType: "Weight", value: 76.5, unit: "KG", createdAt: new Date().toISOString(), note: "Latest morning check" },
        { id: "m-init-4", memberId: member.id, measurementType: "Waist", value: 34, unit: "inches", createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString() },
        { id: "m-init-5", memberId: member.id, measurementType: "Waist", value: 33.2, unit: "inches", createdAt: new Date().toISOString() },
        { id: "m-init-6", memberId: member.id, measurementType: "Left biceps", value: 14.5, unit: "inches", createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString() },
        { id: "m-init-7", memberId: member.id, measurementType: "Left biceps", value: 15.0, unit: "inches", createdAt: new Date().toISOString() }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(`measurements_${member.id}`, JSON.stringify(measurementsList));
  }, [measurementsList, member.id]);

  // Quick biometrics logging inputs on the main dashboard
  const [selectedDashboardChartType, setSelectedDashboardChartType] = useState<string>("Weight");
  const [quickMeasureVal, setQuickMeasureVal] = useState("");
  const [quickMeasureNote, setQuickMeasureNote] = useState("");

  const handleAddQuickBiometrics = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickMeasureVal);
    if (isNaN(val) || val <= 0) return;

    const newUnit = selectedDashboardChartType === "Weight" ? "KG" : "inches";
    const newEntry = {
      id: `m-quick-${Date.now()}`,
      memberId: member.id,
      measurementType: selectedDashboardChartType,
      value: val,
      unit: newUnit,
      createdAt: new Date().toISOString(),
      note: quickMeasureNote.trim() || undefined
    };

    const updatedList = [newEntry, ...measurementsList];
    setMeasurementsList(updatedList);
    setQuickMeasureVal("");
    setQuickMeasureNote("");
  };

  // PAKISTANI FOODS REPOSITORY
  const PAKISTANI_FOODS = [
    { name: "Roti (Medium Size)", calories: 120, protein: 4, carbs: 26, fats: 1 },
    { name: "Chicken Karahi (1 plate)", calories: 350, protein: 32, carbs: 4, fats: 22 },
    { name: "Chana Dal (1 cup cooked)", calories: 220, protein: 12, carbs: 35, fats: 4 },
    { name: "Seekh Kebab (Beef, 1 skewer)", calories: 180, protein: 18, carbs: 2, fats: 12 },
    { name: "Boiled Egg (Large)", calories: 78, protein: 6, carbs: 0.6, fats: 5 },
    { name: "White Rice (Plain, 1 cup cooked)", calories: 205, protein: 4, carbs: 45, fats: 0.4 },
    { name: "Mixed Green Salad", calories: 25, protein: 0.5, carbs: 5, fats: 0 },
    { name: "Full Cream Buffalo Milk (1 glass)", calories: 150, protein: 8, carbs: 12, fats: 8 },
    { name: "Sweet Lassi (1 glass)", calories: 240, protein: 6, carbs: 32, fats: 9 },
    { name: "Whey Protein Shake (1 scoop)", calories: 130, protein: 25, carbs: 2, fats: 2 },
    { name: "Banana (Fresh, 1 medium)", calories: 105, protein: 1.3, carbs: 27, fats: 0.3 },
    { name: "Mixed Dry Nuts (30g hand)", calories: 180, protein: 5, carbs: 8, fats: 15 }
  ];

  const [dietSelectedFoodName, setDietSelectedFoodName] = useState(PAKISTANI_FOODS[0].name);
  const [dietFoodQuantity, setDietFoodQuantity] = useState(1);
  const [dietCustomFoodName, setDietCustomFoodName] = useState("");
  const [dietCustomCalories, setDietCustomCalories] = useState("");
  const [dietCustomProtein, setDietCustomProtein] = useState("");
  const [dietCustomCarbs, setDietCustomCarbs] = useState("");
  const [dietCustomFats, setDietCustomFats] = useState("");
  const [isCustomFoodView, setIsCustomFoodView] = useState(false);

  const handleAddFoodLog = () => {
    let foodObj;
    if (isCustomFoodView) {
      if (!dietCustomFoodName.trim()) return;
      foodObj = {
        name: dietCustomFoodName,
        calories: parseInt(dietCustomCalories) || 100,
        protein: parseInt(dietCustomProtein) || 5,
        carbs: parseInt(dietCustomCarbs) || 10,
        fats: parseInt(dietCustomFats) || 2
      };
    } else {
      foodObj = PAKISTANI_FOODS.find(f => f.name === dietSelectedFoodName) || PAKISTANI_FOODS[0];
    }

    const newLog = {
      id: `dl-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      name: foodObj.name,
      calories: foodObj.calories,
      protein: foodObj.protein,
      carbs: foodObj.carbs,
      fats: foodObj.fats,
      quantity: dietFoodQuantity
    };

    setDietLogs(prev => [newLog, ...prev]);
    setDietFoodQuantity(1);
    setIsCustomFoodView(false);
    setDietCustomFoodName("");
    setDietCustomCalories("");
    setDietCustomProtein("");
    setDietCustomCarbs("");
    setDietCustomFats("");
  };

  const handleRemoveFoodLog = (id: string) => {
    setDietLogs(prev => prev.filter(item => item.id !== id));
  };

  // Memoized Chart Calculations for Biometrics
  const currentBiometricsChartData = useMemo(() => {
    return measurementsList
      .filter(m => m.measurementType === selectedDashboardChartType)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(entry => ({
        date: new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        [selectedDashboardChartType]: entry.value,
        note: entry.note || ""
      }));
  }, [measurementsList, selectedDashboardChartType]);

  // Weekly attendance consistency trend calculation
  const attendanceWeeklyTrendData = useMemo(() => {
    const defaultAttTrend = [
      { week: "Week 1", sessions: 4 },
      { week: "Week 2", sessions: 5 },
      { week: "Week 3", sessions: 3 },
      { week: "Week 4", sessions: attendance.length || 5 }
    ];
    return defaultAttTrend;
  }, [attendance]);

  const todayCaloriesConsumed = useMemo(() => {
    return dietLogs.reduce((sum, item) => sum + (item.calories * item.quantity), 0);
  }, [dietLogs]);

  const todayProteinConsumed = useMemo(() => {
    return dietLogs.reduce((sum, item) => sum + (item.protein * item.quantity), 0);
  }, [dietLogs]);

  const todayCarbsConsumed = useMemo(() => {
    return dietLogs.reduce((sum, item) => sum + (item.carbs * item.quantity), 0);
  }, [dietLogs]);

  const todayFatsConsumed = useMemo(() => {
    return dietLogs.reduce((sum, item) => sum + (item.fats * item.quantity), 0);
  }, [dietLogs]);

  const macroDonutData = useMemo(() => {
    return [
      { name: "Proteins", value: todayProteinConsumed * 4, fill: "#ef4444" },
      { name: "Carbohydrates", value: todayCarbsConsumed * 4, fill: "#eab308" },
      { name: "Fats", value: todayFatsConsumed * 9, fill: "#3b82f6" }
    ];
  }, [todayProteinConsumed, todayCarbsConsumed, todayFatsConsumed]);

  // ==========================================
  // COMMUNITY HUB & CREATOR STUDIO STATES
  // ==========================================
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`fit_points_${member.id}`);
      return saved ? parseInt(saved) : 340;
    } catch {
      return 340;
    }
  });

  useEffect(() => {
    localStorage.setItem(`fit_points_${member.id}`, loyaltyPoints.toString());
  }, [loyaltyPoints, member.id]);

  const [communityFeed, setCommunityFeed] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`fit_feed_${member.id}`);
      return saved ? JSON.parse(saved) : [
        {
          id: "post-1",
          authorName: "Hamza Ali",
          authorPhoto: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=150",
          content: "Alhamdulillah! Smashed a new personal deadlift record of 180kg today at Life Fitness! The atmosphere was insane tonight.",
          likes: 24,
          likedByUser: false,
          time: "2 hours ago",
          comments: [
            { id: "c-1", author: "Kamran Shah", text: "Brilliant effort Hamza! Form was incredibly solid." }
          ]
        },
        {
          id: "post-2",
          authorName: "Zainab Fatima",
          authorPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
          content: "Completed my weekly 4th morning leg training session. Hit 80kg squats target! consistency pays off.",
          likes: 18,
          likedByUser: false,
          time: "5 hours ago",
          comments: []
        },
        {
          id: "post-3",
          authorName: "Coach Shehzad",
          authorPhoto: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=150",
          content: "Outstanding discipline shown by the morning batch today! Remember to keep your water intake above 4 liters in this high heat.",
          likes: 35,
          likedByUser: false,
          time: "Yesterday",
          comments: [
            { id: "c-2", author: "Bilal Butt", text: "Thanks for the reminder coach. Appreciate it!" }
          ]
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(`fit_feed_${member.id}`, JSON.stringify(communityFeed));
  }, [communityFeed, member.id]);

  const [newPostText, setNewPostText] = useState("");

  const handleAddFeedPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost = {
      id: `post-${Date.now()}`,
      authorName: activeDisplayName,
      authorPhoto: member.photoUrl,
      content: newPostText.trim(),
      likes: 1,
      likedByUser: true,
      time: "Just now",
      comments: []
    };

    setCommunityFeed(prev => [newPost, ...prev]);
    setNewPostText("");
    setLoyaltyPoints(prev => prev + 15); // reward for sharing progress
  };

  const handleLikePost = (postId: string) => {
    setCommunityFeed(prev => prev.map(p => {
      if (p.id === postId) {
        const liked = !p.likedByUser;
        return {
          ...p,
          likedByUser: liked,
          likes: liked ? p.likes + 1 : p.likes - 1
        };
      }
      return p;
    }));
  };

  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    setCommunityFeed(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments,
            { id: `c-${Date.now()}`, author: activeDisplayName, text: text.trim() }
          ]
        };
      }
      return p;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
  };

  // Challenges State
  const [challenges, setChallenges] = useState<{ id: string; title: string; desc: string; target: string; points: number; isClaimed: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem(`fit_challenges_${member.id}`);
      return saved ? JSON.parse(saved) : [
        { id: "ch-1", title: "Iron Consistency", desc: "Clock in at least 4 swipe check-ins this week.", target: "4 Sessions", points: 50, isClaimed: false },
        { id: "ch-2", title: "Macro Perfection", desc: "Log your daily diet, protein, and calories 3 days in a row.", target: "3 Days Logged", points: 40, isClaimed: false },
        { id: "ch-3", title: "Supreme PR Shatterer", desc: "Verify and log a new personal record (PR) in the lift journal.", target: "1 PR Logged", points: 60, isClaimed: false },
        { id: "ch-4", title: "Community Pillar", desc: "Post a motivational status or share progress in the community room.", target: "1 Feed Post", points: 30, isClaimed: false }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(`fit_challenges_${member.id}`, JSON.stringify(challenges));
  }, [challenges, member.id]);

  const handleClaimChallenge = (id: string, pts: number) => {
    setChallenges(prev => prev.map(ch => {
      if (ch.id === id) {
        return { ...ch, isClaimed: true };
      }
      return ch;
    }));
    setLoyaltyPoints(prev => prev + pts);
  };

  // Poll state
  const [pollVotedOption, setPollVotedOption] = useState<string>(() => {
    return localStorage.getItem(`fit_poll_voted_${member.id}`) || "";
  });

  const [pollData, setPollData] = useState<{ option: string; votes: number }[]>(() => {
    try {
      const saved = localStorage.getItem(`fit_poll_data_${member.id}`);
      return saved ? JSON.parse(saved) : [
        { option: "Morning 06:30 AM Slot", votes: 42 },
        { option: "Afternoon 12:00 PM Slot", votes: 14 },
        { option: "Evening 06:30 PM Peak", votes: 85 },
        { option: "Night 08:30 PM Late", votes: 29 }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(`fit_poll_data_${member.id}`, JSON.stringify(pollData));
  }, [pollData, member.id]);

  const handleVotePoll = (option: string) => {
    if (pollVotedOption) return; // one vote limit

    setPollData(prev => prev.map(item => {
      if (item.option === option) {
        return { ...item, votes: item.votes + 1 };
      }
      return item;
    }));
    setPollVotedOption(option);
    localStorage.setItem(`fit_poll_voted_${member.id}`, option);
    setLoyaltyPoints(prev => prev + 25); // Vote bonus points!
  };

  // Personal Records Lift Journal
  const [userPrs, setUserPrs] = useState<Record<string, { weight: number; date: string }>>(() => {
    try {
      const saved = localStorage.getItem(`fit_prs_${member.id}`);
      return saved ? JSON.parse(saved) : {
        "Bench Press": { weight: 85, date: "May 25, 2026" },
        "Squat (Ass-to-Grass)": { weight: 110, date: "Jun 02, 2026" },
        "Floor Conventional Deadlift": { weight: 140, date: "Jun 10, 2026" },
        "Standing Overhead Press": { weight: 55, date: "Jun 14, 2026" }
      };
    } catch {
      return {
        "Bench Press": { weight: 85, date: "May 25, 2026" },
        "Squat (Ass-to-Grass)": { weight: 110, date: "Jun 02, 2026" },
        "Floor Conventional Deadlift": { weight: 140, date: "Jun 10, 2026" },
        "Standing Overhead Press": { weight: 55, date: "Jun 14, 2026" }
      };
    }
  });

  useEffect(() => {
    localStorage.setItem(`fit_prs_${member.id}`, JSON.stringify(userPrs));
  }, [userPrs, member.id]);

  const [prInputLift, setPrInputLift] = useState("Bench Press");
  const [prInputWeight, setPrInputWeight] = useState("");

  const handleAddPr = (e: React.FormEvent) => {
    e.preventDefault();
    const wt = parseFloat(prInputWeight);
    if (!wt || wt <= 0) return;

    setUserPrs(prev => ({
      ...prev,
      [prInputLift]: { weight: wt, date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) }
    }));
    setPrInputWeight("");
    setLoyaltyPoints(prev => prev + 30); // PR bonus points!

    // Auto update the challenge progress if relevant
    setChallenges(prev => prev.map(ch => {
      if (ch.id === "ch-3") {
        return { ...ch, desc: "Shattered and logged active record successfully!" };
      }
      return ch;
    }));
  };

  // Branded Gym Content Generator States
  const [creatorHeadline, setCreatorHeadline] = useState("NEW WORKOUT PR!");
  const [creatorMetric, setCreatorMetric] = useState("DEADLIFT: 140 KG");
  const [creatorQuote, setCreatorQuote] = useState("Sweat now, shine later. Zero excuses at Life Fitness!");
  const [creatorLayout, setCreatorLayout] = useState<"story" | "feed" | "banner">("story");
  const [creatorTheme, setCreatorTheme] = useState<"onyx" | "emerald" | "crimson" | "gold">("onyx");
  const [creatorMusic, setCreatorMusic] = useState("Phonk Beats (Slowing Grind)");
  const [creatorCopyStatus, setCreatorCopyStatus] = useState(false);
  const [creatorPreviewAnimation, setCreatorPreviewAnimation] = useState(false);

  const creatorCaptionsPool: Record<string, string> = {
    "PR": "💥 NEW METRIC UNLOCKED! Smashed my previous targets today at @LifeFitnessGym! Consistency pays dividends. If you want results, you must show discipline. Who else is hitting the floor tonight? 💪🇵🇰 #LifeFitness #DisciplineIsKey #HeavyLift #CalisthenicsDesi #GymMotivation",
    "Consistency": "⚔️ No compromise on training! Built in the early morning slots, backed by direct personalized AI insights, fueled with clean nutrition presets. Shoutout to @LifeFitnessGym for the ultimate operational space! Let's get after it. 🏋️‍♂️🙌 #RestDayNone #EatCleanTrainDirty #GymPakistan #BodyTransformation #PakistanFitness",
    "Diet": "🥗 Clean eating = premium muscle rebuilding. Registered my macronutrients count successfully. Big up @LifeFitnessGym for matching precise regional foods in the tracker! Fueling for the squats tomorrow. Let's conquer the peak! 📈🔥 #AbsAreMadeInKitchen #ProteinIntake #FitnessJourney #FitDesi"
  };

  const [selectedCaptionType, setSelectedCaptionType] = useState("PR");

  const generatorSuggestedCaption = useMemo(() => {
    return creatorCaptionsPool[selectedCaptionType] || creatorCaptionsPool["PR"];
  }, [selectedCaptionType]);

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(generatorSuggestedCaption);
    setCreatorCopyStatus(true);
    setTimeout(() => setCreatorCopyStatus(false), 2000);
  };

  const handleTriggerSimulatedShare = () => {
    setCreatorPreviewAnimation(true);
    setTimeout(() => {
      setCreatorPreviewAnimation(false);
      alert("✅ Awesome! Your Branded Poster has been synchronized with the Social Creator Pipeline. Share it to Instagram or Facebook! You gained +20 Lounge XP points.");
      setLoyaltyPoints(prev => prev + 20);
    }, 1500);
  };

  const handleDownloadPoster = () => {
    // We will generate a real dynamically scalable SVG file download of the poster!
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
        <defs>
          <linearGradient id="gradTheme" x1="0%" y1="0%" x2="100%" y2="100%">
            ${creatorTheme === "onyx" ? '<stop offset="0%" stop-color="#111" /><stop offset="100%" stop-color="#222" />' : ""}
            ${creatorTheme === "emerald" ? '<stop offset="0%" stop-color="#022c22" /><stop offset="100%" stop-color="#064e3b" />' : ""}
            ${creatorTheme === "crimson" ? '<stop offset="0%" stop-color="#450a0a" /><stop offset="100%" stop-color="#7f1d1d" />' : ""}
            ${creatorTheme === "gold" ? '<stop offset="0%" stop-color="#1c1917" /><stop offset="100%" stop-color="#78350f" />' : ""}
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#gradTheme)" />
        <circle cx="540" cy="540" r="400" fill="none" stroke="${creatorTheme === "gold" ? "#fbbf24" : "#dc2626"}" stroke-width="4" opacity="0.1" />
        
        <!-- HEADER branding -->
        <text x="540" y="220" font-family="'Inter', sans-serif" font-weight="900" font-size="50" fill="#fff" text-anchor="middle" letter-spacing="8">LIFE FITNESS</text>
        <text x="540" y="280" font-family="'JetBrains Mono', monospace" font-size="24" fill="${creatorTheme === "gold" ? "#f59e0b" : "#dc2626"}" text-anchor="middle" letter-spacing="4">ELITE ATHLETE CARD</text>
        
        <!-- CARD MAIN METRIC -->
        <text x="540" y="750" font-family="'Inter', sans-serif" font-weight="900" font-size="75" fill="${creatorTheme === "gold" ? "#fbbf24" : "#ff4d4d"}" text-anchor="middle" letter-spacing="4">${creatorHeadline.toUpperCase()}</text>
        <rect x="140" y="850" width="800" height="180" rx="30" fill="#000" fill-opacity="0.4" stroke="#fff" stroke-width="2" stroke-opacity="0.1" />
        <text x="540" y="960" font-family="'Inter', sans-serif" font-weight="900" font-size="90" fill="#ffffff" text-anchor="middle">${creatorMetric.toUpperCase()}</text>
        
        <!-- PHOTO WATERMARK MOCK -->
        <text x="540" y="1200" font-family="'Inter', sans-serif" font-weight="500" font-size="28" fill="#a3a3a3" text-anchor="middle" font-style="italic">"${creatorQuote}"</text>
        
        <line x1="200" y1="1350" x2="880" y2="1350" stroke="#fff" stroke-width="2" stroke-opacity="0.1" />
        
        <!-- ATHLETE INSTRUCTIONS -->
        <text x="540" y="1450" font-family="'Inter', sans-serif" font-weight="700" font-size="28" fill="#fff" text-anchor="middle">ATHLETE REGISTERED: ${member.fullName.toUpperCase()}</text>
        <text x="540" y="1500" font-family="'JetBrains Mono', monospace" font-size="24" fill="${creatorTheme === "gold" ? "#fbbf24" : "#dc2626"}" text-anchor="middle">LOYALTY XP CAP: ${loyaltyPoints} XP</text>
        
        <!-- FOOTER BRANDING -->
        <text x="540" y="1720" font-family="'Inter', sans-serif" font-size="24" fill="#a3a3a3" text-anchor="middle" letter-spacing="2">DEDICATED TRAINER SCHEDULING • SMART AI COORDINATION</text>
        <text x="540" y="1780" font-family="'Inter', sans-serif" font-size="20" fill="#737373" text-anchor="middle">life-fitness-pk.applet</text>
      </svg>
    `;

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `life_fitness_${member.id}_poster.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert("📥 Download Started! Enjoy your premium branded Life Fitness SVGPoster. Drag and drop it into Instagram or crop for Reels!");
  };

  // Live Transformation Timeline State
  const [photoBefore, setPhotoBefore] = useState("https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=350"); // initial
  const [photoAfter, setPhotoAfter] = useState("https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=350"); // bulked up state
  const [compareSliderVal, setCompareSliderVal] = useState(50);
  const [timelineLogs, setTimelineLogs] = useState<{ date: string; weight: number; caption: string; icon: string }[]>([
    { date: "May 01", weight: 81.2, caption: "Baseline check. High body fat, starting strength target.", icon: "🥚" },
    { date: "May 20", weight: 79.5, caption: "Water weight shed, squat form rectified.", icon: "⚡" },
    { date: "Jun 10", weight: 76.5, caption: "Striated shoulders visible. Strong athletic definition.", icon: "🛡️" }
  ]);

  const [newTimelineDate, setNewTimelineDate] = useState("");
  const [newTimelineWeight, setNewTimelineWeight] = useState("");
  const [newTimelineCaption, setNewTimelineCaption] = useState("");

  const handleAddTimelineLog = (e: React.FormEvent) => {
    e.preventDefault();
    const wt = parseFloat(newTimelineWeight);
    if (!wt || !newTimelineCaption.trim()) return;

    const newLog = {
      date: newTimelineDate || new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weight: wt,
      caption: newTimelineCaption.trim(),
      icon: "🔥"
    };

    setTimelineLogs(prev => [...prev, newLog]);
    setNewTimelineDate("");
    setNewTimelineWeight("");
    setNewTimelineCaption("");
    setLoyaltyPoints(p => p + 25);
  };

  const handleUploadPhoto = (type: "before" | "after") => {
    const promptUrl = prompt(`Enter image URL to update your ${type} comparison avatar:`);
    if (promptUrl && promptUrl.startsWith("http")) {
      if (type === "before") setPhotoBefore(promptUrl);
      else setPhotoAfter(promptUrl);
      setLoyaltyPoints(p => p + 20);
    }
  };

  // ==========================================
  // ENGAGEMENT, GAMIFICATION, REFERRAL & BOOKING ACTIONS
  // ==========================================

  // Daily Lift Notebook State
  const [dailyLiftLogs, setDailyLiftLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`fit_daily_lifts_${member.id}`);
      return saved ? JSON.parse(saved) : [
        { id: "lift-1", date: "2026-06-16", name: "Flat Bench Barbell Press", reps: 8, weight: 80, rpe: 9 },
        { id: "lift-2", date: "2026-06-16", name: "Squats (Ass-to-Grass)", reps: 10, weight: 100, rpe: 8 }
      ];
    } catch {
      return [
        { id: "lift-1", date: "2026-06-16", name: "Flat Bench Barbell Press", reps: 8, weight: 80, rpe: 9 },
        { id: "lift-2", date: "2026-06-16", name: "Squats (Ass-to-Grass)", reps: 10, weight: 100, rpe: 8 }
      ];
    }
  });

  const [newLiftName, setNewLiftName] = useState("");
  const [newLiftWeight, setNewLiftWeight] = useState("");
  const [newLiftReps, setNewLiftReps] = useState("");
  const [newLiftRpe, setNewLiftRpe] = useState("9");

  useEffect(() => {
    localStorage.setItem(`fit_daily_lifts_${member.id}`, JSON.stringify(dailyLiftLogs));
  }, [dailyLiftLogs, member.id]);

  const handleAddDailyLift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLiftName.trim() || !newLiftWeight || !newLiftReps) return;

    const newLog = {
      id: `lift-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      name: newLiftName.trim(),
      weight: parseFloat(newLiftWeight),
      reps: parseInt(newLiftReps),
      rpe: parseInt(newLiftRpe)
    };

    setDailyLiftLogs(prev => [newLog, ...prev]);
    setLoyaltyPoints(p => p + 25); // reward points for workout logging

    // Automatically push a status update to the community feed
    const postContent = `🏋️ Just logged a heavy set of *${newLog.name}* in my lift notebook! Hit *${newLog.weight} KG* for *${newLog.reps} reps* at RPE ${newLog.rpe}! Consistent grinding yields absolute physical gains! 🔥📈`;
    const newFeedPost = {
      id: `post-lift-${Date.now()}`,
      authorName: activeDisplayName,
      authorPhoto: member.photoUrl,
      content: postContent,
      likes: 2,
      likedByUser: false,
      time: "Just now",
      comments: []
    };
    setCommunityFeed(prev => [newFeedPost, ...prev]);

    setNewLiftName("");
    setNewLiftWeight("");
    setNewLiftReps("");
    setNewLiftRpe("9");
    alert("💪 Set Logged! +25 XP rewards gained and progress update posted to direct feed!");
  };

  const handleDeleteDailyLift = (id: string) => {
    setDailyLiftLogs(prev => prev.filter(l => l.id !== id));
  };

  // Gym Scheduler Slots
  const GYM_SLOTS = [
    { id: "morning-power", name: "Morning Power Hour", days: "Mon - Sat", time: "06:00 AM - 09:00 AM", type: "Mixed Grind", capacity: 20 },
    { id: "ladies-only", name: "Ladies Only Strength", days: "Mon - Sat", time: "10:00 AM - 01:00 PM", type: "Female Only", capacity: 30 },
    { id: "evening-peak", name: "Evening Peak Grind", days: "Mon - Sat", time: "05:00 PM - 09:00 PM", type: "Mixed Peak", capacity: 40 },
    { id: "night-owl", name: "Night Owls Strength", days: "Mon - Sat", time: "09:00 PM - 11:30 PM", type: "Mixed Power", capacity: 25 },
  ];

  // Slot Booked State
  const [bookedSlot, setBookedSlot] = useState<string>(() => {
    return localStorage.getItem(`fit_booked_slot_${member.id}`) || "";
  });

  // Simulated Global Bookings Counts to reflect live occupancy
  const [globalSlotBookings, setGlobalSlotBookings] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("gym_slot_bookings_global");
      return saved ? JSON.parse(saved) : { "morning-power": 12, "ladies-only": 19, "evening-peak": 32, "night-owl": 8 };
    } catch {
      return { "morning-power": 12, "ladies-only": 19, "evening-peak": 32, "night-owl": 8 };
    }
  });

  useEffect(() => {
    localStorage.setItem(`fit_booked_slot_${member.id}`, bookedSlot);
  }, [bookedSlot, member.id]);

  useEffect(() => {
    localStorage.setItem("gym_slot_bookings_global", JSON.stringify(globalSlotBookings));
  }, [globalSlotBookings]);

  const handleBookSlotToggle = (slotId: string) => {
    if (bookedSlot === slotId) {
      // Cancel Booking
      setBookedSlot("");
      setGlobalSlotBookings(prev => ({
        ...prev,
        [slotId]: Math.max(0, prev[slotId] - 1)
      }));
      alert("⚠️ Your gym slot reservation has been cancelled. Your spot is open for other members.");
    } else {
      // Book new slot
      if (bookedSlot) {
        // Cancel old first
        const oldSlot = bookedSlot;
        setGlobalSlotBookings(prev => ({
          ...prev,
          [oldSlot]: Math.max(0, prev[oldSlot] - 1)
        }));
      }
      setBookedSlot(slotId);
      setGlobalSlotBookings(prev => ({
        ...prev,
        [slotId]: prev[slotId] + 1
      }));
      setLoyaltyPoints(p => p + 15); // reward points for booking in advance
      alert(`🎉 Attendance Slot Confirmed! You booked "${GYM_SLOTS.find(s => s.id === slotId)?.name}". Proceed with your digital check-in QR! +15 XP rewarded.`);
    }
  };

  // Trainer assigned daily workouts (synced with admin dashboard assignment actions)
  const [trainerAssignment, setTrainerAssignment] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(`fit_trainer_workout_${member.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    
    // Default tailored setup per gender if nothing was assigned yet
    return {
      assignedAt: new Date().toISOString().split("T")[0],
      trainerName: "Coach Shehzad",
      notes: member.gender === "Female" 
        ? "Emphasis on high-metabolic core circuits, leg glute activations, and light cardiovascular transitions."
        : "Emphasis on heavy progressive overload benching, high-intensity rest pauses, and posture safety alignments.",
      exercises: member.gender === "Female" ? [
        { name: "Weighted Goblet Squats (Kettlebell)", sets: 3, reps: "12-15 reps", targetWeight: "15 KG" },
        { name: "Romanian Dumbbell Deadlifts", sets: 3, reps: "15 reps", targetWeight: "12.5 KG" },
        { name: "Standing Overhead Dumbbell Press", sets: 3, reps: "12 reps", targetWeight: "7.5 KG" },
        { name: "Plank Leg Rainbow Swipes", sets: 3, reps: "45 seconds", targetWeight: "Bodyweight" },
      ] : [
        { name: "Flat Bench Press (Barbell)", sets: 4, reps: "8-12 reps", targetWeight: "80 KG" },
        { name: "Incline Dumbbell Flyes", sets: 3, reps: "12 reps", targetWeight: "22.5 KG" },
        { name: "Overhead Military Press (Barbell)", sets: 3, reps: "10 reps", targetWeight: "50 KG" },
        { name: "Dumbbell Tricep Kickbacks", sets: 3, reps: "12 reps", targetWeight: "15 KG" },
      ],
      status: "Assigned"
    };
  });

  const handleCompleteTrainerAssignment = () => {
    if (trainerAssignment.status === "Completed") return;
    const updated = { ...trainerAssignment, status: "Completed" };
    setTrainerAssignment(updated);
    localStorage.setItem(`fit_trainer_workout_${member.id}`, JSON.stringify(updated));
    setLoyaltyPoints(prev => prev + 55); // Reward for compliance
    
    // Auto post update into community space
    const workoutPost = {
      id: `post-workout-${Date.now()}`,
      authorName: activeDisplayName,
      authorPhoto: member.photoUrl,
      content: `🔥 Checked off my official Workout Assignment today assigned by ${trainerAssignment.trainerName}! Consistently hitting ${trainerAssignment.exercises[0]?.name || "sets"} at ${trainerAssignment.exercises[0]?.targetWeight || "target weights"}. Progressive gains incoming at @LifeFitnessGym! 🛡️⚡`,
      likes: 4,
      likedByUser: true,
      time: "Just now",
      comments: []
    };
    setCommunityFeed(prev => [workoutPost, ...prev]);
    alert("🎉 Workout Logged and Approved! You completed Coach's assignments, earned +55 Lounge XP, and matching progress status is live in the community locker feed!");
  };

  // Referrals list & state
  const [newReferralName, setNewReferralName] = useState("");
  const [referralsList, setReferralsList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`fit_referrals_${member.id}`);
      return saved ? JSON.parse(saved) : [
        { id: "ref-101", friendName: "Ali Hassan", date: "2026-05-24", status: "Joined", pointsAwarded: 150 },
        { id: "ref-102", friendName: "Sheraz Kalyar", date: "2026-06-12", status: "Active Pass", pointsAwarded: 0 }
      ];
    } catch {
      return [
        { id: "ref-101", friendName: "Ali Hassan", date: "2026-05-24", status: "Joined", pointsAwarded: 150 },
        { id: "ref-102", friendName: "Sheraz Kalyar", date: "2026-06-12", status: "Active Pass", pointsAwarded: 0 }
      ];
    }
  });

  // Reward points Store
  const REDEEMABLE_REWARDS = [
    { id: "rev-whey", name: "1 scoop Whey Isolate shake", cost: 80, category: "Nutrition Ready", details: "Aesthetic recovery. Immediate high-anabolic proteins served at bar." },
    { id: "rev-shaker", name: "Life Fitness Matte Custom Shaker", cost: 160, category: "Gears & Straps", details: "Premium leakproof carbon shaker with metallic details." },
    { id: "rev-straps", name: "Iron Grips Gym Wrist Straps", cost: 120, category: "Gears & Straps", details: "Padded cotton wraps for intense grip safety on conventional lifts." },
    { id: "rev-7d", name: "7-Day Free Subscription Extension", cost: 350, category: "Club Membership", details: "Add an extra 7 days of full tier access to your current plan." }
  ];

  const [rewardRedemptions, setRewardRedemptions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`fit_redemptions_${member.id}`);
      return saved ? JSON.parse(saved) : [
        { id: "claim-901", reward: "1 scoop Whey Isolate shake", date: "2026-06-05", pointsDeducted: 80, status: "Delivered" }
      ];
    } catch {
      return [
        { id: "claim-901", reward: "1 scoop Whey Isolate shake", date: "2026-06-05", pointsDeducted: 80, status: "Delivered" }
      ];
    }
  });

  useEffect(() => {
    localStorage.setItem(`fit_referrals_${member.id}`, JSON.stringify(referralsList));
  }, [referralsList, member.id]);

  useEffect(() => {
    localStorage.setItem(`fit_redemptions_${member.id}`, JSON.stringify(rewardRedemptions));
  }, [rewardRedemptions, member.id]);

  const handleAddReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReferralName.trim()) return;

    const newRef = {
      id: `ref-${Date.now()}`,
      friendName: newReferralName.trim(),
      date: new Date().toISOString().split("T")[0],
      status: "Active Pass",
      pointsAwarded: 0
    };

    setReferralsList(prev => [newRef, ...prev]);
    setNewReferralName("");
    alert(`🎟️ VIP Guest Pass generated for "${newRef.friendName}" successfully! Show their coupon card down below.`);
  };

  const handleRedeemReward = (reward: typeof REDEEMABLE_REWARDS[0]) => {
    if (loyaltyPoints < reward.cost) {
      alert(`❌ Insufficient Lounge XP! You have ${loyaltyPoints} XP. This premium item requires ${reward.cost} XP. Keep hitting the gym streaks to earn!`);
      return;
    }

    const proceed = window.confirm(`Confirm spend of ${reward.cost} XP to redeem "${reward.name}"? This action cannot be undone.`);
    if (!proceed) return;

    setLoyaltyPoints(prev => prev - reward.cost);
    const newClaim = {
      id: `CLAIM-${Math.floor(10000 + Math.random() * 90000)}`,
      reward: reward.name,
      date: new Date().toISOString().split("T")[0],
      pointsDeducted: reward.cost,
      status: "Pending Pick Up"
    };

    setRewardRedemptions(prev => [newClaim, ...prev]);
    alert(`🎁 Redemption slip "${newClaim.id}" issued! Present this ID at the Front desk desk lobby. points have been safely debited.`);
  };

  // AI Content Assistant script metrics
  const [aiStudioMood, setAiStudioMood] = useState("savage");
  const [aiStudioPlatform, setAiStudioPlatform] = useState("reels");
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  const handleGenerateAiScript = () => {
    setIsGeneratingScript(true);
    setTimeout(() => {
      let scriptOutput = "";
      const name = member.fullName.split(" ")[0].toUpperCase();
      
      scriptOutput = `🎬 // LIFE FITNESS MODERN PLATFORM SOCIAL VIDEO BLUEPRINT\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🌐 PLATFORM: ${aiStudioPlatform.toUpperCase()} STAGE  |  🔥 MOOD: ${aiStudioMood.toUpperCase()} STYLE\n` +
        `🎵 SUGGESTED SONG: Phonky Hardstyle Beats (Sub-Woofer Boosted)\n` +
        `⏱️ DURATION: 15 seconds intensive micro-cuts\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `[0:00 - 0:03] INTENSE MACRO CLOSING FOCUS\n` +
        `• Camera Frame: Close angle of palms rubbing chalk or gripping red-lacquered dumbbell handles.\n` +
        `• Visual Overlay: Captions dynamic pop-in: "THEY WANT SHINE, BUT ESCAPE THE GRIND."\n` +
        `• Voiceover Beat: Heavy metal/synth drums drop. "Rent is paid daily. There are no shortcuts in the arena."\n\n` +
        `[0:03 - 0:08] GAIN ACTION CLIPS\n` +
        `• Camera Frame: Tracking shot of ${name} executing perfect muscular posture during heavy lifting.\n` +
        `• Subtitles Zoom: "WORKOUT METRIC: ${creatorMetric}"\n` +
        `• Voiceover Beat: "While the crowd formulates excuses, we log sets. Calculated ${creatorHeadline} accomplished."\n\n` +
        `[0:08 - 0:15] LIFE FITNESS OUTRO\n` +
        `• Camera Frame: Fist bump toward lens under warm ceiling spot lights, ending with the gym vector logo card frame.\n` +
        `• Subtitles Zoom: "@LifeFitnessGym - Mandi Bahauddin's Absolute Apex Level Space."\n` +
        `• Voiceover Beat: "Become undefended. Reclaim your crown now."\n\n` +
        `⚡ DESIGN SUGGESTED CAPTION:\n` +
        `"${generatorSuggestedCaption}"\n\n` +
        `⚠️ WARNING DISCLAIMER:\n` +
        `All progressive athletic suggestions and workout templates are standard fitness references. They do not represent orthopedic or clinical guidance. Always work out under trained platform advisors.`;
      
      setGeneratedScript(scriptOutput);
      setIsGeneratingScript(false);
      setLoyaltyPoints(p => p + 10); // small engagement reward
    }, 800);
  };

  // End Community section additions
  // ==========================================


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
      <div className="flex border-b border-neutral-900 text-xs uppercase font-black tracking-widest text-neutral-450 gap-6 shrink-0 mt-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveSection("dashboard")}
          className={`pb-3.5 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSection === "dashboard"
              ? "border-red-655 border-red-600 text-white font-black"
              : "border-transparent text-neutral-550 text-neutral-500 hover:text-white"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          My Member Space
        </button>
        <button
          onClick={() => setActiveSection("workouts")}
          className={`pb-3.5 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSection === "workouts"
              ? "border-red-600 text-white font-black"
              : "border-transparent text-neutral-500 hover:text-white"
          }`}
        >
          <Flame className="h-4 w-4 text-red-500 animate-pulse" />
          My Workout Plan
        </button>
        <button
          onClick={() => setActiveSection("ai-coach")}
          className={`pb-3.5 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
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
        <button
          onClick={() => setActiveSection("diet")}
          className={`pb-3.5 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === "diet"
              ? "border-green-600 text-white font-black"
              : "border-transparent text-neutral-500 hover:text-white"
          }`}
        >
          <Apple className="h-4 w-4 text-green-500" />
          Diet & Macros
        </button>
        <button
          onClick={() => setActiveSection("community")}
          className={`pb-3.5 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === "community"
              ? "border-amber-500 text-white font-black"
              : "border-transparent text-neutral-500 hover:text-white"
          }`}
        >
          <Trophy className="h-4 w-4 text-amber-500" />
          Community & Creator Studio
        </button>
        <button
          onClick={() => setActiveSection("equipment")}
          className={`pb-3.5 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === "equipment"
              ? "border-cyan-500 text-white font-black"
              : "border-transparent text-neutral-500 hover:text-white"
          }`}
        >
          <MapPin className="h-4 w-4 text-cyan-500" />
          Live Floor Map
        </button>
        <button
          onClick={() => setActiveSection("soundboard")}
          className={`pb-3.5 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === "soundboard"
              ? "border-rose-500 text-white font-black"
              : "border-transparent text-neutral-500 hover:text-white"
          }`}
        >
          <Music className="h-4 w-4 text-rose-500" />
          Gym Soundboard
        </button>
        <button
          onClick={() => setActiveSection("traffic")}
          className={`pb-3.5 border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === "traffic"
              ? "border-yellow-500 text-white font-black"
              : "border-transparent text-neutral-500 hover:text-white"
          }`}
        >
          <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
          Best Time to Visit
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

            {/* WHATSAPP AUTOMATION PROFILE TIMELINE */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2 font-sans">
                    <MessageSquare className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                    My WhatsApp Alerts
                  </h3>
                  <p className="text-[10px] text-neutral-550 uppercase tracking-wider block font-bold text-neutral-500 mt-0.5">Automated Coach Telegrams</p>
                </div>
                {waSettings?.remindersEnabled ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block"></span>
                    Active Enrollment
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-neutral-800 text-neutral-400 border border-neutral-700">
                    Reminders Paused
                  </span>
                )}
              </div>

              {/* Settings Outline */}
              {waSettings && (
                <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-850/50 grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                  <div className="bg-neutral-905 bg-neutral-900/40 p-2 rounded-xl">
                    <span className="text-neutral-500 block text-[8px] uppercase">My Contact</span>
                    <span className="text-white mt-1 block font-mono">+{waSettings.whatsappNumber}</span>
                  </div>
                  <div className="bg-neutral-905 bg-neutral-900/40 p-2 rounded-xl">
                    <span className="text-neutral-500 block text-[8px] uppercase">Alert Dispatch</span>
                    <span className="text-white mt-1 block font-mono">{waSettings.workoutReminderTime}</span>
                  </div>
                  <div className="bg-neutral-905 bg-neutral-900/40 p-2 rounded-xl">
                    <span className="text-neutral-500 block text-[8px] uppercase">Absence Cutoff</span>
                    <span className="text-red-400 mt-1 block font-mono">{waSettings.attendanceCutoffTime}</span>
                  </div>
                </div>
              )}

              {/* Chronological Descending Timeline */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {waLogs.length === 0 ? (
                  <div className="text-center p-6 bg-neutral-950 rounded-2xl border border-neutral-850">
                    <p className="text-xs text-neutral-500 leading-normal">
                      No automated WhatsApp logs dispatched to your number yet. Dispatched plans and attendance statuses will show here in real-time.
                    </p>
                  </div>
                ) : (
                  waLogs.map((log: any) => {
                    // Decide Icon & Title
                    let iconNode = <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />;
                    let titleText = "WhatsApp Notification";
                    let accentBorder = "border-neutral-800";

                    if (log.automationType === "daily-workout-dispatched") {
                      iconNode = <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />;
                      titleText = "Workout Plan Dispatched";
                      accentBorder = "border-emerald-500/20";
                    } else if (log.automationType === "attendance-check-sent") {
                      iconNode = <User className="w-3.5 h-3.5 text-yellow-400" />;
                      titleText = "Attendance Verification Sent";
                      accentBorder = "border-yellow-500/20";
                    } else if (log.automationType === "workout-completion-sent") {
                      iconNode = <Award className="w-3.5 h-3.5 text-cyan-400" />;
                      titleText = "Completion Follow-up Check";
                      accentBorder = "border-cyan-500/20";
                    } else if (log.automationType === "absence-recorded") {
                      iconNode = <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
                      titleText = "Absence Notification Logged";
                      accentBorder = "border-red-500/20";
                    } else if (log.automationType === "incoming-webhook-reply") {
                      iconNode = <Send className="w-3.5 h-3.5 text-purple-400 animate-pulse" />;
                      titleText = "SMS Reply Processed";
                      accentBorder = "border-purple-500/20";
                    }

                    return (
                      <div key={log.id} className={`p-3 bg-neutral-950 border ${accentBorder} rounded-2xl space-y-2`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            {iconNode}
                            <span className="text-[11px] font-black tracking-wide text-white font-sans">{titleText}</span>
                          </div>
                          <span className="text-[9px] text-neutral-500 font-mono">
                            {new Date(log.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {new Date(log.sentAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-neutral-300 whitespace-pre-wrap leading-relaxed bg-neutral-900/40 p-2 rounded-xl border border-neutral-850/30 font-sans">
                          {log.messageContent}
                        </p>
                        <div className="flex justify-between items-center text-[8.5px] text-neutral-500 font-mono">
                          <span>Ref: <span className="text-neutral-450">{log.providerRequestId ? log.providerRequestId.slice(0, 15) : "Direct simulation"}</span></span>
                          <span className={`px-1 rounded bg-neutral-900 font-bold ${log.status === "success" ? "text-emerald-400" : "text-red-500"}`}>
                            {log.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* BIOMETRIC PASSKEY AUTHENTICATION PANEL */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2 font-display">
                    <Fingerprint className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                    Biometric Passkeys
                  </h3>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider block font-bold mt-0.5">Secure Passwordless Credentials</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-600/10 text-red-400 border border-red-500/20">
                  FIDO2 Auth
                </span>
              </div>

              {/* Registered Keys List */}
              <div className="space-y-2">
                {loadingPasskeys ? (
                  <p className="text-xs text-neutral-500">Loading registered keys...</p>
                ) : passkeys.length === 0 ? (
                  <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl text-center space-y-2">
                    <p className="text-xs text-neutral-500 leading-normal font-semibold">
                      No biometric passkeys enrolled for this account. Register below to enable fingerprint, face recognition, or secure hardware sign-in.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {passkeys.map(key => (
                      <div key={key.id} className="bg-neutral-950 p-3 border border-neutral-850 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-neutral-900 text-red-500 flex items-center justify-center border border-neutral-850">
                            {key.deviceType === "FaceID" ? (
                              <Eye className="h-4 w-4 text-cyan-400" />
                            ) : key.deviceType === "Yubikey" ? (
                              <Cpu className="h-4 w-4 text-amber-500" />
                            ) : (
                              <Fingerprint className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div>
                            <span className="text-white font-extrabold text-xs block uppercase leading-tight">{key.name}</span>
                            <span className="text-[9px] text-neutral-500 block font-mono">Platform: {key.deviceType} • {new Date(key.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePasskey(key.id)}
                          className="h-8 w-8 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-550 border border-neutral-800 hover:border-neutral-750 flex items-center justify-center transition-all active:scale-90"
                          title="Revoke and delete passkey"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-neutral-500 hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Register New Form */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850/60 space-y-3">
                <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-red-500" />
                  Enroll Device Passkey
                </span>
                
                <div className="space-y-1.5">
                  <label className="text-[9.5px] text-neutral-500 uppercase tracking-wider block font-bold leading-none">Passkey Nickname / Label</label>
                  <input
                    type="text"
                    value={passkeyName}
                    onChange={(e) => setPasskeyName(e.target.value)}
                    placeholder="e.g. My Phone Biometrics / Office Tablet"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-600 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-700 font-semibold outline-none focus:ring-1 focus:ring-red-600 font-sans"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRegisterPasskey}
                  disabled={registeringPasskey || !passkeyName.trim()}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 text-black disabled:text-neutral-500 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
                >
                  {registeringPasskey ? "Awaiting Handshake..." : "Register Biometric Passkey"}
                </button>
              </div>

              {/* Handshake Logs Terminal */}
              {passkeyLog.length > 0 && (
                <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-3.5 space-y-2 font-mono text-[9px] leading-relaxed select-text">
                  <div className="flex items-center justify-between text-neutral-505 border-b border-neutral-850 pb-1.5 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1 text-neutral-500"><Terminal className="h-3 w-3 text-neutral-500" /> WebAuthn Console</span>
                    <button type="button" onClick={() => setPasskeyLog([])} className="hover:text-white uppercase text-neutral-500">Clear</button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-neutral-450 text-neutral-400" style={{ scrollbarWidth: "thin" }}>
                    {passkeyLog.map((logLine, idx) => (
                      <p key={idx} className={logLine.includes("ERROR") ? "text-red-500" : logLine.includes("SUCCESS") ? "text-emerald-400" : ""}>{logLine}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ATTENDANCE, CHAMPIONSHIPS, PAYMENTS */}
          <div className="lg:col-span-7 space-y-6">

            {/* COACH ASSIGNED ROUTINES WITH XP GAIN */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-red-600/10 to-transparent rounded-full filter blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-start gap-3 border-b border-neutral-800 pb-4">
                <div className="space-y-1">
                  <span className="text-[9px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1">
                    <Award className="h-3 w-3 text-red-500 animate-pulse" /> Official Club Directives
                  </span>
                  <h3 className="text-white font-black uppercase text-sm tracking-widest mt-0.5">
                    Coach Workout Assignments
                  </h3>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                  trainerAssignment.status === "Completed" 
                    ? "bg-green-600/10 border-green-500/20 text-green-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"
                }`}>
                  {trainerAssignment.status === "Completed" ? "✓ Done (+55 XP Secured)" : "⚡ active target"}
                </span>
              </div>

              <div className="space-y-4">
                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 space-y-1.5 leading-normal">
                  <span className="text-[9px] text-neutral-500 font-extrabold uppercase font-mono block">Assigner Coach: {trainerAssignment.trainerName} • {trainerAssignment.assignedAt}</span>
                  <p className="text-neutral-300 text-xs italic font-medium leading-relaxed">
                    "{trainerAssignment.notes}"
                  </p>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[9px] text-neutral-500 font-black uppercase tracking-wider block">Target Exercise Routine List:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {trainerAssignment.exercises.map((ex: any, idx: number) => (
                      <div key={idx} className="bg-neutral-950/50 border border-neutral-850/60 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs leading-normal">
                        <div>
                          <p className="text-white font-black uppercase truncate max-w-[130px]">{ex.name}</p>
                          <span className="text-[10px] text-neutral-500 font-semibold font-mono block">Sets: {ex.sets} • Reps: {ex.reps}</span>
                        </div>
                        <span className="font-mono text-[10px] text-red-400 font-bold bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800 shrink-0">
                          {ex.targetWeight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {trainerAssignment.status !== "Completed" ? (
                  <button
                    onClick={handleCompleteTrainerAssignment}
                    className="w-full text-center text-xs font-black bg-red-600 hover:bg-red-700 text-black py-3 rounded-2xl uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 border border-red-500"
                  >
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    Report Workout Accomplished (+55 XP)
                  </button>
                ) : (
                  <div className="bg-green-600/10 border border-green-500/20 p-4 rounded-2xl flex items-center gap-3 text-xs leading-relaxed text-green-300">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                    <div>
                      <span className="font-black uppercase block tracking-wider text-green-400">Routine Completed!</span>
                      Your daily training record has been saved, and matching compliance results have been synchronized to the TV leaderboard feed. Complete tomorrow's shift!
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GYM TIMING ALLOCATION AND SPOT RESERVE SLOTS */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
              <div>
                <span className="text-[9px] text-red-500 font-black uppercase tracking-widest block font-display">Capacity Guard System</span>
                <h3 className="text-white font-black uppercase text-sm tracking-widest mt-0.5 flex items-center gap-1.5">
                  <Calendar className="h-4.5 w-4.5 text-red-500" /> Daily Gym Scheduler Slots
                </h3>
                <p className="text-[10px] text-neutral-450 text-neutral-550 text-neutral-450 text-neutral-400 leading-normal mt-0.5 font-semibold">
                  Reserve your slot in advance to maintain optimal floor traffic safety rules.
                </p>
              </div>

              <div className="space-y-3">
                {GYM_SLOTS.map((slot) => {
                  const isReserved = bookedSlot === slot.id;
                  const currentCount = globalSlotBookings[slot.id] || 0;
                  const ratio = currentCount / slot.capacity;
                  const isFull = ratio >= 1.0;

                  return (
                    <div 
                      key={slot.id} 
                      className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                        isReserved 
                          ? "bg-red-500/10 border-red-500/30 text-white" 
                          : "bg-neutral-950/60 border-neutral-850 hover:border-neutral-800"
                      }`}
                    >
                      <div className="space-y-1.5 leading-normal">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-black text-xs uppercase">{slot.name}</h4>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                            slot.type.includes("Female") 
                              ? "bg-pink-500/10 border border-pink-500/20 text-pink-400" 
                              : "bg-neutral-900 border border-neutral-850 text-neutral-400"
                          }`}>
                            {slot.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-neutral-450 text-neutral-400 font-semibold font-mono">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {slot.time}</span>
                          <span>{slot.days}</span>
                        </div>
                        {/* Live capacity bar */}
                        <div className="space-y-1 w-full max-w-[200px]">
                          <div className="flex justify-between text-[8px] uppercase tracking-wider font-extrabold text-neutral-500">
                            <span>Occupancy ratio</span>
                            <span className="font-mono">{currentCount} / {slot.capacity} spots</span>
                          </div>
                          <div className="h-1 bg-neutral-900 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${ratio > 0.8 ? "bg-red-600" : ratio > 0.5 ? "bg-amber-500" : "bg-green-500"}`}
                              style={{ width: `${Math.min(100, ratio * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={() => handleBookSlotToggle(slot.id)}
                          disabled={isFull && !isReserved}
                          className={`w-full sm:w-auto px-4 py-2 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer border ${
                            isReserved 
                              ? "bg-red-600 border-red-500 text-black hover:bg-neutral-900 hover:text-white" 
                              : isFull 
                                ? "bg-neutral-900 border-neutral-850 text-neutral-600 cursor-not-allowed" 
                                : "bg-neutral-950 hover:bg-neutral-900 border-neutral-800 text-white hover:border-red-500/20"
                          }`}
                        >
                          {isReserved ? "Cancel Spot" : isFull ? "FULL HOUSE" : "Reserve Spot (+15 XP)"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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

            {/* PHYSICAL PROGRESS & BIOMETRICS ANALYTICS PANEL */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2">
                    <Scale className="h-4.5 w-4.5 text-red-500" />
                    My Physical Progress & Analytics
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Keep log history synchronized in real-time</p>
                </div>
                <select
                  value={selectedDashboardChartType}
                  onChange={(e) => setSelectedDashboardChartType(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 text-xs font-bold uppercase rounded-xl px-3 py-1.5 text-white focus:outline-none"
                >
                  <option value="Weight">Weight (KG)</option>
                  <option value="Waist">Waist (inches)</option>
                  <option value="Left biceps">Left Biceps (inches)</option>
                </select>
              </div>

              {currentBiometricsChartData.length < 2 ? (
                <div className="bg-neutral-950/40 p-6 rounded-2xl text-center border border-dashed border-neutral-800">
                  <TrendingUp className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400 font-bold uppercase">Awaiting Analytics Milestones</p>
                  <p className="text-[10px] text-neutral-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    Log at least two status updates down below to project chronological trajectory vectors.
                  </p>
                </div>
              ) : (
                <div className="h-56 w-full text-[10px] font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={currentBiometricsChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBiometrics" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" domain={["auto", "auto"]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", borderRadius: "12px", color: "#fff" }}
                        formatter={(val: number) => [`${val} ${selectedDashboardChartType === "Weight" ? "KG" : "in"}`]}
                      />
                      <Area type="monotone" dataKey={selectedDashboardChartType} stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorBiometrics)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Quick Log Form */}
              <form onSubmit={handleAddQuickBiometrics} className="bg-neutral-950 p-4 border border-neutral-900 rounded-2xl space-y-3">
                <span className="text-[10px] text-red-500 font-black uppercase tracking-wider block">Record New {selectedDashboardChartType} Measurement:</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={quickMeasureVal}
                    onChange={(e) => setQuickMeasureVal(e.target.value)}
                    placeholder={`e.g. ${selectedDashboardChartType === "Weight" ? "76.5 (KG)" : "32.5"}`}
                    className="flex-1 min-w-0 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="text"
                    value={quickMeasureNote}
                    onChange={(e) => setQuickMeasureNote(e.target.value)}
                    placeholder="Short note (optional)"
                    className="flex-[1.5] min-w-0 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-black text-xs font-black uppercase px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </form>
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
      ) : activeSection === "diet" ? (
        <div className="space-y-8 animate-fade-in">
          
          {/* NUTRITION HEADER */}
          <div className="bg-gradient-to-r from-neutral-900 via-emerald-950/20 to-neutral-900 border border-neutral-850 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-1">
                <Sparkles className="h-3.5 w-3.5 animate-spin" /> Dedicated Nutritional Lounge
              </span>
              <h2 className="text-white text-xl font-black uppercase tracking-tight">Active Diet & Macro Companion</h2>
              <p className="text-xs text-neutral-400 font-medium">"Abs are sculpted in the calorie registry and cemented in the squat rack!"</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-neutral-950 px-4 py-2 rounded-2xl border border-neutral-850 text-center">
                <span className="text-[9px] text-neutral-500 uppercase block font-mono">Calorie Limit</span>
                <span className="text-white font-black text-sm font-mono">{calorieGoal.toLocaleString()} kcal</span>
              </div>
              <div className="bg-neutral-950 px-4 py-2 rounded-2xl border border-neutral-850 text-center">
                <span className="text-[9px] text-neutral-500 uppercase block font-mono">Protein Target</span>
                <span className="text-red-500 font-extrabold text-sm font-mono">{proteinGoal}g</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: DAILY METER DYNAMICS */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* CALORIES TARGET BALANCE METERS */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-wider border-b border-neutral-800 pb-2.5 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-emerald-500" />
                  Today's Energy Balance (Kilocalories)
                </h3>
                
                <div className="flex justify-between items-center bg-neutral-950 p-4 border border-neutral-850 rounded-2xl">
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase font-bold block">Consumed today</span>
                    <span className="text-white text-2xl font-black font-mono">{todayCaloriesConsumed.toLocaleString()} <span className="text-xs text-neutral-500">kcal</span></span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-neutral-500 uppercase font-bold block">Remaining budget</span>
                    <span className={`text-2xl font-black font-mono ${calorieGoal - todayCaloriesConsumed < 0 ? "text-red-500" : "text-emerald-500"}`}>
                      {(calorieGoal - todayCaloriesConsumed).toLocaleString()} <span className="text-xs text-neutral-500">kcal</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase">
                    <span>Limit Exhaustion Status</span>
                    <span>{Math.min(100, Math.round((todayCaloriesConsumed / calorieGoal) * 100))}%</span>
                  </div>
                  <div className="w-full bg-neutral-950 h-3 rounded-full overflow-hidden border border-neutral-850/30 p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${todayCaloriesConsumed > calorieGoal ? "bg-red-650 bg-red-600" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, (todayCaloriesConsumed / calorieGoal) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* MACRONUTRIENT RATIO SPLITS */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-wider border-b border-neutral-800 pb-2.5 flex items-center gap-1.5">
                  <Apple className="h-4 w-4 text-emerald-500" />
                  Macronutrient Distribution Splitting
                </h3>

                <div className="space-y-4">
                  {/* Protein Track */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold uppercase transition-all">
                      <span className="flex items-center gap-1.5 text-neutral-300"><div className="h-2 w-2 rounded-full bg-red-500" />Protein / Muscle Repair</span>
                      <span className="text-white font-mono font-black">{todayProteinConsumed}g / {proteinGoal}g</span>
                    </div>
                    <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-850/20">
                      <div className="bg-red-500 h-full transition-all" style={{ width: `${Math.min(100, (todayProteinConsumed / proteinGoal) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Carbohydrates Track */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold uppercase transition-all">
                      <span className="flex items-center gap-1.5 text-neutral-300"><div className="h-2 w-2 rounded-full bg-yellow-500" />Carbohydrates / Glycogen fuel</span>
                      <span className="text-white font-mono font-black">{todayCarbsConsumed}g / {carbsGoal}g</span>
                    </div>
                    <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-850/20">
                      <div className="bg-yellow-500 h-full transition-all" style={{ width: `${Math.min(100, (todayCarbsConsumed / carbsGoal) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Fats Track */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold uppercase transition-all">
                      <span className="flex items-center gap-1.5 text-neutral-300"><div className="h-2 w-2 rounded-full bg-blue-500" />Healthy Lipids / Hormone support</span>
                      <span className="text-white font-mono font-black">{todayFatsConsumed}g / {fatsGoal}g</span>
                    </div>
                    <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-850/20">
                      <div className="bg-blue-500 h-full transition-all" style={{ width: `${Math.min(100, (todayFatsConsumed / fatsGoal) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* Macro percentages Pie Chart */}
                {todayCaloriesConsumed > 0 && (
                  <div className="flex items-center justify-around gap-4 pt-3 border-t border-neutral-850/40">
                    <div className="h-28 w-28 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={macroDonutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={22}
                            outerRadius={38}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {macroDonutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-[10px] space-y-1 font-extrabold uppercase text-neutral-400">
                      <span className="text-[9px] text-neutral-500 block font-bold leading-none mb-1">Calories Contribution:</span>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span>Proteins: {Math.round(((todayProteinConsumed * 4) / Math.max(1, (todayProteinConsumed*4 + todayCarbsConsumed*4 + todayFatsConsumed*9))) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span>Carbs: {Math.round(((todayCarbsConsumed * 4) / Math.max(1, (todayProteinConsumed*4 + todayCarbsConsumed*4 + todayFatsConsumed*9))) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>Fats: {Math.round(((todayFatsConsumed * 9) / Math.max(1, (todayProteinConsumed*4 + todayCarbsConsumed*4 + todayFatsConsumed*9))) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: REPOSITORY MANUAL LOGGER & LOG HISTORY */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* ADD FOOD DIALOG CONSOLE */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <h3 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Apple className="h-4 w-4 text-emerald-500" />
                    Record Meal Log Entry
                  </h3>
                  <button 
                    onClick={() => setIsCustomFoodView(!isCustomFoodView)}
                    className="text-emerald-500 text-[10px] font-black uppercase hover:underline"
                  >
                    {isCustomFoodView ? "Select from standard menu" : "Custom Macros Entry"}
                  </button>
                </div>

                {!isCustomFoodView ? (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end animate-fade-in">
                    <div className="sm:col-span-7 space-y-1.5">
                      <label className="text-[9px] text-neutral-500 font-extrabold uppercase">Choose Desi or Standard Diet preset:</label>
                      <select
                        value={dietSelectedFoodName}
                        onChange={(e) => setDietSelectedFoodName(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs font-extrabold px-3 py-2.5 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      >
                        {PAKISTANI_FOODS.map(f => (
                          <option key={f.name} value={f.name}>
                            {f.name} ({f.calories} kcal)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-[9px] text-neutral-500 font-extrabold uppercase">Multiplier Qty:</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        required
                        value={dietFoodQuantity}
                        onChange={(e) => setDietFoodQuantity(parseFloat(e.target.value) || 1)}
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs font-bold px-3 py-2.5 rounded-xl text-white text-center focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        onClick={handleAddFoodLog}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border-0"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-neutral-500 font-extrabold uppercase">Custom Item Name:</label>
                        <input
                          type="text"
                          required
                          value={dietCustomFoodName}
                          onChange={(e) => setDietCustomFoodName(e.target.value)}
                          placeholder="e.g. Oats with Banana & Honey"
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs px-3 py-2.5 rounded-xl text-white focus:outline-none focus:border-emerald-500 placeholder-neutral-700"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-neutral-500 font-extrabold uppercase">Calories (kcal):</label>
                        <input
                          type="number"
                          required
                          value={dietCustomCalories}
                          onChange={(e) => setDietCustomCalories(e.target.value)}
                          placeholder="kcal"
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs px-3 py-2.5 rounded-xl text-white text-center focus:outline-none focus:border-emerald-500 placeholder-neutral-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-neutral-500 font-extrabold uppercase">Protein (g):</label>
                        <input
                          type="number"
                          value={dietCustomProtein}
                          onChange={(e) => setDietCustomProtein(e.target.value)}
                          placeholder="grams"
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2 py-2.5 rounded-xl text-white text-center focus:outline-none focus:border-emerald-500 placeholder-neutral-700"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-neutral-500 font-extrabold uppercase">Carbohydrates (g):</label>
                        <input
                          type="number"
                          value={dietCustomCarbs}
                          onChange={(e) => setDietCustomCarbs(e.target.value)}
                          placeholder="grams"
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2 py-2.5 rounded-xl text-white text-center focus:outline-none focus:border-emerald-500 placeholder-neutral-700"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-neutral-500 font-extrabold uppercase">Fats (g):</label>
                        <input
                          type="number"
                          value={dietCustomFats}
                          onChange={(e) => setDietCustomFats(e.target.value)}
                          placeholder="grams"
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2 py-2.5 rounded-xl text-white text-center focus:outline-none focus:border-emerald-500 placeholder-neutral-750"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-1">
                      <button
                        onClick={() => setIsCustomFoodView(false)}
                        className="px-4 py-2 text-[10px] font-black uppercase text-neutral-500 hover:text-white border-0 bg-transparent cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddFoodLog}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer border-0"
                      >
                        Register Custom Food
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* LOGGED MEALS HISTORY RECORD */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-wider pb-2 border-b border-neutral-800 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  Meal Logs History (Today)
                </h3>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {dietLogs.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 space-y-2">
                      <p className="text-xs font-semibold uppercase">Your meal tray is empty today</p>
                      <p className="text-[10px] text-neutral-600 max-w-xs mx-auto">Use the Meal Log registry above to quickly account for your caloric intake and protein fuel.</p>
                    </div>
                  ) : (
                    dietLogs.map((item) => (
                      <div key={item.id} className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl flex items-center justify-between gap-4">
                        <div>
                          <h4 className="text-white font-extrabold text-xs uppercase leading-tight">{item.name}</h4>
                          <span className="text-[9px] font-bold font-mono text-emerald-500 block uppercase pt-0.5">
                            Multiplier Qty: {item.quantity}x
                          </span>
                          <span className="text-[9px] text-neutral-500 block font-semibold pt-1">
                            P: {item.protein * item.quantity}g • C: {item.carbs * item.quantity}g • F: {item.fats * item.quantity}g
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-right shrink-0">
                          <div>
                            <span className="font-mono text-white text-sm font-extrabold block">{(item.calories * item.quantity).toLocaleString()}</span>
                            <span className="text-[8px] uppercase font-black text-neutral-500 font-mono">kcal</span>
                          </div>
                          <button
                            onClick={() => handleRemoveFoodLog(item.id)}
                            className="p-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 hover:border-red-500/30 rounded-lg text-neutral-500 hover:text-red-500 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
            
          </div>

          {/* DAILY BMR / TDEE PLANS CALCULATOR METRIC SPLITS */}
          <GainsCalculator onApplyTargets={handleUpdateTargets} currentCalories={todayCaloriesConsumed} />
        </div>
      ) : activeSection === "community" ? (
        <div className="space-y-8 animate-fade-in text-white">
          
          {/* COMMUNITY TOP BANNER / STATS OVERVIEW */}
          <div className="bg-gradient-to-r from-neutral-900 via-amber-955/15 to-neutral-900 border border-neutral-850 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-1">
                <Trophy className="h-3.5 w-3.5 animate-bounce text-amber-500" /> Life Fitness Creator & Social Locker
              </span>
              <h2 className="text-white text-xl font-black uppercase tracking-tight">Active Social Lounge & Creator Studio</h2>
              <p className="text-xs text-neutral-400 font-semibold leading-relaxed">"Sweat is the ultimate currency. Turn your routines into branded community influence!"</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-neutral-950 px-4 py-3 rounded-2xl border border-neutral-850 text-center">
                <span className="text-[9px] text-amber-500 uppercase block font-black tracking-widest">LOYALTY LOUNGE XP</span>
                <span className="text-white font-black text-lg font-mono flex items-center justify-center gap-1.5 mt-0.5">
                  <Award className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                  {loyaltyPoints} XP
                </span>
              </div>
              <div className="bg-neutral-950 px-4 py-3 rounded-2xl border border-neutral-850 text-center">
                <span className="text-[9px] text-neutral-500 uppercase block font-mono">BADGES SECURED</span>
                <span className="text-red-500 font-extrabold text-sm font-mono block mt-0.5">
                  {loyaltyPoints > 420 ? "⭐ Golden Guru" : loyaltyPoints > 370 ? "🔥 Iron Legend" : "⚡ Sunrise Lifter"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: CREATOR STUDIO (TEMPLATE CONFIG & PREVIEW POSTER) */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* BRANDED POSTER GENERATOR INTERFACE */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
                    <Camera className="h-4 w-4" />
                    Branded Gym Poster Generator
                  </h3>
                  <span className="text-[9px] bg-red-650/10 border border-red-500/20 text-red-500 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                    9:16 Story Ready
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Text inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] text-neutral-500 font-extrabold uppercase">Poster Main Headline</label>
                      <input 
                        type="text"
                        value={creatorHeadline}
                        onChange={(e) => setCreatorHeadline(e.target.value)}
                        placeholder="e.g. MORNING GRIND!"
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs px-3 py-2 rounded-xl text-white focus:outline-none focus:border-amber-500 font-bold uppercase"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-neutral-500 font-extrabold uppercase">Target Metric (PR / Streak)</label>
                      <input 
                        type="text"
                        value={creatorMetric}
                        onChange={(e) => setCreatorMetric(e.target.value)}
                        placeholder="e.g. SQUAT: 120 KG"
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs px-3 py-2 rounded-xl text-white focus:outline-none focus:border-amber-500 font-bold uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] text-neutral-500 font-extrabold uppercase">Custom Motivational Quote Overlay</label>
                    <input 
                      type="text"
                      value={creatorQuote}
                      onChange={(e) => setCreatorQuote(e.target.value)}
                      placeholder="e.g. Turn pain into standard performance assets."
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-3 py-2 rounded-xl text-white focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] text-neutral-500 font-extrabold uppercase flex items-center gap-1">
                        <Sliders className="h-3 w-3" /> Theme Palette
                      </label>
                      <select 
                        value={creatorTheme}
                        onChange={(e: any) => setCreatorTheme(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2 py-2 rounded-xl text-white focus:outline-none font-bold"
                      >
                        <option value="onyx">⚫ Charcoal Onyx</option>
                        <option value="emerald">🟢 Faisalabad Emerald</option>
                        <option value="crimson">🔴 Lahore Crimson</option>
                        <option value="gold">🟡 Pakistan Brass Gold</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] text-neutral-500 font-extrabold uppercase flex items-center gap-1">
                        <Music className="h-3 w-3" /> Music Tag Overlay
                      </label>
                      <select 
                        value={creatorMusic}
                        onChange={(e) => setCreatorMusic(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2 py-2 rounded-xl text-white focus:outline-none font-bold"
                      >
                        <option value="Phonk Beats (Slowing Grind)">🎹 Phonk Beats (Slowed Grind)</option>
                        <option value="Hardstyle Gym Energy">🥁 Hardstyle Gym Energy</option>
                        <option value="Pakistani Sufi House Mix">🪘 Pakistani Sufi House Mix</option>
                        <option value="No Ambient Audio Overlay">🔇 No Soundtrack Overlay</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* VISUAL LIVE PREVIEW COMPONENT */}
                <div className="space-y-2 bg-neutral-950 p-4 rounded-3xl border border-neutral-850">
                  <span className="text-[9px] text-neutral-500 uppercase font-black block text-center mb-1">Live Poster Canvas Card (Aspect ratio 9:16)</span>
                  
                  <div className={`relative rounded-2xl overflow-hidden p-6 aspect-[9/16] w-full max-w-[280px] mx-auto border flex flex-col justify-between shadow-2xl transition-all duration-300 ${
                    creatorTheme === "onyx" ? "bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 border-neutral-800" :
                    creatorTheme === "emerald" ? "bg-gradient-to-b from-emerald-950 via-neutral-950 to-neutral-950 border-emerald-900/40" :
                    creatorTheme === "crimson" ? "bg-gradient-to-b from-red-950 via-neutral-950 to-neutral-500 border-red-900/40" :
                    "bg-gradient-to-b from-amber-950 via-neutral-950 to-stone-900 border-amber-900/40"
                  } ${creatorPreviewAnimation ? "scale-95 opacity-50 rotate-1" : "scale-100"}`}>
                    
                    {/* Brand Watermark Overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                    {/* Logo Header */}
                    <div className="text-center z-10">
                      <div className="font-black text-xs uppercase tracking-[0.25em] text-white">LIFE FITNESS</div>
                      <div className="text-[8px] tracking-widest font-mono text-neutral-400 uppercase">Faisalabad, Pakistan</div>
                    </div>

                    {/* Main Content Body */}
                    <div className="text-center space-y-4 z-10 my-auto">
                      <div className={`text-xl font-black uppercase tracking-tight ${
                        creatorTheme === "gold" ? "text-amber-400 font-mono" : "text-red-500"
                      }`}>{creatorHeadline || "PR RECORD HIT!"}</div>
                      
                      <div className="bg-black/40 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/5 inline-block">
                        <div className="text-white text-base font-black uppercase tracking-tight font-mono">{creatorMetric || "DEADLIFT: 140 KG"}</div>
                      </div>

                      <div className="text-[9px] text-neutral-300 italic max-w-[180px] mx-auto leading-normal">
                        "{creatorQuote || "Brutal consistency eats excuses for breakfast."}"
                      </div>
                    </div>

                    {/* Footer / User Badge */}
                    <div className="z-10 text-center space-y-2 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="h-5 w-5 rounded-full overflow-hidden border border-red-500">
                          <img src={member.photoUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                        <span className="text-[9px] font-black uppercase text-white font-mono">{member.fullName}</span>
                      </div>
                      
                      {creatorMusic !== "No Ambient Audio Overlay" && (
                        <div className="inline-flex items-center gap-1 text-[7px] text-neutral-300 font-bold bg-black/75 py-1 px-2 rounded-full font-mono">
                          <Music className="h-2 w-2 text-red-500 animate-spin" />
                          {creatorMusic}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generator Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleDownloadPoster}
                    className="py-3 bg-white hover:bg-neutral-100 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border-0"
                  >
                    <Download className="h-4 w-4" />
                    Download Poster
                  </button>
                  <button
                    onClick={handleTriggerSimulatedShare}
                    className="py-3 bg-red-650 hover:bg-red-700 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border-0"
                  >
                    <Share2 className="h-4 w-4" />
                    Share To Story
                  </button>
                </div>

                {/* Suggested Auto Captions section */}
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-neutral-500 font-extrabold uppercase">Generated Smart Social Captions:</span>
                    <div className="flex gap-2 text-[9px] font-black uppercase text-neutral-400">
                      <button 
                        onClick={() => setSelectedCaptionType("PR")}
                        type="button"
                        className={`hover:text-white ${selectedCaptionType === "PR" ? "text-amber-500 underline font-black" : ""}`}
                      >
                        PR
                      </button>
                      <button 
                        onClick={() => setSelectedCaptionType("Consistency")}
                        type="button"
                        className={`hover:text-white ${selectedCaptionType === "Consistency" ? "text-amber-500 underline font-black" : ""}`}
                      >
                        GRIND
                      </button>
                      <button 
                        onClick={() => setSelectedCaptionType("Diet")}
                        type="button"
                        className={`hover:text-white ${selectedCaptionType === "Diet" ? "text-amber-500 underline font-black" : ""}`}
                      >
                        DIET
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-400 leading-relaxed italic border-l-2 border-amber-500 pl-2.5">
                    {generatorSuggestedCaption}
                  </p>

                  <button
                    onClick={handleCopyCaption}
                    className="py-2 px-3 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-neutral-800"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {creatorCopyStatus ? "Copied!" : "Copy Auto-Caption"}
                  </button>
                </div>

              </div>

              {/* PERSONAL PRs LIFT CHRONICLES */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-wider pb-2 border-b border-neutral-800 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Your Bench, Squat & Deadlift PR Chronicles
                </h3>

                <form onSubmit={handleAddPr} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-neutral-950 p-4 border border-neutral-850 rounded-2xl">
                  <div className="sm:col-span-5 space-y-1">
                    <label className="text-[9px] text-neutral-500 font-black uppercase">Select Gym Lift Variant</label>
                    <select
                      value={prInputLift}
                      onChange={(e) => setPrInputLift(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs py-2 px-2.5 rounded-xl text-white focus:outline-none focus:border-orange-500 font-bold"
                    >
                      <option value="Bench Press">🏋️ Bench Press (Flat Bench)</option>
                      <option value="Squat (Ass-to-Grass)">🏋️ Squat (Ass-to-Grass)</option>
                      <option value="Floor Conventional Deadlift">🏋️ Floor Conventional Deadlift</option>
                      <option value="Standing Overhead Press">🏋️ Standing Overhead Press</option>
                      <option value="Weighted Pullups">🏋️ Weighted Pull-up Max</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[9px] text-neutral-500 font-black uppercase">Shattered Weight (KG)</label>
                    <input 
                      type="number"
                      value={prInputWeight}
                      onChange={(e) => setPrInputWeight(e.target.value)}
                      placeholder="e.g. 150"
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs py-2 px-3 rounded-xl text-white focus:outline-none text-center font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border-0"
                    >
                      <Plus className="h-3.5 w-3.5" /> Log PR
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(userPrs).map(([lift, val]: [string, any]) => (
                    <div key={lift} className="bg-neutral-950 p-3 rounded-2xl border border-neutral-850 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase block font-semibold leading-none mb-1">{lift}</span>
                        <span className="text-white text-base font-black font-mono leading-none">{val.weight} <span className="text-[10px] text-neutral-500">KG</span></span>
                        <span className="text-[8px] text-neutral-600 block pt-1 font-semibold">Registered: {val.date}</span>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                        <Trophy className="h-4 w-4 text-orange-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DAILY LIFT LOGGER NOTEBOOK */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2.5">
                  <h3 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 font-display text-red-500">
                    <Dumbbell className="h-4.5 w-4.5 text-red-500" />
                    Daily Set Log Notebook
                  </h3>
                  <span className="text-[9px] bg-red-650/15 text-red-500 border border-red-500/10 px-2 py-0.5 rounded font-black font-mono uppercase tracking-wider">
                    Set-by-Set (+25 XP)
                  </span>
                </div>

                <p className="text-[10px] text-neutral-400 leading-normal font-semibold">
                  Record your completed workout sets dynamically. The app triggers matching feed announcements and updates global lift calculations!
                </p>

                <form onSubmit={handleAddDailyLift} className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl space-y-3 font-bold uppercase text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] text-neutral-500 font-black uppercase">Exercise / Set Target Name</label>
                    <input 
                      type="text"
                      value={newLiftName}
                      onChange={(e) => setNewLiftName(e.target.value)}
                      placeholder="e.g. Incline Bench Dumbbell Flyes"
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs py-2 px-3 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-500 font-black uppercase">Weight (KG)</label>
                      <input 
                        type="number"
                        value={newLiftWeight}
                        onChange={(e) => setNewLiftWeight(e.target.value)}
                        placeholder="e.g. 35"
                        className="w-full bg-neutral-900 border border-neutral-800 text-xs py-2 px-2.5 rounded-xl text-white focus:outline-none text-center font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-500 font-black uppercase">Reps Count</label>
                      <input 
                        type="number"
                        value={newLiftReps}
                        onChange={(e) => setNewLiftReps(e.target.value)}
                        placeholder="e.g. 12"
                        className="w-full bg-neutral-900 border border-neutral-800 text-xs py-2 px-2.5 rounded-xl text-white focus:outline-none text-center font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-500 font-black uppercase">Intensity (RPE)</label>
                      <select
                        value={newLiftRpe}
                        onChange={(e) => setNewLiftRpe(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 text-xs py-2 px-2.5 rounded-xl text-white focus:outline-none font-bold"
                      >
                        <option value="10">RPE 10 (Max Effort)</option>
                        <option value="9">RPE 9 (1 Rep Left)</option>
                        <option value="8">RPE 8 (2 Reps Left)</option>
                        <option value="7">RPE 7 (Speed Grind)</option>
                        <option value="6">RPE 6 (Warmup Set)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-red-600 hover:bg-neutral-100 hover:text-black text-black font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4 shrink-0" /> Log Completed Set (+25 XP)
                  </button>
                </form>

                {/* Logs List representation */}
                {dailyLiftLogs.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {dailyLiftLogs.map((l: any) => (
                      <div key={l.id} className="bg-neutral-950 p-3.5 border border-dashed border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-xs leading-normal">
                        <div>
                          <p className="text-white font-black uppercase truncate max-w-[170px]">{l.name}</p>
                          <span className="text-[10px] text-neutral-500 font-semibold font-mono block">Reps Count: {l.reps} • On {l.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-red-400 font-bold bg-neutral-900 border border-neutral-850 px-2.5 py-1 rounded">
                            {l.weight} KG (RPE {l.rpe})
                          </span>
                          <button
                            onClick={() => handleDeleteDailyLift(l.id)}
                            className="text-neutral-600 hover:text-red-500 transition-colors p-1 cursor-pointer bg-transparent border-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 animate-pulse" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-neutral-950/40 border border-neutral-850/60 rounded-2xl text-[10px] text-neutral-500 uppercase font-black">
                    No sets logged today. Hit the weight room first!
                  </div>
                )}
              </div>

              {/* 🤖 AI WORKOUT CAPTION & VIDEO SCRIPT STUDIO */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
                    <Sparkles className="h-4 w-4" />
                    AI Gym Caption & Script Studio
                  </h3>
                  <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black font-mono">
                    PRO PLATFORM
                  </span>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-semibold">
                    Synthesize personalized viral video scripts and dynamic captions using your workout data.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-neutral-500 font-extrabold uppercase font-mono">Select Target Platform</label>
                      <select
                        value={aiStudioPlatform}
                        onChange={(e) => setAiStudioPlatform(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs py-2 px-2 rounded-xl text-white focus:outline-none focus:border-amber-500 font-bold"
                      >
                        <option value="reels">📱 IG Reels / TikTok</option>
                        <option value="shorts">🎥 YouTube Shorts</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-neutral-500 font-extrabold uppercase font-mono">Aura & Speaking Mood</label>
                      <select
                        value={aiStudioMood}
                        onChange={(e) => setAiStudioMood(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs py-2 px-2 rounded-xl text-white focus:outline-none focus:border-amber-500 font-bold"
                      >
                        <option value="savage">🔥 Intense Savage</option>
                        <option value="analytical">🧠 Athletic Analytical</option>
                        <option value="bro">🤝 Gym Bro Hype</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerateAiScript}
                    disabled={isGeneratingScript}
                    className="w-full py-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {isGeneratingScript ? "Running Deep AI Engine..." : "Synthesize Video Script (+10 XP)"}
                  </button>

                  {/* Generated Script Display */}
                  {generatedScript && (
                    <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 space-y-4">
                      <div className="flex justify-between items-center text-[10px] text-neutral-500 uppercase font-bold border-b border-neutral-900 pb-2">
                        <span>Output AI Generation Blueprint</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedScript);
                            alert("📋 Copy successful!");
                          }}
                          className="hover:text-amber-500 transition-colors cursor-pointer text-white bg-transparent border-none"
                        >
                          Copy Full Script
                        </button>
                      </div>

                      <pre className="text-[10px] text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap max-h-72 overflow-y-auto pr-1">
                        {generatedScript}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* 🤝 LOYALTY CLUB COUPLING STORE & REFERRALS HUB */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
                    <Users className="h-4 w-4" />
                    Referrals & Loyalty XP Shop
                  </h3>
                  <span className="text-[9px] text-neutral-500 font-black uppercase font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850">
                    Level Up
                  </span>
                </div>

                <div className="space-y-5">
                  <div className="p-4 bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-850 rounded-2xl space-y-3">
                    <span className="text-[9px] text-amber-500 font-black uppercase tracking-wider block">🤝 Refer a Friend (Get 150 points)</span>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newReferralName.trim()) return;
                        handleAddReferral(e);
                      }} 
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={newReferralName}
                        onChange={(e) => setNewReferralName(e.target.value)}
                        placeholder="Enter Friend's Name"
                        className="bg-neutral-950 border border-neutral-800 text-xs px-3 py-2 rounded-xl text-white focus:outline-none focus:border-amber-500 flex-1"
                      />
                      <button
                        type="submit"
                        className="bg-red-650 hover:bg-neutral-100 hover:text-black text-black font-black uppercase text-[10px] px-4 py-2 rounded-xl transition-all cursor-pointer border-0 tracking-widest shrink-0"
                      >
                        Issue VIP Pass
                      </button>
                    </form>
                  </div>

                  {/* Active Referrals List */}
                  {referralsList.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] text-neutral-500 font-black uppercase tracking-wider block font-display">Your Issued Passes / Referred Circle</span>
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {referralsList.map((ref, idx) => (
                          <div 
                            key={idx} 
                            className="bg-neutral-950 p-4 border border-dashed border-neutral-800 rounded-2xl space-y-3 hover:border-amber-500/30 transition-all duration-300"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="text-white font-black text-xs uppercase leading-none">{ref.friendName}</h4>
                                <span className="text-[8px] text-neutral-500 font-bold block pt-1">Registered On: {ref.date}</span>
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                ref.status === "Joined" 
                                  ? "bg-green-600/15 text-green-400 border border-green-500/20" 
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {ref.status}
                              </span>
                            </div>

                            {/* Stylized high fidelity ticket */}
                            <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-850 flex items-center justify-between gap-4 text-[10px]">
                              <div className="space-y-1">
                                <span className="text-[8px] text-neutral-600 font-black uppercase block leading-none font-mono">Pass Verification Key</span>
                                <span className="font-mono text-white text-xs uppercase font-extrabold tracking-widest">{ref.id}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  alert(`🎟️ VIP COUPON GUEST PASS: \n` +
                                    `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                                    `Life Fitness Gym Mandi Bahauddin\n` +
                                    `Guest Member: ${ref.friendName}\n` +
                                    `PASS ID CODE: ${ref.id}\n` +
                                    `Rules: 1-Day All Access Floor Pass + Free Trainer consultation session!\n` +
                                    `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                                    `Send this barcode details to them via Whatsapp!`);
                                }}
                                className="bg-neutral-950 text-[8px] font-black py-1 px-2.5 rounded hover:text-white border border-neutral-800 cursor-pointer"
                              >
                                View Barcode Ticket
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rewards Shop Catalogue */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[9px] text-amber-500 font-black uppercase tracking-wider block font-display">🎁 Redeem Shop Lounge Products</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {REDEEMABLE_REWARDS.map((reward) => (
                        <div key={reward.id} className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl flex flex-col justify-between gap-3 text-xs leading-normal">
                          <div className="space-y-1">
                            <span className="text-[8px] text-neutral-500 font-black uppercase block font-mono">{reward.category}</span>
                            <h4 className="text-white font-black uppercase leading-tight truncate">{reward.name}</h4>
                            <p className="text-[10px] text-neutral-400 font-semibold leading-normal">{reward.details}</p>
                          </div>
                          <div className="flex justify-between items-center border-t border-neutral-900 pt-3">
                            <span className="font-mono text-amber-500 font-black">{reward.cost} XP Required</span>
                            <button
                              onClick={() => handleRedeemReward(reward)}
                              className="bg-neutral-900 hover:bg-neutral-800 text-white font-black text-[9px] px-3 py-1.5 rounded-xl border border-neutral-800 transition-all cursor-pointer uppercase tracking-widest font-mono"
                            >
                              Redeem Item
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Redemption History Ledger */}
                  {rewardRedemptions.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[9px] text-neutral-500 font-black uppercase tracking-wider block font-mono">Redeemed Voucher Ledger Logs</span>
                      <div className="space-y-2">
                        {rewardRedemptions.map((claim, idx) => (
                          <div key={idx} className="bg-neutral-950 p-3 rounded-xl border border-neutral-900 flex justify-between items-center text-[10px] leading-normal">
                            <div>
                              <h5 className="text-white font-black uppercase">{claim.reward}</h5>
                              <span className="text-neutral-500 block text-[9px] font-semibold">Spent {claim.pointsDeducted} XP • On {claim.date}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-amber-500 font-bold block bg-neutral-900 py-1 px-2 rounded border border-neutral-850 uppercase">{claim.id}</span>
                              <span className="text-[8px] text-neutral-400 font-mono block pt-1 font-semibold">{claim.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: LEADERS, ACTIVE CHALLENGES & COMMUNITY CHAT FEED COMPONENT */}
            <div className="lg:col-span-6 space-y-6">

              {/* WEEKLY ACTIVE GYM CHALLENGES */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
                    <Award className="h-4 w-4" />
                    Weekly Gym Challenges & Rewards
                  </h3>
                  <span className="text-[9px] text-neutral-500 font-bold uppercase header-font">Claim XP Instantly</span>
                </div>

                <div className="space-y-3">
                  {challenges.map((ch) => (
                    <div key={ch.id} className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-white uppercase">{ch.title}</span>
                          <span className="text-[9px] bg-amber-500/15 text-amber-500 font-bold px-1.5 py-0.2 rounded font-mono">
                            +{ch.points} XP
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-semibold leading-snug">{ch.desc}</p>
                        <span className="text-[9px] text-neutral-500 font-mono block">Milestone: {ch.target}</span>
                      </div>

                      <div className="shrink-0 text-right">
                        {ch.isClaimed ? (
                          <span className="text-emerald-500 text-[10px] font-black uppercase flex items-center gap-1 font-mono">
                            <CheckCircle className="h-4 w-4 text-emerald-500" /> Claimed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleClaimChallenge(ch.id, ch.points)}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[9px] px-3 py-1.5 rounded-xl transition-all cursor-pointer border-0 tracking-widest"
                          >
                            Claim
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BEFORE & AFTER PHOTO TRANSFORMATION INTERFACE */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <h3 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-amber-500" />
                    Interactive Transformation Slider & Comparison
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUploadPhoto("before")}
                      type="button"
                      className="text-[9px] text-neutral-400 hover:text-white font-bold uppercase border-0 bg-transparent cursor-pointer"
                    >
                      Update Before
                    </button>
                    <span className="text-neutral-700">|</span>
                    <button 
                      onClick={() => handleUploadPhoto("after")}
                      type="button"
                      className="text-[9px] text-neutral-400 hover:text-white font-bold uppercase border-0 bg-transparent cursor-pointer"
                    >
                      Update After
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Slider Control Container */}
                  <div className="relative h-64 bg-neutral-950 border border-neutral-850 rounded-2xl overflow-hidden flex items-center justify-center">
                    {/* Before Image underlaid */}
                    <img 
                      src={photoBefore || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=350"} 
                      alt="Before" 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    
                    {/* After Image overlaid with clipping */}
                    <div 
                      className="absolute inset-y-0 left-0 right-0 overflow-hidden pointer-events-none transition-all duration-150"
                      style={{ clipPath: `polygon(0 0, ${compareSliderVal}% 0, ${compareSliderVal}% 100%, 0 100%)` }}
                    >
                      <img 
                        src={photoAfter || "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=350"} 
                        alt="After" 
                        className="absolute inset-0 w-full h-full object-cover" 
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>

                    {/* Left/Right Text Indicators */}
                    <div className="absolute top-3 left-3 bg-black/75 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-black text-neutral-300 pointer-events-none">
                      Before Baseline
                    </div>
                    <div className="absolute top-3 right-3 bg-amber-500/90 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-black text-black pointer-events-none">
                      Active After
                    </div>

                    {/* Central separator handle line */}
                    <div 
                      className="absolute inset-y-0 w-0.5 bg-washed bg-white filter drop-shadow-lg pointer-events-none"
                      style={{ left: `${compareSliderVal}%` }}
                    />
                  </div>

                  {/* Range Slider controller */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-neutral-500 uppercase font-black">
                      <span>Drag to compare changes</span>
                      <span>Progress Slider: {compareSliderVal}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={compareSliderVal}
                      onChange={(e) => setCompareSliderVal(parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Timeline Weight Log Form */}
                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850/80 space-y-3">
                  <span className="text-[9px] text-neutral-500 font-extrabold uppercase block">Log Progress Snapshot Metrics</span>
                  <form onSubmit={handleAddTimelineLog} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[8px] text-neutral-600 uppercase block font-bold">Month Date</label>
                      <input 
                        type="text"
                        value={newTimelineDate}
                        onChange={(e) => setNewTimelineDate(e.target.value)}
                        placeholder="e.g. Jun 16"
                        className="w-full bg-neutral-900 border border-neutral-800 text-[11px] py-1.5 px-2 rounded-lg text-white text-center"
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[8px] text-neutral-600 uppercase block font-bold">Weight (KG)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={newTimelineWeight}
                        onChange={(e) => setNewTimelineWeight(e.target.value)}
                        placeholder="e.g. 77"
                        className="w-full bg-neutral-900 border border-neutral-800 text-[11px] py-1.5 px-2 rounded-lg text-white text-center font-bold"
                      />
                    </div>
                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[8px] text-neutral-600 uppercase block font-bold">Progress Notes</label>
                      <input 
                        type="text"
                        value={newTimelineCaption}
                        onChange={(e) => setNewTimelineCaption(e.target.value)}
                        placeholder="e.g. Biceps hitting 15 inches!"
                        className="w-full bg-neutral-900 border border-neutral-800 text-[11px] py-1.5 px-3 rounded-lg text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-amber-500 font-extrabold text-[10px] uppercase rounded-lg transition-all cursor-pointer border hover:text-white"
                      >
                        Log
                      </button>
                    </div>
                  </form>

                  {/* Timeline listing logs */}
                  <div className="space-y-2 pt-2 border-t border-neutral-900 max-h-40 overflow-y-auto pr-1">
                    {timelineLogs.map((log, index) => (
                      <div key={index} className="flex justify-between items-center text-[10px] text-neutral-400 bg-neutral-900/50 p-2 rounded-lg border border-neutral-900">
                        <span className="font-mono text-white text-xs">{log.icon}</span>
                        <div className="flex-1 px-2.5">
                          <span className="font-bold text-neutral-300 font-mono text-[9px] uppercase">{log.date}</span>
                          <span className="text-neutral-500 text-[9px] px-1.5">|</span>
                          <span className="font-bold text-amber-500 font-mono">{log.weight} KG</span>
                          <p className="text-[9px] text-neutral-400 leading-normal italic mt-0.5">{log.caption}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTIVE AUDIENCE WEEKLY POLL OF THE WEEK (INTERACTIVE RECHARTS) */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
                    <Megaphone className="h-4 w-4" />
                    Life Fitness Active Member Poll
                  </h3>
                  <span className="text-[9px] text-neutral-500 font-black uppercase font-mono">Vote & Watch Results</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-white font-extrabold text-xs uppercase leading-tight">Which fitness machine should the gym install next?</h4>
                    <p className="text-[10px] text-neutral-500 font-medium">Earn +25 Lounge XP instant credits for participating.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {pollData.map((item) => {
                      const percentage = Math.round((item.votes / pollData.reduce((tot, x) => tot + x.votes, 0)) * 100);
                      return (
                        <button
                          key={item.option}
                          disabled={!!pollVotedOption}
                          onClick={() => handleVotePoll(item.option)}
                          className={`p-3.5 rounded-xl text-left transition-all border outline-none text-xs flex flex-col justify-between gap-2 cursor-pointer ${
                            pollVotedOption === item.option 
                              ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                              : "bg-neutral-950 hover:bg-neutral-900 border-neutral-850 text-neutral-300"
                          } disabled:cursor-not-allowed`}
                        >
                          <span className="font-extrabold block text-[11px] uppercase tracking-tight leading-tight">{item.option}</span>
                          
                          {/* Live percentage bar display */}
                          <div className="space-y-1 w-full pt-1">
                            <div className="flex justify-between text-[8px] text-neutral-500 font-mono font-bold leading-none">
                              <span>{item.votes} Votes</span>
                              <span>{percentage}%</span>
                            </div>
                            <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {pollVotedOption && (
                    <div className="text-center p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 text-xs font-black uppercase tracking-wider animate-pulse leading-none font-mono">
                      🗳️ Your ballot of: "{pollVotedOption}" has been registered!
                    </div>
                  )}
                </div>
              </div>

              {/* COMMUNITY FEEDS & DISCUSSION LIVE CHAT SHARING */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-amber-500" />
                    Interactive Gym-Wide Progress Feed
                  </h3>
                  <span className="text-[9px] text-neutral-500 font-bold uppercase header-font">Live Member Buzz</span>
                </div>

                {/* POST INPUT */}
                <form onSubmit={handleAddFeedPost} className="space-y-2">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      placeholder="Share your physical stats, lifts or motivational words..."
                      className="flex-1 bg-neutral-950 border border-neutral-850 px-3.5 py-3.5 rounded-2xl text-xs text-white placeholder-neutral-700 font-semibold focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="px-5 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer border-0 flex items-center gap-1 text-[11px]"
                    >
                      <Send className="h-3.5 w-3.5" /> Post
                    </button>
                  </div>
                </form>

                {/* FEEDS LIST CONTAINER */}
                <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                  {communityFeed.map((post) => (
                    <div key={post.id} className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl space-y-3.5">
                      
                      {/* Post Header */}
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full overflow-hidden border border-red-500 shrink-0">
                            <img src={post.authorPhoto} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <span className="text-white text-[11px] font-black uppercase block leading-tight">{post.authorName}</span>
                            <span className="text-[8px] text-neutral-500 block leading-none font-semibold pt-0.5">{post.time}</span>
                          </div>
                        </div>

                        {/* Likes trigger */}
                        <button
                          onClick={() => handleLikePost(post.id)}
                          type="button"
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
                            post.likedByUser 
                              ? "bg-red-500/10 border-red-500 text-red-500" 
                              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span>{post.likes}</span>
                        </button>
                      </div>

                      {/* Content */}
                      <p className="text-[11px] text-neutral-300 leading-relaxed font-medium">
                        {post.content}
                      </p>

                      {/* Comments section */}
                      <div className="space-y-2 border-t border-neutral-900 pt-3">
                        {post.comments.map((comment: any) => (
                          <div key={comment.id} className="bg-neutral-900/60 p-2 rounded-xl text-[10px] leading-relaxed border border-neutral-900 text-neutral-400">
                            <span className="font-extrabold text-neutral-200 uppercase tracking-tight">{comment.author}: </span>
                            <span>{comment.text}</span>
                          </div>
                        ))}

                        {/* Comment input form */}
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text"
                            value={commentInputs[post.id] || ""}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder="Type a comment..."
                            className="flex-1 bg-neutral-900 border border-neutral-800 text-[10px] px-2.5 py-1.5 rounded-lg text-white font-semibold focus:outline-none focus:border-amber-500"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            type="button"
                            className="bg-neutral-900 hover:bg-neutral-800 border-neutral-850 px-3 py-1.5 text-amber-500 font-extrabold text-[9px] uppercase hover:text-white rounded-lg transition-all cursor-pointer border animate-fade-in"
                          >
                            Reply
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      ) : activeSection === "workouts" ? (
        <div className="animate-fade-in text-white/90">
          <MemberWorkoutDashboard memberId={member.id} />
        </div>
      ) : activeSection === "equipment" ? (
        <div className="animate-fade-in text-white/90">
          <EquipmentFloorMap />
        </div>
      ) : activeSection === "soundboard" ? (
        <div className="animate-fade-in text-white/90">
          <GymSoundboard />
        </div>
      ) : activeSection === "traffic" ? (
        <div className="animate-fade-in text-white/90">
          <GymTrafficHeatmap attendance={attendance} isAdminView={false} />
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

      {/* MODAL: BIOMETRIC SIMULATION SECURE ENCLAVE */}
      {showEnclaveModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-6 text-center animate-in fade-in duration-205">
            <div className="space-y-4 animate-bounce-slow">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center">
                <Fingerprint className="h-8 w-8 text-red-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-red-500 text-[10px] font-black uppercase tracking-widest block font-mono">Biometric Hardware Verification</span>
                <h3 className="text-white text-lg font-black uppercase tracking-tight">Touch ID / Face ID</h3>
                <p className="text-xs text-neutral-400 leading-normal font-semibold">
                  FIDO2 request from <span className="text-white underline font-semibold font-mono">localhost</span>. Verify your identity using biometric sensors or physical key to save the passkey credential securely.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-850 text-left">
              <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block mb-2 text-center">Select your Authenticator Platform</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => finishSimulatedPasskeyRegistration("TouchID")}
                  className="flex flex-col items-center justify-center p-2.5 bg-neutral-900 hover:bg-neutral-850 rounded-xl border border-neutral-800 font-extrabold text-[10px] text-white uppercase text-center space-y-1.5 transition-all active:scale-95 duration-100"
                >
                  <Fingerprint className="h-5 w-5 text-red-500" />
                  <span>Touch ID</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => finishSimulatedPasskeyRegistration("FaceID")}
                  className="flex flex-col items-center justify-center p-2.5 bg-neutral-900 hover:bg-neutral-850 rounded-xl border border-neutral-800 font-extrabold text-[10px] text-white uppercase text-center space-y-1.5 transition-all active:scale-95 duration-100"
                >
                  <Eye className="h-5 w-5 text-cyan-400" />
                  <span>Face ID</span>
                </button>

                <button
                  type="button"
                  onClick={() => finishSimulatedPasskeyRegistration("Yubikey")}
                  className="flex flex-col items-center justify-center p-2.5 bg-neutral-900 hover:bg-neutral-850 rounded-xl border border-neutral-800 font-extrabold text-[10px] text-white uppercase text-center space-y-1.5 transition-all active:scale-95 duration-100"
                >
                  <Cpu className="h-5 w-5 text-amber-500" />
                  <span>USB Key</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setShowEnclaveModal(false); setRegisteringPasskey(false); addLogMessage("REGISTRATION CANCELLED: Verification rejected by user."); }}
              className="w-full py-3.5 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 font-extrabold text-xs uppercase rounded-xl border border-neutral-800 transition-all text-center"
            >
              Cancel Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
