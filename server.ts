import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// ==========================================
// MUSCELWIKI INTEGRATION & MOCK DATABASE
// ==========================================

const MOCK_EXERCISES = [
  {
    id: "mw-1",
    name: "Barbell Bench Press",
    primaryMuscles: ["Chest"],
    secondaryMuscles: ["Triceps", "Shoulders"],
    category: "barbell",
    difficulty: "intermediate",
    force: "push",
    mechanic: "compound",
    grips: "pronated",
    instructions: [
      "Lie flat on the bench with your feet flat on the floor.",
      "Grip the barbell with hands slightly wider than shoulder-width, palms facing away from you.",
      "Lower the bar slowly to your chest while keeping your elbows at 45 degrees.",
      "Push the bar back up with force, squeezing your chest at the top."
    ],
    video_branded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    video_unbranded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  },
  {
    id: "mw-2",
    name: "Dumbbell Bicep Curl",
    primaryMuscles: ["Biceps"],
    secondaryMuscles: ["Forearms"],
    category: "dumbbell",
    difficulty: "beginner",
    force: "pull",
    mechanic: "isolation",
    grips: "supinated",
    instructions: [
      "Stand tall holding dumbbells at your sides, palms facing in.",
      "Curl the weights up while keeping your elbows pinned close to your body.",
      "Squeeze your biceps at the top and lower under full control."
    ],
    video_branded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    video_unbranded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
  },
  {
    id: "mw-3",
    name: "Bodyweight Pull-Up",
    primaryMuscles: ["Back"],
    secondaryMuscles: ["Biceps", "Shoulders"],
    category: "bodyweight",
    difficulty: "advanced",
    force: "pull",
    mechanic: "compound",
    grips: "pronated",
    instructions: [
      "Grip the overhead pull-up bar wider than shoulder-width, palms facing forward.",
      "Hang with arms fully extended and core engaged.",
      "Pull yourself up until your chin clears the bar, focusing on driving your elbows down.",
      "Slowly lower yourself back to the starting hang position."
    ],
    video_branded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    video_unbranded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4"
  },
  {
    id: "mw-4",
    name: "Barbell Back Squat",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Hamstrings", "Core"],
    category: "barbell",
    difficulty: "intermediate",
    force: "push",
    mechanic: "compound",
    grips: "pronated",
    instructions: [
      "Safely rest the barbell on your upper back trapezius, gripping it firmly.",
      "Stand shoulder-width apart and lower your hips down as if sitting in a chair.",
      "Keep your chest upright, descend until parallel, then drive through your heels."
    ],
    video_branded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    video_unbranded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
  },
  {
    id: "mw-5",
    name: "Plank Hold",
    primaryMuscles: ["Abs"],
    secondaryMuscles: ["Core", "Shoulders"],
    category: "bodyweight",
    difficulty: "beginner",
    force: "static",
    mechanic: "isolation",
    grips: "neutral",
    instructions: [
      "Adopt a pushup-like position but rest your body weight on your forearms rather than your hands.",
      "Contract your abdominal wall tightly and squeeze your glutes.",
      "Maintain a perfectly straight horizontal torso from heels to neck."
    ],
    video_branded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    video_unbranded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
  },
  {
    id: "mw-6",
    name: "Cable Chest Crossover",
    primaryMuscles: ["Chest"],
    secondaryMuscles: ["Shoulders"],
    category: "cable",
    difficulty: "intermediate",
    force: "push",
    mechanic: "isolation",
    grips: "pronated",
    instructions: [
      "Stand between two cable columns, grab cables, and take a moderate step forward.",
      "Bring your hands together in a wide hugging motion, flexing your pectorals.",
      "Hold a deep squeeze for a full second, then relax back under control."
    ],
    video_branded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    video_unbranded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"
  },
  {
    id: "mw-7",
    name: "Dumbbell Shoulder Press",
    primaryMuscles: ["Shoulders"],
    secondaryMuscles: ["Triceps"],
    category: "dumbbell",
    difficulty: "beginner",
    force: "push",
    mechanic: "compound",
    grips: "pronated",
    instructions: [
      "Sit on an upright bench with dumbbells at shoulder level, palms forward.",
      "Press dumbbells directly upward until arms are straight overhead.",
      "Lower the weights slowly back to shoulder-level spacing."
    ],
    video_branded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    video_unbranded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  },
  {
    id: "mw-8",
    name: "Machine Leg Extension",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: [],
    category: "machine",
    difficulty: "beginner",
    force: "push",
    mechanic: "isolation",
    grips: "neutral",
    instructions: [
      "Adjust the seat so your knees align with the pivot point of the extension arm.",
      "Secure shins under the padded extension bar, grasping handles.",
      "Contract thighs and extend knees fully, then slowly release downward."
    ],
    video_branded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    video_unbranded: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  }
];

// Server Configuration & Caching states
let muscleWikiSettingsServer = {
  enabled: true,
  defaultGender: process.env.MUSCLEWIKI_DEFAULT_GENDER || "male",
  preferredVideoType: "auto", // branded, unbranded, auto
  apiBaseUrl: process.env.MUSCLEWIKI_API_BASE_URL || "https://api.musclewiki.com",
  cacheEnabled: process.env.MUSCLEWIKI_CACHE_ENABLED !== "false",
  searchCacheMinutes: Number(process.env.MUSCLEWIKI_SEARCH_CACHE_MINUTES) || 30,
  detailCacheHours: Number(process.env.MUSCLEWIKI_DETAIL_CACHE_HOURS) || 12
};

const serverCapabilities = {
  exerciseListing: true,
  exerciseSearching: true,
  exerciseDetails: true,
  exerciseVideos: true,
  randomExercise: true,
  routines: true,
  workouts: true,
  bodyMaps: true,
  brandedMedia: true,
  unbrandedMedia: true,
};

