/**
 * TypeScript Interfaces for Life Fitness
 */

export type UserRole = "super_admin" | "admin" | "reception" | "trainer" | "member";

export interface GymSettings {
  gymName: string;
  location: string;
  googleMapsUrl: string;
  phone: string;
  whatsApp: string;
  openTimeMaleMorn: string;
  closeTimeMaleMorn: string;
  openTimeFemale: string;
  closeTimeFemale: string;
  openTimeMaleEve: string;
  closeTimeMaleEve: string;
  cleaningBreak1: string;
  cleaningBreak2: string;
  weeklyHoliday: string;
  ramadanTimings: string;
  specialNotice: string;
  initialAdminEmail: string;
  bannerPhotoUrl?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  memberId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string; // memberId
  uid?: string; // linked auth uid
  fullName: string;
  fatherName: string;
  phone: string;
  whatsApp: string;
  gender: "Male" | "Female";
  dob: string;
  address: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  bloodGroup: string;
  cnic?: string;
  photoUrl: string;
  planId: string;
  planName: string;
  durationMonths: number;
  membershipStatus: "Active" | "Expiring Soon" | "Expired" | "Frozen" | "Pending Approval" | "Suspended";
  joinedDate: string;
  expiryDate: string;
  medicalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlan {
  planId: string;
  name: string;
  description: string;
  price1m: number;
  price3m: number;
  price6m: number;
  price12m: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  promoDiscount?: number; // percentage
  promoStart?: string;
  promoEnd?: string;
}

export interface MembershipApplication {
  applicationId: string;
  fullName: string;
  fatherName: string;
  phone: string;
  whatsApp: string;
  gender: "Male" | "Female";
  dob: string;
  address: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  bloodGroup: string;
  cnic?: string;
  photoUrl: string;
  planId: string;
  durationMonths: number;
  timingPreference: string;
  medicalNotes?: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

export interface PaymentRecord {
  paymentId: string;
  receiptNo: string;
  memberId: string;
  memberName: string;
  planName: string;
  duration: number;
  originalPrice: number;
  discountType: "None" | "Promo" | "Credit" | "Manual";
  discountAmount: number;
  finalPaidAmount: number;
  paymentMethod: "Cash at Gym" | "Bank Transfer" | "EasyPaisa" | "JazzCash";
  paymentStatus: "Pending" | "Paid" | "Partially Paid" | "Refunded" | "Cancelled";
  paymentDate: string;
  refNo?: string;
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  recordId: string;
  memberId: string;
  memberName: string;
  gender: "Male" | "Female";
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:MM AM/PM
  checkOutTime?: string;
  staffId: string;
  staffName: string;
  status: "Present" | "Excused" | "Late" | "Denied";
  overrideReason?: string;
}

export interface ExerciseChallenge {
  id: string; // e.g., bench_press
  name: string;
  benchmarkMale: string;
  benchmarkFemale: string;
  scoringType: "Reps" | "Time" | "Weight" | "Distance";
  rules: string;
  isActive: boolean;
  imageUrl: string;
}

export interface CompetitionAttempt {
  attemptId: string;
  memberId: string;
  memberName: string;
  gender: "Male" | "Female";
  exerciseId: string;
  exerciseName: string;
  score: number; // raw value for sorting (duration in seconds or repetitions)
  scoreDisplay: string; // e.g., "45 Reps" or "4 mins 12 secs" or "120 KG"
  staffId: string;
  staffName: string;
  photoUrl?: string;
  videoUrl?: string;
  status: "Pending" | "Approved" | "Rejected" | "Disqualified";
  notes?: string;
  period: string; // e.g., "2026-06"
  createdAt: string;
  updatedAt: string;
  // UI metrics
  rankMovement?: "up" | "down" | "same";
  rankPrevious?: number;
}

export interface ChallengeWinner {
  id: string; // period_exerciseId
  period: string; // YYYY-MM
  memberId: string;
  memberName: string;
  exerciseId: string;
  exerciseName: string;
  score: number;
  scoreDisplay: string;
  prize: string;
  photoUrl?: string;
}

export interface MembershipCredit {
  creditId: string;
  memberId: string;
  memberName: string;
  winningExercise: string;
  period: string;
  status: "Available" | "Applied" | "Expired" | "Cancelled";
  issuedAt: string;
  redeemedAt?: string;
  approvedBy: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  text: string;
  photoUrl?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  url: string;
  category: "Interiors" | "Workouts" | "Events" | "Winners";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

// ==========================================
// LIFE FITNESS AI & ADVANCED PROFILE TYPES
// ==========================================

export interface FitnessProfile {
  weight?: number;          // kg
  height?: number;          // cm
  age?: number;
  fitnessGoals: string[];   // selected multiple
  customGoal?: string;
  experienceLevel?: "Beginner" | "Intermediate" | "Advanced";
  trainingStyle?: "Weight Training" | "Strength Training" | "Cardio" | "Functional Training" | "Bodyweight Training" | "Mixed Training";
  workoutDuration?: "30 minutes" | "45 minutes" | "60 minutes" | "90 minutes" | "Custom";
  customWorkoutDuration?: number; // minutes
  workoutDays?: string[];   // e.g. ["Monday", "Wednesday", "Friday"]
  availableEquipment?: string[];
  activityLevel?: "Sedentary" | "Lightly Active" | "Moderately Active" | "Very Active" | "Extremely Active";
  targetWeight?: number;
  targetDate?: string;
  restingHeartRate?: number;
  averageSleep?: number;
  waterIntake?: number;
  unitSystem: "Metric" | "Imperial";
}

export interface GoalHistoryEntry {
  id: string;
  goals: string[];
  customGoal?: string;
  changedAt: string;
}

export interface BodyMeasurementEntry {
  id: string;
  memberId: string;
  measurementType: string; // Standard measurement type like "Weight", "Waist", or a custom name like "Upper Chest"
  value: number;
  unit: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  note?: string;
}

export interface CustomMeasurementType {
  id: string;
  name: string;
  unit: string;
  hiddenOnDashboard?: boolean;
}

export interface ProgressPhoto {
  id: string;
  memberId: string;
  category: "Front" | "Side" | "Back";
  photoUrl: string;
  date: string;
  weight?: number;
  note?: string;
  visibility: "Private" | "Trainer" | "Admin";
}

export interface HealthConsiderations {
  previousInjuries?: string;
  currentPain?: string;
  movementRestrictions?: string;
  exercisesToAvoid?: string;
  medicalConditions?: string;
  medication?: string;
  doctorRecommendations?: string;
  trainerNotes?: string;
  disclaimerAccepted: boolean;
}

export interface WorkoutPlan {
  id: string;
  memberId: string;
  title: string;
  goal: string;
  warmUp: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    rest: string;
    equipment: string;
    notes?: string;
  }[];
  coolDown: string;
  safetyNote: string;
  estimatedDuration: number; // minutes
  createdAt: string;
  savedToSchedule?: boolean;
}

export interface WorkoutLog {
  id: string;
  memberId: string;
  date: string;
  workoutName: string;
  exercises: {
    name: string;
    weight: number;
    sets: number;
    reps: number;
    completed: boolean;
  }[];
  duration: number; // minutes
  difficultyRating: number; // 1-10
  energyLevel: number; // 1-10
  painOrDiscomfort?: string;
  notes?: string;
  completed: boolean;
  caloriesBurned?: number;
}

export interface AiConsentSettings {
  bodyMeasurements: boolean;
  attendance: boolean;
  workoutHistory: boolean;
  competitionHistory: boolean;
  healthConsiderations: boolean;
  progressPhotos: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  createdAt: string;
}

export interface AdminAiSettings {
  enabled: boolean;
  provider: string; // "gemini"
  model: string; // "gemini-3.5-flash"
  maxResponseLength: number;
  dailyLimitPerMember: number;
  monthlyTokenLimit: number;
  systemInstructions: string;
  safetyInstructions: string;
  allowBodyMeasurements: boolean;
  allowAttendance: boolean;
  allowWorkoutLogs: boolean;
  allowChampionships: boolean;
  allowHealthNotes: boolean;
  workoutPlanToggle: boolean;
  nutritionToggle: boolean;
  competitionToggle: boolean;
  retentionPeriodDays: number;
}

export interface SavedExercise {
  id: string;
  memberId: string;
  provider: string;
  externalExerciseId: string;
  exerciseName: string;
  primaryMuscles: string[];
  category: string;
  difficulty: string;
  personalNote?: string;
  savedAt: string;
}

export interface MemberWorkoutExercise {
  id: string;
  memberId: string;
  workoutPlanId?: string;
  provider: string;
  externalExerciseId: string;
  exerciseName: string;
  primaryMuscles: string[];
  category: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  weight?: string;
  notes?: string;
  order: number;
}

export interface MemberWhatsAppSettings {
  id: string;
  memberId: string;
  whatsappNumber: string;
  instanceId: string;
  remindersEnabled: boolean;
  timezone: string;
  workoutReminderTime: string; // e.g. "18:00"
  attendanceCheckDelayMinutes: number; // e.g. 30
  attendanceCutoffTime: string; // e.g. "21:00"
  expectedWorkoutDurationMinutes: number; // e.g. 75
  completionFollowupDelayMinutes: number; // e.g. 15
  preferredLanguage: "en" | "ur";
  lastMessageStatus?: "none" | "sent" | "delivered" | "failed";
  lastMessageDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberWorkoutSession {
  id: string; // e.g. "memberId:workoutDate"
  memberId: string;
  workoutPlanId: string;
  workoutDate: string; // e.g. "2026-06-17"
  workoutName: string;
  scheduledTime: string; // e.g. "18:00"
  reminderSentAt?: string;
  attendanceQuestionSentAt?: string;
  plannedAttendanceResponse?: "coming" | "cannot_come" | "unknown";
  checkInTime?: string;
  checkOutTime?: string;
  completionQuestionSentAt?: string;
  completionResponse?: "completed" | "partially_completed" | "not_completed";
  completedAt?: string;
  status: "scheduled" | "reminder_sent" | "planning_to_attend" | "checked_in" | "workout_completed" | "workout_incomplete" | "absent" | "excused" | "skipped" | "message_failed";
  isLateAttendance: boolean;
  absenceRecordedAt?: string;
  messageFailureReason?: string;
  createdAt: string;
  updatedAt: string;
  completedExercises?: string[]; // array of completed exercise IDs
  lastOpenedAt?: string;
  totalExercisesCount?: number;
  completedExercisesCount?: number;
}

export interface MemberWorkoutExerciseDetail {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  rest: string;
  imageUrl?: string;
  videoUrl?: string;
  notes?: string;
  coachInstructions?: string;
}

export interface MemberWorkoutPlan {
  id: string;
  memberId: string;
  title: string;
  startDate: string;
  endDate: string;
  editPermission: "locked" | "limited" | "full";
  exercises: MemberWorkoutExerciseDetail[];
  history: {
    versionId: string;
    updatedBy: string; // "coach" | "member"
    updatedAt: string;
    exercises: MemberWorkoutExerciseDetail[];
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppAutomationLog {
  id: string;
  memberId: string;
  workoutSessionId: string;
  automationType: string; // "daily-workout" | "attendance-question" | "completion-question" | "absence-notification"
  destinationNumber: string;
  messageType: "text" | "button";
  messageContent: string;
  provider: string; // "waalerts"
  providerRequestId?: string;
  requestPayloadSanitized: string;
  responsePayload: string;
  status: "success" | "failed";
  errorMessage?: string;
  attemptNumber: number;
  sentAt: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface MemberPasskey {
  id: string; // Key ID / Credentials ID
  memberId: string;
  name: string;
  publicKey: string; // JWK or Base64 representation of WebAuthn public key
  counter: number;
  transports?: string[];
  deviceType?: string; // e.g. "TouchID", "FaceID", "Yubikey"
  createdAt: string;
}


