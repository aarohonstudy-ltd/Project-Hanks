"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  builderTopics,
  generateExamQuestions,
} from "@/lib/admin/exam-builder-actions";
import type { BuilderTopic } from "@/lib/admin/exam-builder";
import type { ExamItem } from "@/lib/admin/types";
export default function RandomBuilder({
  items,
  onChange,
  disabled,
  onBusy,
}: {
  items: ExamItem[];
  onChange: (items: ExamItem[]) => void;
  disabled: boolean;
  onBusy: (v: boolean) => void;
}) {
  const [topics, setTopics] = useState<BuilderTopic[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("quota"),
    [counts, setCounts] = useState<Record<string, number>>({}),
    [count, setCount] = useState(20);
  const [difficulty, setDifficulty] = useState(""),
    [fresh, setFresh] = useState(true),
    [replace, setReplace] = useState(false),
    [search, setSearch] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void builderTopics().then((r) => {
      if (active) {
        setTopics(r.data ?? []);
        setError(r.error ?? "");
      }
    });
    return () => {
      active = false;
    };
  }, [retry]);
  const selected = Object.entries(counts).map(([id, count]) => ({ id, count }));
  const total =
    mode === "quota" ? selected.reduce((s, x) => s + x.count, 0) : count;
  async function generate() {
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      const r = await generateExamQuestions({
        mode,
        topics: selected,
        count,
        difficulty,
        fresh,
      });
      if (r.error) setError(r.error);
      else if (r.data) {
        onChange(r.data);
        setReplace(false);
      }
    } catch {
      setError("সংযোগের সমস্যা। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <details className="ad-builder">
      <summary>স্বয়ংক্রিয়ভাবে random প্রশ্ন নিন</summary>
      <fieldset disabled={disabled || busy} className="grid gap-4 mt-4">
        <label>
          প্রশ্ন নির্বাচনের নিয়ম
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="quota">প্রতি টপিক থেকে নির্দিষ্ট সংখ্যক</option>
            <option value="random">নির্বাচিত টপিকগুলো থেকে পুরো random</option>
          </select>
        </label>
        <p className="ad-hint">
          Quota mode-এ প্রতিটি টপিকের সংখ্যা ঠিক থাকবে। পুরো random mode-এ সব
          নির্বাচিত টপিক মিলিয়ে প্রশ্ন নেওয়া হবে; প্রতিটি টপিক থেকে প্রশ্ন আসার
          নিশ্চয়তা নেই। Generate শুধু তালিকা তৈরি করে, Save করলে পরীক্ষা
          সংরক্ষিত হবে।
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label>
            কঠিনতা
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">সব</option>
              <option value="easy">সহজ</option>
              <option value="medium">মাঝারি</option>
              <option value="hard">কঠিন</option>
            </select>
          </label>
          {mode === "random" && (
            <label>
              মোট প্রশ্ন
              <input
                type="number"
                min={1}
                max={200}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </label>
          )}
        </div>
        <label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={fresh}
            onChange={(e) => setFresh(e.target.checked)}
          />
          Published পরীক্ষায় যুক্ত বা আগে attempt/practice-এ ব্যবহৃত প্রশ্ন বাদ
          দিন
        </label>
        <input
          aria-label="টপিক খুঁজুন"
          placeholder="বিষয় / টপিক খুঁজুন"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ad-builder-topics">
          {topics
            .filter((t) =>
              `${t.subject} ${t.title}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((t) => (
              <div key={t.id} className="ad-builder-topic">
                <label className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={t.id in counts}
                    onChange={(e) =>
                      setCounts((old) => {
                        const next = { ...old };
                        if (e.target.checked) next[t.id] = 1;
                        else delete next[t.id];
                        return next;
                      })
                    }
                  />
                  <span>
                    {t.subject} · {t.title}
                    <small className="block">
                      Published প্রশ্ন: {t.available}টি (filter-এর আগে)
                    </small>
                  </span>
                </label>
                {mode === "quota" && t.id in counts && (
                  <input
                    aria-label={`${t.title} প্রশ্ন সংখ্যা`}
                    type="number"
                    min={1}
                    max={200}
                    value={counts[t.id]}
                    onChange={(e) =>
                      setCounts({ ...counts, [t.id]: Number(e.target.value) })
                    }
                  />
                )}
              </div>
            ))}
        </div>
        <p>
          নির্বাচিত টপিক: {selected.length} · মোট প্রশ্ন: {total} / ২০০
        </p>
        {items.length > 0 && (
          <label className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={replace}
              onChange={(e) => setReplace(e.target.checked)}
            />
            Generate করলে বর্তমান {items.length}টি প্রশ্নের তালিকা বদলে যাবে
          </label>
        )}
        <Button
          type="button"
          disabled={
            !selected.length ||
            total < 1 ||
            total > 200 ||
            !Number.isInteger(total) ||
            (items.length > 0 && !replace)
          }
          onClick={generate}
        >
          Random প্রশ্ন তৈরি করুন
        </Button>
      </fieldset>
      {busy && <p role="status">প্রশ্ন বাছাই হচ্ছে…</p>}
      {error && (
        <p role="alert" className="ad-form-error">
          {error}{" "}
          {!topics.length && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setRetry(retry + 1)}
            >
              আবার লোড
            </Button>
          )}
        </p>
      )}
    </details>
  );
}