const blockCapabilityUntil: Record<string, number> = {};
const serverCache: Record<string, { data: any; expiresAt: number }> = {};
const memberUsage: Record<string, {
  searchesThisHour: number;
  searchesResetTime: number;
  detailsToday: number;
  detailsResetTime: number;
  videosToday: number;
  videosResetTime: number;
}> = {};

// Helper logging function
function logMwRequest(endpoint: string, status: number, duration: number, cacheHit: boolean, memberId?: string, retryCount: number = 0) {
  const maskedMemberId = memberId ? `${memberId.slice(0, 4)}***${memberId.slice(-3)}` : "anonymous";
  console.log(`[MUSCLEWIKI API METRICS]
    Endpoint: ${endpoint}
    Status: ${status}
    Duration: ${duration}ms
    Cache: ${cacheHit ? "HIT" : "MISS"}
    MemberId: ${maskedMemberId}
    Retries: ${retryCount}
  `);
}

// Check feature capability with dynamic retry lockout
function isFeatureAvailable(feature: string): boolean {
  if (blockCapabilityUntil[feature] && Date.now() < blockCapabilityUntil[feature]) {
    return false;
  }
  return serverCapabilities[feature as keyof typeof serverCapabilities] !== false;
}

function disableFeatureTemporarily(feature: string) {
  console.warn(`[MUSCLEWIKI WARNING] Restricting feature due to API limits or errors: ${feature}`);
  blockCapabilityUntil[feature] = Date.now() + 5 * 60 * 1000; // block for 5 minutes
}

// Request rate limits validator
function checkRateLimit(memberId: string, type: "search" | "detail" | "video"): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  if (!memberUsage[memberId]) {
    memberUsage[memberId] = {
      searchesThisHour: 0,
      searchesResetTime: now + 60 * 60 * 1000,
      detailsToday: 0,
      detailsResetTime: now + 24 * 60 * 60 * 1000,
      videosToday: 0,
      videosResetTime: now + 24 * 60 * 60 * 1000
    };
  }

  const user = memberUsage[memberId];

  if (type === "search") {
    if (now > user.searchesResetTime) {
      user.searchesThisHour = 0;
      user.searchesResetTime = now + 60 * 60 * 1000;
    }
    if (user.searchesThisHour >= 30) {
      return { allowed: false, waitSeconds: Math.ceil((user.searchesResetTime - now) / 1000) };
    }
    user.searchesThisHour++;
  } else if (type === "detail") {
    if (now > user.detailsResetTime) {
      user.detailsToday = 0;
      user.detailsResetTime = now + 24 * 60 * 60 * 1000;
    }
    if (user.detailsToday >= 100) {
      return { allowed: false, waitSeconds: Math.ceil((user.detailsResetTime - now) / 1000) };
    }
    user.detailsToday++;
  } else if (type === "video") {
    if (now > user.videosResetTime) {
      user.videosToday = 0;
      user.videosResetTime = now + 24 * 60 * 60 * 1000;
    }
    if (user.videosToday >= 200) {
      return { allowed: false, waitSeconds: Math.ceil((user.videosResetTime - now) / 1000) };
    }
    user.videosToday++;
  }

  return { allowed: true };
}

// Generic fetching logic for MuscleWiki with caching and error detection
async function performMuscleWikiFetch(endpoint: string, queryParams: Record<string, any> = {}, cacheDurationMs?: number): Promise<{ data: any; cacheHit: boolean; retryCount: number }> {
  const apiKey = process.env.MUSCLEWIKI_API_KEY;
  const start = Date.now();

  // If no configured API key, return simulated mock data fallback immediately.
  if (!apiKey) {
    const mockRes = emulateMockFetch(endpoint, queryParams);
    logMwRequest(endpoint, 200, Date.now() - start, true, "fallback-system");
    return { data: mockRes, cacheHit: true, retryCount: 0 };
  }

  const queryString = new URLSearchParams(queryParams).toString();
  const cacheKey = `${endpoint}?${queryString}`;

  if (muscleWikiSettingsServer.cacheEnabled && serverCache[cacheKey]) {
    const cached = serverCache[cacheKey];
    if (Date.now() < cached.expiresAt) {
      logMwRequest(endpoint, 200, Date.now() - start, true, "system-cache");
      return { data: cached.data, cacheHit: true, retryCount: 0 };
    }
  }

  const url = `${muscleWikiSettingsServer.apiBaseUrl}${endpoint}${queryString ? "?" + queryString : ""}`;
  let retryCount = 0;
  const maxRetries = 1;

  while (retryCount <= maxRetries) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "Accept": "application/json"
        }
      });

      const duration = Date.now() - start;

      if (response.status === 401) {
        console.error("MuscleWiki API 401: Invalid credentials. Falling back to mock.");
        muscleWikiSettingsServer.enabled = false;
        logMwRequest(endpoint, 401, duration, false, undefined, retryCount);
        return { data: emulateMockFetch(endpoint, queryParams), cacheHit: false, retryCount };
      }

      if (response.status === 403) {
        console.error(`MuscleWiki API 403 Forbidden for endpoint: ${endpoint}`);
        // Mark features unavailable
        if (endpoint.includes("routines")) disableFeatureTemporarily("routines");
        if (endpoint.includes("workouts")) disableFeatureTemporarily("workouts");
        if (endpoint.includes("bodymaps")) disableFeatureTemporarily("bodyMaps");
        
        logMwRequest(endpoint, 403, duration, false, undefined, retryCount);
        return { data: emulateMockFetch(endpoint, queryParams), cacheHit: false, retryCount };
      }

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const responseData = await response.json();
      
      if (muscleWikiSettingsServer.cacheEnabled && cacheDurationMs) {
        serverCache[cacheKey] = {
          data: responseData,
          expiresAt: Date.now() + cacheDurationMs
        };
      }

      logMwRequest(endpoint, response.status, duration, false, undefined, retryCount);
      return { data: responseData, cacheHit: false, retryCount };

    } catch (err) {
      console.error(`Attempt ${retryCount} failed for fetch to ${url}:`, err);
      retryCount++;
      if (retryCount > maxRetries) {
        const duration = Date.now() - start;
        logMwRequest(endpoint, 500, duration, false, undefined, retryCount);
        return { data: emulateMockFetch(endpoint, queryParams), cacheHit: false, retryCount };
      }
    }
  }

  return { data: emulateMockFetch(endpoint, {}), cacheHit: false, retryCount };
}

