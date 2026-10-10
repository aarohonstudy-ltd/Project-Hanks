"use client";
import { useDashboard } from "@/components/student/dashboard-context";
import { bn, href, navigation } from "@/components/student/navigation";
import {
  ArrowRight,
  ChevronRight,
  GraduationCap,
  Home,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";

export default function DashboardSidebar() {
  const { section, setMobileOpen, saved, enrolled } = useDashboard();

  return (
    <div className="sd-sidebar-inner">
      <Link href="/" className="sd-brand">
        <span className="sd-logo">
          <GraduationCap size={25} />
        </span>
        <span>
          <strong>আরোহণ</strong>
          <small>STUDENT PORTAL</small>
        </span>
      </Link>
      <div className="sd-nav-label">শেখার ঠিকানা</div>
      <nav aria-label="শিক্ষার্থী মেনু">
        {navigation.map((n, i) => (
          <div key={n.id}>
            {i === 7 && (
              <div className="sd-nav-label sd-nav-divider">অনুশীলন ও কোর্স</div>
            )}
            <Link
              href={href(n.id)}
              onNavigate={() => setMobileOpen(false)}
              aria-current={section === n.id ? "page" : undefined}
              className={`sd-nav-link ${section === n.id ? "is-active" : ""}`}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {n.id === "live" ? (
                <span className="sd-dot" />
              ) : n.id === "courses" ? (
                <small>{bn(enrolled.length)}</small>
              ) : null}
            </Link>
          </div>
        ))}
      </nav>
      <div className="sd-sidebar-bottom">
        <div className="sd-help">
          <Sparkles size={18} />
          <strong>ছোট ছোট চেষ্টায় বড় সাফল্য</strong>
          <p>আজকের অনুশীলনটি শেষ করেছেন?</p>
          <Link href="/dashboard/practice">
            অনুশীলন শুরু করুন <ArrowRight size={14} />
          </Link>
        </div>
        <Link href="/dashboard/profile" className="sd-account">
          <span className="sd-avatar">
            <UserRound size={20} />
          </span>
          <span>
            <strong>{saved.profile.name}</strong>
            <small>{saved.profile.id}</small>
          </span>
          <ChevronRight size={16} />
        </Link>
        <Link href="/" className="sd-home-link">
          <Home size={15} /> মূল ওয়েবসাইট
        </Link>
      </div>
    </div>
  );
}
