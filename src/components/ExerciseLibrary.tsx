import React, { useState, useEffect } from "react";
import { 
  Dumbbell, 
  Search, 
  Trash2, 
  Heart, 
  BookmarkCheck, 
  Plus, 
  Video, 
  Save, 
  Flame, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Award,
  Play,
  RotateCw,
  Notebook
} from "lucide-react";
import { Member, SavedExercise, MemberWorkoutExercise } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc 
} from "firebase/firestore";

interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  category: string;
  difficulty: string;
  force?: string;
  mechanic?: string;
  instructions: string[];
  video_branded?: string;
  video_unbranded?: string;
  primary_machine_id?: string;
  secondary_machine_id?: string;
}

interface ExerciseLibraryProps {
  member: Member;
}

export default function ExerciseLibrary({ member }: ExerciseLibraryProps) {
  // Navigation tabs inside exercise space
  const [libraryTab, setLibraryTab] = useState<"catalog" | "saved" | "routine">("catalog");

  // Search and browse filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  // Server data fetch states
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [muscles, setMuscles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  // Expanded content details
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Saved Exercises & Custom Workout Routines lists
  const [savedList, setSavedList] = useState<SavedExercise[]>([]);
  const [workoutRoutine, setWorkoutRoutine] = useState<Partial<MemberWorkoutExercise>[]>([]);
  const [savedRoutines, setSavedRoutines] = useState<MemberWorkoutExercise[]>([]);

  // Action status feedbacks
  const [saveLoading, setSaveLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Edit/View personal annotation note states on saved exercises
  const [activeNoteEditId, setActiveNoteEditId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");

  // Fetch initial categories, muscles and default exercises
  useEffect(() => {
    async function fetchFiltersAndCatalog() {
      setLoading(true);
      setErrorText("");
      try {
        const catRes = await fetch("/api/musclewiki/categories");
        if (catRes.ok) {
          const cats = await catRes.json();
          setCategories(Array.isArray(cats) ? cats : []);
        }

        const musRes = await fetch("/api/musclewiki/muscles");
        if (musRes.ok) {
          const mus = await musRes.json();
          setMuscles(Array.isArray(mus) ? mus : []);
        }

        // Default initial exercises search
        await handleSearch(true);
      } catch (err: any) {
        setErrorText("Failed to retrieve filters or catalogue. Operating in fallback mode.");
      } finally {
        setLoading(false);
      }
    }
    fetchFiltersAndCatalog();
    fetchSavedFromFirestore();
    fetchUserSavedRoutines();
  }, []);

  // Fetch saved exercises list
  const fetchSavedFromFirestore = async () => {
    try {
      const q = query(collection(db, "savedExercises"), where("memberId", "==", member.id));
      const querySnapshot = await getDocs(q);
      const items: SavedExercise[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as SavedExercise);
      });
      setSavedList(items);
      localStorage.setItem(`lf_saved_exercises_${member.id}`, JSON.stringify(items));
    } catch (err) {
      console.warn("Failed to load saved exercises from Firestore. Using local storage backup:", err);
      const backup = localStorage.getItem(`lf_saved_exercises_${member.id}`);
      if (backup) {
        try {
          setSavedList(JSON.parse(backup));
        } catch (_) {
          setSavedList([]);
        }
      } else {
        setSavedList([]);
      }
    }
  };

  // Fetch created routines
  const fetchUserSavedRoutines = async () => {
    try {
      const q = query(collection(db, "memberWorkoutExercises"), where("memberId", "==", member.id));
      const querySnapshot = await getDocs(q);
      const items: MemberWorkoutExercise[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as MemberWorkoutExercise);
      });
      // Sort by order/name
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      setSavedRoutines(items);
      localStorage.setItem(`lf_workout_exercises_${member.id}`, JSON.stringify(items));
    } catch (err) {
      console.warn("Failed to fetch custom routines from Firestore. Using local storage backup:", err);
      const backup = localStorage.getItem(`lf_workout_exercises_${member.id}`);
      if (backup) {
        try {
          const items: MemberWorkoutExercise[] = JSON.parse(backup);
          items.sort((a, b) => (a.order || 0) - (b.order || 0));
          setSavedRoutines(items);
        } catch (_) {
          setSavedRoutines([]);
        }
      } else {
        setSavedRoutines([]);
      }
    }
  };

  // Search logic
  const handleSearch = async (initial = false) => {
    setLoading(true);
    setErrorText("");
    try {
      const parts = [];
      if (searchTerm) parts.push(`search=${encodeURIComponent(searchTerm)}`);
      if (selectedMuscle) parts.push(`muscles=${encodeURIComponent(selectedMuscle)}`);
      if (selectedCategory) parts.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (selectedDifficulty) parts.push(`difficulty=${encodeURIComponent(selectedDifficulty)}`);
      parts.push(`memberId=${encodeURIComponent(member.id)}`);

      const queryUrl = `/api/musclewiki/search?${parts.join("&")}`;
      const res = await fetch(queryUrl);
      if (!res.ok) {
        throw new Error("Unable to fetch matching queries.");
      }
      const data = await res.json();
      setExercises(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorText("Error loading workouts. Displaying standard catalog options.");
    } finally {
      setLoading(false);
    }
  };

  // Save/Bookmark exercise
  const handleSaveExercise = async (ex: Exercise) => {
    const docId = `${member.id}_${ex.id}`;
    const data: SavedExercise = {
      id: docId,
      memberId: member.id,
      provider: "musclewiki",
      externalExerciseId: ex.id,
      exerciseName: ex.name,
      primaryMuscles: ex.primaryMuscles,
      category: ex.category,
      difficulty: ex.difficulty,
      savedAt: new Date().toISOString(),
      personalNote: ""
    };

    // Immediate optimistic local update
    const updatedList = [data, ...savedList.filter(s => s.id !== docId)];
    setSavedList(updatedList);
    localStorage.setItem(`lf_saved_exercises_${member.id}`, JSON.stringify(updatedList));

    try {
      await setDoc(doc(db, "savedExercises", docId), data);
      showToast("Exercise successfully saved to bookmarks!");
      fetchSavedFromFirestore();
    } catch (err) {
      console.warn("Firestore save deferred. Saved locally:", err);
      showToast("Saved to bookmarks locally.");
    }
  };

  // Remove saved exercise
  const handleUnsaveExercise = async (savedId: string) => {
    // Immediate optimistic local update
    const updatedList = savedList.filter(s => s.id !== savedId);
    setSavedList(updatedList);
    localStorage.setItem(`lf_saved_exercises_${member.id}`, JSON.stringify(updatedList));

    try {
      await deleteDoc(doc(db, "savedExercises", savedId));
      showToast("Removed from bookmarks.");
      fetchSavedFromFirestore();
    } catch (err) {
      console.warn("Firestore delete deferred. Removed locally:", err);
      showToast("Removed bookmark locally.");
    }
  };

  // Add personal note
  const handleUpdateNote = async (savedId: string) => {
    const match = savedList.find(s => s.id === savedId);
    if (!match) return;

    const updated = { ...match, personalNote: tempNoteText };
    // Immediate optimistic local update
    const updatedList = savedList.map(s => s.id === savedId ? updated : s);
    setSavedList(updatedList);
    localStorage.setItem(`lf_saved_exercises_${member.id}`, JSON.stringify(updatedList));

    try {
      await setDoc(doc(db, "savedExercises", savedId), updated);
      setActiveNoteEditId(null);
      showToast("Added note annotation successfully.");
      fetchSavedFromFirestore();
    } catch (err) {
      console.warn("Firestore note update deferred. Updated locally:", err);
      setActiveNoteEditId(null);
      showToast("Updated note annotation locally.");
    }
  };

  // Add exercise to active Workout Routine Builder
  const handleAddToRoutine = (ex: Exercise | SavedExercise) => {
    const isSavedEntity = "externalExerciseId" in ex;
    const name = isSavedEntity ? (ex as SavedExercise).exerciseName : (ex as Exercise).name;
    const extId = isSavedEntity ? (ex as SavedExercise).externalExerciseId : (ex as Exercise).id;
    const primaryMuscles = isSavedEntity ? (ex as SavedExercise).primaryMuscles : (ex as Exercise).primaryMuscles;
    const category = isSavedEntity ? (ex as SavedExercise).category : (ex as Exercise).category;

    const newItem: Partial<MemberWorkoutExercise> = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      memberId: member.id,
      externalExerciseId: extId,
      exerciseName: name,
      provider: "musclewiki",
      primaryMuscles: primaryMuscles,
      category: category,
      sets: 3,
      reps: "12, 10, 8",
      restSeconds: 60,
      weight: "Bodyweight",
      notes: "",
      order: workoutRoutine.length + 1
    };

    setWorkoutRoutine([...workoutRoutine, newItem]);
    showToast(`Added ${name} directly to routine constructor!`);
  };

  // Save completed workout routine to Firestore database
  const handleSaveWholeRoutine = async () => {
    if (workoutRoutine.length === 0) {
      showToast("Workout is currently blank!");
      return;
    }
    setSaveLoading(true);

    const preparedItems: MemberWorkoutExercise[] = workoutRoutine.map(item => {
      const routineDocId = `routine_${item.id}`;
      return {
        ...item,
        id: routineDocId,
        savedAt: new Date().toISOString()
      } as MemberWorkoutExercise;
    });

    // Immediate optimistic local update
    const updatedRoutines = [...preparedItems, ...savedRoutines];
    setSavedRoutines(updatedRoutines);
    localStorage.setItem(`lf_workout_exercises_${member.id}`, JSON.stringify(updatedRoutines));
    setWorkoutRoutine([]);
    setLibraryTab("routine");

    try {
      for (const item of preparedItems) {
        if (!item.id || !item.exerciseName) continue;
        await setDoc(doc(db, "memberWorkoutExercises", item.id), item);
      }
      showToast("Gym routine successfully built and synchronized!");
      fetchUserSavedRoutines();
    } catch (err) {
      console.warn("Firestore routine save deferred. Saved locally:", err);
      showToast("Gym routine successfully built offline!");
    } finally {
      setSaveLoading(false);
    }
  };

  // Remove routine block
  const handleRemoveRoutineItem = async (routineId: string) => {
    // Immediate optimistic local update
    const updatedRoutines = savedRoutines.filter(r => r.id !== routineId);
    setSavedRoutines(updatedRoutines);
    localStorage.setItem(`lf_workout_exercises_${member.id}`, JSON.stringify(updatedRoutines));

    try {
      await deleteDoc(doc(db, "memberWorkoutExercises", routineId));
      showToast("Exercise item removed.");
      fetchUserSavedRoutines();
    } catch (err) {
      console.warn("Firestore routine remove deferred. Removed locally:", err);
      showToast("Exercise item removed locally.");
    }
  };

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(""), 4000);
  };

  // Clean gender displays
  const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6 relative overflow-hidden" id="exercise-library-container">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-8 right-8 z-50 bg-red-650 bg-red-600 border border-red-500 text-black font-extrabold py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-2 text-xs uppercase animate-bounce">
          <Award className="h-4.5 w-4.5 shrink-0" />
          {feedbackMsg}
        </div>
      )}

      {/* Header section with brand colors */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-red-500 font-extrabold text-[10px] tracking-widest uppercase block mb-1">MuscleWiki Integrated System</span>
          <h2 className="text-white text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Dumbbell className="h-5 sm:h-6 w-5 sm:w-6 text-red-500 shrink-0" />
            Exercise Library & Routine Builder
          </h2>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-neutral-950 border border-neutral-850 p-1 rounded-xl gap-1 w-full md:w-auto overflow-x-auto">
          <button 
            onClick={() => setLibraryTab("catalog")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              libraryTab === "catalog" ? "bg-red-600 text-black font-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            Browse Wiki
          </button>
          <button 
            onClick={() => setLibraryTab("saved")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              libraryTab === "saved" ? "bg-red-600 text-black font-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Heart className="h-3.5 w-3.5" />
            Bookmarks ({savedList.length})
          </button>
          <button 
            onClick={() => setLibraryTab("routine")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              libraryTab === "routine" ? "bg-red-600 text-black font-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            <BookmarkCheck className="h-3.5 w-3.5" />
            My Active Routines
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: BROWSE CATALOG ======================= */}
      {libraryTab === "catalog" && (
        <div className="space-y-6">
          {/* Advanced Search Bars Grid card */}
          <div className="bg-neutral-950 border border-neutral-850/60 p-5 rounded-2xl space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input 
                  type="text" 
                  placeholder="Query: 'chest press', 'barbell', 'bicep'..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
                />
              </div>
              <button 
                onClick={() => handleSearch()}
                className="bg-red-655 bg-red-600 hover:bg-red-700 text-black font-black text-xs uppercase px-5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                Search
              </button>
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block mb-1">Target Muscle Group</label>
                <select 
                  value={selectedMuscle} 
                  onChange={(e) => setSelectedMuscle(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2 md:p-2.5 text-xs text-neutral-300 focus:outline-none focus:border-red-600"
                >
                  <option value="">-- All Muscles --</option>
                  {muscles.map((m) => (
                    <option key={m} value={m}>{capitalize(m)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block mb-1">Equipment Category</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2 md:p-2.5 text-xs text-neutral-300 focus:outline-none focus:border-red-600"
                >
                  <option value="">-- All Equipment --</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{capitalize(c)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block mb-1">Difficulty Tier</label>
                <select 
                  value={selectedDifficulty} 
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2 md:p-2.5 text-xs text-neutral-300 focus:outline-none focus:border-red-600"
                >
                  <option value="">-- All Tiers --</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results section */}
          {errorText && (
            <div className="border border-red-500/10 bg-red-650/5 text-red-400 p-4 rounded-xl text-center text-xs">
              {errorText}
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
              <RotateCw className="h-8 w-8 text-red-500 animate-spin" />
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider animate-pulse">Consulting MuscleWiki Library...</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-neutral-800 rounded-3xl text-neutral-5050 text-neutral-500">
              <SlidersHorizontal className="h-10 w-10 mx-auto text-neutral-700 mb-2" />
              <p className="text-xs font-bold uppercase">No matching exercises found.</p>
              <p className="text-[11px] text-neutral-600 mt-1">Refine your tags/keywords search above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">Loaded {exercises.length} Exercises from global database</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exercises.map((ex) => {
                  const isExpanded = expandedExerciseId === ex.id;
                  const isSaved = savedList.some(s => s.externalExerciseId === ex.id);

                  return (
                    <div 
                      key={ex.id} 
                      className={`bg-neutral-950 border rounded-2xl transition-all text-xs flex flex-col justify-between ${
                        isExpanded ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-neutral-850/60 hover:border-neutral-800"
                      }`}
                    >
                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-red-500 font-extrabold text-[9px] uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded border border-red-950/20">{ex.category}</span>
                            <h3 className="text-white font-extrabold text-sm uppercase mt-1.5 leading-snug">{ex.name}</h3>
                          </div>
                          
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => isSaved ? handleUnsaveExercise(savedList.find(s => s.externalExerciseId === ex.id)!.id) : handleSaveExercise(ex)}
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                isSaved 
                                  ? "bg-red-600/10 border-red-500/20 text-red-500" 
                                  : "bg-neutral-900 border-neutral-800 text-neutral-450 hover:text-white"
                              }`}
                              title={isSaved ? "Remove from bookmarks" : "Save to bookmarks"}
                            >
                              <Heart className="h-4.5 w-4.5 fill-current" />
                            </button>
                            <button
                              onClick={() => handleAddToRoutine(ex)}
                              className="p-2 bg-neutral-900 border border-neutral-800 text-neutral-450 hover:text-white rounded-xl hover:border-red-500 transition-all cursor-pointer"
                              title="Add to daily routine"
                            >
                              <Plus className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>

                        {/* Badges specifications list */}
                        <div className="flex flex-wrap gap-1.5 text-[10px] uppercase font-bold text-neutral-400">
                          <span className="bg-neutral-900 px-2.5 py-1 rounded">Primary: <span className="text-neutral-200">{(ex.primaryMuscles || []).join(", ")}</span></span>
                          {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
                            <span className="bg-neutral-900 px-2.5 py-1 rounded">Sec: <span className="text-neutral-300">{(ex.secondaryMuscles || []).join(", ")}</span></span>
                          )}
                          <span className="bg-neutral-900 px-2.5 py-1 rounded">Level: <span className="text-red-400">{ex.difficulty}</span></span>
                        </div>
                      </div>

                      {/* Expandable step instructions or videos section */}
                      {isExpanded ? (
                        <div className="p-5 border-t border-neutral-900 bg-neutral-950/80 space-y-4 animate-fade-in text-[11px] leading-relaxed">
                          {/* Station Floor Map integration */}
                          <div className="p-3 bg-neutral-900/60 border border-neutral-850/60 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <span className="text-red-500 font-extrabold text-[8px] uppercase tracking-wider block">Station Floor Mapping</span>
                              <span className="text-white font-black uppercase text-[9.5px] block mt-0.5">
                                📟 Mapped: {ex.name.toLowerCase().includes("bench") ? "Olympic Bench Press" : ex.name.toLowerCase().includes("squat") ? "Linear Smith Cage" : ex.name.toLowerCase().includes("pulldown") || ex.name.toLowerCase().includes("lat") ? "High Lat Tower" : ex.name.toLowerCase().includes("curl") ? "Preacher Arm Bench" : ex.name.toLowerCase().includes("cable") ? "Cable Overpass" : "Dumbbell Racks / Multi-Zone"}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const targetTerm = ex.name.toLowerCase().includes("bench") ? "bench" 
                                  : ex.name.toLowerCase().includes("squat") ? "squat"
                                  : ex.name.toLowerCase().includes("pulldown") || ex.name.toLowerCase().includes("lat") ? "lat"
                                  : ex.name.toLowerCase().includes("curl") ? "curl"
                                  : ex.name.toLowerCase().includes("cable") ? "cable"
                                  : "dumbbell";
                                sessionStorage.setItem("flr_target_machine", targetTerm);
                                alert(`📍 Map Pin set for physical gym station: "${targetTerm.toUpperCase()}".\nNavigate to "Floor Map & Glitch Desk" tab at top options to view the pulsing station location!`);
                              }}
                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-black font-black uppercase text-[8px] tracking-wider rounded-lg transition-all cursor-pointer"
                            >
                              📍 Locate
                            </button>
                          </div>

                          {/* Instructions */}
                          <div className="space-y-2">
                            <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest block">Execution Steps:</span>
                            <ol className="list-decimal list-inside space-y-1.5 text-neutral-300 pl-1 font-medium">
                              {(ex.instructions || []).map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>

                          {/* Video rendering securely via server-side proxy */}
                          {(ex.video_branded || ex.video_unbranded) && (
                            <div className="space-y-2">
                              <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest block flex items-center gap-1.5">
                                <Video className="h-3.5 w-3.5 text-red-500" />
                                Secure Demo Loop:
                              </span>
                              <div className="relative rounded-xl overflow-hidden border border-neutral-850 bg-black aspect-video">
                                <video 
                                  src={`/api/musclewiki/media/video?path=${encodeURIComponent(ex.video_branded || ex.video_unbranded || "")}&memberId=${encodeURIComponent(member.id)}`}
                                  controls 
                                  loop 
                                  muted 
                                  playsInline
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          )}

                          <button 
                            onClick={() => setExpandedExerciseId(null)}
                            className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 rounded-xl text-neutral-400 hover:text-white uppercase font-bold text-[10px] tracking-wide flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <ChevronUp className="h-3.5 w-3.5" /> Close Steps
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 border-t border-neutral-900 bg-neutral-900/30 flex justify-center">
                          <button 
                            onClick={() => setExpandedExerciseId(ex.id)}
                            className="text-[10px] font-black uppercase text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <ChevronDown className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                            View Execution Steps & Video Demo
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: MY BOOKMARKS ======================= */}
      {libraryTab === "saved" && (
        <div className="space-y-6">
          {savedList.length === 0 ? (
            <div className="p-16 text-center border border-dashed border-neutral-800 rounded-3xl text-neutral-500">
              <Heart className="h-10 w-10 mx-auto text-neutral-700 mb-2" />
              <p className="text-xs font-bold uppercase">No bookmarked exercises yet.</p>
              <p className="text-[11px] text-neutral-600 mt-1">Browse the library and tap the heart icon to save favorite movements.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedList.map((item) => (
                <div key={item.id} className="bg-neutral-950 border border-neutral-850 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex gap-1.5 items-center">
                        <span className="text-[9px] font-extrabold uppercase bg-red-600/10 text-red-500 px-20 py-0.5 rounded border border-red-950/20">{item.category}</span>
                        <span className="text-[10px] text-neutral-500 font-bold uppercase">{item.difficulty}</span>
                      </div>
                      <h3 className="text-white font-extrabold text-sm uppercase mt-1.5 leading-snug">{item.exerciseName}</h3>
                      <p className="text-[9px] text-neutral-500 mt-0.5">Target: {(item.primaryMuscles || []).join(", ")}</p>
                    </div>

                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleAddToRoutine(item)}
                        className="p-1.5 bg-neutral-900 border border-neutral-800 rounded bg-green-600/10 text-green-400 hover:bg-green-600/25 border-green-500/20 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-extrabold uppercase"
                        title="Add to constructor"
                      >
                        <Plus className="h-3.5 w-3.5" /> Routine
                      </button>
                      <button 
                        onClick={() => handleUnsaveExercise(item.id)}
                        className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-500 hover:text-red-500 transition-all cursor-pointer"
                        title="Remove bookmark"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Personal Annotations note container */}
                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-850 space-y-2">
                    <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest block flex items-center gap-1">
                      <Notebook className="h-3 w-3 text-red-500" /> My Personal Note / Target Weight
                    </span>

                    {activeNoteEditId === item.id ? (
                      <div className="space-y-2">
                        <textarea 
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-[11px] text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-red-600"
                          placeholder="e.g. 'Stretching lower back. Record: 4 sets of 12 reps @ 65kg'"
                          value={tempNoteText}
                          onChange={(e) => setTempNoteText(e.target.value)}
                        />
                        <div className="flex gap-1 justify-end">
                          <button 
                            onClick={() => setActiveNoteEditId(null)}
                            className="bg-neutral-800 text-neutral-400 text-[10px] font-extrabold uppercase px-3 py-1 rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => handleUpdateNote(item.id)}
                            className="bg-red-600 text-black text-[10px] font-black uppercase px-3 py-1 rounded cursor-pointer"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-4">
                        <p className="text-[11px] text-neutral-300 italic min-h-[1.5rem] leading-snug">
                          {item.personalNote || "No active annotations appended yet."}
                        </p>
                        <button 
                          onClick={() => {
                            setActiveNoteEditId(item.id);
                            setTempNoteText(item.personalNote || "");
                          }}
                          className="text-[9px] uppercase font-black text-red-500 hover:underline shrink-0 block"
                        >
                          Edit note
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 3: CUSTOM WORKOUT CONSTRUCTOR ======================= */}
      {libraryTab === "routine" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* WORKOUT SESSION BUILDER PANEL */}
            <div className="lg:col-span-7 bg-neutral-950 border border-neutral-850 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                <div>
                  <h3 className="text-white font-extrabold text-xs uppercase flex items-center gap-1.5">
                    <SlidersHorizontal className="h-4 w-4 text-red-500" />
                    Routine Constructor Box
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Stack workout targets to sync live to your profile</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-neutral-500 uppercase block tracking-wider font-extrabold">Total Items:</span>
                  <span className="font-mono text-white text-base font-black leading-none">{workoutRoutine.length} Exercises</span>
                </div>
              </div>

              {workoutRoutine.length === 0 ? (
                <div className="py-16 text-center text-neutral-500">
                  <SlidersHorizontal className="h-8 w-8 text-neutral-800 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs font-bold uppercase text-neutral-600">Constructor is currently empty.</p>
                  <p className="text-[10px] text-neutral-700 mt-1 max-w-sm mx-auto">Click 'Add to daily routine' from bookmarks or catalogs to begin mapping custom sports regimes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workoutRoutine.map((item, idx) => (
                    <div key={item.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-850 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[9px] font-extrabold text-red-500 uppercase tracking-widest block mb-0.5">Exercise #{idx + 1}</span>
                          <h4 className="text-white font-extrabold text-xs uppercase">{item.exerciseName}</h4>
                        </div>
                        <button 
                          onClick={() => setWorkoutRoutine(workoutRoutine.filter(w => w.id !== item.id))}
                          className="text-neutral-500 hover:text-red-500 shrink-0 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Custom sets/reps/weights parameters inputs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] uppercase font-bold text-neutral-500">
                        <div>
                          <label className="block text-[8px] uppercase tracking-wider mb-1">Sets Count</label>
                          <input 
                            type="number"
                            min="1"
                            max="10"
                            value={item.sets || 3}
                            onChange={(e) => {
                              const list = [...workoutRoutine];
                              list[idx].sets = Number(e.target.value) || 3;
                              setWorkoutRoutine(list);
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-white text-center text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] uppercase tracking-wider mb-1">Reps Schema</label>
                          <input 
                            type="text"
                            placeholder="e.g. 12, 10, 8"
                            value={item.reps || "12, 10, 8"}
                            onChange={(e) => {
                              const list = [...workoutRoutine];
                              list[idx].reps = e.target.value;
                              setWorkoutRoutine(list);
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-white text-center text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] uppercase tracking-wider mb-1">Rest Time (s)</label>
                          <input 
                            type="number"
                            step="5"
                            value={item.restSeconds || 60}
                            onChange={(e) => {
                              const list = [...workoutRoutine];
                              list[idx].restSeconds = Number(e.target.value) || 60;
                              setWorkoutRoutine(list);
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-white text-center text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] uppercase tracking-wider mb-1">Target Weight</label>
                          <input 
                            type="text"
                            placeholder="e.g. 45 kg"
                            value={item.weight || "Bodyweight"}
                            onChange={(e) => {
                              const list = [...workoutRoutine];
                              list[idx].weight = e.target.value;
                              setWorkoutRoutine(list);
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-white text-center text-xs"
                          />
                        </div>
                      </div>

                      {/* Instructor feedback notes */}
                      <div>
                        <label className="block text-[8px] uppercase tracking-wider mb-1 text-neutral-500 font-bold">Personal Routine Note</label>
                        <input 
                          type="text" 
                          placeholder="Note: Focus on deep squeeze at top."
                          value={item.notes || ""}
                          onChange={(e) => {
                            const list = [...workoutRoutine];
                            list[idx].notes = e.target.value;
                            setWorkoutRoutine(list);
                          }}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-neutral-300 text-xs text-left"
                        />
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={handleSaveWholeRoutine}
                    disabled={saveLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-black font-black text-xs uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md mt-4 cursor-pointer disabled:opacity-40"
                  >
                    <Save className="h-4 w-4" />
                    {saveLoading ? "Synchronizing Gym Matrix..." : "Save Completed Routine Session"}
                  </button>
                </div>
              )}
            </div>

            {/* MY HISTORY SAVED ROUTINES PANEL */}
            <div className="lg:col-span-5 bg-neutral-950 border border-neutral-850 p-5 rounded-2xl space-y-4">
              <h3 className="text-white font-extrabold text-xs uppercase flex items-center gap-1.5 border-b border-neutral-900 pb-3">
                <BookmarkCheck className="h-4 w-4 text-red-500 animate-pulse" />
                Linked Workout Routines
              </h3>

              <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
                {savedRoutines.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-10 leading-normal">
                    No persistent training schedules saved yet. Build routine schemes in constructor box.
                  </p>
                ) : (
                  savedRoutines.map((r, index) => (
                    <div key={r.id} className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-850 text-xs relative space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[8px] font-extrabold text-red-500 uppercase tracking-widest block">Workout Element #{index + 1}</span>
                          <h4 className="text-white font-extrabold uppercase truncate mt-0.5 max-w-[170px]">{r.exerciseName}</h4>
                        </div>
                        <button 
                          onClick={() => handleRemoveRoutineItem(r.id)}
                          className="text-neutral-500 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400 bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-850/40">
                        <div>
                          <span className="text-[8px] block uppercase text-neutral-500">Sets & Reps:</span>
                          <span className="font-extrabold text-white">{r.sets} Sets ({r.reps})</span>
                        </div>
                        <div>
                          <span className="text-[8px] block uppercase text-neutral-500">Target Weight:</span>
                          <span className="font-extrabold text-red-400">{r.weight || "Bodyweight"}</span>
                        </div>
                        {r.restSeconds !== undefined && (
                          <div className="col-span-2">
                            <span className="text-[8px] block uppercase text-neutral-500">Rest Cycle Time:</span>
                            <span className="font-extrabold text-neutral-300 font-mono">{r.restSeconds} seconds</span>
                          </div>
                        )}
                        {r.notes && (
                          <div className="col-span-2 mt-1">
                            <span className="text-[8px] block uppercase text-neutral-500 text-semibold">Instructions Notes:</span>
                            <p className="text-neutral-300 italic">{r.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