// Local mock structures for Routines and Workouts
const MOCK_ROUTINES = [
  {
    id: 1,
    name: "Push Pull Legs Split",
    slug: "push-pull-legs-split",
    description: "Classic 3-day split training block for hypertrophy focusing on compound loading.",
    difficulty: "Beginner"
  },
  {
    id: 2,
    name: "Full Body Athlete",
    slug: "full-body-athlete",
    description: "Comprehensive conditioning for supreme overall strength, muscle endurance and mobility.",
    difficulty: "Intermediate"
  }
];

const MOCK_ROUTINES_BY_ID: Record<string, any> = {
  "1": {
    id: 1,
    name: "Push Pull Legs Split",
    slug: "push-pull-legs-split",
    description: "Classic 3-day split training block for hypertrophy focusing on compound loading.",
    difficulty: "Beginner",
    workouts: [
      { id: 1, name: "Push Day", slug: "push-day" },
      { id: 2, name: "Pull Day", slug: "pull-day" },
      { id: 3, name: "Leg Day", slug: "leg-day" }
    ]
  },
  "2": {
    id: 2,
    name: "Full Body Athlete",
    slug: "full-body-athlete",
    description: "Comprehensive conditioning for supreme overall strength, muscle endurance and mobility.",
    difficulty: "Intermediate",
    workouts: [
      { id: 4, name: "Full Body Conditioning A", slug: "full-body-conditioning-a" }
    ]
  }
};

const MOCK_WORKOUTS = [
  { id: 1, name: "Push Day", slug: "push-day", difficulty: "Beginner", goal: "Gain Muscle", equipment: "Dumbbells", muscles: "Chest" },
  { id: 2, name: "Pull Day", slug: "pull-day", difficulty: "Beginner", goal: "Gain Muscle", equipment: "Barbell", muscles: "Back" },
  { id: 3, name: "Leg Day", slug: "leg-day", difficulty: "Beginner", goal: "Gain Muscle", equipment: "Barbell", muscles: "Quadriceps" },
  { id: 4, name: "Full Body Conditioning A", slug: "full-body-conditioning-a", difficulty: "Intermediate", goal: "Health & Fitness", equipment: "Bodyweight", muscles: "Core" }
];

const MOCK_WORKOUTS_BY_ID: Record<string, any> = {
  "1": {
    id: 1,
    name: "Push Day",
    slug: "push-day",
    difficulty: "Beginner",
    goal: "Gain Muscle",
    equipment: "Dumbbells",
    muscles: "Chest",
    exercises: [
      { id: "mw-1", sets: 3, reps: "8-12", duration: null, superset_group: null },
      { id: "mw-7", sets: 3, reps: "10-12", duration: null, superset_group: null },
      { id: "mw-6", sets: 3, reps: "12-15", duration: null, superset_group: null }
    ]
  },
  "2": {
    id: 2,
    name: "Pull Day",
    slug: "pull-day",
    difficulty: "Beginner",
    goal: "Gain Muscle",
    equipment: "Barbell",
    muscles: "Back",
    exercises: [
      { id: "mw-3", sets: 3, reps: "max reps", duration: null, superset_group: null },
      { id: "mw-2", sets: 3, reps: "10-12", duration: null, superset_group: null }
    ]
  },
  "3": {
    id: 3,
    name: "Leg Day",
    slug: "leg-day",
    difficulty: "Beginner",
    goal: "Gain Muscle",
    equipment: "Barbell",
    muscles: "Quadriceps",
    exercises: [
      { id: "mw-4", sets: 4, reps: "8-10", duration: null, superset_group: null },
      { id: "mw-8", sets: 3, reps: "12-15", duration: null, superset_group: null }
    ]
  },
  "4": {
    id: 4,
    name: "Full Body Conditioning A",
    slug: "full-body-conditioning-a",
    difficulty: "Intermediate",
    goal: "Health & Fitness",
    equipment: "Bodyweight",
    muscles: "Core",
    exercises: [
      { id: "mw-3", sets: 3, reps: "8-10", duration: null, superset_group: null },
      { id: "mw-5", sets: 3, reps: null, duration: "60s", superset_group: null }
    ]
  }
};

