import { 
  Member, 
  MembershipPlan, 
  ExerciseChallenge, 
  CompetitionAttempt, 
  ChallengeWinner, 
  PaymentRecord, 
  AttendanceRecord, 
  Announcement, 
  GymSettings 
} from "../types";

export const defaultSettings: GymSettings = {
  gymName: "Life Fitness",
  location: "Wasar Road, Mandi Bahauddin, Pakistan",
  googleMapsUrl: "https://maps.google.com/?q=Life+Fitness+Wasar+Road+Mandi+Bahauddin",
  phone: "+923443292360",
  whatsApp: "+923443292360",
  openTimeMaleMorn: "06:00 AM",
  closeTimeMaleMorn: "10:00 AM",
  openTimeFemale: "11:00 AM",
  closeTimeFemale: "04:00 PM",
  openTimeMaleEve: "05:00 PM",
  closeTimeMaleEve: "10:00 PM",
  cleaningBreak1: "10:00 AM to 11:00 AM",
  cleaningBreak2: "04:00 PM to 05:00 PM",
  weeklyHoliday: "Sunday",
  ramadanTimings: "Male: 4:30 AM - 7:30 AM & 8:30 PM - 11:30 PM | Female: 2:00 PM - 5:00 PM",
  specialNotice: "Ramadan schedules are currently active. All members are advised to perform heavy lifting during supervised hours only.",
  initialAdminEmail: "zunairkalyar10@gmail.com"
};

export const defaultPlans: MembershipPlan[] = [
  {
    planId: "basic",
    name: "Plan A: Basic Membership",
    description: "Gym package designed for classic strength conditioning. Access to all free weights and plate-loaded racks (excludes access to electric cardio machines).",
    price1m: 2500,
    price3m: 7125, // 7500 - 5% discount
    price6m: 13500, // 15000 - 10% discount
    price12m: 25500, // 30000 - 15% discount
    features: [
      "Access to full Dumbbell & Olympic barbell array",
      "Access to Squat racks, Deadlift platforms & Bench press",
      "Plate-loaded strength isolation machines",
      "In-gym lockboxes & sanitation areas",
      "Male/Female separated timing availability",
      "Admissibility to 'Life Fitness Top Nine' monthly competitions"
    ],
    isPopular: false,
    isActive: true
  },
  {
    planId: "premium",
    name: "Plan B: Premium Membership",
    description: "All-inclusive VIP pass. Full access to electronic treadmills, cross-trainers, stationary speed cylinders, power-assisted plates, and all gym facilities.",
    price1m: 4000,
    price3m: 11400, // 12000 - 5% discount
    price6m: 21600, // 24000 - 10% discount
    price12m: 40800, // 48000 - 15% discount
    features: [
      "Unrestricted access to all basic tier plate machines",
      "Full access to electronic treadmills, steppers & cardio rigs",
      "Complimentary dietary schedule & baseline BMI logging",
      "Shower access & premium private locker keys",
      "Extended personal-trainer consultation (1 session/mo)",
      "Priority submission checks in monthly competitions"
    ],
    isPopular: true,
    isActive: true
  }
];

