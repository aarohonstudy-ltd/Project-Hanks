"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Menu,
  X,
  ArrowUpRight,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { browserClient } from "@/lib/supabase/client";
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
import "./admin.css";
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
};
export default function AdminPanel({
  section,
  name,
  data,
  options,
  search,
}: {
  section: AdminSection;
  name: string;
  data: AdminData;
  options: Options;
  search: string;
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const router = useRouter(),
    { setTheme, resolvedTheme } = useTheme();
  const Screen = screens[section];
  const title = sections.find(([s]) => s === section)?.[1];
  function href(page: number) {
    return `/admin/${section}?q=${encodeURIComponent(search)}&page=${page}`;
  }
  return (
    <div className="ad-root">
      <aside className={`ad-sidebar ${open ? "ad-open" : ""}`}>
        <Link className="ad-brand" href="/admin">
          <span>আ</span>
          <div>
            আরোহণ<small>ADMIN WORKSPACE</small>
          </div>
        </Link>
        <button
          className="ad-close"
          onClick={() => setOpen(false)}
          aria-label="মেনু বন্ধ করুন"
        >
          <X />
        </button>
        <p className="ad-nav-label">ম্যানেজমেন্ট</p>
        <nav>
          {sections.map(([id, label], i) => (
            <Link
              aria-current={section === id ? "page" : undefined}
              key={id}
              href={id === "overview" ? "/admin" : `/admin/${id}`}
              className={section === id ? "active" : ""}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="ad-admin-id">
          <ShieldCheck size={20} />
          <div>
            {name}
            <small>Administrator</small>
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="ad-backdrop"
          aria-label="মেনু বন্ধ করুন"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="ad-main">
        <header className="ad-header">
          <div className="flex items-center gap-3">
            <Button
              className="ad-menu"
              variant="ghost"
              size="icon"
              aria-label="মেনু খুলুন"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </Button>
            <span>
              Workspace <span className="text-muted-foreground mx-2">/</span>{" "}
              <strong>{title}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="থিম পরিবর্তন"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <Sun size={18} className="hidden dark:block" />
              <Moon size={18} className="dark:hidden" />
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                স্টুডেন্ট পোর্টাল <ArrowUpRight size={15} />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="লগআউট"
              onClick={async () => {
                const { error } = await browserClient().auth.signOut();
                if (error) setError(error.message);
                else {
                  router.replace("/login");
                  router.refresh();
                }
              }}
            >
              <LogOut size={18} />
            </Button>
          </div>
        </header>
        <main className="ad-content">
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
          {error && <p role="alert">{error}</p>}
          {section !== "overview" && (
            <form className="ad-search" action={`/admin/${section}`}>
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
            </form>
          )}
          <Screen data={data} options={options} />
          {section !== "overview" && (
            <footer className="ad-pagination">
              <span>
                মোট {data.total}টি · পৃষ্ঠা {data.page} /{" "}
                {Math.max(1, Math.ceil(data.total / 25))}
              </span>
              <div className="flex gap-3">
                {data.page > 1 && (
                  <Link href={href(data.page - 1)}>← আগের</Link>
                )}
                {data.page * 25 < data.total && (
                  <Link href={href(data.page + 1)}>পরের →</Link>
                )}
              </div>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
