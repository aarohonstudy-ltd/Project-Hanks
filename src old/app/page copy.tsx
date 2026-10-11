"use client";

import { useState } from "react";
import { ArrowDown, ArrowUpRight, ArrowRight, BookOpen, Check, CheckCircle2, Clock3, GraduationCap, Layers3, Play, Sparkles, Target, Trophy, Video } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import "./home.css";

const categories = ["সব কোর্স", "বিসিএস", "ব্যাংক", "শিক্ষক নিবন্ধন", "স্কিল ডেভেলপমেন্ট"];
const courses = [
  { id: "bcs", category: "বিসিএস", title: "বিসিএস প্রিলিমিনারি — পূর্ণাঙ্গ প্রস্তুতি", label: "BCS FOUNDATION", mark: "BCS", caption: "একটি লক্ষ্য। গোছানো প্রস্তুতি।", lessons: 120, time: "৬ মাস", price: "২,৯৯০", color: "blue", topics: ["বাংলা ও ইংরেজি", "গণিত ও মানসিক দক্ষতা", "সাধারণ জ্ঞান ও মডেল টেস্ট"] },
  { id: "bank", category: "ব্যাংক", title: "ব্যাংক জব প্রস্তুতি — শুরু থেকে সফলতা", label: "BANK JOB PREPARATION", mark: "BANK", caption: "পরবর্তী সুযোগের জন্য প্রস্তুত হোন।", lessons: 85, time: "৪ মাস", price: "১,৯৯০", color: "green", topics: ["Quantitative aptitude", "English & analytical ability", "লিখিত পরীক্ষার অনুশীলন"] },
  { id: "teacher", category: "শিক্ষক নিবন্ধন", title: "শিক্ষক নিবন্ধন — কমপ্লিট গাইডলাইন", label: "TEACHER REGISTRATION", mark: "NTRCA", caption: "শিক্ষক হওয়ার স্বপ্নের পাশে।", lessons: 95, time: "৫ মাস", price: "২,৪৯০", color: "purple", topics: ["প্রিলিমিনারি প্রস্তুতি", "বিষয়ভিত্তিক আলোচনা", "অনুশীলন ও মূল্যায়ন"] },
  { id: "english", category: "স্কিল ডেভেলপমেন্ট", title: "Spoken English — আত্মবিশ্বাসে কথা বলুন", label: "COMMUNICATION SKILLS", mark: "Hello!", caption: "প্রতিদিন একটু, আত্মবিশ্বাস অনেকটা।", lessons: 40, time: "২ মাস", price: "৯৯০", color: "orange", topics: ["দৈনন্দিন কথোপকথন", "উচ্চারণ ও শব্দভান্ডার", "ইন্টারভিউ অনুশীলন"] },
];
const books = [
  { title: "সাধারণ জ্ঞান", subtitle: "বাংলাদেশ ও আন্তর্জাতিক", number: "01", color: "blue" },
  { title: "গণিতের সহজ পাঠ", subtitle: "বেসিক থেকে অনুশীলন", number: "02", color: "green" },
  { title: "English Essentials", subtitle: "Grammar · Vocabulary", number: "03", color: "purple" },
];
const faqs = [
  ["কোন কোর্সটি আমার জন্য উপযুক্ত?", "আপনার পরীক্ষার লক্ষ্য অনুযায়ী কোর্সের ক্যাটাগরি বেছে নিন। ‘বিস্তারিত’ বাটনে ক্লিক করে বিষয়গুলো দেখে আপনার প্রয়োজনের সঙ্গে মিলিয়ে নিতে পারেন।"],
  ["মোবাইল থেকে ক্লাস করা যাবে?", "এই পেজটি মোবাইল, ট্যাবলেট ও কম্পিউটারে ব্যবহারযোগ্য। প্রকৃত ক্লাস দেখার সুবিধা আপনার লার্নিং প্ল্যাটফর্মের সঙ্গে যুক্ত করতে হবে।"],
  ["কোর্সে কীভাবে ভর্তি হব?", "এটি একটি নমুনা হোমপেজ। আপনার আসল কোর্সের পেজ, ভর্তি প্রক্রিয়া এবং পেমেন্ট সিস্টেম সংযুক্ত করার পর এখান থেকে ভর্তি করা যাবে।"],
  ["কোর্সের মেয়াদ ও মূল্য কোথায় পাব?", "প্রতিটি কার্ডে নমুনা মেয়াদ ও মূল্য দেওয়া আছে। প্রকাশের আগে আপনার প্রতিষ্ঠানের প্রকৃত তথ্য দিয়ে এগুলো পরিবর্তন করুন।"],
];
const actionClass = "academy-action rounded-full px-6 font-semibold";

