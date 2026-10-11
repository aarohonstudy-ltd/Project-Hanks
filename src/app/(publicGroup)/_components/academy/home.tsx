"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Play,
  Users,
  ClipboardCheck,
  CircleHelp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { HomeData, Course } from "@/lib/academy/types";

import Registration from "./registration";
const bn = (n: number) => n.toLocaleString("bn-BD");
export default function Home({ data }: { data: HomeData }) {
  const router = useRouter();
  const [registration, setRegistration] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  function exam() {
    router.push("/dashboard/free");
  }
  function prepare() {
    document.getElementById("videos")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  return (
    <main lang="bn" className="academy-home overflow-x-clip">
      <section className="academy-hero relative isolate overflow-hidden border-b pt-32 pb-20 sm:pt-40">
        <div
          aria-hidden="true"
          className="academy-grid absolute inset-0 -z-10"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Badge
              variant="outline"
              className="mb-6 rounded-full bg-background/60 px-4 py-2"
            >
              আপনার আগামী, আপনার প্রস্তুতি
            </Badge>
            <h1 className="text-4xl leading-[1.4] font-bold tracking-tight sm:text-5xl">
              চাকরির প্রস্তুতির সাথে{" "}
              <span className="academy-accent">
                জ্ঞানের পরিধি বিস্তৃত হোক আকাশ জুড়ে
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              বিসিএস, প্রাইমারি এবং ৯ম-১০ম গ্রেডসহ সকল প্রতিযোগিতামূলক পরীক্ষার
              প্রস্তুতিতে আস্থার নাম
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={exam}
                className="academy-primary academy-action rounded-full px-7"
              >
                পরীক্ষা দিন <ArrowUpRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={prepare}
                className="academy-action rounded-full px-7"
              >
                <Play className="size-4" /> প্রস্তুতি নিন
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              নিজের সময়ে শিখুন • অনুশীলনে এগিয়ে যান
            </p>
          </div>
          <div className="rounded-[2rem] border bg-background/85 p-6 shadow-2xl shadow-sky-950/10">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-semibold">আপনার লার্নিং স্পেস</span>
              <GraduationCap className="academy-accent" />
            </div>
            <div className="academy-cover blue rounded-2xl p-7">
              <p className="text-xs tracking-[.2em]">LEARN. PRACTICE. GROW.</p>
              <p className="relative mt-10 text-3xl leading-snug font-bold">
                ছোট ছোট পদক্ষেপে
                <br />
                বড় স্বপ্নের কাছাকাছি।
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "বিষয়ভিত্তিক প্রস্তুতি",
                "নিয়মিত পরীক্ষা",
                "ফলাফল ও ব্যাখ্যা",
              ].map((text, i) => (
                <div
                  key={text}
                  className="flex items-center gap-3 rounded-xl border p-3"
                >
                  <span className="academy-accent font-bold">0{i + 1}</span>
                  <span className="text-sm">{text}</span>
                  <CheckCircle2 className="ml-auto size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section id="courses" className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
        <Heading tag="FIND YOUR NEXT STEP" title="আপনার লক্ষ্যে, আপনার কোর্স" />
        <p className="mt-3 text-muted-foreground">
          গোছানো প্রস্তুতিতে এগিয়ে যান নিজের গতিতে।
        </p>
        <div className="mt-8 grid grid-cols-2 items-stretch gap-3 sm:gap-5 lg:grid-cols-4">
          {data.courses.map((item) => (
            <Card
              key={item.id}
              className="academy-card flex h-full min-w-0 flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-none"
            >
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={item.cover}
                  alt={`${item.category} কোর্সের কভার`}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
              <CardContent className="flex flex-1 flex-col p-3 sm:p-5">
                <Badge
                  variant="secondary"
                  className="mb-3 max-w-full text-[10px]"
                >
                  {item.category}
                </Badge>
                <h3 className="min-h-20 text-sm leading-6 font-semibold sm:text-base">
                  {item.title}
                </h3>
                <p className="my-3 text-xs leading-6 text-muted-foreground">
                  {bn(item.lessons)} লেসন · {bn(item.months)} মাস
                </p>
                <div className="mt-auto border-t pt-3">
                  <p className="mb-3 text-lg font-bold">
                    {item.price ? `৳${bn(item.price)}` : "ফ্রি"}
                  </p>
                  <Button
                    variant="outline"
                    className="academy-action w-full rounded-full text-xs sm:text-sm"
                    onClick={() => setCourse(item)}
                  >
                    বিস্তারিত <ArrowUpRight className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">ডেমো কোর্স ও মূল্য</p>
      </section>
      <section className="border-y bg-muted/35 py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Users,
                label: "মোট স্টুডেন্ট",
                value: data.analytics.students,
              },
              {
                icon: CircleHelp,
                label: "মোট প্রশ্ন",
                value: data.analytics.questions,
              },
              {
                icon: ClipboardCheck,
                label: "মোট পরীক্ষা দেওয়ার সংখ্যা",
                value: data.analytics.examsTaken,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border bg-card p-7 text-center text-card-foreground"
              >
                <item.icon className="academy-accent mx-auto mb-4 size-7" />
                <p className="text-4xl font-bold">{bn(item.value)}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            উপরের পরিসংখ্যানগুলো ডেমো ডেটা।
          </p>
        </div>
      </section>
      <section id="pricing" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <Heading tag="A PLAN FOR YOUR GOAL" title="কোর্স প্ল্যান ও প্রাইসিং" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.courses.map((item) => (
            <Card
              key={item.id}
              className="academy-card flex flex-col rounded-2xl shadow-none"
            >
              <CardContent className="flex flex-1 flex-col p-5">
                <h3 className="font-semibold">{item.category}</h3>
                <p className="my-5 text-3xl font-bold">
                  {item.price ? `৳${bn(item.price)}` : "ফ্রি"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bn(item.months)} মাস · নমুনা প্ল্যান
                </p>
                <ul className="my-6 space-y-3">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm">
                      <CheckCircle2 className="academy-accent size-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="academy-primary academy-action mt-auto rounded-full"
                  onClick={() => (item.price === 0 ? exam() : setCourse(item))}
                >
                  {item.price === 0 ? "পরীক্ষা দিন" : "প্ল্যান দেখুন"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section id="videos" className="border-y bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Heading
            tag="WATCH. LEARN. PRACTICE."
            title="ভিডিওতে শুরু হোক প্রস্তুতি"
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {data.videos.map((video) => (
              <Card key={video.id} className="overflow-hidden rounded-2xl p-0">
                <video
                  controls
                  playsInline
                  preload="none"
                  poster={video.poster}
                  className="aspect-video w-full bg-slate-950"
                  aria-label={video.title}
                >
                  <source src={video.src} type="video/mp4" />
                  <track
                    kind="captions"
                    src="/academy/demo-lesson.vtt"
                    srcLang="en"
                    label="English"
                    default
                  />
                  আপনার ব্রাউজার ভিডিও সাপোর্ট করে না।
                </video>
                <CardContent className="p-5">
                  <h3 className="font-semibold">{video.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    ডেমো ভিডিও: ২০০-এর ১৫% = ২০০ × ১৫ ÷ ১০০ = ৩০।
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section
        id="faq"
        className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr]"
      >
        <Heading tag="LET’S MAKE IT CLEAR" title="সাধারণ জিজ্ঞাসা" />
        <Accordion type="single" collapsible className="space-y-3">
          {data.faqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="rounded-xl border! bg-muted/25 px-5"
            >
              <AccordionTrigger className="text-left leading-7">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="leading-7 text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <section id="reviews" className="academy-night py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Heading tag="LEARNERS’ STORIES" title="শিক্ষার্থীদের অভিজ্ঞতা" />
          <p className="mt-4 text-sm text-slate-300">
            নমুনা রিভিউ—এগুলো বাস্তব শিক্ষার্থীর সাফল্যের দাবি নয়।
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {data.reviews.map((review) => (
              <figure
                key={review.id}
                className="rounded-2xl border border-white/15 bg-white/5 p-6"
              >
                <BookOpen className="mb-6 size-6 text-sky-300" />
                <blockquote className="leading-8 text-slate-200">
                  “{review.text}”
                </blockquote>
                <figcaption className="mt-7 border-t border-white/15 pt-4">
                  <p className="font-semibold">{review.name}</p>
                  <p className="mt-1 text-sm text-sky-300">{review.course}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
      <Registration open={registration} onOpenChange={setRegistration} />
      <Dialog
        open={!!course}
        onOpenChange={(open) => {
          if (!open) setCourse(null);
        }}
      >
        <DialogContent lang="bn" className="academy-home rounded-2xl">
          <DialogHeader>
            <DialogTitle>{course?.title}</DialogTitle>
            <DialogDescription>কোর্সের নমুনা বিবরণ</DialogDescription>
          </DialogHeader>
          <p className="text-2xl font-bold">
            {course?.price ? `৳${bn(course.price)}` : "ফ্রি"}
          </p>
          <ul className="space-y-3">
            {course?.features.map((feature) => (
              <li key={feature} className="flex gap-2">
                <CheckCircle2 className="academy-accent size-5" />
                {feature}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            পেইড ভর্তি ও পেমেন্ট এখনো চালু হয়নি। আপাতত ফ্রি পরীক্ষায় অংশ নিতে
            পারেন।
          </p>
          <Button
            className="academy-primary rounded-full"
            onClick={() => {
              setCourse(null);
              exam();
            }}
          >
            ফ্রি পরীক্ষা দিন
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
function Heading({ tag, title }: { tag: string; title: string }) {
  return (
    <div>
      <p className="academy-eyebrow">{tag}</p>
      <h2 className="mt-3 text-3xl leading-snug font-bold sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}
