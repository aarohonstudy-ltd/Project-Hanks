import {
  BarChart3,
  BookOpen,
  Bookmark,
  CalendarDays,
  Gift,
  Layers3,
  LayoutDashboard,
  ListChecks,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
export const navigation = [
  { id: "overview", label: "ওভারভিউ", icon: LayoutDashboard },
  { id: "live", label: "লাইভ এক্সাম", icon: Zap },
  { id: "free", label: "ফ্রি মডেল টেস্ট", icon: Sparkles },
  { id: "upcoming", label: "আসন্ন পরীক্ষা", icon: CalendarDays },
  { id: "mistakes", label: "ভুল উত্তরের খাতা", icon: ListChecks },
  { id: "bookmarks", label: "বুকমার্ক", icon: Bookmark },
  { id: "analytics", label: "অ্যানালাইসিস", icon: BarChart3 },
  { id: "practice", label: "প্র্যাকটিস", icon: Target },
  { id: "questions", label: "প্রশ্ন ব্যাংক", icon: Layers3 },
  { id: "courses", label: "আমার কোর্স", icon: BookOpen },
  { id: "referral", label: "রেফারেল", icon: Gift },
] as const;
export const href = (id: string) =>
  id === "overview" ? "/dashboard" : `/dashboard/${id}`;
export const bn = (n: number) => n.toLocaleString("bn-BD");
