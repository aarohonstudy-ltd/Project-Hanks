export type LeaderboardExam = {
  id: string;
  title: string;
  courseId: string | null;
  course: string;
  subjects: string;
  type: string;
};
export type LeaderboardRow = {
  rank: number;
  name: string;
  score: number;
  seconds: number;
  isMe: boolean;
  passed: boolean | null;
};
export type LeaderboardData = {
  exams: LeaderboardExam[];
  exam: {
    id: string;
    title: string;
    course: string;
    passMark: number;
    maxMarks: number;
    duration: number;
    type: string;
  } | null;
  rows: LeaderboardRow[];
  top: LeaderboardRow[];
  mine: LeaderboardRow | null;
  participants: number;
  total: number;
  page: number;
  passed: number | null;
};