export const defaultExercises: ExerciseChallenge[] = [
  {
    id: "bench_press",
    name: "Bench Press Rep Challenge",
    benchmarkMale: "120 KG",
    benchmarkFemale: "60 KG",
    scoringType: "Reps",
    rules: "Valid repetitions completed at the benchmark weight. Bar must touch chest and lock out fully at the top. Spotter cannot assist during active reps.",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "chest_press",
    name: "Chest Press Rep Challenge",
    benchmarkMale: "80 KG Machine Weight",
    benchmarkFemale: "40 KG Machine Weight",
    scoringType: "Reps",
    rules: "Assisted machine chest press at fixed pin block. Elbows must break 90 degrees at bottom, locking out completely at top.",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "treadmill",
    name: "Treadmill Endurance Challenge",
    benchmarkMale: "8 KM/H (2% Incline)",
    benchmarkFemale: "7 KM/H (1% Incline)",
    scoringType: "Time",
    rules: "Longest continuous run at the designated Speed & Incline. Holding the handlebars is prohibited. Maximum of one 5-second emergency pause allowed.",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1578762560072-44314e66480d?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "push_ups",
    name: "Push-Up Speed Challenge",
    benchmarkMale: "Max in 2 Minutes",
    benchmarkFemale: "Max in 2 Minutes (Knee Support permitted)",
    scoringType: "Reps",
    rules: "Full range pushups. Body must remain in a rigid straight line (or knees on carpet for female adaptions). Chest must touch the floor foam spacer.",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "squats",
    name: "Squat Depth Challenge",
    benchmarkMale: "140 KG",
    benchmarkFemale: "70 KG",
    scoringType: "Reps",
    rules: "Barbell back squat repetitions. Hip crease must pass below top of the kneecaps (parallel depth). Belt and knee sleeves are permitted.",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "deadlift",
    name: "Deadlift Rep Challenge",
    benchmarkMale: "180 KG",
    benchmarkFemale: "90 KG",
    scoringType: "Reps",
    rules: "Repetitions from static floor to lockout. No bouncing off the floor. Lifting straps are prohibited. Belt and chalk are allowed.",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "shoulder_press",
    name: "Shoulder Press Challenge",
    benchmarkMale: "60 KG",
    benchmarkFemale: "30 KG",
    scoringType: "Reps",
    rules: "Standing overhead strict press. No leg drive permitted (no push press). Barbell must clear jaw and lock out directly over spine.",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "pull_ups",
    name: "Continuous Pull-Up Challenge",
    benchmarkMale: "Dead-hang (Bodyweight)",
    benchmarkFemale: "Assisted (Level 12)",
    scoringType: "Reps",
    rules: "Maximum consecutive reps without dropping off the bar. Chin must clear the horizontal plane of the bar, arms fully straight at the bottom.",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1598971619177-3e1ee698afeb?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "plank",
    name: "Plank Endurance Challenge",
    benchmarkMale: "Forearm Plank (No movement)",
    benchmarkFemale: "Forearm Plank (No movement)",
    scoringType: "Time",
    rules: "Static plank on forearms. Hips must reside in stable neutral alignment. Any sag or peaking of hips terminates the clock.",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400"
  }
];

