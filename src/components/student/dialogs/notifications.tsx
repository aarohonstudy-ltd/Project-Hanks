"use client";
import Link from "next/link";
import { Popover } from "radix-ui";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/student/dashboard-context";
import PushSettings from "../push-settings";
export default function NotificationsDropdown() {
  const { data, saved, notifications, setNotifications, run } = useDashboard();
  return (
    <Popover.Root
      open={notifications}
      onOpenChange={(open) => {
        setNotifications(open);
        if (open) void run("read_notifications");
      }}
    >
      <Popover.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="নোটিফিকেশন">
          <Bell />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={10}
          collisionPadding={12}
          aria-label="নোটিফিকেশন"
          className="z-50 flex max-h-[var(--radix-popover-content-available-height)] flex-col w-[380px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-xl outline-none"
        >
          <div className="flex shrink-0 items-center justify-between border-b p-4">
            <div>
              <h2 className="font-semibold">নোটিফিকেশন</h2>
              <p className="text-xs text-muted-foreground">
                আপনার আপডেট ও রিমাইন্ডার
              </p>
            </div>
            <Popover.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="নোটিফিকেশন বন্ধ করুন"
              >
                <X size={16} />
              </Button>
            </Popover.Close>
          </div>
          <div className="min-h-0 max-h-[65vh] overflow-y-auto overscroll-contain p-3 space-y-3">
            {data.notifications.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                এখনো কোনো notification নেই।
              </p>
            )}
            {data.notifications.map((n) => (
              <article
                key={n.id ?? n.title}
                className="flex gap-3 rounded-xl border p-3"
              >
                <Bell size={17} className="shrink-0 mt-1 text-primary" />
                <div className="min-w-0 space-y-1">
                  <h3 className="text-sm font-semibold break-words">
                    {n.title}
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {n.body}
                  </p>
                  {n.url?.startsWith("/") && !n.url.startsWith("//") && (
                    <Link
                      href={n.url}
                      onClick={() => setNotifications(false)}
                      className="text-primary text-sm"
                    >
                      বিস্তারিত দেখুন →
                    </Link>
                  )}
                </div>
              </article>
            ))}
            {saved.reminders.map((id) => (
              <p className="rounded-lg bg-muted p-3 text-sm" key={id}>
                রিমাইন্ডার: {data.exams.find((e) => e.id === id)?.title}
              </p>
            ))}
            <details className="border-t pt-3">
              <summary className="cursor-pointer text-sm font-medium py-2">
                Push notification settings
              </summary>
              <PushSettings />
            </details>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
