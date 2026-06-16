import React, { useState, useEffect, useRef } from "react";
import { 
  User, 
  Target, 
  Activity, 
  Camera, 
  Trash2, 
  Save, 
  X, 
  FolderPlus, 
  Eye, 
  EyeOff, 
  Calendar, 
  Scale, 
  TrendingUp, 
  Heart,
  Plus,
  AlertTriangle,
  Lock,
  ChevronRight,
  Info
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  Member, 
  FitnessProfile, 
  GoalHistoryEntry, 
  BodyMeasurementEntry, 
  CustomMeasurementType, 
  ProgressPhoto, 
  HealthConsiderations, 
  AiConsentSettings 
} from "../types";

interface MemberProfileEditorProps {
  member: Member;
  onUpdateMember: (updated: Member) => void;
  onClose: () => void;
}

export default function MemberProfileEditor({ 
  member, 
  onUpdateMember, 
  onClose 
}: MemberProfileEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("basic");

  // Loading state
  const memberId = member.id;

  // 1. BASIC INFORMATION STATE
  const [fullName, setFullName] = useState(member.fullName);
  const [preferredDisplayName, setPreferredDisplayName] = useState(
    member.fullName.split(" ")[0] || ""
  );
  const [phone, setPhone] = useState(member.phone);
  const [whatsApp, setWhatsApp] = useState(member.whatsApp);
  const [dob, setDob] = useState(member.dob);
  const [gender, setGender] = useState(member.gender);
  const [address, setAddress] = useState(member.address);
  const [emergencyName, setEmergencyName] = useState(member.emergencyContactName || "");
  const [emergencyPhone, setEmergencyPhone] = useState(member.emergencyContactNumber || "");
  const [photoUrl, setPhotoUrl] = useState(member.photoUrl);
  
  // Photo upload, preview & cropping states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoZoom, setPhotoZoom] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cropMode, setCropMode] = useState(false);

  // 2. FITNESS PROFILE STATE
  const [fitnessProfile, setFitnessProfile] = useState<FitnessProfile>(() => {
    const saved = localStorage.getItem(`fit_prof_${memberId}`);
    return saved ? JSON.parse(saved) : {
      fitnessGoals: ["Muscle Gain"],
      unitSystem: "Metric"
    };
  });

  const [goalHistory, setGoalHistory] = useState<GoalHistoryEntry[]>(() => {
    const saved = localStorage.getItem(`goal_hist_${memberId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [newGoalValue, setNewGoalValue] = useState("");

  // 3. BODY MEASUREMENTS STATE
  const [measurements, setMeasurements] = useState<BodyMeasurementEntry[]>(() => {
    const saved = localStorage.getItem(`measurements_${memberId}`);
    if (saved) return JSON.parse(saved);
    // Seed initial metrics derived from current member specs
    return [
      { id: "m-init-1", memberId, measurementType: "Weight", value: 78, unit: "KG", createdAt: new Date(Date.now() - 30 * 86450 * 1000).toISOString(), updatedAt: new Date(Date.now() - 30 * 86450 * 1000).toISOString(), note: "Starter baseline logs" },
      { id: "m-init-2", memberId, measurementType: "Weight", value: 77.2, unit: "KG", createdAt: new Date(Date.now() - 15 * 86450 * 1000).toISOString(), updatedAt: new Date(Date.now() - 15 * 86450 * 1000).toISOString(), note: "Progress check" },
      { id: "m-init-3", memberId, measurementType: "Weight", value: 76.5, unit: "KG", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), note: "Latest morning check" },
      { id: "m-init-4", memberId, measurementType: "Waist", value: 34, unit: "inches", createdAt: new Date(Date.now() - 30 * 86450 * 1000).toISOString(), updatedAt: new Date(Date.now() - 30 * 86450 * 1000).toISOString() },
      { id: "m-init-5", memberId, measurementType: "Waist", value: 33.2, unit: "inches", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "m-init-6", memberId, measurementType: "Left biceps", value: 14.5, unit: "inches", createdAt: new Date(Date.now() - 30 * 86450 * 1000).toISOString(), updatedAt: new Date(Date.now() - 30 * 86450 * 1000).toISOString() },
      { id: "m-init-7", memberId, measurementType: "Left biceps", value: 15.0, unit: "inches", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
  });

  const [customTypes, setCustomTypes] = useState<CustomMeasurementType[]>(() => {
    const saved = localStorage.getItem(`cust_types_${memberId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedChartType, setSelectedChartType] = useState<string>("Weight");
  const [chartDateFilter, setChartDateFilter] = useState<string>("all");

  // Add entry state
  const [newMeasureType, setNewMeasureType] = useState("Weight");
  const [newMeasureVal, setNewMeasureVal] = useState("");
  const [newMeasureNote, setNewMeasureNote] = useState("");
  const [newMeasureDate, setNewMeasureDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [inputErrorWarning, setInputErrorWarning] = useState<string | null>(null);

  // Custom measurement creator state
  const [showCustomCreator, setShowCustomCreator] = useState(false);
  const [customTypeName, setCustomTypeName] = useState("");
  const [customTypeUnit, setCustomTypeUnit] = useState("inches");

  // 4. PROGRESS PHOTOS STATE
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>(() => {
    const saved = localStorage.getItem(`prog_photos_${memberId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [photoUploadCat, setPhotoUploadCat] = useState<"Front" | "Side" | "Back">("Front");
  const [photoUploadRef, setPhotoUploadRef] = useState<string>("");
  const [photoUploadWeight, setPhotoUploadWeight] = useState("");
  const [photoUploadNote, setPhotoUploadNote] = useState("");
  const [photoUploadPrivacy, setPhotoUploadPrivacy] = useState<"Private" | "Trainer" | "Admin">("Private");
  
  // Before-After comparison states
  const [compPhotoLeft, setCompPhotoLeft] = useState<string>("");
  const [compPhotoRight, setCompPhotoRight] = useState<string>("");

  // 5. HEALTH AND SECURITY STATE
  const [healthAndSafety, setHealthAndSafety] = useState<HealthConsiderations>(() => {
    const saved = localStorage.getItem(`health_safety_${memberId}`);
    return saved ? JSON.parse(saved) : { disclaimerAccepted: false };
  });

  // AI Consent Settings
  const [consentSettings, setConsentSettings] = useState<AiConsentSettings>(() => {
    const saved = localStorage.getItem(`consent_${memberId}`);
    return saved ? JSON.parse(saved) : {
      bodyMeasurements: true,
      attendance: true,
      workoutHistory: true,
      competitionHistory: true,
      healthConsiderations: false,
      progressPhotos: false
    };
  });

  // Saving alerts
  const [notification, setNotification] = useState<string | null>(null);

  // Sync state helpers
  useEffect(() => {
    localStorage.setItem(`fit_prof_${memberId}`, JSON.stringify(fitnessProfile));
  }, [fitnessProfile, memberId]);

  useEffect(() => {
    localStorage.setItem(`goal_hist_${memberId}`, JSON.stringify(goalHistory));
  }, [goalHistory, memberId]);

  useEffect(() => {
    localStorage.setItem(`measurements_${memberId}`, JSON.stringify(measurements));
  }, [measurements, memberId]);

  useEffect(() => {
    localStorage.setItem(`cust_types_${memberId}`, JSON.stringify(customTypes));
  }, [customTypes, memberId]);

  useEffect(() => {
    localStorage.setItem(`prog_photos_${memberId}`, JSON.stringify(progressPhotos));
  }, [progressPhotos, memberId]);

  useEffect(() => {
    localStorage.setItem(`health_safety_${memberId}`, JSON.stringify(healthAndSafety));
  }, [healthAndSafety, memberId]);

  useEffect(() => {
    localStorage.setItem(`consent_${memberId}`, JSON.stringify(consentSettings));
  }, [consentSettings, memberId]);

  // Toast notifier trigger
  const triggerNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Profile image selector
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Supported formats
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Unsupported file type. Please upload a JPg, PNG or WEBP image.");
      return;
    }

    // Size limit 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Image is too large. Image size must be smaller than 5MB.");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setCropMode(true);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCroppedImage = () => {
    if (!photoPreview) return;
    
    // We simulate canvas-specific crop/zoom by applying zoom filter and generating output
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = 300;
        canvas.height = 300;
        if (ctx) {
          // Draw image centered & fitted with zoom scaling
          ctx.clearRect(0, 0, 300, 300);
          const size = Math.min(img.width, img.height);
          const sourceX = (img.width - size) / 2;
          const sourceY = (img.height - size) / 2;
          
          // Apply sliding scale
          const zoomOffset = (size * (1 - 1 / photoZoom)) / 2;
          const cropSize = size / photoZoom;
          
          ctx.drawImage(
            img, 
            sourceX + zoomOffset, 
            sourceY + zoomOffset, 
            cropSize, 
            cropSize, 
            0, 
            0, 
            300, 
            300
          );
          
          const croppedBase64 = canvas.toDataURL("image/jpeg", 0.85);
          setPhotoUrl(croppedBase64);
          setCropMode(false);
          setPhotoPreview(null);
          triggerNotification("Image cropped and applied successfully.");
        }
      };
      img.src = photoPreview;
    } else {
      // Fallback
      setPhotoUrl(photoPreview);
      setCropMode(false);
      setPhotoPreview(null);
    }
  };

  const handleRemoveImage = () => {
    // Fallback placeholder
    const fallback = gender === "Female" 
      ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" 
      : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
    setPhotoUrl(fallback);
    triggerNotification("Profile photograph removed.");
  };

  // Submit profile basic changes
  const handleSaveBasicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      alert("Full Name and Phone Number are required.");
      return;
    }

    const updatedMember: Member = {
      ...member,
      fullName: fullName.trim(),
      phone: phone.trim(),
      whatsApp: whatsApp.trim(),
      dob,
      gender,
      address: address.trim(),
      emergencyContactName: emergencyName.trim(),
      emergencyContactNumber: emergencyPhone.trim(),
      photoUrl,
      updatedAt: new Date().toISOString()
    };

    onUpdateMember(updatedMember);
    triggerNotification("Basic profile information updated successfully!");
  };

  // Handle goals modifications
  const handleToggleGoal = (goal: string) => {
    let newGoals = [...fitnessProfile.fitnessGoals];
    if (newGoals.includes(goal)) {
      newGoals = newGoals.filter(g => g !== goal);
    } else {
      newGoals.push(goal);
    }
    
    // Save history record of change
    const histEntry: GoalHistoryEntry = {
      id: `gh-${Date.now()}`,
      goals: newGoals,
      customGoal: fitnessProfile.customGoal,
      changedAt: new Date().toISOString()
    };

    setGoalHistory(prev => [histEntry, ...prev]);
    setFitnessProfile(prev => ({
      ...prev,
      fitnessGoals: newGoals
    }));
    triggerNotification("Workout goal settings updated.");
  };

  // Custom equipment check based on Member's plan (Basic has no access to electronic mach)
  const isPremiumEquipment = (eq: string) => {
    return ["Electronic machines", "Cardio equipment", "Treadmill"].includes(eq);
  };

  const handleToggleEquipment = (eq: string) => {
    // Basic plan check
    const isBasic = member.planName.toLowerCase().includes("basic") || member.planId.toLowerCase().includes("basic") || member.planName.toLowerCase().includes("plan a");
    if (isBasic && isPremiumEquipment(eq)) {
      alert(`⚠️ Your "${member.planName}" membership plan restricts access to electronic cardio and treadmill equipment. Upgrading to a premium package provides full facility credentials.`);
      return;
    }

    let items = fitnessProfile.availableEquipment ? [...fitnessProfile.availableEquipment] : [];
    if (items.includes(eq)) {
      items = items.filter(i => i !== eq);
    } else {
      items.push(eq);
    }

    setFitnessProfile(prev => ({
      ...prev,
      availableEquipment: items
    }));
  };

  // Adding body measurements
  const handleAddMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newMeasureVal);
    if (isNaN(val) || val <= 0) {
      alert("Please specify a valid positive numerical measurement value.");
      return;
    }

    // Input Validation Guard warnings (not hard blocks but warnings for safety)
    let warningMsg = null;
    if (newMeasureType === "Weight" && val > 300) {
      warningMsg = `Value (${val} KG) seems extremely high for body weight. Please check if this is correct.`;
    } else if (newMeasureType === "Height" && val < 40) {
      warningMsg = `Value (${val} CM) seems extremely short for height. Please check if this is correct.`;
    } else if (["Waist", "Chest", "Neck", "Hips", "Shoulders"].includes(newMeasureType) && val > 120) {
      warningMsg = `Value (${val} inches/cm) seems very high. Please check if this is correct.`;
    }

    if (warningMsg) {
      setInputErrorWarning(warningMsg);
      return;
    }

    saveMeasurementData(newMeasureType, val);
  };

  const saveMeasurementData = (type: string, val: number) => {
    const unit = type === "Weight" 
      ? (fitnessProfile.unitSystem === "Metric" ? "KG" : "lbs")
      : type === "Height"
        ? (fitnessProfile.unitSystem === "Metric" ? "CM" : "inches")
        : (fitnessProfile.unitSystem === "Metric" ? "CM" : "inches");

    const newDoc: BodyMeasurementEntry = {
      id: `meas-${Date.now()}`,
      memberId,
      measurementType: type,
      value: val,
      unit,
      createdAt: new Date(newMeasureDate).toISOString(),
      updatedAt: new Date().toISOString(),
      note: newMeasureNote.trim() || undefined
    };

    setMeasurements(prev => [newDoc, ...prev]);
    setNewMeasureVal("");
    setNewMeasureNote("");
    setInputErrorWarning(null);
    triggerNotification(`Added new progress log for: ${type}`);
  };

  const handleCustomCreatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTypeName.trim()) return;

    const exists = customTypes.find(t => t.name.toLowerCase() === customTypeName.toLowerCase());
    if (exists) {
      alert("This custom measurement type already exists.");
      return;
    }

    const tId = `ct-${Date.now()}`;
    const newType: CustomMeasurementType = {
      id: tId,
      name: customTypeName.trim(),
      unit: customTypeUnit
    };

    setCustomTypes(prev => [...prev, newType]);
    setNewMeasureType(customTypeName.trim());
    setCustomTypeName("");
    setShowCustomCreator(false);
    triggerNotification(`Created custom metric: ${newType.name}`);
  };

  const handleDeleteEntry = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete this ${name} progress entry? This action is irreversible.`)) {
      setMeasurements(prev => prev.filter(m => m.id !== id));
      triggerNotification("Deleted progress entry.");
    }
  };

  const handleDeleteCustomType = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete custom measurement category "${name}"? All associated past log history entries will be lost.`)) {
      setCustomTypes(prev => prev.filter(c => c.id !== id));
      setMeasurements(prev => prev.filter(m => m.measurementType !== name));
      triggerNotification(`Removed custom metric category and historical entries.`);
    }
  };

  // Fetch metrics data statistics
  const getMeasurementStats = (type: string) => {
    const list = measurements
      .filter(m => m.measurementType === type)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (list.length === 0) return null;

    const first = list[0];
    const latest = list[list.length - 1];
    const prev = list.length > 1 ? list[list.length - 2] : first;

    const diff = latest.value - prev.value;
    const pct = prev.value > 0 ? (diff / prev.value) * 100 : 0;
    const totalDiff = latest.value - first.value;
    const totalPct = first.value > 0 ? (totalDiff / first.value) * 100 : 0;

    return {
      current: latest.value,
      latestDate: new Date(latest.createdAt).toLocaleDateString(),
      first: first.value,
      previous: prev.value,
      diff,
      pct,
      totalDiff,
      totalPct,
      unit: latest.unit,
      entriesCount: list.length
    };
  };

  // Filter historical lists for the Recharts graph visualization
  const getChartData = (type: string) => {
    let filtered = measurements
      .filter(m => m.measurementType === type)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (chartDateFilter !== "all") {
      const now = new Date();
      let limitDate = new Date();
      if (chartDateFilter === "30") {
        limitDate.setDate(now.getDate() - 30);
      } else if (chartDateFilter === "90") {
        limitDate.setMonth(now.getMonth() - 3);
      } else if (chartDateFilter === "180") {
        limitDate.setMonth(now.getMonth() - 6);
      } else if (chartDateFilter === "365") {
        limitDate.setFullYear(now.getFullYear() - 1);
      }
      filtered = filtered.filter(m => new Date(m.createdAt) >= limitDate);
    }

    return filtered.map(m => ({
      date: new Date(m.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      Value: m.value,
      rawDate: m.createdAt
    }));
  };

  // Upload Progress Photos
  const handlePhotoUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUploadRef.trim()) {
      alert("Please upload or provide a photograph url.");
      return;
    }

    const nPhoto: ProgressPhoto = {
      id: `p-photo-${Date.now()}`,
      memberId,
      category: photoUploadCat,
      photoUrl: photoUploadRef,
      date: new Date().toISOString().split("T")[0],
      weight: photoUploadWeight ? parseFloat(photoUploadWeight) : undefined,
      note: photoUploadNote.trim() || undefined,
      visibility: photoUploadPrivacy
    };

    setProgressPhotos(prev => [nPhoto, ...prev]);
    setPhotoUploadRef("");
    setPhotoUploadWeight("");
    setPhotoUploadNote("");
    triggerNotification(`Uploaded optional ${photoUploadCat} progress photo.`);
  };

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-3xl overflow-hidden shadow-2xl animate-fade-in max-w-6xl mx-auto w-full flex flex-col md:flex-row relative">
      
      {/* Toast Notifier */}
      {notification && (
        <div className="absolute top-4 right-4 z-50 bg-red-600 text-black font-black uppercase text-xs px-5 py-3 rounded-xl shadow-lg border border-red-500/25 flex items-center gap-2 animate-bounce">
          <Info className="h-4 w-4" />
          {notification}
        </div>
      )}

      {/* Tabs list Side Panel */}
      <div className="w-full md:w-64 bg-neutral-900 border-r border-neutral-850 p-5 space-y-4 shrink-0">
        <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
          <div>
            <h3 className="text-white font-black uppercase tracking-tight text-sm">Portal Profile</h3>
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Life Fitness Config</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-neutral-850 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none">
          {[
            { id: "basic", label: "Basic Info", icon: User },
            { id: "fitness", label: "Fitness Goals", icon: Target },
            { id: "measurements", label: "Measurements", icon: Scale },
            { id: "photos", label: "Progress Photos", icon: Camera },
            { id: "health", label: "Health & Safety", icon: Heart },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === tab.id 
                    ? "bg-red-600 text-black font-black" 
                    : "text-neutral-400 hover:text-white hover:bg-neutral-850"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden md:block pt-16 space-y-2">
          <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-850 text-[10px] text-neutral-500 leading-normal font-semibold">
            <Lock className="h-3.5 w-3.5 text-neutral-600 mb-1" />
            <p className="font-extrabold uppercase text-[9px] text-neutral-400 mb-1">Administrative Block</p>
            You are editing self-permitted data fields. Sensitive attributes like plan ID, payment state, and digital check-ins remain administrative locks.
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
        
        {/* TAB 1: BASIC MEMBER INFORMATION */}
        {activeTab === "basic" && (
          <form onSubmit={handleSaveBasicInfo} className="space-y-6">
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="text-white text-lg font-black uppercase tracking-widest">Basic Profile Information</h2>
              <p className="text-xs text-neutral-450 text-neutral-400">Update your gym identity, contact details, and emergency references.</p>
            </div>

            {/* Profile Picture Controller */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative h-28 w-28 rounded-full border-3 border-red-600 overflow-hidden shrink-0 bg-neutral-950 flex items-center justify-center">
                <img src={photoUrl} alt="Preview Avatar" className="h-full w-full object-cover" />
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <h4 className="text-white font-extrabold text-sm uppercase">Profile Representative Photo</h4>
                <p className="text-[11px] text-neutral-500 max-w-sm leading-relaxed font-semibold">
                  Select a JPG, PNG, or WEBP image under 5MB. Use zoom sliders to center.
                </p>

                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-2 border border-neutral-800 shadow-md transition-all cursor-pointer"
                  >
                    <Camera className="h-4 w-4 text-red-500" />
                    Select Picture
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-red-500 font-bold text-xs uppercase rounded-xl flex items-center gap-2 border border-neutral-800 shadow-md transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Simulated Cropping Modal/Section */}
            {cropMode && photoPreview && (
              <div className="bg-neutral-900 border border-red-500/20 rounded-3xl p-6 space-y-4 animate-fade-in">
                <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-500" />
                  Crop & Align Profile Photo
                </h4>
                
                <div className="flex flex-col items-center gap-4">
                  <div className="h-48 w-48 overflow-hidden rounded-full border-2 border-red-500 shrink-0 bg-neutral-900 relative">
                    <img 
                      src={photoPreview} 
                      alt="Crop View" 
                      style={{ transform: `scale(${photoZoom})` }}
                      className="h-full w-full object-cover transition-transform origin-center" 
                    />
                  </div>

                  <div className="w-full max-w-xs space-y-1">
                    <div className="flex justify-between text-[10px] text-neutral-400 font-bold uppercase">
                      <span>Zoom Alignment:</span>
                      <span>{photoZoom.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.1" 
                      value={photoZoom}
                      onChange={(e) => setPhotoZoom(parseFloat(e.target.value))}
                      className="w-full accent-red-500"
                    />
                  </div>

                  <div className="flex gap-2 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={handleApplyCroppedImage}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Crop & Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCropMode(false);
                        setPhotoPreview(null);
                      }}
                      className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-750 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {/* Input fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Full Name:</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Preferred Display Name (Display Name):</label>
                <input
                  type="text"
                  value={preferredDisplayName}
                  onChange={(e) => setPreferredDisplayName(e.target.value)}
                  placeholder="e.g. Aly"
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Phone Number:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">WhatsApp Contact:</label>
                <input
                  type="text"
                  value={whatsApp}
                  onChange={(e) => setWhatsApp(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Date of Birth:</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Gender:</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Residential Address:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Emergency Contact Representative:</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Parent or Guardian Name"
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Emergency Phone Number:</label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
              <button
                type="submit"
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase text-xs tracking-widest rounded-xl border border-neutral-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: OPTIONAL FITNESS PROFILE */}
        {activeTab === "fitness" && (
          <div className="space-y-6">
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="text-white text-lg font-black uppercase tracking-widest">My Fitness Profile</h2>
              <p className="text-xs text-neutral-400">Complete standard fields below to share workout records for custom AI coach summaries.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Unit System & Base Metrics */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl space-y-4">
                <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Scale className="h-4.5 w-4.5 text-red-500" />
                  Base Measurements & Units
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Preferred Unit Standard:</label>
                    <select
                      value={fitnessProfile.unitSystem}
                      onChange={(e) => setFitnessProfile(p => ({ ...p, unitSystem: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none"
                    >
                      <option value="Metric">Metric (KG, CM, Litres)</option>
                      <option value="Imperial">Imperial (lbs, Inches, Gallons)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Current Weight:</label>
                      <input
                        type="number"
                        placeholder="KG"
                        value={fitnessProfile.weight || ""}
                        onChange={(e) => setFitnessProfile(p => ({ ...p, weight: parseFloat(e.target.value) || undefined }))}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Current Height:</label>
                      <input
                        type="number"
                        placeholder="CM"
                        value={fitnessProfile.height || ""}
                        onChange={(e) => setFitnessProfile(p => ({ ...p, height: parseFloat(e.target.value) || undefined }))}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Target Weight:</label>
                      <input
                        type="number"
                        placeholder="KG"
                        value={fitnessProfile.targetWeight || ""}
                        onChange={(e) => setFitnessProfile(p => ({ ...p, targetWeight: parseFloat(e.target.value) || undefined }))}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Target Date:</label>
                      <input
                        type="date"
                        value={fitnessProfile.targetDate || ""}
                        onChange={(e) => setFitnessProfile(p => ({ ...p, targetDate: e.target.value || undefined }))}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-[10.5px] text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences & Routine */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl space-y-4 md:col-span-2">
                <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-red-500" />
                  Training Preferences & Level
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Experience Level:</label>
                    <select
                      value={fitnessProfile.experienceLevel || ""}
                      onChange={(e) => setFitnessProfile(p => ({ ...p, experienceLevel: e.target.value as any || undefined }))}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                    >
                      <option value="">Choose Level</option>
                      <option value="Beginner">Beginner (Correct Form Focus)</option>
                      <option value="Intermediate">Intermediate (Consistency)</option>
                      <option value="Advanced">Advanced (Power & Hypertrophy)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Preferred Training Style:</label>
                    <select
                      value={fitnessProfile.trainingStyle || ""}
                      onChange={(e) => setFitnessProfile(p => ({ ...p, trainingStyle: e.target.value as any || undefined }))}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                    >
                      <option value="">Choose Style</option>
                      <option value="Weight Training">Weight Training</option>
                      <option value="Strength Training">Strength Training</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Functional Training">Functional Training</option>
                      <option value="Bodyweight Training">Bodyweight Training</option>
                      <option value="Mixed Training">Mixed Training</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Workout Duration:</label>
                    <select
                      value={fitnessProfile.workoutDuration || ""}
                      onChange={(e) => setFitnessProfile(p => ({ ...p, workoutDuration: e.target.value as any || undefined }))}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                    >
                      <option value="">Choose Duration</option>
                      <option value="30 minutes">30 minutes</option>
                      <option value="45 minutes">45 minutes</option>
                      <option value="60 minutes">60 minutes</option>
                      <option value="90 minutes">90 minutes</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Water Intake (Daily):</label>
                    <input
                      type="number"
                      placeholder="Litres"
                      step="0.5"
                      value={fitnessProfile.waterIntake || ""}
                      onChange={(e) => setFitnessProfile(p => ({ ...p, waterIntake: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-neutral-450 text-[10px] text-neutral-400 font-bold uppercase block mb-1">Goal Workout Days:</span>
                  <div className="flex flex-wrap gap-1">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                      const active = fitnessProfile.workoutDays?.includes(day);
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            let items = fitnessProfile.workoutDays ? [...fitnessProfile.workoutDays] : [];
                            if (items.includes(day)) {
                              items = items.filter(d => d !== day);
                            } else {
                              items.push(day);
                            }
                            setFitnessProfile(p => ({ ...p, workoutDays: items }));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                            active ? "bg-red-600 text-black" : "bg-neutral-950 hover:bg-neutral-800 text-neutral-400 border border-neutral-800"
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Target Goals Selection */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
              <h3 className="text-white font-black text-xs uppercase tracking-widest">
                Target Goals (Select One or More)
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {[
                  "Weight Loss", "Muscle Gain", "Strength Gain", "Fat Loss", 
                  "Improve Fitness", "Improve Stamina", "Body Recomposition", 
                  "General Health", "Competition Preparation", "Maintain Current Fitness"
                ].map(goal => {
                  const active = fitnessProfile.fitnessGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => handleToggleGoal(goal)}
                      className={`px-4 py-3 rounded-2xl text-xs font-bold text-left border transition-all cursor-pointer ${
                        active 
                          ? "bg-red-650/10 border-red-500 text-red-500" 
                          : "bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-400"
                      }`}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>

              {/* Custom goals field */}
              <div className="pt-2">
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Custom Fitness Goal Description:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fitnessProfile.customGoal || ""}
                    onChange={(e) => setFitnessProfile(p => ({ ...p, customGoal: e.target.value }))}
                    placeholder="Describe specific custom benchmark targets (e.g., Increase vertical jump, Benchpress 100KG)"
                    className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Allowed Equipment Checks */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-start border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-white font-black text-xs uppercase tracking-widest">Facility Equipment Configuration</h3>
                  <p className="text-[10px] text-neutral-400 mt-1">Select machinery you utilize. AI limits workout suggestions to your allowed membership access tiers.</p>
                </div>
                <span className="text-[9px] bg-red-650/15 border border-red-500/25 px-2.5 py-0.5 rounded text-red-500 font-black uppercase">{member.planName} tier</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {[
                  "Basic gym equipment", "Free weights", "Strength machines", 
                  "Electronic machines", "Treadmill", "Cardio equipment"
                ].map(eq => {
                  const active = fitnessProfile.availableEquipment?.includes(eq);
                  const isPremium = isPremiumEquipment(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => handleToggleEquipment(eq)}
                      className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                        active 
                          ? "bg-neutral-950 border-red-500 text-white" 
                          : "bg-neutral-950/40 border-neutral-850 text-neutral-500"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="font-bold uppercase tracking-wider text-[10px] block">{eq}</span>
                        {isPremium && (
                          <span className="text-[8px] uppercase tracking-widest text-red-500 font-extrabold flex items-center gap-1">
                            <Lock className="h-2 w-2" />
                            Premium Tier
                          </span>
                        )}
                      </div>
                      <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                        active ? "border-red-500 bg-red-500/10 text-red-500" : "border-neutral-800"
                      }`}>
                        {active ? "✔" : ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => triggerNotification("Fitness settings saved successfully.")}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
              >
                Apply Profile Settings
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: BODY MEASUREMENTS & HISTORY CHARTS */}
        {activeTab === "measurements" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-neutral-800 pb-3">
              <div>
                <h2 className="text-white text-lg font-black uppercase tracking-widest">Body Measurements & Progress Curves</h2>
                <p className="text-xs text-neutral-400">Add progress entries over time to compute change indexes and render curves.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomCreator(true)}
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FolderPlus className="h-3.5 w-3.5 text-red-500" />
                  Create Custom Category
                </button>
              </div>
            </div>

            {/* Custom measurement creator inline form */}
            {showCustomCreator && (
              <form onSubmit={handleCustomCreatorSubmit} className="bg-neutral-900 border border-red-500/20 rounded-3xl p-5 space-y-4 animate-slide-in">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <h4 className="text-white font-black text-xs uppercase tracking-widest">Setup Custom Tracking Metric</h4>
                  <button type="button" onClick={() => setShowCustomCreator(false)} className="text-neutral-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Measurement Name:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Upper chest, Arm flexed"
                      value={customTypeName}
                      onChange={(e) => setCustomTypeName(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Standard Unit:</label>
                    <select
                      value={customTypeUnit}
                      onChange={(e) => setCustomTypeUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-white"
                    >
                      <option value="inches">Inches (in)</option>
                      <option value="CM">Centimetres (CM)</option>
                      <option value="KG">Kilograms (KG)</option>
                      <option value="lbs">Pounds (lbs)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-red-655 bg-red-600 hover:bg-red-700 text-black font-black uppercase text-[10px] tracking-widest rounded-lg transition-all cursor-pointer"
                    >
                      Create Category
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Add New Entry Form */}
            <form onSubmit={handleAddMeasurement} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
              <h3 className="text-white font-black text-xs uppercase tracking-widest">
                Log New Entry Card
              </h3>

              {inputErrorWarning && (
                <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl text-xs text-red-500 flex items-start gap-2 leading-relaxed font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <p className="font-extrabold uppercase mb-0.5">Likely Input Error Warning</p>
                    <p className="mb-2">{inputErrorWarning}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(newMeasureVal);
                          saveMeasurementData(newMeasureType, val);
                        }}
                        className="px-3 py-1 bg-red-600 text-black font-black uppercase text-[9px] tracking-widest rounded transition-all"
                      >
                        Yes, Correct. Save anyway
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputErrorWarning(null)}
                        className="px-3 py-1 bg-neutral-800 text-white font-bold uppercase text-[9px] tracking-widest rounded transition-all"
                      >
                        Dismiss & Edit
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Metric Type:</label>
                  <select
                    value={newMeasureType}
                    onChange={(e) => setNewMeasureType(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-white"
                  >
                    <optgroup label="Standard Metrics">
                      <option value="Weight">Weight (KG / lbs)</option>
                      <option value="Height">Height (CM / in)</option>
                      <option value="Neck">Neck</option>
                      <option value="Shoulders">Shoulders</option>
                      <option value="Chest">Chest</option>
                      <option value="Waist">Waist</option>
                      <option value="Hips">Hips</option>
                      <option value="Left biceps">Left biceps</option>
                      <option value="Right biceps">Right biceps</option>
                      <option value="Left forearm">Left forearm</option>
                      <option value="Right forearm">Right forearm</option>
                      <option value="Left thigh">Left thigh</option>
                      <option value="Right thigh">Right thigh</option>
                      <option value="Left calf">Left calf</option>
                      <option value="Right calf">Right calf</option>
                      <option value="Body fat percentage">Body fat percentage (%)</option>
                      <option value="Muscle mass">Muscle mass (kg)</option>
                    </optgroup>
                    {customTypes.length > 0 && (
                      <optgroup label="Custom Tracking Metrics">
                        {customTypes.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Entry Value:</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Value (positive only)"
                    required
                    value={newMeasureVal}
                    onChange={(e) => setNewMeasureVal(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Log Date:</label>
                  <input
                    type="date"
                    required
                    value={newMeasureDate}
                    onChange={(e) => setNewMeasureDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Optional Note:</label>
                  <input
                    type="text"
                    placeholder="e.g. Fed in morning"
                    value={newMeasureNote}
                    onChange={(e) => setNewMeasureNote(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-655 bg-red-600 hover:bg-red-700 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Save Entry Logs
                </button>
              </div>
            </form>

            {/* Dashboard Progress Cards Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {["Weight", "Waist", "Left biceps", "Body fat percentage"].map(item => {
                const stats = getMeasurementStats(item);
                if (!stats) return null;
                const isPositive = stats.diff >= 0;
                return (
                  <div 
                    key={item}
                    onClick={() => setSelectedChartType(item)} 
                    className={`bg-neutral-900 border p-4.5 rounded-3xl cursor-pointer transition-all hover:scale-[1.02] ${
                      selectedChartType === item ? "border-red-500 shadow-md shadow-red-950/10" : "border-neutral-800"
                    }`}
                  >
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">{item} Summary:</span>
                    <div className="flex justify-between items-baseline mt-1.5">
                      <span className="font-mono text-xl font-black text-white leading-none">
                        {stats.current} <span className="text-xs text-neutral-400 font-sans font-bold">{stats.unit}</span>
                      </span>
                      <span className={`text-[10px] font-mono font-extrabold ${stats.diff === 0 ? "text-neutral-500" : isPositive ? "text-green-400" : "text-red-500"}`}>
                        {stats.diff === 0 ? "0" : (isPositive ? "+" : "") + stats.diff.toFixed(1)} ({stats.pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between text-[9px] text-neutral-500 font-semibold mt-2 pt-2 border-t border-neutral-850">
                      <span>Baseline: {stats.first} {stats.unit}</span>
                      <span>Logs: {stats.entriesCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chart Area */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-neutral-800 pb-3">
                <div className="space-y-1">
                  <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-red-500" />
                    Measurement Progress Graph: {selectedChartType}
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-semibold">Viewing historical trends plotted over time.</p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="flex border border-neutral-800 rounded-xl overflow-hidden p-0.5 bg-neutral-950 text-[10px] uppercase font-black tracking-wider text-neutral-400">
                    {[
                      { id: "30", label: "30D" },
                      { id: "90", label: "3M" },
                      { id: "180", label: "6M" },
                      { id: "all", label: "All" }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setChartDateFilter(f.id)}
                        className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                          chartDateFilter === f.id ? "bg-red-600 text-black font-black" : "hover:text-white"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RECHARTS PLOT */}
              <div className="h-64 sm:h-72 w-full pt-2">
                {getChartData(selectedChartType).length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-neutral-500 uppercase font-bold tracking-widest bg-neutral-950/20 border border-neutral-850 rounded-2xl">
                    Add at least 1 progress log to plot values
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData(selectedChartType)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" stroke="#666666" fontSize={10} tickLine={false} />
                      <YAxis stroke="#666666" fontSize={11} domain={["auto", "auto"]} width={35} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#171717", borderColor: "#404040", borderRadius: "12px", fontSize: "11px" }}
                        labelStyle={{ fontWeight: "bold", textTransform: "uppercase", color: "#a3a3a3" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Value" 
                        stroke="#dc2626" // Red stroke 
                        strokeWidth={3} 
                        dot={{ r: 4, stroke: "#dc2626", fill: "#000000", strokeWidth: 2 }} // centered hollow dot
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Custom categories listed */}
            {customTypes.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-3">
                <h3 className="text-white font-black text-xs uppercase tracking-widest border-b border-neutral-800 pb-2">Custom Measurements Trackers</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {customTypes.map(c => (
                    <div key={c.id} className="bg-neutral-950 p-3.5 border border-neutral-850 rounded-2xl flex items-center gap-3">
                      <div>
                        <span className="font-extrabold text-white uppercase block">{c.name}</span>
                        <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">Unit: {c.unit}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomType(c.id, c.name)}
                        className="text-neutral-500 hover:text-red-500 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Entries Log Sheet */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-white font-black text-xs uppercase tracking-widest border-b border-neutral-800 pb-2">
                All Logs History Checklist
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {measurements.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-4">No historical entry log files.</p>
                ) : (
                  measurements.map(m => (
                    <div key={m.id} className="bg-neutral-950 p-3.5 border border-neutral-850 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-extrabold uppercase font-bold">{m.measurementType}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">{new Date(m.createdAt).toLocaleDateString()}</span>
                        </div>
                        {m.note && <p className="text-[10px] italic text-neutral-500 mt-1">Note: {m.note}</p>}
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="font-mono text-white font-black bg-neutral-900 px-3 py-1 rounded-xl border border-neutral-800">
                          {m.value} {m.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(m.id, m.measurementType)}
                          className="text-neutral-600 hover:text-red-500 transition-all cursor-pointer p-1"
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
        )}

        {/* TAB 4: PROGRESS PHOTOS */}
        {activeTab === "photos" && (
          <div className="space-y-6">
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="text-white text-lg font-black uppercase tracking-widest">Progress Photos Timeline</h2>
              <p className="text-xs text-neutral-400">Securely catalogue photographs (Front, Side, Back) to construct side-by-side progression checks.</p>
            </div>

            {/* Photo upload form */}
            <form onSubmit={handlePhotoUploadSubmit} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
              <h3 className="text-white font-black text-xs uppercase tracking-widest">Add Progress Photograph</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Pose category:</label>
                  <select
                    value={photoUploadCat}
                    onChange={(e) => setPhotoUploadCat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-white"
                  >
                    <option value="Front">Front Silhouette</option>
                    <option value="Side">Side Silhouette</option>
                    <option value="Back">Back Silhouette</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Photo Reference URL:</label>
                  <input
                    type="text"
                    required
                    placeholder="Provide image link / placeholder url"
                    value={photoUploadRef}
                    onChange={(e) => setPhotoUploadRef(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-white"
                  />
                  <div className="mt-1 flex gap-1.5 text-[9px] uppercase font-bold text-neutral-500">
                    <span 
                      onClick={() => setPhotoUploadRef("https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400")} 
                      className="hover:text-white cursor-pointer underline"
                    >
                      Sample Gym 1
                    </span>
                    <span>•</span>
                    <span 
                      onClick={() => setPhotoUploadRef("https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400")} 
                      className="hover:text-white cursor-pointer underline"
                    >
                      Sample Gym 2
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Body Weight (KG, Optional):</label>
                  <input
                    type="number"
                    placeholder="e.g. 76.5"
                    value={photoUploadWeight}
                    onChange={(e) => setPhotoUploadWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Note / Context:</label>
                  <input
                    type="text"
                    placeholder="e.g. 4 weeks into cutting cycle"
                    value={photoUploadNote}
                    onChange={(e) => setPhotoUploadNote(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1">Visibility settings (Privacy):</label>
                  <select
                    value={photoUploadPrivacy}
                    onChange={(e) => setPhotoUploadPrivacy(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-white"
                  >
                    <option value="Private">Private to Member (Absolute Isolations)</option>
                    <option value="Trainer">Visible to Assigned Trainer</option>
                    <option value="Admin">Visible to Gym Admin & Staff ONLY</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-neutral-500 font-semibold pt-1">
                <p className="flex items-center gap-1.5 leading-normal">
                  <Lock className="h-3 w-3 text-red-500" />
                  Your photos are securely separated via authenticated member ID and never exposed to other gym attendees by defaults.
                </p>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-655 bg-red-600 hover:bg-red-700 text-black font-black uppercase text-[10px] tracking-widest rounded-xl cursor-pointer"
                >
                  Save Photo
                </button>
              </div>
            </form>

            {/* Before-After Progressive Comparison Workspace */}
            {progressPhotos.length > 1 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                  Visual Side-by-Side Progression Workspace
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-neutral-450 text-[10px] uppercase font-extrabold tracking-wider block mb-1">Left "Before" Photo Selection:</label>
                    <select
                      value={compPhotoLeft}
                      onChange={(e) => setCompPhotoLeft(e.target.value)}
                      className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
                    >
                      <option value="">Select log photo...</option>
                      {progressPhotos.map(p => (
                        <option key={p.id} value={p.photoUrl}>
                          {p.date} • {p.category} ({p.weight ? p.weight + "kg" : "N/A"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-450 text-[10px] uppercase font-extrabold tracking-wider block mb-1">Right "After" Photo Selection:</label>
                    <select
                      value={compPhotoRight}
                      onChange={(e) => setCompPhotoRight(e.target.value)}
                      className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
                    >
                      <option value="">Select log photo...</option>
                      {progressPhotos.map(p => (
                        <option key={p.id} value={p.photoUrl}>
                          {p.date} • {p.category} ({p.weight ? p.weight + "kg" : "N/A"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {compPhotoLeft && compPhotoRight && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl flex flex-col justify-between space-y-3">
                      <div className="h-72 w-full rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900">
                        <img src={compPhotoLeft} alt="Before preview" className="h-full w-full object-cover" />
                      </div>
                      <div className="text-center">
                        <span className="text-neutral-400 font-extrabold uppercase text-[10px] tracking-wider block">Before Baseline Record</span>
                      </div>
                    </div>

                    <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl flex flex-col justify-between space-y-3">
                      <div className="h-72 w-full rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900">
                        <img src={compPhotoRight} alt="After preview" className="h-full w-full object-cover" />
                      </div>
                      <div className="text-center">
                        <span className="text-red-500 font-extrabold uppercase text-[10px] tracking-wider block">After Progression Record</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Photos timeline display */}
            <div className="space-y-4">
              <h3 className="text-white font-black text-xs uppercase tracking-widest border-b border-neutral-800 pb-2">Photo Timeline Logs</h3>
              
              {progressPhotos.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500 bg-neutral-900/40 border border-neutral-850 rounded-3xl">
                  No photographs uploaded. Use the card above to catalogue progressions.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {progressPhotos.map(p => (
                    <div key={p.id} className="bg-neutral-900 border border-neutral-800 p-4.5 rounded-3xl space-y-3.5 flex flex-col justify-between">
                      <div className="h-56 w-full overflow-hidden border border-neutral-850 bg-neutral-950 rounded-2xl">
                        <img src={p.photoUrl} alt={p.category} className="h-full w-full object-cover" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="bg-red-650/15 border border-red-500/25 px-2.5 py-0.5 rounded text-red-500 font-black uppercase text-[9px] tracking-wider">{p.category}</span>
                          <span className="text-[10px] font-mono text-neutral-500 font-bold">{p.date}</span>
                        </div>

                        <div className="text-[11px] leading-relaxed font-semibold">
                          {p.weight && <p className="text-white">Logged Weight: <span className="font-mono text-red-500 font-extrabold">{p.weight} KG</span></p>}
                          {p.note && <p className="text-neutral-450 text-neutral-400">Note: {p.note}</p>}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-neutral-850">
                          <span className="text-[9px] text-neutral-5050 flex items-center gap-1 uppercase font-bold text-neutral-500">
                            <Lock className="h-2.5 w-2.5 text-neutral-600 animate-pulse" />
                            {p.visibility} Settings
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Delete this photograph entry permanently?")) {
                                setProgressPhotos(prev => prev.filter(photo => photo.id !== p.id));
                                triggerNotification("Deleted photo.");
                              }
                            }}
                            className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-red-500 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: HEALTH AND CONSIDERATIONS + PRIVACY */}
        {activeTab === "health" && (
          <div className="space-y-6">
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="text-white text-lg font-black uppercase tracking-widest">Health & AI Privacy Settings</h2>
              <p className="text-xs text-neutral-400">Manage movement restrictions or medical considerations and control AI data access.</p>
            </div>

            {/* Health Considerations Section */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Heart className="h-4.5 w-4.5 text-red-500" />
                Physical Considerations and Precautions
              </h3>
              <p className="text-[11px] text-neutral-500 leading-normal font-semibold">
                This is sensitive safety information. Only you, authorized instructors, and the AI agent may parse this box to prevent injuries. AI recommendations will actively avoid conflicting routines.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1.5">Previous Injuries / Surgeries:</label>
                  <input
                    type="text"
                    value={healthAndSafety.previousInjuries || ""}
                    onChange={(e) => setHealthAndSafety(p => ({ ...p, previousInjuries: e.target.value }))}
                    placeholder="e.g. Left shoulder ligament tear, March 2025"
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1.5">Movement Restrictions:</label>
                  <input
                    type="text"
                    value={healthAndSafety.movementRestrictions || ""}
                    onChange={(e) => setHealthAndSafety(p => ({ ...p, movementRestrictions: e.target.value }))}
                    placeholder="e.g. Avoid heavy overhead pressing"
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1.5">Medical Conditions Affecting Exercise:</label>
                  <input
                    type="text"
                    value={healthAndSafety.medicalConditions || ""}
                    onChange={(e) => setHealthAndSafety(p => ({ ...p, medicalConditions: e.target.value }))}
                    placeholder="e.g. Mild asthma (keep inhaler nearby)"
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] font-bold uppercase block mb-1.5">Doctor Recommendations:</label>
                  <input
                    type="text"
                    value={healthAndSafety.doctorRecommendations || ""}
                    onChange={(e) => setHealthAndSafety(p => ({ ...p, doctorRecommendations: e.target.value }))}
                    placeholder="e.g. Keep heartrate below 160 bpm"
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Explicit Safety Disclaimer Checkout */}
              <div className="pt-3 border-t border-neutral-850">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={healthAndSafety.disclaimerAccepted}
                    onChange={(e) => setHealthAndSafety(p => ({ ...p, disclaimerAccepted: e.target.checked }))}
                    className="mt-1 accent-red-500 rounded h-4 w-4 shrink-0"
                  />
                  <div className="text-[11px] text-neutral-400 leading-relaxed font-semibold">
                    <span className="text-white font-extrabold uppercase text-[10px] block mb-0.5">Strict AI Safety & Advisor Disclaimer Acknowledgement:</span>
                    I understand that the Life Fitness AI Assistant only delivers general educational fitness/nutrition and technique recommendations. It does NOT replace professional medical consults, diagnostic services, dietitians, or certified personal coaches.
                  </div>
                </label>
              </div>
            </div>

            {/* AI Privacy Setting Collection */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <h3 className="text-white font-black text-xs uppercase tracking-widest border-b border-neutral-850 pb-3">
                AI Privacy Logs Consent Configurator
              </h3>
              <p className="text-[11px] text-neutral-500 font-semibold leading-normal">
                Control which personal logs the AI Coach can parse. Enabling allows personalized workout planning and progress reviews. Disabling treats the prompt with clean baseline context values.
              </p>

              <div className="space-y-2.5">
                {[
                  { id: "bodyMeasurements", label: "Include Body Measurements Progress Charts", desc: "Allow AI to calculate percentage weight gains or waist trends." },
                  { id: "attendance", label: "Include Attendance Registrations History", desc: "Allow AI to analyze consistency and weekly attendances." },
                  { id: "workoutHistory", label: "Include Logged Completed Workouts Logs", desc: "Allow AI to adapt suggestions to previously trained routine modules." },
                  { id: "competitionHistory", label: "Include Monthly Tournaments Submissions Standing", desc: "Allow AI to supply preparation targets and technique reviews." },
                  { id: "healthConsiderations", label: "Include Health Considerations Restrictions & Injures", desc: "Allows AI to explicitly skip dangerous exercises from generated plans.", warning: true },
                ].map(item => {
                  const active = (consentSettings as any)[item.id] === true;
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-2xl flex items-center justify-between gap-4 border transition-all ${
                        active ? "bg-neutral-950 border-neutral-800" : "bg-neutral-950/40 border-neutral-900"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-white font-extrabold text-[11px] uppercase block flex items-center gap-1.5">
                          {item.label}
                          {item.warning && (
                            <span className="bg-red-650/15 border border-red-500/20 text-red-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Highly Recommended</span>
                          )}
                        </span>
                        <p className="text-[10px] text-neutral-550 text-neutral-500 font-semibold">{item.desc}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setConsentSettings(prev => ({
                            ...prev,
                            [item.id]: !active
                          }));
                          triggerNotification("AI privacy permissions updated.");
                        }}
                        className={`w-12 h-6.5 rounded-full p-1 transition-all cursor-pointer shrink-0 ${
                          active ? "bg-red-600" : "bg-neutral-800"
                        }`}
                      >
                        <div className={`h-4.5 w-4.5 rounded-full bg-black transition-all ${
                          active ? "translate-x-5.5" : "translate-x-0"
                        }`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  triggerNotification("Health and AI Consent settings committed.");
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
              >
                Save Health Parameters
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