// Local mock processor to run without API subscriptions
function emulateMockFetch(endpoint: string, queryParams: Record<string, any>): any {
  if (endpoint.includes("/statistics")) {
    return {
      status: "healthy",
      version: "2.0.0",
      exercises_loaded: 1832,
      categories_count: 6,
      muscles_count: 7,
      routines_count: MOCK_ROUTINES.length,
      workouts_count: MOCK_WORKOUTS.length
    };
  }
  if (endpoint.includes("/categories")) {
    return ["barbell", "dumbbell", "bodyweight", "machine", "cardio", "cable"];
  }
  if (endpoint.includes("/muscles")) {
    return ["Chest", "Biceps", "Quadriceps", "Back", "Triceps", "Shoulders", "Abs"];
  }
  if (endpoint.includes("/filters")) {
    return {
      difficulties: ["beginner", "intermediate", "advanced"],
      forces: ["push", "pull", "static"],
      mechanics: ["compound", "isolation"]
    };
  }
  if (endpoint.includes("/search") || endpoint.includes("/exercises")) {
    const { search, muscles, category, difficulty } = queryParams;
    let filtered = [...MOCK_EXERCISES];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(ex => ex.name.toLowerCase().includes(s) || ex.primaryMuscles.some(pm => pm.toLowerCase().includes(s)));
    }
    if (muscles) {
      const m = muscles.toLowerCase();
      filtered = filtered.filter(ex => ex.primaryMuscles.some(pm => pm.toLowerCase() === m));
    }
    if (category) {
      const c = category.toLowerCase();
      filtered = filtered.filter(ex => ex.category.toLowerCase() === c);
    }
    if (difficulty) {
      const d = difficulty.toLowerCase();
      filtered = filtered.filter(ex => ex.difficulty.toLowerCase() === d);
    }

    return filtered;
  }
  if (endpoint.match(/\/exercises\/(\d+|mw-\d+)/)) {
    const rawMatch = endpoint.match(/\/exercises\/(\d+|mw-\d+)/);
    const id = rawMatch ? rawMatch[1] : "";
    return MOCK_EXERCISES.find(ex => ex.id === id) || MOCK_EXERCISES[0];
  }
  if (endpoint.includes("/random")) {
    const category = queryParams.category;
    let pool = [...MOCK_EXERCISES];
    if (category) {
      pool = pool.filter(e => e.category.toLowerCase() === category.toLowerCase());
    }
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx] || MOCK_EXERCISES[0];
  }

  // Routines & Workouts sub-routing emulation
  if (endpoint.match(/\/routines\/(\d+)\/full/)) {
    const m = endpoint.match(/\/routines\/(\d+)\/full/);
    const id = m ? m[1] : "1";
    const routine = MOCK_ROUTINES_BY_ID[id] || MOCK_ROUTINES_BY_ID["1"];
    const expandedWorkouts = routine.workouts.map((wRef: any) => {
      const wk = MOCK_WORKOUTS_BY_ID[String(wRef.id)] || MOCK_WORKOUTS_BY_ID["1"];
      const expandedExercises = wk.exercises.map((exRef: any) => {
        const detail = MOCK_EXERCISES.find(ex => ex.id === exRef.id) || MOCK_EXERCISES[0];
        return { ...detail, prescription: exRef };
      });
      return { ...wk, exercises: expandedExercises };
    });
    return { ...routine, workouts: expandedWorkouts };
  }
  if (endpoint.match(/\/routines\/(\d+)/)) {
    const m = endpoint.match(/\/routines\/(\d+)/);
    const id = m ? m[1] : "1";
    return MOCK_ROUTINES_BY_ID[id] || MOCK_ROUTINES_BY_ID["1"];
  }
  if (endpoint.includes("/routines")) {
    return MOCK_ROUTINES;
  }
  if (endpoint.match(/\/workouts\/(\d+)\/full/)) {
    const m = endpoint.match(/\/workouts\/(\d+)\/full/);
    const id = m ? m[1] : "1";
    const wk = MOCK_WORKOUTS_BY_ID[id] || MOCK_WORKOUTS_BY_ID["1"];
    const expandedExercises = wk.exercises.map((exRef: any) => {
      const detail = MOCK_EXERCISES.find(ex => ex.id === exRef.id) || MOCK_EXERCISES[0];
      return { ...detail, ...exRef };
    });
    return { ...wk, exercises: expandedExercises };
  }
  if (endpoint.match(/\/workouts\/(\d+)/)) {
    const m = endpoint.match(/\/workouts\/(\d+)/);
    const id = m ? m[1] : "1";
    return MOCK_WORKOUTS_BY_ID[id] || MOCK_WORKOUTS_BY_ID["1"];
  }
  if (endpoint.includes("/workouts")) {
    return MOCK_WORKOUTS;
  }

  return { error: "Unsupported simulated endpoint" };
}

// GET/POST Settings
app.get("/api/musclewiki/settings", (req, res) => {
  res.json(muscleWikiSettingsServer);
});

app.post("/api/musclewiki/settings", (req, res) => {
  const { enabled, defaultGender, preferredVideoType, cacheEnabled, searchCacheMinutes, detailCacheHours } = req.body;
  if (enabled !== undefined) muscleWikiSettingsServer.enabled = !!enabled;
  if (defaultGender !== undefined) muscleWikiSettingsServer.defaultGender = defaultGender;
  if (preferredVideoType !== undefined) muscleWikiSettingsServer.preferredVideoType = preferredVideoType;
  if (cacheEnabled !== undefined) muscleWikiSettingsServer.cacheEnabled = !!cacheEnabled;
  if (searchCacheMinutes !== undefined) muscleWikiSettingsServer.searchCacheMinutes = Number(searchCacheMinutes) || 30;
  if (detailCacheHours !== undefined) muscleWikiSettingsServer.detailCacheHours = Number(detailCacheHours) || 12;

  console.log("[MUSCLEWIKI CONFIG] Admin updated settings:", muscleWikiSettingsServer);
  res.json({ success: true, settings: muscleWikiSettingsServer });
});

// Cache purge
app.post("/api/musclewiki/clear-cache", (req, res) => {
  for (const k in serverCache) {
    delete serverCache[k];
  }
  console.log("[MUSCLEWIKI CONFIG] Cache purged.");
  res.json({ success: true, message: "Server-side cache purged." });
});

// API Routes
app.get("/api/musclewiki", (req, res) => {
  res.json({
    name: "MuscleWiki API Integration Middleware",
    version: "2.0.0",
    docs: "/docs",
    openapi: "/openapi.json",
    health: "/api/musclewiki/health",
    apiMode: process.env.MUSCLEWIKI_API_KEY ? "production" : "fallback-emulated",
    endpoints: {
      exercises: "/api/musclewiki/exercises",
      search: "/api/musclewiki/search",
      random: "/api/musclewiki/random",
      categories: "/api/musclewiki/categories",
      muscles: "/api/musclewiki/muscles",
      filters: "/api/musclewiki/filters",
      statistics: "/api/musclewiki/statistics",
      routines: "/api/musclewiki/routines",
      workouts: "/api/musclewiki/workouts"
    }
  });
});

