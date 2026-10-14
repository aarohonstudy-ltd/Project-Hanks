"use client";
import Link from "next/link";
import Form from "next/form";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/shared/pagination";
import {
  sections,
  type AdminData,
  type AdminSection,
  type Options,
} from "@/lib/admin/types";
import Courses from "./sections/courses";
import Subjects from "./sections/subjects";
import Topics from "./sections/topics";
import Lessons from "./sections/lessons";
import Questions from "./sections/questions";
import Exams from "./sections/exams";
import Requests from "./sections/requests";
import Students from "./sections/students";
import Results from "./sections/results";
import Audit from "./sections/audit";
import Overview from "./sections/overview";
import Notifications from "./sections/notifications";
export type SectionProps = { data: AdminData; options: Options };
const screens = {
  courses: Courses,
  subjects: Subjects,
  topics: Topics,
  lessons: Lessons,
  questions: Questions,
  exams: Exams,
  requests: Requests,
  students: Students,
  results: Results,
  audit: Audit,
  overview: Overview,
  notifications: Notifications,
};
export default function AdminPanel({
  section,
  data,
  options,
  search,
}: {
  section: AdminSection;
  data: AdminData;
  options: Options;
  search: string;
}) {
  const Screen = screens[section];
  const title = sections.find(([s]) => s === section)?.[1];
  function href(page: number) {
    return `/admin/${section}?q=${encodeURIComponent(search)}&page=${page}`;
  }
  return (
    <>
      <div className="ad-page-title">
        <div>
          <p className="ad-eyebrow">AAROHON / CONTROL CENTER</p>
          <h1>{title}</h1>
          <p>আপনার একাডেমির তথ্য ও কার্যক্রম পরিচালনা করুন।</p>
        </div>
        <span className="ad-live">
          <span /> Supabase connected
        </span>
      </div>
      {section !== "overview" && section !== "notifications" && (
        <Form className="ad-search" action={`/admin/${section}`}>
          <input
            name="q"
            defaultValue={search}
            aria-label="খুঁজুন"
            placeholder="নাম, শিরোনাম বা প্রাসঙ্গিক তথ্য দিয়ে খুঁজুন…"
          />
          <Button variant="outline" type="submit">
            খুঁজুন
          </Button>
          {search && <Link href={`/admin/${section}`}>মুছুন</Link>}
        </Form>
      )}
      <Screen data={data} options={options} />
      {section !== "overview" && (
        <Pagination
          className="ad-pagination"
          page={data.page}
          total={data.total}
          pageSize={25}
          href={href}
        />
      )}
    </>
  );
}
