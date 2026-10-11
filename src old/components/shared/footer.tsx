import Link from "next/link";
import { ArrowUpRight, GraduationCap } from "lucide-react";
import { siteConfig } from "@/lib/academy/site-config";
import "@/app/home.css";
export default function Footer() {
  return (
    <footer lang="bn" className="academy-home border-t">
      <div className="academy-cta">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-10 sm:flex-row sm:items-center sm:px-8">
          <div>
            <h2 className="text-2xl font-bold">
              আপনার পরবর্তী অধ্যায় শুরু হোক।
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              আজকের শেখা, আগামীর সম্ভাবনা।
            </p>
          </div>
          <Link
            href="/#courses"
            className="academy-primary academy-action inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
          >
            কোর্স খুঁজে নিন <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-3 pt-10 text-xl font-bold"
        >
          <GraduationCap className="academy-accent size-8" />
          {siteConfig.name}
        </Link>
        <div className="grid gap-10 py-10 md:grid-cols-3">
          <section>
            <h3 className="font-semibold">Contact Us</h3>
            <p className="mt-4 text-sm text-muted-foreground">
              {siteConfig.address}
            </p>
            <a
              className="mt-3 block break-all text-sm underline underline-offset-4"
              href={`mailto:${siteConfig.email}`}
            >
              {siteConfig.email}
            </a>
            <p className="mt-3 text-xs text-muted-foreground">
              যোগাযোগের তথ্য নমুনা হিসেবে দেওয়া।
            </p>
          </section>
          <nav aria-label="Product">
            <h3 className="font-semibold">Product</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                ["কোর্সসমূহ", "/#courses"],
                ["ভিডিও লেসন", "/#videos"],
                ["ফ্রি পরীক্ষা", "/free-exam"],
                ["কোর্স প্ল্যান", "/#pricing"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="hover:underline hover:text-sky-700 dark:hover:text-sky-300"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <section>
            <h3 className="font-semibold">Terms and Conditions</h3>
            <details className="mt-4 rounded-xl border p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                ডেমো ব্যবহারের শর্ত
              </summary>
              <p className="mt-3 leading-7 text-muted-foreground">
                এটি একটি প্রিভিউ। বাস্তব ভর্তি, পেমেন্ট বা সার্টিফিকেট প্রদান
                করা হয় না। কোর্স, পরিসংখ্যান ও রিভিউ নমুনা তথ্য।
              </p>
            </details>
            <details className="mt-3 rounded-xl border p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                ডেমো গোপনীয়তা
              </summary>
              <p className="mt-3 leading-7 text-muted-foreground">
                রেজিস্ট্রেশনের নাম ও ইমেইল সংরক্ষণ বা পাঠানো হয় না। এই ট্যাবে
                শুধু ডেমো রেজিস্ট্রেশনের একটি চিহ্ন থাকে।
              </p>
            </details>
          </section>
        </div>
        <div className="flex flex-col justify-between gap-5 border-t py-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex gap-3">
              {(["whatsapp", "instagram", "telegram"] as const).map((name) => (
                <a
                  key={name}
                  href={siteConfig.socials[name]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${name} — demo platform link (new tab)`}
                  className="academy-action flex size-11 items-center justify-center rounded-full border bg-muted hover:bg-accent"
                >
                  <SocialIcon kind={name} />
                </a>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              ডেমো লিংক—নিজস্ব অ্যাকাউন্ট এখনো যুক্ত হয়নি।
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Copyright © 2026 {siteConfig.name}. সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </div>
    </footer>
  );
}
// Inline SVG keeps social icons independent of removed/deprecated Lucide brand exports.
function SocialIcon({ kind }: { kind: "whatsapp" | "instagram" | "telegram" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "instagram" ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
        </>
      ) : kind === "telegram" ? (
        <>
          <path d="m3 10 18-7-4 18-5-6-4 3 1-6 9-6-12 7Z" />
        </>
      ) : (
        <>
          <path d="M20.5 11.5a9 9 0 0 1-13.3 7.9L3 21l1.5-4.5A9 9 0 1 1 20.5 11.5Z" />
          <path d="m8 7 2 3-1 1c1 2 2 3 4 4l1-1 3 1c0 3-3 3-6 1S6 10 8 7Z" />
        </>
      )}
    </svg>
  );
}
