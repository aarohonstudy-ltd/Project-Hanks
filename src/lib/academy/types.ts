export type Course = { id: string; title: string; category: string; cover: string; lessons: number; months: number; price: number; features: string[] };
export type HomeData = {
  courses: Course[];
  analytics: { students: number; questions: number; examsTaken: number };
  faqs: { id: string; question: string; answer: string }[];
  reviews: { id: string; name: string; course: string; text: string }[];
  videos: { id: string; title: string; src: string; poster: string }[];
};
export type Question = { id: string; text: string; options: string[]; correctIndex: number; explanation: string };