export const demoMembers: Member[] = [
  {
    id: "KFC-101",
    uid: "dummy_uid_1",
    fullName: "Kamran Kalyar",
    fatherName: "Muhammad Khan Kalyar",
    phone: "03443292360",
    whatsApp: "03443292360",
    gender: "Male",
    dob: "1994-04-12",
    address: "Wasar Road, Mandi Bahauddin",
    emergencyContactName: "Irfan Kalyar",
    emergencyContactNumber: "03451234567",
    bloodGroup: "O+",
    cnic: "34401-2223344-1",
    photoUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=150",
    planId: "premium",
    planName: "Plan B: Premium Membership",
    durationMonths: 12,
    membershipStatus: "Active",
    joinedDate: "2026-01-01",
    expiryDate: "2026-12-31",
    medicalNotes: "No chronic conditions. Excellent baseline endurance levels.",
    createdAt: "2026-01-01T08:00:00Z",
    updatedAt: "2026-01-01T08:00:00Z"
  },
  {
    id: "KFC-102",
    uid: "dummy_uid_2",
    fullName: "Zunair Kalyar",
    fatherName: "Ghulam Muhammad",
    phone: "03443292360",
    whatsApp: "03443292360",
    gender: "Male",
    dob: "1998-08-20",
    address: "Al-Imran Market, Wasar Road, Mandi Bahauddin",
    emergencyContactName: "Nadeem Ashraf",
    emergencyContactNumber: "03417643213",
    bloodGroup: "A+",
    cnic: "34401-9876543-1",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    planId: "premium",
    planName: "Plan B: Premium Membership",
    durationMonths: 6,
    membershipStatus: "Active",
    joinedDate: "2026-03-15",
    expiryDate: "2026-09-15",
    medicalNotes: "Minor left rotator cuff sensitivity. Exercising strict care on overhead work.",
    createdAt: "2026-03-15T09:00:00Z",
    updatedAt: "2026-03-15T09:00:00Z"
  },
  {
    id: "KFC-103",
    uid: "dummy_uid_3",
    fullName: "Ayesha Gondal",
    fatherName: "Tariq Gondal",
    phone: "03234556677",
    whatsApp: "03234556677",
    gender: "Female",
    dob: "2000-11-05",
    address: "Sufipura, Mandi Bahauddin",
    emergencyContactName: "Tariq Gondal",
    emergencyContactNumber: "03001234567",
    bloodGroup: "B+",
    cnic: "34401-4455667-2",
    photoUrl: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80&w=150",
    planId: "premium",
    planName: "Plan B: Premium Membership",
    durationMonths: 3,
    membershipStatus: "Active",
    joinedDate: "2026-05-10",
    expiryDate: "2026-08-10",
    medicalNotes: "",
    createdAt: "2026-05-10T11:00:00Z",
    updatedAt: "2026-05-10T11:00:00Z"
  },
  {
    id: "KFC-104",
    uid: "dummy_uid_4",
    fullName: "Usman Tarar",
    fatherName: "Bashir Tarar",
    phone: "03456677889",
    whatsApp: "03456677889",
    gender: "Male",
    dob: "1995-02-14",
    address: "Civil Lines, Mandi Bahauddin",
    emergencyContactName: "Bashir Tarar",
    emergencyContactNumber: "03451112233",
    bloodGroup: "O-",
    cnic: "34401-9988776-1",
    photoUrl: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&q=80&w=150",
    planId: "basic",
    planName: "Plan A: Basic Membership",
    durationMonths: 1,
    membershipStatus: "Expired",
    joinedDate: "2026-04-01",
    expiryDate: "2026-05-01",
    medicalNotes: "Slight low back strain history.",
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z"
  },
  {
    id: "KFC-105",
    uid: "dummy_uid_5",
    fullName: "Naseem Akhtar",
    fatherName: "Karamat Ali",
    phone: "03115566744",
    whatsApp: "",
    gender: "Female",
    dob: "1993-07-22",
    address: "Wasar Road, Mandi Bahauddin",
    emergencyContactName: "Karamat Ali",
    emergencyContactNumber: "03212345678",
    bloodGroup: "AB+",
    cnic: "34401-1111222-2",
    photoUrl: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=150",
    planId: "basic",
    planName: "Plan A: Basic Membership",
    durationMonths: 1,
    membershipStatus: "Expiring Soon",
    joinedDate: "2026-05-18",
    expiryDate: "2026-06-18",
    medicalNotes: "",
    createdAt: "2026-05-18T10:30:00Z",
    updatedAt: "2026-05-18T10:30:00Z"
  },
  // Adding 15 more members dynamically to have a deep 20-member list
  ...Array.from({ length: 15 }, (_, i) => {
    const isMale = i % 2 === 0;
    const namesM = ["Hamza", "Bilal", "Faisal", "Ali", "Zahid", "Shoaib", "Qasim", "Saeed"];
    const namesF = ["Sadia", "Zainab", "Sana", "Amna", "Maria", "Mariam", "Fatima"];
    const surnames = ["Ranjha", "Gondal", "Gujjar", "Tarar", "Waraich", "Kalyar", "Chatha"];

    const fullName = isMale 
      ? `${namesM[i % namesM.length]} ${surnames[i % surnames.length]}`
      : `${namesF[i % namesF.length]} ${surnames[i % surnames.length]}`;

    const joinedMonthsAgo = (i % 3) + 1;
    const expMonths = (i % 4) + 1;
    const statuses: Member["membershipStatus"][] = ["Active", "Active", "Active", "Expired", "Suspended", "Frozen"];

    return {
      id: `KFC-${106 + i}`,
      fullName,
      fatherName: `Muhammad ${surnames[(i + 1) % surnames.length]}`,
      phone: `0300${1234560 + i}`,
      whatsApp: `0300${1234560 + i}`,
      gender: isMale ? "Male" as const : "Female" as const,
      dob: `199${(i % 9) + 1}-0${(i % 9) + 1}-10`,
      address: `Sector ${i + 1}, Mandi Bahauddin`,
      emergencyContactName: `Father of ${fullName}`,
      emergencyContactNumber: `0333${9876540 + i}`,
      bloodGroup: ["A+", "B+", "O+", "AB+"][i % 4],
      cnic: `34401-445588${i}-1`,
      photoUrl: isMale 
        ? `https://images.unsplash.com/photo-${["1500648767791-00dcc994a43e", "1539571696357-5a69c17a67c6", "1506794778202-cad84cf45f1d"][i % 3]}?auto=format&fit=crop&q=80&w=150`
        : `https://images.unsplash.com/photo-${["1544005313-94ddf0286df2", "1494790108377-be9c29b29330", "1438761681033-6461ffad8d80"][i % 3]}?auto=format&fit=crop&q=80&w=150`,
      planId: i % 3 === 0 ? "basic" : "premium",
      planName: i % 3 === 0 ? "Plan A: Basic Membership" : "Plan B: Premium Membership",
      durationMonths: [1, 3, 6, 12][i % 4],
      membershipStatus: statuses[i % statuses.length],
      joinedDate: `2026-0${7 - joinedMonthsAgo}-01`,
      expiryDate: `2026-0${7 - joinedMonthsAgo + expMonths}-01`,
      medicalNotes: i % 5 === 0 ? "Asthmatic under medication" : "",
      createdAt: `2026-02-01T08:00:00Z`,
      updatedAt: `2026-02-01T08:00:00Z`
    };
  })
];

