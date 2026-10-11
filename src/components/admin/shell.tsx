"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Menu,
  X,
  ArrowUpRight,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { disableBrowserPush } from "@/lib/notifications/browser";
import { browserClient } from "@/lib/supabase/client";
import { sections } from "@/lib/admin/types";
import "./admin.css";
export default function AdminShell({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const router = useRouter(),
    pathname = usePathname(),
    { setTheme, resolvedTheme } = useTheme();
  const section = pathname.split("/")[2] || "overview";
  const title = sections.find(([s]) => s === section)?.[1] || "অ্যাডমিন";
  return (
    <div className="ad-root">
      <aside className={`ad-sidebar ${open ? "ad-open" : ""}`}>
        <Link className="ad-brand" href="/admin">
          <span>আ</span>
          <div>
            আরোহণ<small>ADMIN WORKSPACE</small>
          </div>
        </Link>
        <button
          className="ad-close"
          onClick={() => setOpen(false)}
          aria-label="মেনু বন্ধ করুন"
        >
          <X />
        </button>
        <p className="ad-nav-label">ম্যানেজমেন্ট</p>
        <nav>
          {sections.map(([id, label], i) => (
            <Link
              aria-current={section === id ? "page" : undefined}
              key={id}
              href={id === "overview" ? "/admin" : `/admin/${id}`}
              className={section === id ? "active" : ""}
              onNavigate={() => setOpen(false)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="ad-admin-id">
          <ShieldCheck size={20} />
          <div>
            {name}
            <small>Administrator</small>
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="ad-backdrop"
          aria-label="মেনু বন্ধ করুন"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="ad-main">
        <header className="ad-header">
          <div className="flex items-center gap-3">
            <Button
              className="ad-menu"
              variant="ghost"
              size="icon"
              aria-label="মেনু খুলুন"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </Button>
            <span>
              Workspace <span className="text-muted-foreground mx-2">/</span>{" "}
              <strong>{title}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="থিম পরিবর্তন"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <Sun size={18} className="hidden dark:block" />
              <Moon size={18} className="dark:hidden" />
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                স্টুডেন্ট পোর্টাল <ArrowUpRight size={15} />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="লগআউট"
              onClick={async () => {
                await disableBrowserPush().catch(() => {});
                const { error } = await browserClient().auth.signOut();
                if (error) setError(error.message);
                else {
                  router.replace("/login");
                  router.refresh();
                }
              }}
            >
              <LogOut size={18} />
            </Button>
          </div>
        </header>
        <main className="ad-content">
          {error && <p role="alert">{error}</p>}
          {children}
        </main>
      </div>
    </div>
  );
}
