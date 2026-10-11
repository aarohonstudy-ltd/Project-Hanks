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
  date: string;
  questions: string[];
};
export type Attempt = {
  id: string;
  examId: string;
  title: string;
  answers: Record<string, number>;
  questionIds: string[];
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
};
export type StudentData = {
  profile: { name: string; email: string; goal: string; id: string };
  questions: Question[];
  exams: Exam[];
  courses: Course[];
  attempts: Attempt[];
  notifications: { title: string; body: string }[];
};