export const demoPastWinners: ChallengeWinner[] = [
  {
    id: "2026-05_bench_press",
    period: "2026-05",
    memberId: "KFC-101",
    memberName: "Kamran Kalyar",
    exerciseId: "bench_press",
    exerciseName: "Bench Press Rep Challenge",
    score: 24,
    scoreDisplay: "24 Reps @ 120 KG",
    prize: "1 Month Premium Gym Membership Free",
    photoUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "2026-05_chest_press",
    period: "2026-05",
    memberId: "KFC-108",
    memberName: "Bilal Gujjar",
    exerciseId: "chest_press",
    exerciseName: "Chest Press Rep Challenge",
    score: 31,
    scoreDisplay: "31 Reps @ 80 KG",
    prize: "1 Month Basic Gym Membership Free",
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "2026-05_treadmill",
    period: "2026-05",
    memberId: "KFC-103",
    memberName: "Ayesha Gondal",
    exerciseId: "treadmill",
    exerciseName: "Treadmill Endurance Challenge",
    score: 2520, // 42 minutes
    scoreDisplay: "42:00 mins @ 7 KM/H",
    prize: "1 Month Premium Gym Membership Free",
    photoUrl: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "2026-05_push_ups",
    period: "2026-05",
    memberId: "KFC-102",
    memberName: "Zunair Kalyar",
    exerciseId: "push_ups",
    exerciseName: "Push-Up Speed Challenge",
    score: 95,
    scoreDisplay: "95 Reps in 2 mins",
    prize: "1 Month Premium Gym Membership Free"
  },
  {
    id: "2026-05_squats",
    period: "2026-05",
    memberId: "KFC-112",
    memberName: "Hamza Waraich",
    exerciseId: "squats",
    exerciseName: "Squat Depth Challenge",
    score: 18,
    scoreDisplay: "18 Reps @ 140 KG",
    prize: "1 Month Basic Gym Membership Free"
  },
  {
    id: "2026-05_deadlift",
    period: "2026-05",
    memberId: "KFC-114",
    memberName: "Ali Tarar",
    exerciseId: "deadlift",
    exerciseName: "Deadlift Rep Challenge",
    score: 15,
    scoreDisplay: "15 Reps @ 180 KG",
    prize: "1 Month Basic Gym Membership Free"
  },
  {
    id: "2026-05_shoulder_press",
    period: "2026-05",
    memberId: "KFC-116",
    memberName: "Shoaib Gujjar",
    exerciseId: "shoulder_press",
    exerciseName: "Shoulder Press Challenge",
    score: 12,
    scoreDisplay: "12 Reps @ 60 KG",
    prize: "1 Month Premium Gym Membership Free"
  },
  {
    id: "2026-05_pull_ups",
    period: "2026-05",
    memberId: "KFC-110",
    memberName: "Faisal Ranjha",
    exerciseId: "pull_ups",
    exerciseName: "Continuous Pull-Up Challenge",
    score: 34,
    scoreDisplay: "34 reps continuous",
    prize: "1 Month Basic Gym Membership Free"
  },
  {
    id: "2026-05_plank",
    period: "2026-05",
    memberId: "KFC-105",
    memberName: "Naseem Akhtar",
    exerciseId: "plank",
    exerciseName: "Plank Endurance Challenge",
    score: 410, // 6 mins 50 secs
    scoreDisplay: "6 mins 50 secs plank",
    prize: "1 Month Basic Gym Membership Free",
    photoUrl: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=150"
  }
];

