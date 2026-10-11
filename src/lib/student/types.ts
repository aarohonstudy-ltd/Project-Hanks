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
  closed?: boolean;
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
  bookmarks?: string[];
  reminders?: string[];
  completedLessonIds?: string[];
  referralCode?: string;
  referralCount?: number;
  leaderboard?: { name: string; score: number }[];
  profile: { name: string; email: string; goal: string; id: string };
  questions: Question[];
  exams: Exam[];
  courses: Course[];
  attempts: Attempt[];
  notifications: { title: string; body: string }[];
};