app.get("/api/musclewiki/health", async (req, res) => {
  if (!muscleWikiSettingsServer.enabled) {
    return res.status(503).json({ status: "disabled", error: "Integration disabled by Administrator." });
  }
  res.json({ status: "healthy", apiMode: process.env.MUSCLEWIKI_API_KEY ? "production" : "fallback-emulated", capabilities: serverCapabilities });
});

app.get("/api/musclewiki/statistics", async (req, res) => {
  const result = await performMuscleWikiFetch("/statistics", {}, 60 * 60 * 1000); // 1 hour cache
  res.json(result.data);
});

app.get("/api/musclewiki/exercises", async (req, res) => {
  const memberId = (req.query.memberId as string) || "anonymous";
  const rate = checkRateLimit(memberId, "search");
  if (!rate.allowed) {
    return res.status(429).json({ error: "Rate limit exceeded.", resetTime: rate.waitSeconds });
  }

  const queryParams: Record<string, any> = {};
  if (req.query.limit) queryParams.limit = Number(req.query.limit);
  if (req.query.offset) queryParams.offset = Number(req.query.offset);
  if (req.query.search) queryParams.search = req.query.search;
  if (req.query.gender) queryParams.gender = req.query.gender;
  if (req.query.category) queryParams.category = req.query.category;
  if (req.query.muscles) queryParams.muscles = req.query.muscles;
  if (req.query.difficulty) queryParams.difficulty = req.query.difficulty;
  if (req.query.force) queryParams.force = req.query.force;
  if (req.query.mechanic) queryParams.mechanic = req.query.mechanic;
  if (req.query.grips) queryParams.grips = req.query.grips;

  const cacheDuration = muscleWikiSettingsServer.searchCacheMinutes * 60 * 1000;
  const result = await performMuscleWikiFetch("/exercises", queryParams, cacheDuration);
  
  if (Array.isArray(result.data)) {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const paginated = result.data.slice(offset, offset + limit);
    return res.json({
      total: result.data.length,
      limit,
      offset,
      count: paginated.length,
      results: paginated
    });
  }

  res.json(result.data);
});

app.get("/api/musclewiki/routines", async (req, res) => {
  const queryParams: Record<string, any> = {};
  if (req.query.limit) queryParams.limit = Number(req.query.limit);
  if (req.query.offset) queryParams.offset = Number(req.query.offset);
  if (req.query.difficulty) queryParams.difficulty = req.query.difficulty;

  const result = await performMuscleWikiFetch("/routines", queryParams, 60 * 60 * 1000);
  res.json(result.data);
});

app.get("/api/musclewiki/routines/:id", async (req, res) => {
  const result = await performMuscleWikiFetch(`/routines/${req.params.id}`, {}, 60 * 60 * 1000);
  res.json(result.data);
});

app.get("/api/musclewiki/routines/:id/full", async (req, res) => {
  const result = await performMuscleWikiFetch(`/routines/${req.params.id}/full`, {}, 60 * 60 * 1000);
  res.json(result.data);
});

app.get("/api/musclewiki/workouts", async (req, res) => {
  const queryParams: Record<string, any> = {};
  if (req.query.limit) queryParams.limit = Number(req.query.limit);
  if (req.query.offset) queryParams.offset = Number(req.query.offset);
  if (req.query.difficulty) queryParams.difficulty = req.query.difficulty;
  if (req.query.goal) queryParams.goal = req.query.goal;
  if (req.query.equipment) queryParams.equipment = req.query.equipment;
  if (req.query.muscles) queryParams.muscles = req.query.muscles;

  const result = await performMuscleWikiFetch("/workouts", queryParams, 60 * 60 * 1000);
  res.json(result.data);
});

app.get("/api/musclewiki/workouts/:id", async (req, res) => {
  const result = await performMuscleWikiFetch(`/workouts/${req.params.id}`, {}, 60 * 60 * 1000);
  res.json(result.data);
});

app.get("/api/musclewiki/workouts/:id/full", async (req, res) => {
  const result = await performMuscleWikiFetch(`/workouts/${req.params.id}/full`, {}, 60 * 60 * 1000);
  res.json(result.data);
});

app.get("/api/musclewiki/test-connection", async (req, res) => {
  const apiKey = process.env.MUSCLEWIKI_API_KEY;
  if (!apiKey) {
    return res.json({
      status: "mock",
      apiMode: "fallback-emulated",
      message: "No API key configured in environment variable MUSCLEWIKI_API_KEY. Currently running in offline/mock emulation mode.",
      keyConfigured: false
    });
  }

  const url = `${muscleWikiSettingsServer.apiBaseUrl}/categories`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      }
    });

    if (response.status === 200) {
      const data = await response.json();
      return res.json({
        status: "success",
        apiMode: "production",
        code: 200,
        message: "Your MuscleWiki API Key is working perfectly!",
        keyConfigured: true,
        sampleCategories: Array.isArray(data) ? data.slice(0, 5) : data
      });
    } else {
      return res.json({
        status: "failed",
        apiMode: "production",
        code: response.status,
        message: `MuscleWiki servers rejected the key with status ${response.status} (${response.statusText}). Please check that the key is entered correctly in your Secrets panel.`,
        keyConfigured: true
      });
    }
  } catch (err) {
    return res.json({
      status: "error",
      apiMode: "production",
      message: `Failed to connect to MuscleWiki servers. Network or hostname error: ${err instanceof Error ? err.message : String(err)}`,
      keyConfigured: true
    });
  }
});

app.get("/api/musclewiki/categories", async (req, res) => {
  const result = await performMuscleWikiFetch("/categories", {}, 30 * 24 * 60 * 60 * 1000); // 30 days
  res.json(result.data);
});

app.get("/api/musclewiki/muscles", async (req, res) => {
  const result = await performMuscleWikiFetch("/muscles", {}, 30 * 24 * 60 * 60 * 1000); // 30 days
  res.json(result.data);
});

