import type { HomeData, Question } from "./types";
// DEMO ONLY: replace via the server-side service, not inside UI components.
export const demoHome: HomeData = {
  courses: [
    {
      id: "bcs",
      title: "বিসিএস প্রিলিমিনারি পূর্ণাঙ্গ প্রস্তুতি",
      category: "বিসিএস",
      cover: "/academy/bcs.svg",
      lessons: 120,
      months: 6,
      price: 2990,
      features: ["বিষয়ভিত্তিক ভিডিও", "প্র্যাকটিস প্রশ্ন", "মডেল টেস্ট"],
    },
    {
      id: "primary",
      title: "প্রাইমারি শিক্ষক নিয়োগ প্রস্তুতি",
      category: "প্রাইমারি",
      cover: "/academy/primary.svg",
      lessons: 80,
      months: 4,
      price: 1990,
      features: ["বেসিক থেকে আলোচনা", "অধ্যায়ভিত্তিক পরীক্ষা", "রিভিশন ক্লাস"],
    },
    {
      id: "grade",
      title: "৯ম–১০ম গ্রেড সমন্বিত প্রস্তুতি",
      category: "৯ম–১০ম গ্রেড",
      cover: "/academy/grade.svg",
      lessons: 100,
      months: 5,
      price: 2490,
      features: [
        "কমন বিষয়গুলোর প্রস্তুতি",
        "সমাধানসহ প্রশ্ন",
        "সাপ্তাহিক মূল্যায়ন",
      ],
    },
    {
      id: "free",
      title: "ফ্রি প্রস্তুতি ও মূল্যায়ন পরীক্ষা",
      category: "ফ্রি কোর্স",
      cover: "/academy/free.svg",
      lessons: 10,
      months: 1,
      price: 0,
      features: ["নমুনা লেসন", "ফ্রি পরীক্ষা", "তাৎক্ষণিক ফলাফল"],
    },
  ],
  analytics: { students: 12500, questions: 85000, examsTaken: 42000 },
  faqs: [
    {
      id: "1",
      question: "ফ্রি পরীক্ষা কীভাবে দেব?",
      answer:
        "“পরীক্ষা দিন” বাটনে ক্লিক করে ডেমো রেজিস্ট্রেশন সম্পন্ন করুন। এরপর ফ্রি পরীক্ষার পেজ খুলবে।",
    },
    {
      id: "2",
      question: "ক্লাস কি মোবাইলে দেখা যাবে?",
      answer:
        "হ্যাঁ, মোবাইল, ট্যাবলেট ও কম্পিউটার থেকে ভিডিও সেকশন ব্যবহার করতে পারবেন।",
    },
    {
      id: "3",
      question: "কোর্সে ভর্তি ও পেমেন্ট কীভাবে করব?",
      answer:
        "বর্তমানে এটি ডেমো। কোর্সের বিবরণ দেখা ও ফ্রি পরীক্ষা দেওয়া যায়; পেইড ভর্তি ও পেমেন্ট এখনো চালু হয়নি।",
    },
    {
      id: "4",
      question: "পরীক্ষার ফলাফল কোথায় পাব?",
      answer:
        "সব প্রশ্নের উত্তর দিয়ে জমা দিলে একই পেজে স্কোর, সঠিক উত্তর ও ব্যাখ্যা দেখতে পাবেন।",
    },
  ],
  // Fictional reviews: UI explicitly labels these as sample feedback.
  reviews: [
    {
      id: "r1",
      name: "ডেমো শিক্ষার্থী ১",
      course: "বিসিএস প্রস্তুতি",
      text: "বিষয়গুলো এক জায়গায় সাজানো থাকায় পড়ার পরিকল্পনা করা সহজ।",
    },
    {
      id: "r2",
      name: "ডেমো শিক্ষার্থী ২",
      course: "প্রাইমারি প্রস্তুতি",
      text: "ভিডিওর সঙ্গে নিয়মিত অনুশীলনের সুযোগ প্রস্তুতিতে সাহায্য করে।",
    },
    {
      id: "r3",
      name: "ডেমো শিক্ষার্থী ৩",
      course: "৯ম–১০ম গ্রেড",
      text: "পরীক্ষার পর উত্তর ও ব্যাখ্যা দেখে ভুলগুলো বুঝতে পারি।",
    },
  ],
  videos: [
    {
      id: "intro",
      title: "শতকরা: একটি সহজ উদাহরণ",
      src: "/academy/demo-lesson.mp4",
      poster: "/academy/grade.svg",
    },
  ],
};
// Never send correctIndex to clients in production; score real attempts on the server.
export const demoQuestions: Question[] = [
  {
    id: "q1",
    text: "২০০-এর ১৫% কত?",
    options: ["২০", "৩০", "৪০", "৫০"],
    correctIndex: 1,
    explanation: "২০০ × ১৫ ÷ ১০০ = ৩০।",
  },
  {
    id: "q2",
    text: "বাংলাদেশের জাতীয় ফুল কোনটি?",
    options: ["গোলাপ", "বেলি", "শাপলা", "জবা"],
    correctIndex: 2,
    explanation: "বাংলাদেশের জাতীয় ফুল শাপলা।",
  },
  {
    id: "q3",
    text: "Choose the correct sentence.",
    options: [
      "He go to school.",
      "He goes to school.",
      "He going school.",
      "He gone school.",
    ],
    correctIndex: 1,
    explanation:
      "Present simple-এ third person singular subject-এর সঙ্গে goes বসে।",
  },
];