export const demoAttempts: CompetitionAttempt[] = [
  // Bench Press
  {
    attemptId: "att-101",
    memberId: "KFC-101",
    memberName: "Kamran Kalyar",
    gender: "Male",
    exerciseId: "bench_press",
    exerciseName: "Bench Press Rep Challenge",
    score: 22,
    scoreDisplay: "22 Reps @ 120 KG",
    staffId: "trainer_p1",
    staffName: "Trainer Asif",
    status: "Approved",
    period: "2026-06",
    createdAt: "2026-06-05T18:00:00-07:00",
    updatedAt: "2026-06-05T18:00:00-07:00"
  },
  {
    attemptId: "att-102",
    memberId: "KFC-102",
    memberName: "Zunair Kalyar",
    gender: "Male",
    exerciseId: "bench_press",
    exerciseName: "Bench Press Rep Challenge",
    score: 25,
    scoreDisplay: "25 Reps @ 120 KG",
    staffId: "trainer_p1",
    staffName: "Trainer Asif",
    status: "Approved",
    period: "2026-06",
    createdAt: "2026-06-10T18:30:00-07:00",
    updatedAt: "2026-06-10T18:35:00-07:00"
  },
  {
    attemptId: "att-103",
    memberId: "KFC-106",
    memberName: "Hamza Tarar",
    gender: "Male",
    exerciseId: "bench_press",
    exerciseName: "Bench Press Rep Challenge",
    score: 18,
    scoreDisplay: "18 Reps @ 120 KG",
    staffId: "staff_recept",
    staffName: "Admin Zunair",
    status: "Approved",
    period: "2026-06",
    createdAt: "2026-06-12T17:00:00-07:00",
    updatedAt: "2026-06-12T17:02:00-07:00"
  },
  // Push Ups
  {
    attemptId: "att-201",
    memberId: "KFC-102",
    memberName: "Zunair Kalyar",
    gender: "Male",
    exerciseId: "push_ups",
    exerciseName: "Push-Up Speed Challenge",
    score: 98,
    scoreDisplay: "98 Reps in 2 mins",
    staffId: "trainer_p1",
    staffName: "Trainer Asif",
    status: "Approved",
    period: "2026-06",
    createdAt: "2026-06-02T19:00:00-07:00",
    updatedAt: "2026-06-02T19:10:00-07:00"
  },
  {
    attemptId: "att-202",
    memberId: "KFC-101",
    memberName: "Kamran Kalyar",
    gender: "Male",
    exerciseId: "push_ups",
    exerciseName: "Push-Up Speed Challenge",
    score: 104,
    scoreDisplay: "104 Reps in 2 mins",
    staffId: "trainer_p1",
    staffName: "Trainer Asif",
    status: "Approved",
    period: "2026-06",
    createdAt: "2026-06-14T18:00:00-07:00",
    updatedAt: "2026-06-14T18:05:00-07:00"
  },
  {
    attemptId: "att-203",
    memberId: "KFC-110",
    memberName: "Faisal Gondal",
    gender: "Male",
    exerciseId: "push_ups",
    exerciseName: "Push-Up Speed Challenge",
    score: 89,
    scoreDisplay: "89 Reps in 2 mins",
    staffId: "trainer_p1",
    staffName: "Trainer Asif",
    status: "Approved",
    period: "2026-06",
    createdAt: "2026-06-12T18:00:00-07:00",
    updatedAt: "2026-06-12T18:00:00-07:00"
  },
  // Treadmill
  {
    attemptId: "att-301",
    memberId: "KFC-103",
    memberName: "Ayesha Gondal",
    gender: "Female",
    exerciseId: "treadmill",
    exerciseName: "Treadmill Endurance Challenge",
    score: 2700, // 45 mins
    scoreDisplay: "45 mins @ 7 KM/H",
    staffId: "trainer_p1",
    staffName: "Trainer Asif",
    status: "Approved",
    period: "2026-06",
    createdAt: "2026-06-07T12:00:00-07:00",
    updatedAt: "2026-06-07T12:30:00-07:00"
  },
  {
    attemptId: "att-302",
    memberId: "KFC-105",
    memberName: "Naseem Akhtar",
    gender: "Female",
    exerciseId: "treadmill",
    exerciseName: "Treadmill Endurance Challenge",
    score: 2100, // 35 mins
    scoreDisplay: "35 mins @ 7 KM/H",
    staffId: "trainer_p1",
    staffName: "Trainer Asif",
    status: "Approved",
    period: "2026-06",
    createdAt: "2026-06-09T13:00:00-07:00",
    updatedAt: "2026-06-09T13:00:00-07:00"
  },
  // Pending Attemp for validation testing
  {
    attemptId: "att-pending-01",
    memberId: "KFC-106",
    memberName: "Hamza Tarar",
    gender: "Male",
    exerciseId: "squats",
    exerciseName: "Squat Depth Challenge",
    score: 15,
    scoreDisplay: "15 Reps @ 140 KG",
    staffId: "trainer_p1",
    staffName: "Trainer Asif",
    status: "Pending",
    period: "2026-06",
    createdAt: "2026-06-15T10:00:00-07:00",
    updatedAt: "2026-06-15T10:00:00-07:00"
  }
];