app.get("/api/musclewiki/filters", async (req, res) => {
  const result = await performMuscleWikiFetch("/filters", {}, 30 * 24 * 60 * 60 * 1000); // 30 days
  res.json(result.data);
});

// Search and listings
app.get("/api/musclewiki/search", async (req, res) => {
  const memberId = (req.query.memberId as string) || "anonymous";
  const rate = checkRateLimit(memberId, "search");
  if (!rate.allowed) {
    return res.status(429).json({ error: "Search rate limit exceeded. Please try again after some time.", resetTime: rate.waitSeconds });
  }

  const queryParams: Record<string, any> = {};
  if (req.query.search) queryParams.search = req.query.search;
  if (req.query.muscles) queryParams.muscles = req.query.muscles;
  if (req.query.category) queryParams.category = req.query.category;
  if (req.query.difficulty) queryParams.difficulty = req.query.difficulty;
  if (req.query.gender) queryParams.gender = req.query.gender;

  const cacheDuration = muscleWikiSettingsServer.searchCacheMinutes * 60 * 1000;
  const result = await performMuscleWikiFetch("/search", queryParams, cacheDuration);
  
  // Guard outputs to maximum 20 results
  if (Array.isArray(result.data)) {
    return res.json(result.data.slice(0, 20));
  }
  res.json(result.data);
});

// Exercise Details
app.get("/api/musclewiki/exercises/:id", async (req, res) => {
  const id = req.params.id;
  const memberId = (req.query.memberId as string) || "anonymous";
  const rate = checkRateLimit(memberId, "detail");
  if (!rate.allowed) {
    return res.status(429).json({ error: "Detail rate limit exceeded.", resetTime: rate.waitSeconds });
  }

  const cacheDuration = muscleWikiSettingsServer.detailCacheHours * 60 * 60 * 1000;
  const result = await performMuscleWikiFetch(`/exercises/${id}`, {}, cacheDuration);
  res.json(result.data);
});

// Exercise Videos
app.get("/api/musclewiki/exercises/:id/videos", async (req, res) => {
  const id = req.params.id;
  const cacheDuration = muscleWikiSettingsServer.detailCacheHours * 60 * 60 * 1000;
  const result = await performMuscleWikiFetch(`/exercises/${id}/videos`, {}, cacheDuration);
  res.json(result.data);
});

// Random exercise
app.get("/api/musclewiki/random", async (req, res) => {
  const category = req.query.category as string;
  const query: Record<string, any> = {};
  if (category) query.category = category;

  const result = await performMuscleWikiFetch("/random", query, 0); // never cache random endpoint!
  res.json(result.data);
});

// Media secure stream proxies
app.get("/api/musclewiki/media/video", async (req, res) => {
  try {
    const targetPath = req.query.path as string;
    const memberId = (req.query.memberId as string) || "anonymous";

    if (!targetPath) {
      return res.status(400).send("Video path is required.");
    }

    const rate = checkRateLimit(memberId, "video");
    if (!rate.allowed) {
      return res.status(429).send("Video streaming limit exceeded for today.");
    }

    // Safety checks: Reject arbitrary redirects outside MuscleWiki or Sample Buckets
    if (!targetPath.startsWith("/") && 
        !targetPath.startsWith("https://api.musclewiki.com") && 
        !targetPath.startsWith("https://images.musclewiki.com") && 
        !targetPath.startsWith("https://media.musclewiki.com") && 
        !targetPath.startsWith("https://musclewiki.com") && 
        !targetPath.startsWith("https://commondatastorage.googleapis.com")) {
      return res.status(400).send("External unapproved resource rejected.");
    }

    const destUrl = targetPath.startsWith("http") 
      ? targetPath 
      : `${muscleWikiSettingsServer.apiBaseUrl}${targetPath}`;

    const headers: Record<string, string> = {};
    if (process.env.MUSCLEWIKI_API_KEY) {
      headers["X-API-Key"] = process.env.MUSCLEWIKI_API_KEY;
    }
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const response = await fetch(destUrl, { headers });
    
    res.status(response.status);
    const passHeaders = ["content-type", "content-length", "content-range", "accept-ranges"];
    passHeaders.forEach(hd => {
      const val = response.headers.get(hd);
      if (val) res.setHeader(hd, val);
    });

    if (response.body) {
      const reader = response.body.getReader();
      req.on("close", () => {
        reader.cancel().catch(() => {});
      });

      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        await pump();
      };
      await pump();
    } else {
      res.end();
    }

  } catch (err) {
    console.error("Video proxy streaming failure:", err);
    res.status(500).send("Media request failed.");
  }
});

// Image secure proxy
app.get("/api/musclewiki/media/image", async (req, res) => {
  try {
    const pathQuery = req.query.path as string;
    if (!pathQuery) return res.status(400).send("Image path required.");

    if (!pathQuery.startsWith("/") && 
        !pathQuery.startsWith("https://api.musclewiki.com") && 
        !pathQuery.startsWith("https://images.musclewiki.com") && 
        !pathQuery.startsWith("https://musclewiki.com")) {
      return res.status(400).send("Unapproved image layout.");
    }

    const host = pathQuery.startsWith("http") ? pathQuery : `${muscleWikiSettingsServer.apiBaseUrl}${pathQuery}`;
    const headers: Record<string, string> = {};
    if (process.env.MUSCLEWIKI_API_KEY) {
      headers["X-API-Key"] = process.env.MUSCLEWIKI_API_KEY;
    }

    const response = await fetch(host, { headers });
    res.status(response.status);
    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("content-type", contentType);

    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        await pump();
      };
      await pump();
    } else {
      res.end();
    }
  } catch (err) {
    console.error("Image proxy failed:", err);
    res.status(500).send("Media error.");
  }
});

