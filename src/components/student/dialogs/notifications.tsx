"use client";
import { useDashboard } from "@/components/student/dashboard-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PushSettings from "../push-settings";
import { Bell } from "lucide-react";

export default function NotificationsDialog() {
  const { data, saved, notifications, setNotifications } = useDashboard();
  return (
    <Dialog open={notifications} onOpenChange={setNotifications}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>নোটিফিকেশন</DialogTitle>
          <DialogDescription>
            আপনার আপডেট ও সংরক্ষিত রিমাইন্ডার
          </DialogDescription>
        </DialogHeader>
        <PushSettings />
        {data.notifications.length === 0 && <p>এখনো কোনো notification নেই।</p>}
        {data.notifications.map((n) => (
          <div className="sd-notification" key={n.id ?? n.title}>
            <Bell size={18} />
            <div>
              <strong>{n.title}</strong>
              <p>{n.body}</p>
              {n.url?.startsWith("/") && !n.url.startsWith("//") && (
                <a className="text-primary text-sm" href={n.url}>
                  বিস্তারিত দেখুন →
                </a>
              )}
            </div>
          </div>
        ))}
        {saved.reminders.map((id) => (
          <p key={id}>
            রিমাইন্ডার: {data.exams.find((e) => e.id === id)?.title}
          </p>
        ))}
      </DialogContent>
    </Dialog>
  );
}
