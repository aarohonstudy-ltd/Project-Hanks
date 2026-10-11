"use client";
import { useDashboard } from "@/components/student/dashboard-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, UserRound } from "lucide-react";
export default function ProfileSection() {
  const { data, saved, ready, setNotice, update } = useDashboard();

  return (
    <form
      className="sd-panel sd-profile"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        update({
          ...saved,
          profile: {
            ...saved.profile,
            name: String(form.get("name")).trim() || data.profile.name,
            email: String(form.get("email")).trim(),
            goal: String(form.get("goal")).trim(),
          },
        });
        setNotice("ডেমো প্রোফাইল সংরক্ষিত হয়েছে।");
      }}
      key={ready ? "loaded" : "loading"}
    >
      <div className="sd-profile-heading">
        <span className="sd-avatar">
          <UserRound />
        </span>
        <div>
          <h2>আপনার পরিচিতি</h2>
          <p>{saved.profile.id} · ডেমো অ্যাকাউন্ট</p>
        </div>
      </div>
      <Label htmlFor="student-name">নাম</Label>
      <Input
        id="student-name"
        name="name"
        maxLength={80}
        defaultValue={saved.profile.name}
        required
      />
      <Label htmlFor="student-email">ইমেইল</Label>
      <Input
        id="student-email"
        name="email"
        type="email"
        defaultValue={saved.profile.email}
        required
      />
      <Label htmlFor="student-goal">আপনার লক্ষ্য</Label>
      <Input
        id="student-goal"
        name="goal"
        maxLength={120}
        defaultValue={saved.profile.goal}
      />
      <p>
        তথ্য শুধু এই ব্রাউজারে থাকবে। এটি প্রকৃত লগইন বা Supabase অ্যাকাউন্ট নয়।
      </p>
      <Button disabled={!ready} type="submit">
        পরিবর্তন সংরক্ষণ করুন <Check />
      </Button>
    </form>
  );
}