// Dynamic body maps
app.get("/api/musclewiki/bodymap/:exerciseId", async (req, res) => {
  try {
    if (!isFeatureAvailable("bodyMaps")) {
      return res.status(403).json({ error: "Static body maps subscription restricted." });
    }

    const exId = req.params.exerciseId;
    const gender = req.query.gender || muscleWikiSettingsServer.defaultGender;
    const theme = req.query.theme || "dark";
    const view = req.query.view || "front";

    const pathUrl = `/stream/images/bodymaps/${exId}?gender=${gender}&theme=${theme}&view=${view}`;
    const fullUrl = `${muscleWikiSettingsServer.apiBaseUrl}${pathUrl}`;

    const headers: Record<string, string> = {
      "X-API-Key": process.env.MUSCLEWIKI_API_KEY || ""
    };

    const response = await fetch(fullUrl, { headers });
    if (response.status === 403) {
      disableFeatureTemporarily("bodyMaps");
      return res.status(403).json({ error: "Access denied by provider." });
    }

    res.status(response.status);
    const rawCt = response.headers.get("content-type");
    if (rawCt) res.setHeader("content-type", rawCt);

    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        await pump();
      };
      await pump();
    } else {
      res.end();
    }

  } catch (err) {
    console.error("Bodymap proxy failed:", err);
    res.status(500).send("Graphics error.");
  }
});

