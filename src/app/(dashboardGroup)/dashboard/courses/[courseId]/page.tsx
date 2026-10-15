import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
import Classroom from "@/components/student/course-classroom";
import type { CourseRoom } from "@/lib/student/course-types";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { courseId } = await params;
  const { lesson } = await searchParams;
  const client = await serverClient();
  const { data, error } = await client.rpc("aarohon_course_content", {
    course_ident: courseId,
    lesson_ident: lesson || null,
  });
  if (error || !data)
    return (
      <div className="sd-panel p-8 space-y-4">
        <h2 className="text-xl font-bold">কোর্সটি খোলা যাচ্ছে না</h2>
        <p>
          আপনার enrollment সক্রিয় আছে কি না দেখুন। পরে আবার চেষ্টা করুন অথবা
          সহায়তার জন্য অ্যাডমিনকে জানান।
        </p>
        <Link className="text-primary" href="/dashboard/courses">
          আমার কোর্সে ফিরুন →
        </Link>
        <br />
        <Link className="text-primary" href="/dashboard/catalog">
          সকল কোর্স দেখুন →
        </Link>
      </div>
    );
  return (
    <Classroom
      key={`${courseId}:${lesson || "continue"}`}
      room={data as CourseRoom}
    />
  );
}
