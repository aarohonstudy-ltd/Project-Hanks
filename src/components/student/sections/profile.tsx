"use client";
import { useDashboard } from "@/components/student/dashboard-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, UserRound } from "lucide-react";
export default function ProfileSection() {
  const { saved, ready, run } = useDashboard();

  return (
    <form
      className="sd-panel sd-profile"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        void run("profile", {
          name: String(form.get("name")).trim(),
          goal: String(form.get("goal")).trim(),
        });
      }}
      key={ready ? "loaded" : "loading"}
    >
      <div className="sd-profile-heading">
        <span className="sd-avatar">
          <UserRound />
        </span>
        <div>
          <h2>আপনার পরিচিতি</h2>
          <p>{saved.profile.id}</p>
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
        readOnly
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
      <p>আপনার নাম ও লক্ষ্য অ্যাকাউন্টে সংরক্ষণ হবে।</p>
      <Button disabled={!ready} type="submit">
        পরিবর্তন সংরক্ষণ করুন <Check />
      </Button>
    </form>
  );
}
