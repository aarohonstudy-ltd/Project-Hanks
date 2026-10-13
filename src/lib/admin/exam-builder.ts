import type { Question } from "@/lib/student/types";
export type BuilderTopic = {
  id: string;
  title: string;
  subject: string;
  available: number;
};
export type ExamSettings = {
  title: string;
  exam_type: string;
  duration_minutes: number;
  pass_mark: number;
};
export type PreviewQuestion = Question & {
  topic_id: string;
  difficulty: string;
  status: string;
  marks: number;
  negative_marks: number;
};
export type ExamPreviewData = {
  questions: PreviewQuestion[];
  exam: ExamSettings | null;
};
export function gradeDemo(
  questions: PreviewQuestion[],
  answers: Record<string, number>,
) {
  let correct = 0,
    wrong = 0,
    skipped = 0,
    score = 0;
  for (const q of questions) {
    if (answers[q.id] === undefined) skipped++;
    else if (answers[q.id] === q.answer) {
      correct++;
      score += q.marks;
    } else {
      wrong++;
      score -= q.negative_marks;
    }
  }
  return {
    correct,
    wrong,
    skipped,
    score: Math.round(score * 100) / 100,
    total:
      Math.round(questions.reduce((sum, q) => sum + q.marks, 0) * 100) / 100,
  };
}
