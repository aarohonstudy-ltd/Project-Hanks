"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function CourseError({ reset }: { reset: () => void }) {
  return (
    <main lang="bn" className="mx-auto min-h-[60vh] max-w-3xl px-6 pt-32 pb-16">
      <h1 className="text-2xl font-extrabold">কোর্সের তথ্য লোড হচ্ছে না</h1>
      <p className="mt-4 text-muted-foreground">
        কিছুক্ষণ পর আবার চেষ্টা করুন।
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>আবার চেষ্টা করুন</Button>
        <Button variant="outline" asChild>
          <Link href="/#courses">সকল কোর্স</Link>
        </Button>
      </div>
    </main>
  );
}
