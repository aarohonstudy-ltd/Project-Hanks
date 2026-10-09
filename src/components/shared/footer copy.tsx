import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
} from "lucide-react";

const footerLinks = [
  {
    title: "শেখা শুরু করুন",
    items: [
      { label: "আমাদের কোর্স", href: "/#courses" },
      { label: "শেখার পদ্ধতি", href: "/#how-it-works" },
      { label: "সাধারণ প্রশ্ন", href: "/#faq" },
    ],
  },
  {
    title: "আপনার অ্যাকাউন্ট",
    items: [
      { label: "লগইন করুন", href: "/login" },
      { label: "হোমপেজ", href: "/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      lang="bn"
      className="relative isolate overflow-hidden border-t
        border-slate-200 bg-slate-50 text-slate-900
        dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
    >
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10
          bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.10),transparent_55%)]"
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Footer CTA */}
        <div
          className="flex flex-col items-start justify-between gap-6
            border-b border-slate-200 py-10
            sm:flex-row sm:items-center dark:border-slate-800"
        >
          <div className="flex items-center gap-4">
            <span
              className="flex size-12 shrink-0 items-center justify-center
                rounded-2xl bg-sky-100 text-sky-700
                dark:bg-sky-950 dark:text-sky-300"
            >
              <BookOpen className="size-6" aria-hidden="true" />
            </span>

            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                আপনার পরবর্তী অধ্যায় শুরু হোক।
              </h2>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                ছোট ছোট পদক্ষেপেই এগিয়ে যান বড় স্বপ্নের দিকে।
              </p>
            </div>
          </div>

          <Link
            href="/#courses"
            className="group inline-flex min-h-11 shrink-0 items-center
              justify-center gap-2 rounded-full bg-sky-700 px-6 py-3
              text-sm font-semibold text-white shadow-sm
              transition duration-200
              hover:bg-sky-800 hover:shadow-lg hover:shadow-sky-900/15
              focus-visible:outline-2 focus-visible:outline-offset-4
              focus-visible:outline-sky-500
              motion-safe:hover:-translate-y-1
              motion-reduce:transition-none"
          >
            কোর্স খুঁজে নিন

            <ArrowUpRight
              aria-hidden="true"
              className="size-4 transition-transform
                motion-safe:group-hover:translate-x-0.5
                motion-safe:group-hover:-translate-y-0.5
                motion-reduce:transition-none"
            />
          </Link>
        </div>

        {/* Main footer */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-lg
                focus-visible:outline-2 focus-visible:outline-offset-4
                focus-visible:outline-sky-500"
            >
              <span
                className="flex size-11 items-center justify-center
                  rounded-xl bg-sky-700 text-white"
              >
                <GraduationCap className="size-6" aria-hidden="true" />
              </span>

              <span className="text-xl font-bold tracking-tight">
                BytesBrew
                <span className="text-sky-700 dark:text-sky-300">
                  {" "}Academy
                </span>
              </span>
            </Link>

            <p
              className="mt-5 max-w-sm text-sm leading-7
                text-slate-600 dark:text-slate-300"
            >
              শেখার ইচ্ছা থেকে সামনে এগিয়ে যাওয়ার সাহস—
              আপনার প্রস্তুতি ও নতুন দক্ষতা অর্জনের পথে
              আমরা আছি পাশে।
            </p>

            <div
              className="mt-6 inline-flex items-center gap-2 rounded-full
                border border-slate-200 bg-white px-3 py-2
                text-xs font-medium text-slate-600
                dark:border-slate-700 dark:bg-slate-900
                dark:text-slate-300"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-emerald-500"
              />
              শিখুন। অনুশীলন করুন। এগিয়ে যান।
            </div>
          </div>

          {footerLinks.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="text-sm font-semibold">
                {group.title}
              </h3>

              <ul className="mt-5 space-y-4">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group inline-flex items-center gap-1
                        rounded-sm text-sm text-slate-600
                        transition-colors hover:text-sky-700
                        focus-visible:outline-2
                        focus-visible:outline-offset-4
                        focus-visible:outline-sky-500
                        dark:text-slate-300 dark:hover:text-sky-300"
                    >
                      {item.label}

                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-3.5 opacity-0 transition-opacity
                          group-hover:opacity-100
                          group-focus-visible:opacity-100
                          motion-reduce:transition-none"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col gap-3 border-t border-slate-200
            py-6 text-xs leading-6 text-slate-600
            sm:flex-row sm:items-center sm:justify-between
            dark:border-slate-800 dark:text-slate-400"
        >
          <p>
            © {new Date().getFullYear()} BytesBrew Academy.
            সর্বস্বত্ব সংরক্ষিত।
          </p>

          <p>আজকের শেখা, আগামীর সম্ভাবনা।</p>
        </div>
      </div>
    </footer>
  );
}