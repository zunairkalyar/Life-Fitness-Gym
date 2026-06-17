import { MemberWhatsAppSettings, MemberWorkoutSession, WhatsAppAutomationLog } from "../types";

export const defaultWhatsAppSettings: MemberWhatsAppSettings[] = [
  {
    id: "ws-kfc-101",
    memberId: "KFC-101",
    whatsappNumber: "923443292360",
    instanceId: "LF-INST-KFC1",
    remindersEnabled: true,
    timezone: "Asia/Karachi",
    workoutReminderTime: "18:00",
    attendanceCheckDelayMinutes: 30,
    attendanceCutoffTime: "21:00",
    expectedWorkoutDurationMinutes: 75,
    completionFollowupDelayMinutes: 15,
    preferredLanguage: "en",
    lastMessageStatus: "delivered",
    lastMessageDate: "2026-06-16T18:00:00Z",
    createdAt: "2026-06-15T12:00:00Z",
    updatedAt: "2026-06-16T18:00:00Z"
  },
  {
    id: "ws-kfc-102",
    memberId: "KFC-102",
    whatsappNumber: "923443292360",
    instanceId: "LF-INST-KFC2",
    remindersEnabled: true,
    timezone: "Asia/Karachi",
    workoutReminderTime: "17:30",
    attendanceCheckDelayMinutes: 45,
    attendanceCutoffTime: "21:30",
    expectedWorkoutDurationMinutes: 60,
    completionFollowupDelayMinutes: 10,
    preferredLanguage: "ur",
    lastMessageStatus: "delivered",
    lastMessageDate: "2026-06-16T17:30:00Z",
    createdAt: "2026-06-15T12:00:00Z",
    updatedAt: "2026-06-16T17:30:00Z"
  },
  {
    id: "ws-kfc-103",
    memberId: "KFC-103",
    whatsappNumber: "923234556677",
    instanceId: "LF-INST-KFC3",
    remindersEnabled: false,
    timezone: "Asia/Karachi",
    workoutReminderTime: "19:00",
    attendanceCheckDelayMinutes: 30,
    attendanceCutoffTime: "22:00",
    expectedWorkoutDurationMinutes: 90,
    completionFollowupDelayMinutes: 15,
    preferredLanguage: "en",
    lastMessageStatus: "none",
    createdAt: "2026-06-15T12:00:00Z",
    updatedAt: "2026-06-15T12:00:00Z"
  }
];

export const defaultWorkoutSessions: MemberWorkoutSession[] = [
  // Session for Kamran Kalyar (KFC-101) - Checked in, and completed workout!
  {
    id: "session-kfc-101-2026-06-16",
    memberId: "KFC-101",
    workoutPlanId: "wp-kfc-101-1",
    workoutDate: "2026-06-16",
    workoutName: "Push Day Workout",
    scheduledTime: "18:00",
    reminderSentAt: "18:00",
    checkInTime: "18:15",
    completionQuestionSentAt: "19:45",
    completionResponse: "completed",
    completedAt: "19:50",
    status: "workout_completed",
    isLateAttendance: false,
    createdAt: "2026-06-16T11:00:00Z",
    updatedAt: "2026-06-16T19:50:00Z"
  },
  // Session for Kamran Kalyar today (KFC-101) - Scheduled, just reminded
  {
    id: "session-kfc-101-2026-06-17",
    memberId: "KFC-101",
    workoutPlanId: "wp-kfc-101-1",
    workoutDate: "2026-06-17",
    workoutName: "Chest and Triceps Hypertrophy",
    scheduledTime: "18:00",
    reminderSentAt: "18:00",
    status: "reminder_sent",
    isLateAttendance: false,
    createdAt: "2026-06-17T11:00:00Z",
    updatedAt: "2026-06-17T18:00:00Z"
  },
  // Session for Zunair Kalyar (KFC-102) - Absent yesterday
  {
    id: "session-kfc-102-2026-06-16",
    memberId: "KFC-102",
    workoutPlanId: "wp-kfc-102-1",
    workoutDate: "2026-06-16",
    workoutName: "Pull Day - Lats Focused",
    scheduledTime: "17:30",
    reminderSentAt: "17:30",
    attendanceQuestionSentAt: "18:15",
    plannedAttendanceResponse: "cannot_come",
    absenceRecordedAt: "21:30",
    status: "absent",
    isLateAttendance: false,
    createdAt: "2026-06-16T11:00:00Z",
    updatedAt: "2026-06-16T21:30:00Z"
  }
];

export const defaultWhatsAppLogs: WhatsAppAutomationLog[] = [
  {
    id: "log-1",
    memberId: "KFC-101",
    workoutSessionId: "session-kfc-101-2026-06-16",
    automationType: "daily-workout",
    destinationNumber: "923443292360",
    messageType: "text",
    messageContent: "🏋️ Life Fitness — Today’s Workout\n\nHello Kamran Kalyar,\n\nYour workout for today is:\n\n🔥 Push Day Workout...\n\nStay focused! 💪",
    provider: "waalerts",
    providerRequestId: "req_wa_kfc101_daily",
    requestPayloadSanitized: '{"number":"923443292360","type":"text","message":"[SANITIZED]","instance_id":"LF-INST-KFC1"}',
    responsePayload: '{"success":true,"message":"Message placed in queue","id":"msg_abcd123"}',
    status: "success",
    attemptNumber: 1,
    sentAt: "2026-06-16T18:00:00Z",
    deliveredAt: "2026-06-16T18:00:15Z",
    createdAt: "2026-06-16T18:00:00Z"
  },
  {
    id: "log-2",
    memberId: "KFC-101",
    workoutSessionId: "session-kfc-101-2026-06-16",
    automationType: "completion-question",
    destinationNumber: "923443292360",
    messageType: "text",
    messageContent: "✅ Workout Check\n\nHello Kamran Kalyar,\n\nYou checked into Life Fitness at 18:15.\n\nDid you complete today’s workout?",
    provider: "waalerts",
    providerRequestId: "req_wa_kfc101_comp",
    requestPayloadSanitized: '{"number":"923443292360","type":"text","message":"[SANITIZED]","instance_id":"LF-INST-KFC1"}',
    responsePayload: '{"success":true,"message":"Message placed in queue"}',
    status: "success",
    attemptNumber: 1,
    sentAt: "2026-06-16T19:45:00Z",
    deliveredAt: "2026-06-16T19:45:10Z",
    createdAt: "2026-06-16T19:45:00Z"
  }
];
