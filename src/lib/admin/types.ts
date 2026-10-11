export const sections = [
  ["overview", "সারসংক্ষেপ"],
  ["courses", "কোর্স"],
  ["subjects", "বিষয়"],
  ["topics", "টপিক"],
  ["lessons", "লেসন"],
  ["questions", "প্রশ্ন ব্যাংক"],
  ["exams", "পরীক্ষা"],
  ["requests", "এনরোলমেন্ট"],
  ["students", "শিক্ষার্থী"],
  ["results", "ফলাফল"],
  ["audit", "অ্যাক্টিভিটি লগ"],
] as const;
export type AdminSection = (typeof sections)[number][0];
export type Row = { id: string; [key: string]: unknown };
export type AdminData = {
  rows: Row[];
  total: number;
  page: number;
  counts?: Record<string, number>;
};
export type Choice = { id: string; title: string };
export type Options = {
  courses: Choice[];
  subjects: Choice[];
  topics: Choice[];
};
export type ExamItem = {
  id: string;
  title: string;
  marks: number;
  negative_marks: number;
};
export type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "select"
    | "checkbox"
    | "multi"
    | "datetime-local"
    | "url";
  required?: boolean;
  choices?: Choice[];
  min?: number;
  max?: number;
  step?: string;
  hint?: string;
};