export const demoPayments: PaymentRecord[] = [
  {
    paymentId: "pay-101",
    receiptNo: "REC-2026-0001",
    memberId: "KFC-101",
    memberName: "Kamran Kalyar",
    planName: "Plan B: Premium Membership",
    duration: 12,
    originalPrice: 48000,
    discountType: "Promo",
    discountAmount: 7200, // 15% discount
    finalPaidAmount: 40800,
    paymentMethod: "Bank Transfer",
    paymentStatus: "Paid",
    paymentDate: "2026-01-01",
    refNo: "FT-983748293",
    receivedBy: "Admin Zunair",
    createdAt: "2026-01-01T08:30:00Z"
  },
  {
    paymentId: "pay-102",
    receiptNo: "REC-2026-0002",
    memberId: "KFC-102",
    memberName: "Zunair Kalyar",
    planName: "Plan B: Premium Membership",
    duration: 6,
    originalPrice: 24000,
    discountType: "Promo",
    discountAmount: 2400, // 10% discount
    finalPaidAmount: 21600,
    paymentMethod: "EasyPaisa",
    paymentStatus: "Paid",
    paymentDate: "2026-03-15",
    refNo: "EP-4837492",
    receivedBy: "Admin Zunair",
    createdAt: "2026-03-15T09:12:00Z"
  },
  {
    paymentId: "pay-103",
    receiptNo: "REC-2026-0003",
    memberId: "KFC-103",
    memberName: "Ayesha Gondal",
    planName: "Plan B: Premium Membership",
    duration: 3,
    originalPrice: 12000,
    discountType: "Promo",
    discountAmount: 600, // 5%
    finalPaidAmount: 11400,
    paymentMethod: "Cash at Gym",
    paymentStatus: "Paid",
    paymentDate: "2026-05-10",
    receivedBy: "Admin Zunair",
    createdAt: "2026-05-10T11:05:00Z"
  }
];

export const demoAttendance: AttendanceRecord[] = [
  {
    recordId: "attlog-01",
    memberId: "KFC-101",
    memberName: "Kamran Kalyar",
    gender: "Male",
    date: "2026-06-15",
    checkInTime: "07:15 AM",
    checkOutTime: "08:45 AM",
    staffId: "reception_01",
    staffName: "Receptionist Maryam",
    status: "Present"
  },
  {
    recordId: "attlog-02",
    memberId: "KFC-102",
    memberName: "Zunair Kalyar",
    gender: "Male",
    date: "2026-06-15",
    checkInTime: "07:30 AM",
    checkOutTime: "09:00 AM",
    staffId: "reception_01",
    staffName: "Receptionist Maryam",
    status: "Present"
  },
  {
    recordId: "attlog-03",
    memberId: "KFC-103",
    memberName: "Ayesha Gondal",
    gender: "Female",
    date: "2026-06-15",
    checkInTime: "11:45 AM",
    checkOutTime: "01:15 PM",
    staffId: "reception_01",
    staffName: "Receptionist Maryam",
    status: "Present"
  },
  {
    recordId: "attlog-04",
    memberId: "KFC-105",
    memberName: "Naseem Akhtar",
    gender: "Female",
    date: "2026-06-15",
    checkInTime: "12:00 PM",
    checkOutTime: "01:30 PM",
    staffId: "reception_01",
    staffName: "Receptionist Maryam",
    status: "Present"
  }
];

export const demoAnnouncements: Announcement[] = [
  {
    id: "ann-01",
    title: "New Weight Plates and Dumbbells Sourced",
    content: "We have upgraded our free-weight range with 500 KG of rubber-coated Olympic grade plates and new heavy-lift dumbbells ranging from 35 KG to 60 KG. Visit today to break your PRs!",
    isActive: true,
    createdAt: "2026-06-10T08:00:00Z"
  },
  {
    id: "ann-02",
    title: "Life Fitness App Launches!",
    content: "Our members can now view their digital cards, daily attendance histories, fee payment invoices, and check live exercise standings on our monthly leaderboards via mobile!",
    isActive: true,
    createdAt: "2026-06-14T08:00:00Z"
  }
];
