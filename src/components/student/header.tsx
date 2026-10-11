/* eslint-disable @next/next/no-location-assign-relative-destination -- Full reload clears authenticated client state. */
"use client";
import { browserClient } from "@/lib/supabase/client";
import { useDashboard } from "@/components/student/dashboard-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, ChevronRight, Menu, Moon, Sun, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import DashboardSidebar from "./sidebar";
export default function DashboardHeader() {
  const { mobileOpen, setMobileOpen, setNotifications, title, run, setNotice } =
    useDashboard();
  const { setTheme } = useTheme();
  return (
    <header className="sd-header">
      <div className="sd-header-left">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="sd-mobile-menu"
              aria-label="মেনু খুলুন"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sd-mobile-sheet">
            <SheetHeader className="sr-only">
              <SheetTitle>স্টুডেন্ট মেনু</SheetTitle>
              <SheetDescription>ড্যাশবোর্ডের বিভাগ বেছে নিন</SheetDescription>
            </SheetHeader>
            <DashboardSidebar />
          </SheetContent>
        </Sheet>
        <div className="sd-breadcrumb">
          স্টুডেন্ট পোর্টাল <ChevronRight size={14} />
          <strong>{title}</strong>
        </div>
      </div>
      <div className="sd-header-actions">
        <Button
          variant="ghost"
          onClick={async () => {
            const { error } = await browserClient().auth.signOut();
            if (error) setNotice(error.message);
            else location.assign("/login");
          }}
        >
          লগআউট
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="থিম পরিবর্তন করুন"
          onClick={() =>
            setTheme(
              document.documentElement.classList.contains("dark")
                ? "light"
                : "dark",
            )
          }
        >
          <Sun className="hidden dark:block" />
          <Moon className="dark:hidden" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="নোটিফিকেশন"
          onClick={() => {
            setNotifications(true);
            void run("read_notifications");
          }}
        >
          <Bell />
        </Button>
        <Link
          href="/dashboard/profile"
          className="sd-avatar"
          aria-label="আমার প্রোফাইল"
        >
          <UserRound size={19} />
        </Link>
      </div>
    </header>
  );
}
