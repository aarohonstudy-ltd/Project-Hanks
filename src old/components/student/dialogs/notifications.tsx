"use client";
import { useDashboard } from "@/components/student/dashboard-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell } from "lucide-react";

export default function NotificationsDialog() {
  const { data, saved, notifications, setNotifications } = useDashboard();
  return (
    <Dialog open={notifications} onOpenChange={setNotifications}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>নোটিফিকেশন</DialogTitle>
          <DialogDescription>
            নমুনা আপডেট ও আপনার সংরক্ষিত রিমাইন্ডার
          </DialogDescription>
        </DialogHeader>
        {data.notifications.map((n) => (
          <div className="sd-notification" key={n.title}>
            <Bell size={18} />
            <div>
              <strong>{n.title}</strong>
              <p>{n.body}</p>
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
