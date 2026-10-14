import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpen, CheckCircle2 } from "lucide-react";
import { getHomeData } from "@/lib/academy/service";
import CourseCover from "@/components/course-cover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import "@/app/home.css";
// Rendered on first visit, then cached; admin saves revalidate it immediately.
export const revalidate = 300;
export async function generateStaticParams() {
  return [];
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const data = await getHomeData();
  if (data.error) throw new Error("Course information unavailable");
  const course = data.courses.find((item) => item.id === courseId);
  if (!course) notFound();
  const bn = (value: number) => value.toLocaleString("bn-BD");

  return (
    <main lang="bn" className="academy-home min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Link
          href="/#courses"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="size-4" />
          সকল কোর্স
        </Link>
        <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="relative aspect-video overflow-hidden rounded-3xl border">
              <CourseCover src={course.cover} title={course.title} />
            </div>
            <Badge variant="secondary" className="mt-6">
              {course.category}
            </Badge>
            <h1 className="mt-4 text-3xl leading-snug font-bold sm:text-4xl">
              {course.title}
            </h1>
            <div className="mt-5 flex items-center gap-2 text-muted-foreground">
              <BookOpen className="size-5" />
              {bn(course.lessons)}টি প্রকাশিত লেসন
            </div>
            <section className="mt-8">
              <h2 className="text-xl font-semibold">কোর্স সম্পর্কে</h2>
              <p className="mt-4 whitespace-pre-line leading-8 text-muted-foreground">
                {course.description || "কোর্সের বিস্তারিত শিগগিরই যুক্ত হবে।"}
              </p>
            </section>
            {course.features.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xl font-semibold">এই কোর্সে যা থাকছে</h2>
                <ul className="mt-5 space-y-4">
                  {course.features.map((feature, index) => (
                    <li key={index} className="flex gap-3 leading-7">
                      <CheckCircle2 className="academy-accent mt-1 size-5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
          <aside className="rounded-3xl border bg-card p-6 shadow-sm lg:sticky lg:top-28">
            <h2 className="text-xl font-semibold">আপনার প্রস্তুতি শুরু করুন</h2>
            <p className="mt-5 text-4xl font-bold">
              {course.price ? `৳${bn(course.price)}` : "ফ্রি"}
            </p>
            <Button
              asChild
              className="academy-primary mt-6 h-14 w-full gap-2 rounded-full text-lg"
            >
              <Link
                href={`/dashboard/catalog?course=${encodeURIComponent(course.id)}`}
              >
                এনরোল করুন <ArrowUpRight className="size-5" />
              </Link>
            </Button>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              লগইন করে ড্যাশবোর্ড থেকে এনরোল করুন।{" "}
              {course.price
                ? "পেইড কোর্সে আপনার অনুরোধ অ্যাডমিন অনুমোদন দেবেন।"
                : "ফ্রি কোর্সে সরাসরি এনরোল করতে পারবেন।"}
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