// Secure API endpoint for Life Fitness AI Assistant (Supports MuscleWiki Tool Loop)
app.post("/api/gemini", async (req, res) => {
  try {
    const { message, history = [], context = {}, systemInstruction = "" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured. Please add it in Settings > Secrets."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

    const contents: any[] = [
      ...history.map((msg: any) => ({
        role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    // Inject Member Context to personalize the conversation
    const memberContextBlock = `
CORE MEMBER DATA (SECURE & ISOLATED):
- Name: ${context.fullName || "Member"}
- Display Name: ${context.preferredDisplayName || context.fullName || "Member"}
- Gender: ${context.gender || "Not specified"}
- Age: ${context.age || "Not specified"}
- Membership Plan: ${context.planName || "Basic"} (Plan level determines allowed gym equipment)
- Membership Status: ${context.membershipStatus || "Active"}
- Membership Expiry Date: ${context.expiryDate || "N/A"}
- Days Remaining: ${context.remainingDays || 0}days

PERSONAL FITNESS PROFILE:
- Current Weight: ${context.weight ? context.weight + " KG" : "Not specified"}
- Height: ${context.height ? context.height + " CM" : "Not specified"}
- Target Weight: ${context.targetWeight ? context.targetWeight + " KG" : "Not specified"}
- Targets Completion Date: ${context.targetDate || "Not specified"}
- Active Fitness Goals: ${context.fitnessGoals && context.fitnessGoals.length > 0 ? context.fitnessGoals.join(", ") : "General Fitness"}
- Experience Level: ${context.experienceLevel || "Beginner"}
- Preferred training style: ${context.trainingStyle || "General Weight Training"}
- Preferred duration: ${context.workoutDuration || "60 minutes"} ${context.customWorkoutDuration ? "(" + context.customWorkoutDuration + "m)" : ""}
- Scheduled workout days: ${context.workoutDays && context.workoutDays.length > 0 ? context.workoutDays.join(", ") : "Flexible"}
- Resting Heart Rate: ${context.restingHeartRate ? context.restingHeartRate + " bpm" : "Not specified"}
- Sleep hours: ${context.averageSleep ? context.averageSleep + " hours" : "Not specified"}
- Water intake: ${context.waterIntake ? context.waterIntake + " Litres" : "Not specified"}
- Allowed equipment based on plan: ${context.allowedEquipment || "Basic gym equipment, free weights"}

HEALTH CONSIDERATIONS & SAFETY DISCLAIMERS:
- Limitations, injuries, precautions: ${context.restrictionsEnabled && context.healthConsiderations ? JSON.stringify(context.healthConsiderations) : "No injuries or restrictions specified"}
- Disclaimer accepted: ${context.disclaimerAccepted ? "Yes" : "No"}

ATTENDANCE LOG HISTORY (THIS MONTH):
${context.attendanceHistory && context.attendanceHistory.length > 0 ? JSON.stringify(context.attendanceHistory) : "No attendance check-ins logged yet"}

RECENT COMPLETED WORKOUTS FEEDBACK:
${context.recentWorkouts && context.recentWorkouts.length > 0 ? JSON.stringify(context.recentWorkouts) : "No workout logs recorded yet"}

LATEST PHYSICAL MEASUREMENTS HISTORY SUMMARY:
${context.measurementSummary && context.measurementSummary.length > 0 ? JSON.stringify(context.measurementSummary) : "No body measurement logs recorded yet"}

UPCOMING LIVE GYM CHALLENGE INFORMATION:
- Bench Press Reps, Chest Press Reps, Treadmill Endurance, Pushup Challenge, Squats, Deadlifts, Pull-ups, plank checks.
${context.competitionSummary ? JSON.stringify(context.competitionSummary) : "No active competition results recorded yet"}
`;

    const instructionsAnnex = `
ROLE & RECOMENDATION PROTOCOL:
- You are the premium Life Fitness AI Personal Coach. Suggest appropriate MuscleWiki-based exercise routines.
- If a member has specified any health injuries, discomforts, or pain boundaries (e.g., lower back stiffness, knee pain), you MUST strictly avoid chest exercises, shoulder flyes, or heavy compound squats that aggravate those regions.
- Limit recommeded exercises to maximum 5 in any turn.
- When suggesting specific exercises, you MUST FORMAT THEM IN AS CUSTOM TAGS SO THE CLIENT INTERFACE RENDS AN INTERACTIVE ATHLETIC CARD DIRECTLY.
- Format syntax exactly as:
  [EXERCISE:{"id":"exercise_id_or_mw_id","name":"Exercise Name","muscle":"Body Target","equipment":"Machine/Barbell/etc","difficulty":"Beginner/etc","reason":"Personalized benefit why recommended"}]
- Do not output long JSON text outside this tags.
- Support physical warnings: If severe chest tightness, acute sharp joint locks, hyperventilation, dizziness or fainting thresholds are reported during workouts, command stopping immediately and consulting medical professionals.
`;

    const combinedSystemInstruction = `${systemInstruction}\n\n[MEMBER SPECIFIC CONTEXT]\nYou are chatting securely with ${context.fullName || "this member"}. You MUST keep all answers contextualized to this individual:\n${memberContextBlock}\n\n${instructionsAnnex}\n\nRemember to respect safety precautions. If any physical boundaries, injuries or limitations exist, strictly avoid matching exercises that impact it. Always speak in a helpful, supportive, highly motivational tone. Avoid medical diagnosis. Suggest a qualified trainer or physician for complex medical queries. Keep responses structured (using Markdown).`;

    // Function declarations for Gemini calls
    const toolsConfig = {
      functionDeclarations: [
        {
          name: "searchMuscleWikiExercises",
          description: "Search MuscleWiki exercises catalog using filters such as search term, muscle category, equipment, or difficulty.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              search: { type: Type.STRING, description: "Search query string" },
              muscles: { type: Type.STRING, description: "Muscle name (e.g. Chest, Biceps, Back, Quadriceps, Shoulders, Abs)" },
              category: { type: Type.STRING, description: "Equipment category (e.g. barbell, dumbbell, bodyweight, machine, cable)" },
              difficulty: { type: Type.STRING, description: "Experience level (beginner, intermediate, advanced)" }
            }
          }
        },
        {
          name: "getMuscleWikiExercise",
          description: "Get detailed instruction steps, category, and video path of an exercise using its identifier ID.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "ID of the target exercise (e.g. mw-1, mw-2)" }
            },
            required: ["id"]
          }
        },
        {
          name: "getRandomMuscleWikiExercise",
          description: "Get a random fitness exercise, optionally filtered by equipment category.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "Filter by category (e.g. barbell, bodyweight)" }
            }
          }
        }
      ]
    };

    let response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: combinedSystemInstruction,
        maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS) || 1200,
        temperature: 0.7,
        tools: [toolsConfig]
      },
    });

    let currentResponse = response;
    let iterations = 0;

    // Loop to resolve functional tool calls on server securely
    while (currentResponse.functionCalls && currentResponse.functionCalls.length > 0 && iterations < 5) {
      iterations++;
      const toolResults = [];

      for (const call of currentResponse.functionCalls) {
        const { name, args } = call;
        let dataResult = {};

        try {
          if (name === "searchMuscleWikiExercises") {
            const search = args.search as string;
            const muscles = args.muscles as string;
            const category = args.category as string;
            const difficulty = args.difficulty as string;

            let filtered = [...MOCK_EXERCISES];
            if (process.env.MUSCLEWIKI_API_KEY && isFeatureAvailable("exerciseSearching")) {
              const apiResult = await performMuscleWikiFetch("/search", { search, muscles, category, difficulty });
              filtered = apiResult.data;
            } else {
              if (search) {
                const s = search.toLowerCase();
                filtered = filtered.filter(ex => ex.name.toLowerCase().includes(s) || ex.primaryMuscles.some(pm => pm.toLowerCase().includes(s)));
              }
              if (muscles) {
                const m = muscles.toLowerCase();
                filtered = filtered.filter(ex => ex.primaryMuscles.some(pm => pm.toLowerCase() === m));
              }
              if (category) {
                const c = category.toLowerCase();
                filtered = filtered.filter(ex => ex.category.toLowerCase() === c);
              }
              if (difficulty) {
                const d = difficulty.toLowerCase();
                filtered = filtered.filter(ex => ex.difficulty.toLowerCase() === d);
              }
            }

            // Limit elements
            dataResult = filtered.slice(0, 5).map(e => ({
              id: e.id,
              name: e.name,
              primaryMuscles: e.primaryMuscles,
              category: e.category,
              difficulty: e.difficulty
            }));

          } else if (name === "getMuscleWikiExercise") {
            const exId = args.id as string;
            if (process.env.MUSCLEWIKI_API_KEY && isFeatureAvailable("exerciseDetails")) {
              const apiResult = await performMuscleWikiFetch(`/exercises/${exId}`);
              dataResult = apiResult.data;
            } else {
              dataResult = MOCK_EXERCISES.find(ex => ex.id === exId) || MOCK_EXERCISES[0];
            }
          } else if (name === "getRandomMuscleWikiExercise") {
            const cat = args.category as string;
            if (process.env.MUSCLEWIKI_API_KEY && isFeatureAvailable("randomExercise")) {
              const apiResult = await performMuscleWikiFetch("/random", cat ? { category: cat } : {});
              dataResult = apiResult.data;
            } else {
              let pool = [...MOCK_EXERCISES];
              if (cat) pool = pool.filter(e => e.category === cat.toLowerCase());
              dataResult = pool[Math.floor(Math.random() * pool.length)] || MOCK_EXERCISES[0];
            }
          }
        } catch (exErr) {
          console.error(`Tool ${name} failed:`, exErr);
          dataResult = { error: "Operation temporarily offline." };
        }

        toolResults.push({
          functionResponse: {
            name,
            response: dataResult
          }
        });
      }

      contents.push({
        role: "model",
        parts: currentResponse.candidates?.[0]?.content?.parts || []
      });

      contents.push({
        role: "user",
        parts: toolResults
      });

      currentResponse = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: combinedSystemInstruction,
          maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS) || 1200,
          temperature: 0.7,
          tools: [toolsConfig]
        }
      });
    }

    const reply = currentResponse.text || "I was unable to complete the analysis. Please try again.";
    res.json({ text: reply });

  } catch (error: any) {
    console.error("Gemini Server Error:", error);
    res.status(550).status(500).json({ error: error?.message || "Internal server error occurred." });
  }
});

// Configure Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static production assets mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
