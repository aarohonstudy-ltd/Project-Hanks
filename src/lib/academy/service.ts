import "server-only";
import { serverClient } from "@/lib/supabase/server";
import type { HomeData } from "./types";
const faqs: HomeData["faqs"] = [
  {
    id: "exam",
    question: "ফ্রি পরীক্ষা কীভাবে দেব?",
    answer:
      "অ্যাকাউন্ট তৈরি করে লগইন করুন। ড্যাশবোর্ডের ফ্রি পরীক্ষা থেকে প্রকাশিত পরীক্ষায় অংশ নিতে পারবেন।",
  },
  {
    id: "mobile",
    question: "মোবাইলে কি পড়া যাবে?",
    answer:
      "হ্যাঁ, মোবাইল, ট্যাবলেট ও কম্পিউটার থেকে কোর্স ও প্রশ্ন ব্যাংক ব্যবহার করতে পারবেন।",
  },
  {
    id: "enroll",
    question: "কোর্সে ভর্তি কীভাবে করব?",
    answer:
      "কোর্সের বিস্তারিত থেকে ড্যাশবোর্ডে যান। ফ্রি কোর্সে সরাসরি এনরোল করতে পারবেন। পেইড কোর্সে এনরোলমেন্টের অনুরোধ পাঠানোর পর অ্যাডমিন অনুমোদন দেবেন।",
  },
  {
    id: "results",
    question: "পরীক্ষার ফলাফল কোথায় পাব?",
    answer:
      "ড্যাশবোর্ডে পরীক্ষার ফলাফল দেখা যাবে। নির্ধারিত পরীক্ষার ফলাফল ও ব্যাখ্যা প্রকাশের সময় অনুযায়ী উপলব্ধ হবে।",
  },
];
export async function getHomeData(): Promise<HomeData> {
  try {
    const client = await serverClient();
    const { data, error } = await client.rpc("aarohon_public_home");
    if (error || !data) throw Error(error?.code || "No data");
    return { ...data, faqs, reviews: [] } as HomeData;
  } catch {
    return {
      courses: [],
      analytics: { students: 0, questions: 0, examsTaken: 0 },
      videos: [],
      reviews: [],
      faqs,
      error: "কোর্সের তথ্য এখন লোড হচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }
}
