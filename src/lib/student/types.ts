export type Section =
  | "overview"
  | "live"
  | "free"
  | "upcoming"
  | "mistakes"
  | "bookmarks"
  | "analytics"
  | "practice"
  | "questions"
  | "courses"
  | "catalog"
  | "referral"
  | "profile"
  | "leaderboard";
export type Question = {
  id: string;
  subject: string;
  text: string;
  options: string[];
  answer: number;
  explanation: string;
};
export type Exam = {
  id: string;
  title: string;
  subject: string;
  kind: "live" | "free" | "upcoming";
  isFree?: boolean;
  courseId?: string | null;
  closed?: boolean;
  // ISO end time (023); absent on older databases.
  endsAt?: string | null;
  completed?: boolean;
  date: string;
  questions: string[];
};
export type Attempt = {
  id: string;
  examId: string;
  title: string;
  answers: Record<string, number>;
  questionIds: string[];
  marks?: number;
  score: number;
  total: number;
  date: string;
};
export type Course = {
  thumbnail_url?: string | null;
  id: string;
  title: string;
  category: string;
  description: string;
  completed: number;
  lessons: string[];
  enrolled: boolean;
  color: string;
  price?: number;
  pending?: boolean;
  lessonIds?: string[];
};
export type StudentData = {
  session?: { valid: boolean; expiresAt: string | null; serverNow: string };
  bookmarks?: string[];
  reminders?: string[];
  completedLessonIds?: string[];
  referralCode?: string;
  referralCount?: number;
  leaderboard?: { name: string; score: number }[];
  profile: {
    role?: string;
    name: string;
    email: string;
    goal: string;
    id: string;
    // Profile details (020); absent until that migration runs.
    phone?: string;
    dateOfBirth?: string;
    gender?: "" | "male" | "female" | "other";
    institution?: string;
    educationLevel?: string;
    district?: string;
    address?: string;
    hasPassword?: boolean;
  };
  questions: Question[];
  exams: Exam[];
  courses: Course[];
  attempts: Attempt[];
  notifications: {
    id?: string;
    title: string;
    body: string;
    url?: string | null;
  }[];
};
