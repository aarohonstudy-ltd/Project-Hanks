"use client";
import { useState, useTransition } from "react";
import {
  Trophy,
  Search,
  BookOpen,
  Users,
  Target,
  Medal,
  Printer,
  RefreshCw,
  ArrowRight,
  Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadLeaderboard } from "@/lib/student/leaderboard-actions";
import type {
  LeaderboardData,
  LeaderboardRow,
} from "@/lib/student/leaderboard";
import "../leaderboard/leaderboard.css";
const bn = (n: number) =>
  n.toLocaleString("bn-BD", { maximumFractionDigits: 2 });
function duration(n: number) {
  return `${bn(Math.floor(n / 60))} মি. ${bn(n % 60)} সে.`;
}
function Status({ row }: { row: LeaderboardRow }) {
  return (
    <span
      className={`lb-status ${row.passed === true ? "pass" : row.passed === false ? "fail" : ""}`}
    >
      {row.passed === null ? "সম্পন্ন" : row.passed ? "পাস" : "ফেল"}
    </span>
  );
}
export default function LeaderboardSection({
  initial,
  initialError,
}: {
  initial?: LeaderboardData;
  initialError?: string;
}) {
  const [data, setData] = useState(initial),
    [error, setError] = useState(initialError ?? ""),
    [pending, startTransition] = useTransition();
  const [course, setCourse] = useState(""),
    [examSearch, setExamSearch] = useState(""),
    [studentSearch, setStudentSearch] = useState(""),
    [appliedSearch, setAppliedSearch] = useState("");
  const exams = data?.exams ?? [];
  const courses = Array.from(
    new Map(
      exams.filter((e) => e.courseId).map((e) => [e.courseId!, e.course]),
    ).entries(),
  );
  const matching = exams.filter(
    (e) =>
      (!course || e.courseId === course) &&
      `${e.title} ${e.subjects}`
        .toLowerCase()
        .includes(examSearch.toLowerCase()),
  );
  function load(id: string | null, search = "", page = 1) {
    setError("");
    startTransition(async () => {
      const r = await loadLeaderboard(id, search, page);
      if (r.error) setError(r.error);
      else if (r.data) {
        setData(r.data);
        setAppliedSearch(search);
      }
    });
  }
  return (
    <div className="lb-root" aria-busy={pending}>
      <section className="lb-hero">
        <div>
          <span className="lb-eyebrow">
            <Trophy size={15} /> YOUR PROGRESS, RECOGNIZED
          </span>
          <h2>প্রস্তুতির পথে, সেরাদের সাথে</h2>
          <p>প্রতিটি পরীক্ষায় নিজের অবস্থান দেখুন, পরের লক্ষ্য ঠিক করুন।</p>
        </div>
        <div className="lb-hero-icon">
          <Trophy size={56} strokeWidth={1.25} />
          <span>মেধা তালিকা</span>
        </div>
      </section>
      <section className="sd-panel lb-filters">
        <div className="lb-section-heading">
          <span className="lb-icon">
            <BookOpen size={19} />
          </span>
          <div>
            <h3>আপনার পরীক্ষা বেছে নিন</h3>
            <p>কোর্স, পরীক্ষার নাম অথবা বিষয় দিয়ে খুঁজুন</p>
          </div>
        </div>
        <div className="lb-filter-grid">
          <label>
            <span>কোর্স</span>
            <select
              value={course}
              disabled={pending}
              onChange={(e) => setCourse(e.target.value)}
            >
              <option value="">সব কোর্স</option>
              {courses.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>পরীক্ষা / বিষয় খুঁজুন</span>
            <div className="lb-input-icon">
              <Search size={17} />
              <input
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                placeholder="যেমন: আন্তর্জাতিক, গণিত…"
              />
            </div>
          </label>
          <label>
            <span>প্রকাশিত ফলাফলের পরীক্ষা</span>
            <select
              aria-label="পরীক্ষা নির্বাচন"
              disabled={pending}
              value={
                matching.some((e) => e.id === data?.exam?.id)
                  ? data?.exam?.id
                  : ""
              }
              onChange={(e) => {
                if (e.target.value) {
                  setStudentSearch("");
                  load(e.target.value);
                }
              }}
            >
              <option value="">পরীক্ষা নির্বাচন করুন</option>
              {matching.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!matching.length && (
          <p className="lb-muted">এই ফিল্টারে প্রকাশিত ফলাফলের পরীক্ষা নেই।</p>
        )}
      </section>
      {error && (
        <div className="lb-error" role="alert">
          <p>{error}</p>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              load(data?.exam?.id ?? null, appliedSearch, data?.page ?? 1)
            }
          >
            আবার চেষ্টা করুন
          </Button>
        </div>
      )}
      {pending && (
        <p className="lb-loading" role="status">
          ফলাফল লোড হচ্ছে…
        </p>
      )}
      {data?.exam ? (
        <>
          <div className="lb-title-row">
            <div>
              <div className="lb-tags">
                <span>{data.exam.course}</span>
                <span>
                  {data.exam.type === "live" ? "লাইভ পরীক্ষা" : "মডেল টেস্ট"}
                </span>
              </div>
              <h2>
                <Trophy size={23} />
                {data.exam.title}
              </h2>
              <p>
                মোট নম্বর {bn(data.exam.maxMarks)} · সময়{" "}
                {bn(data.exam.duration)} মিনিট
                {data.exam.passMark > 0 &&
                  ` · পাস নম্বর ${bn(data.exam.passMark)}`}
              </p>
            </div>
            <div className="lb-actions">
              <Button
                variant="outline"
                disabled={pending}
                aria-label="ফলাফল রিফ্রেশ"
                onClick={() => load(data.exam!.id, appliedSearch, data.page)}
              >
                <RefreshCw size={15} />
              </Button>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => window.print()}
              >
                <Printer size={15} /> প্রিন্ট
              </Button>
            </div>
          </div>
          <div className="lb-stats">
            <div>
              <Users size={19} />
              <span>
                অংশগ্রহণকারী
                <strong>
                  {bn(data.participants)} <small>জন</small>
                </strong>
              </span>
            </div>
            <div>
              <Target size={19} />
              <span>
                সর্বোচ্চ স্কোর
                <strong>
                  {data.top.length ? bn(data.top[0].score) : "—"}{" "}
                  <small>/ {bn(data.exam.maxMarks)}</small>
                </strong>
              </span>
            </div>
            <div>
              <Medal size={19} />
              <span>
                আপনার অবস্থান
                <strong>
                  {data.mine ? `#${bn(data.mine.rank)}` : "—"}{" "}
                  <small>
                    {data.mine ? "অভিনন্দন, এগিয়ে চলুন" : "এখনো অংশ নেননি"}
                  </small>
                </strong>
              </span>
            </div>
          </div>
          {data.top.length > 0 && (
            <div className="lb-podium">
              {data.top.map((r, i) => (
                <article key={i} className={`lb-podium-card place-${i + 1}`}>
                  <div className="lb-medal">
                    <Medal size={20} />
                    <span>#{bn(r.rank)}</span>
                  </div>
                  <div className="lb-avatar">{r.name.trim().slice(0, 1)}</div>
                  <h3>
                    {r.name}
                    {r.isMe && <small>আপনি</small>}
                  </h3>
                  <strong>
                    {bn(r.score)}
                    <span> নম্বর</span>
                  </strong>
                  <p>
                    <Clock3 size={12} />
                    {duration(r.seconds)}
                  </p>
                </article>
              ))}
            </div>
          )}
          {data.mine && (
            <div className="lb-mine">
              <span className="lb-icon">
                <Target size={22} />
              </span>
              <div>
                <strong>আপনার অর্জন · #{bn(data.mine.rank)}</strong>
                <p>
                  {bn(data.mine.score)} নম্বর · {duration(data.mine.seconds)} ·{" "}
                  <Status row={data.mine} />
                </p>
              </div>
              <span className="lb-mine-note">
                আরও এগিয়ে যাওয়ার পালা <ArrowRight size={16} />
              </span>
            </div>
          )}
          <section className="sd-panel lb-results">
            <div className="lb-table-heading">
              <div>
                <h3>মেধা তালিকা</h3>
                <p>স্কোর বেশি, সমান স্কোরে সময় কম—এই ক্রমে র‍্যাঙ্ক।</p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  load(data.exam!.id, studentSearch, 1);
                }}
              >
                <label className="lb-input-icon">
                  <Search size={16} />
                  <input
                    aria-label="শিক্ষার্থীর নাম খুঁজুন"
                    placeholder="শিক্ষার্থীর নাম…"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </label>
                <Button type="submit" variant="outline" disabled={pending}>
                  খুঁজুন
                </Button>
                {appliedSearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      setStudentSearch("");
                      load(data.exam!.id);
                    }}
                  >
                    মুছুন
                  </Button>
                )}
              </form>
            </div>
            <div className="lb-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>র‍্যাঙ্ক</th>
                    <th>শিক্ষার্থীর নাম</th>
                    <th>স্ট্যাটাস</th>
                    <th>সময়</th>
                    <th>স্কোর</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr
                      key={`${r.rank}-${i}`}
                      className={r.isMe ? "is-me" : ""}
                    >
                      <td>
                        <span className={`lb-rank rank-${r.rank}`}>
                          {r.rank <= 3 && <Medal size={14} />} {bn(r.rank)}
                        </span>
                      </td>
                      <td>
                        <span className="lb-name">
                          {r.name}
                          {r.isMe && <small>আপনি</small>}
                        </span>
                      </td>
                      <td>
                        <Status row={r} />
                      </td>
                      <td className="lb-time">{duration(r.seconds)}</td>
                      <td className="lb-score">{bn(r.score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.rows.length && (
              <div className="lb-empty">
                <Trophy size={32} />
                <h3>
                  {data.participants
                    ? "এই নামে কাউকে পাওয়া যায়নি"
                    : "প্রথম ফলাফলের অপেক্ষায়"}
                </h3>
                <p>
                  {data.participants
                    ? "অন্য নাম দিয়ে খুঁজুন অথবা সার্চ মুছুন।"
                    : "পরীক্ষা জমা হওয়ার পর এখানে মেধা তালিকা দেখা যাবে।"}
                </p>
              </div>
            )}
            <div className="lb-pagination">
              <span>
                {bn(data.total)} জন · পৃষ্ঠা {bn(data.page)} /{" "}
                {bn(Math.max(1, Math.ceil(data.total / 25)))}
              </span>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending || data.page <= 1}
                  onClick={() =>
                    load(data.exam!.id, appliedSearch, data.page - 1)
                  }
                >
                  ← আগের
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending || data.page * 25 >= data.total}
                  onClick={() =>
                    load(data.exam!.id, appliedSearch, data.page + 1)
                  }
                >
                  পরের →
                </Button>
              </div>
            </div>
          </section>
          <p className="lb-footnote">
            প্রতি শিক্ষার্থীর সেরা জমা দেওয়া attempt দেখানো হচ্ছে। স্কোর ও সময়
            দুটোই সমান হলে একই র‍্যাঙ্ক।{" "}
            {data.exam.passMark === 0
              ? "পাস নম্বর নির্ধারিত না থাকায় স্ট্যাটাস “সম্পন্ন”।"
              : ""}{" "}
            প্রিন্টে বর্তমান পৃষ্ঠা ও ফিল্টার থাকবে।
          </p>
        </>
      ) : (
        !error &&
        !pending && (
          <section className="sd-panel lb-empty">
            <Trophy size={42} />
            <h3>মেধা তালিকা শিগগিরই</h3>
            <p>আপনার জন্য উন্মুক্ত পরীক্ষার ফল প্রকাশ হলে এখানে দেখা যাবে।</p>
          </section>
        )
      )}
    </div>
  );
}
