import { serverClient } from "@/lib/supabase/server";
import type { CourseRoom } from "@/lib/student/course-types";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const { courseId, lessonId } = await params;
  const client = await serverClient();
  const { data: auth } = await client.auth.getUser();
  const fail = (message: string, status: number) =>
    new Response(message, {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  if (!auth.user) return fail("PDF download করতে login করুন।", 401);
  const { data, error } = await client.rpc("aarohon_course_content", {
    course_ident: courseId,
    lesson_ident: lessonId,
  });
  if (error || !data)
    return fail("এই লেসন download করার অনুমতি নেই অথবা লেসনটি উপলব্ধ নয়।", 403);
  const lesson = (data as CourseRoom).lesson;
  if (!lesson?.pdfPath) return fail("এই লেসনে PDF নেই।", 404);
  const filename =
    (lesson.title.replace(/[\/\\:*?"<>|\r\n]/g, "-").slice(0, 100) ||
      "lesson") + ".pdf";
  const { data: signed, error: signError } = await client.storage
    .from("course-materials")
    .createSignedUrl(lesson.pdfPath, 60, { download: filename });
  if (signError || !signed)
    return fail("PDF download করা যায়নি। পরে আবার চেষ্টা করুন।", 503);
  return new Response(null, {
    status: 302,
    headers: {
      Location: signed.signedUrl,
      "Cache-Control": "private, no-store",
    },
  });
}