export default function HomePage() {
  const [category, setCategory] = useState("সব কোর্স");
  const [selected, setSelected] = useState<string | null>(null);
  const current = courses.find((course) => course.id === selected);

  return (
    <main lang="bn" className="academy-home overflow-x-clip bg-background text-foreground">
      <section className="academy-hero relative isolate overflow-hidden border-b pt-32 pb-16 sm:pt-40 sm:pb-24">
        <div aria-hidden="true" className="academy-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <Badge variant="outline" className="mb-7 gap-2 rounded-full border-sky-500/20 bg-background/60 px-4 py-2 text-xs font-medium text-sky-700 dark:text-sky-300"><span className="size-2 rounded-full bg-emerald-500" /> আপনার আগামী, আপনার প্রস্তুতি</Badge>
            <h1 className="max-w-2xl text-4xl leading-[1.3] font-bold tracking-tight sm:text-5xl lg:text-6xl">স্বপ্নটা আপনার।<br /><span className="text-sky-600 dark:text-sky-400">এগিয়ে যাওয়ার</span><br />সঙ্গী আমরা।</h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">চাকরির প্রস্তুতি থেকে নতুন দক্ষতা—গোছানো কোর্স, নিয়মিত অনুশীলন আর সঠিক গাইডলাইনে শুরু হোক আপনার পরবর্তী অধ্যায়।</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#courses" className={cn(buttonVariants({ size: "lg" }), actionClass, "bg-sky-600 text-white hover:bg-sky-700")}>কোর্স খুঁজে নিন <ArrowUpRight className="size-4" /></a>
              <a href="#how-it-works" className={cn(buttonVariants({ variant: "outline", size: "lg" }), actionClass, "bg-background/60")}><Play className="size-4" /> কীভাবে শিখবেন</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {["নিজের সময়ে শেখা", "লক্ষ্যভিত্তিক প্রস্তুতি"].map((text) => <span key={text} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" />{text}</span>)}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
            <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-full bg-sky-300/20 blur-3xl" />
            <div className="rounded-[2rem] border border-white/60 bg-background/85 p-5 shadow-2xl shadow-sky-950/10 backdrop-blur sm:p-7 dark:border-white/10">
              <div className="mb-7 flex items-center justify-between"><span className="text-sm font-semibold">আপনার লার্নিং স্পেস</span><Badge variant="secondary" className="rounded-full">নমুনা প্রিভিউ</Badge></div>
              <div className="academy-cover blue flex min-h-52 flex-col justify-between rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between"><span className="text-xs tracking-[.2em]">LEARN. PRACTICE. GROW.</span><GraduationCap className="size-7" /></div>
                <div className="relative"><p className="mb-2 text-sm text-white/75">ছোট ছোট পদক্ষেপে</p><p className="text-3xl leading-snug font-bold">বড় স্বপ্নের<br />কাছাকাছি।</p></div>
              </div>
              <div className="mt-6 space-y-3">{["পাঠ বুঝুন", "অনুশীলন করুন", "নিজেকে যাচাই করুন"].map((label, i) => <div key={label} className="flex items-center gap-3 rounded-xl border bg-background/60 p-3"><span className="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sm font-bold text-sky-600">0{i + 1}</span><span className="flex-1 text-sm font-medium">{label}</span>{i === 0 ? <Check className="size-4 text-emerald-500" /> : <ArrowRight className="size-4 text-muted-foreground" />}</div>)}</div>
            </div>
            <div className="absolute -right-2 -bottom-6 flex items-center gap-3 rounded-2xl border bg-background p-4 shadow-xl sm:-right-5"><span className="flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500"><Trophy className="size-5" /></span><div><p className="text-sm font-semibold">আজকের শেখা, আগামীর শক্তি</p><p className="mt-1 text-xs text-muted-foreground">Keep moving forward</p></div></div>
          </div>
        </div>
      </section>

      <section id="courses" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="academy-eyebrow">FIND YOUR NEXT STEP</p><h2 className="mt-3 text-3xl leading-snug font-bold sm:text-4xl">আপনার লক্ষ্যে, <span className="text-sky-600 dark:text-sky-400">আপনার কোর্স</span></h2><p className="mt-4 text-muted-foreground">যেখান থেকেই শুরু করুন, এগিয়ে যান নিজের গতিতে।</p></div><a href="#how-it-works" className="flex items-center gap-2 text-sm font-medium text-sky-600 hover:underline">শেখার পদ্ধতি <ArrowDown className="size-4" /></a></div>
        <div role="group" aria-label="কোর্সের ক্যাটাগরি" className="my-8 flex flex-wrap gap-2">{categories.map((item) => <Button key={item} variant={category === item ? "default" : "outline"} onClick={() => { setCategory(item); setSelected(null); }} aria-pressed={category === item} className={cn("rounded-full transition-colors", category === item && "bg-sky-600 text-white hover:bg-sky-700")}>{item}</Button>)}</div>
        <div aria-live="polite" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{courses.filter((course) => category === "সব কোর্স" || course.category === category).map((course) => <Card key={course.id} className="academy-card gap-0 overflow-hidden rounded-2xl p-0 shadow-none">
          <div className={cn("academy-cover flex min-h-48 flex-col justify-between p-5 text-white", course.color)}><span className="relative text-[10px] tracking-[.18em]">{course.label}</span><div className="relative"><p className="text-4xl font-black tracking-tight">{course.mark}</p><p className="mt-2 text-xs text-white/80">{course.caption}</p></div><BookOpen aria-hidden="true" className="absolute right-4 bottom-4 size-20 -rotate-12 opacity-10" /></div>
          <CardContent className="flex flex-1 flex-col p-5"><Badge variant="secondary" className="mb-3 w-fit rounded-md text-[10px]">{course.category}</Badge><h3 className="min-h-14 text-lg leading-7 font-semibold">{course.title}</h3><div className="my-4 flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Video className="size-3.5" />{course.lessons} লেসন</span><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{course.time}</span></div><div className="mt-auto flex items-center justify-between border-t pt-4"><span className="text-xl font-bold">৳{course.price}</span><Button variant="outline" size="sm" onClick={() => setSelected(selected === course.id ? null : course.id)} aria-expanded={selected === course.id} aria-controls="course-details" className="academy-action rounded-full">বিস্তারিত <ArrowUpRight className="size-4" /></Button></div></CardContent>
        </Card>)}</div>
        <p className="mt-4 text-xs text-muted-foreground">কোর্স, মূল্য ও লেসনের তথ্য নমুনা হিসেবে দেখানো হয়েছে।</p>
        {current && <div id="course-details" role="region" aria-label="কোর্সের বিস্তারিত" className="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-6"><div className="flex items-start justify-between gap-4"><h3 className="text-xl font-semibold">{current.title}</h3><Button variant="ghost" size="sm" onClick={() => setSelected(null)}>বন্ধ করুন</Button></div><ul className="mt-4 grid gap-3 sm:grid-cols-3">{current.topics.map((topic) => <li key={topic} className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 shrink-0 text-sky-600" />{topic}</li>)}</ul></div>}
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-y bg-muted/35 py-16 sm:py-20"><div className="mx-auto max-w-7xl px-5 sm:px-8"><p className="academy-eyebrow">A LITTLE EVERY DAY</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">শেখার পথটা হোক সহজ</h2><div className="mt-10 grid gap-8 md:grid-cols-3">{[{ icon: Target, title: "লক্ষ্য ঠিক করুন", text: "আপনার পরীক্ষা বা দক্ষতার লক্ষ্য অনুযায়ী বেছে নিন সঠিক কোর্স।" }, { icon: Layers3, title: "গুছিয়ে শিখুন", text: "বিষয়ভিত্তিক লেসনে বেসিক বুঝে এগিয়ে যান ধাপে ধাপে।" }, { icon: CheckCircle2, title: "অনুশীলনে এগিয়ে যান", text: "নিয়মিত চর্চায় দুর্বলতা খুঁজুন, প্রস্তুতিকে আরও শক্ত করুন।" }].map((item, i) => <div key={item.title} className="relative"><div className="mb-5 flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-2xl border bg-background text-sky-600"><item.icon className="size-6" /></span><span className="text-4xl font-bold text-muted-foreground/20">0{i + 1}</span></div><h3 className="text-xl font-semibold">{item.title}</h3><p className="mt-3 max-w-sm leading-7 text-muted-foreground">{item.text}</p></div>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><div className="text-center"><p className="academy-eyebrow">BEYOND THE CLASSROOM</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">প্রস্তুতির টেবিলে, ভালো বই</h2><p className="mt-4 text-muted-foreground">নিজে পড়ুন, নোট নিন, আরেকবার অনুশীলন করুন।</p></div><div className="mt-10 grid gap-6 md:grid-cols-3">{books.map((book) => <Card key={book.number} className="academy-card gap-0 overflow-hidden rounded-2xl p-0 shadow-none"><div className="flex h-64 items-center justify-center bg-muted/50 p-6"><div className={cn("academy-book academy-cover flex h-52 w-40 flex-col justify-between rounded-r-lg p-5 text-white", book.color)}><span className="text-[9px] tracking-[.18em]">THE STUDY COLLECTION</span><div><BookOpen className="mb-3 size-7" /><h3 className="text-xl leading-7 font-bold">{book.title}</h3></div><span className="text-xs opacity-70">VOL. {book.number}</span></div></div><CardContent className="p-5"><h3 className="font-semibold">{book.title}</h3><p className="mt-1 text-sm text-muted-foreground">{book.subtitle}</p><Badge variant="outline" className="mt-4">নমুনা বইয়ের সংগ্রহ</Badge></CardContent></Card>)}</div></section>

      <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20"><div aria-hidden="true" className="academy-grid absolute inset-0 opacity-10" /><div className="relative mx-auto max-w-7xl px-5 sm:px-8"><p className="academy-eyebrow text-sky-400">SMALL HABITS. BIG POSSIBILITIES.</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">সফল প্রস্তুতির তিন অভ্যাস</h2><p className="mt-4 max-w-xl leading-7 text-slate-400">আপনার গল্প শুরু হোক প্রতিদিনের ছোট ছোট চেষ্টা থেকে।</p><div className="mt-10 grid gap-5 md:grid-cols-3">{[{ title: "একটি রুটিন", text: "অল্প সময় হলেও প্রতিদিন পড়ার জন্য নির্দিষ্ট সময় রাখুন।", tag: "CONSISTENCY" }, { title: "নিজের নোট", text: "শেখা বিষয় নিজের ভাষায় লিখুন, নিয়মিত ফিরে দেখুন।", tag: "UNDERSTANDING" }, { title: "নিয়মিত মূল্যায়ন", text: "অনুশীলনের ভুল থেকেই পরের দিনের পড়ার পরিকল্পনা করুন।", tag: "PROGRESS" }].map((item) => <div key={item.tag} className="rounded-2xl border border-white/10 bg-white/5 p-7 transition-colors hover:border-sky-400/40 hover:bg-white/10"><Sparkles className="mb-6 size-6 text-sky-400" /><h3 className="text-xl font-semibold">{item.title}</h3><p className="mt-3 leading-7 text-slate-400">{item.text}</p><p className="mt-8 text-[10px] tracking-[.2em] text-sky-300">{item.tag}</p></div>)}</div></div></section>

      <section id="faq" className="mx-auto grid max-w-7xl scroll-mt-24 gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr]"><div><p className="academy-eyebrow">LET’S MAKE IT CLEAR</p><h2 className="mt-3 text-3xl leading-snug font-bold sm:text-4xl">মনে কিছু<br />প্রশ্ন আছে?</h2><p className="mt-4 max-w-sm leading-7 text-muted-foreground">শুরু করার আগে প্রয়োজনীয় তথ্য জেনে নিন।</p></div><Accordion type="single" collapsible className="space-y-3">{faqs.map(([question, answer], index) => <AccordionItem key={question} value={`faq-${index}`} className="rounded-xl border! bg-muted/25 px-5"><AccordionTrigger className="py-5 text-left leading-6 hover:no-underline">{question}</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">{answer}</AccordionContent></AccordionItem>)}</Accordion></section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8"><div className="academy-cta relative overflow-hidden rounded-[2rem] border p-8 text-center sm:p-16"><Badge variant="outline" className="mb-5 rounded-full bg-background/50">YOUR NEXT CHAPTER</Badge><h2 className="text-3xl leading-snug font-bold sm:text-4xl">আজকের শুরুটাই বদলে দিতে পারে<br className="hidden sm:block" /> আগামীর গল্প।</h2><p className="mx-auto mt-5 max-w-lg leading-7 text-muted-foreground">নতুন লক্ষ্য, নতুন সম্ভাবনা। আপনার পছন্দের কোর্সটি খুঁজে নিন আজই।</p><a href="#courses" className={cn(buttonVariants({ size: "lg" }), actionClass, "mt-8 bg-sky-600 text-white hover:bg-sky-700")}>শেখা শুরু করুন <ArrowRight className="size-4" /></a></div></section>
    </main>
  );
}
