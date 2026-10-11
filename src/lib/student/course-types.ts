export type CourseLesson = {
  id: string;
  title: string;
  section: string;
  duration: number | null;
  completed: boolean;
  video: boolean;
  pdf: boolean;
  text: boolean;
};
export type CourseRoom = {
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string | null;
  };
  lessons: CourseLesson[];
  lesson: {
    id: string;
    title: string;
    content: string;
    videoUrl: string | null;
    pdfPath: string | null;
  } | null;
};
