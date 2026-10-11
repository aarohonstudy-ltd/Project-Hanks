"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { importQuestions } from "@/lib/admin/actions";
import {
  importBatches,
  previewQuestionCsv,
  type CsvPreview,
} from "@/lib/admin/question-csv";
import type { Choice } from "@/lib/admin/types";

export default function QuestionImport({ courses }: { courses: Choice[] }) {
  const router = useRouter(),
    stop = useRef(false);
  const [open, setOpen] = useState(false),
    [reading, setReading] = useState(false),
    [busy, startImport] = useTransition();
  const [preview, setPreview] = useState<CsvPreview>(),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [status, setStatus] = useState("draft");
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [done, setDone] = useState(0);
  const selected =
    preview?.rows.filter(
      (r) => mapping[r.course] && mapping[r.course] !== "skip",
    ) ?? [];
  async function read(file?: File) {
    setPreview(undefined);
    setError("");
    setMessage("");
    setDone(0);
    if (!file) return;
    if (
      !file.name.toLowerCase().endsWith(".csv") ||
      file.size > 20 * 1024 * 1024
    ) {
      setError("UTF-8 CSV ফাইল দিন (সর্বোচ্চ 20 MB)।");
      return;
    }
    setReading(true);
    try {
      const next = previewQuestionCsv(await file.text());
      setPreview(next);
      setMapping(
        Object.fromEntries(
          next.courses.map(({ name }) => [
            name,
            courses.find((c) => c.title === name)?.id ?? "new",
          ]),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "CSV পড়া যায়নি।");
    } finally {
      setReading(false);
    }
  }
  function run() {
    stop.current = false;
    setError("");
    setMessage("");
    setDone(0);
    startImport(async () => {
      let imported = 0,
        skipped = 0,
        changed = 0,
        completed = 0;
      try {
        for (const batch of importBatches(selected)) {
          if (stop.current) break;
          const result = await importQuestions(batch, mapping, status);
          if (result.error || !result.data)
            throw Error(result.error || "Import হয়নি।");
          imported += result.data.imported;
          skipped += result.data.skipped;
          changed += result.data.changed;
          completed += batch.length;
          setDone(completed);
          setMessage(
            `নতুন ${imported}টি · আগে থেকে আছে ${skipped}টি${changed ? ` · বদলানো উৎসের ${changed}টি অপরিবর্তিত রাখা হয়েছে` : ""}`,
          );
        }
        setMessage(
          `${stop.current ? "Import থামানো হয়েছে।" : "Import সম্পন্ন।"} নতুন ${imported}টি · আগে থেকে আছে ${skipped}টি।${changed ? ` উৎসে বদলানো ${changed}টি প্রশ্ন overwrite হয়নি; প্রশ্ন ব্যাংক থেকে সম্পাদনা করুন।` : ""}`,
        );
      } catch (e) {
        setError(
          `${e instanceof Error ? e.message : "সংযোগের সমস্যা হয়েছে।"} ${completed}টি record প্রক্রিয়া হয়েছে। একই ফাইল ও mapping রেখে আবার Import করুন; আগের প্রশ্ন ডুপ্লিকেট হবে না।`,
        );
      } finally {
        router.refresh();
      }
    });
  }
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
        <div>
          <h3 className="font-semibold">CSV থেকে প্রশ্ন আনুন</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            প্রশ্ন, অপশন, সঠিক উত্তর ও ব্যাখ্যা একসঙ্গে import করুন।
          </p>
        </div>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Upload size={16} /> CSV Import
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy && !reading) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>প্রশ্ন ব্যাংক CSV Import</DialogTitle>
            <DialogDescription>
              প্রথমে ফাইল যাচাই করুন, তারপর কোর্স ও প্রকাশের অবস্থা বেছে নিন।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <label className="ad-field">
              <span>১. question_bank_rows.csv অথবা একই format-এর CSV</span>
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={busy || reading}
                onChange={(e) => void read(e.target.files?.[0])}
              />
            </label>
            <p className="text-xs leading-6 text-muted-foreground">
              কলাম: id, q, opts, correct, exp, topic, subject, course,
              created_at, is_master। opts হলো JSON array; correct: 0 = প্রথম, 1
              = দ্বিতীয় অপশন।
            </p>
            {reading && <p role="status">ফাইল যাচাই হচ্ছে…</p>}
            {preview && (
              <>
                <div className="rounded-xl bg-muted p-4">
                  মোট {preview.total.toLocaleString("bn-BD")}টি · সঠিক{" "}
                  {preview.rows.length.toLocaleString("bn-BD")}টি · ত্রুটি{" "}
                  {preview.errors.length.toLocaleString("bn-BD")}টি
                </div>
                {preview.errors.length > 0 && (
                  <div role="alert" className="ad-form-error">
                    <p>
                      ত্রুটিগুলো ঠিক করে ফাইল আবার দিন। এখন কোনো প্রশ্ন import
                      হবে না।
                    </p>
                    <ul className="mt-2 list-inside list-disc">
                      {preview.errors.slice(0, 12).map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                    {preview.errors.length > 12 && (
                      <p>আরও {preview.errors.length - 12}টি ত্রুটি আছে।</p>
                    )}
                  </div>
                )}
                <fieldset disabled={busy} className="space-y-4">
                  <legend className="mb-3 font-semibold">
                    ২. পুরোনো কোর্স → নতুন কোর্স
                  </legend>
                  {preview.courses.map(({ name, count }) => (
                    <label key={name} className="ad-field">
                      <span>
                        {name} · {count}টি
                      </span>
                      <select
                        value={mapping[name] ?? ""}
                        onChange={(e) =>
                          setMapping((m) => ({ ...m, [name]: e.target.value }))
                        }
                      >
                        <option value="new">
                          এই নামে নতুন Draft কোর্স তৈরি করুন
                        </option>
                        <option value="skip">
                          এই কোর্সের প্রশ্ন বাদ রাখুন
                        </option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <p className="text-xs leading-6 text-muted-foreground">
                    নতুন কোর্সের দাম ও ছবি পরে ঠিক করে Publish করুন। বিষয় ও টপিক
                    নিজে থেকে তৈরি হবে। একই বিষয়ের হলেও imported প্রশ্ন শুধু
                    নির্ধারিত কোর্সের শিক্ষার্থীরা পাবে; ফ্রি পরীক্ষায় যুক্ত
                    করলে সেখানেও পাওয়া যাবে।
                  </p>
                  <label className="ad-field">
                    <span>৩. নতুন প্রশ্নের অবস্থা</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="draft">Draft — যাচাই করার জন্য</option>
                      <option value="published">
                        Published — ব্যবহার করার জন্য প্রস্তুত
                      </option>
                    </select>
                  </label>
                </fieldset>
                {selected[0] && (
                  <div className="space-y-2 rounded-xl border p-4">
                    <h4 className="text-sm font-semibold">
                      প্রথম নির্বাচিত প্রশ্নের প্রিভিউ
                    </h4>
                    <p className="whitespace-pre-wrap">{selected[0].q}</p>
                    <ol className="list-inside list-decimal space-y-1">
                      {selected[0].opts.map((o, i) => (
                        <li
                          key={i}
                          className={
                            i === selected[0].correct
                              ? "font-semibold text-emerald-700 dark:text-emerald-400"
                              : ""
                          }
                        >
                          {o}
                          {i === selected[0].correct ? " ✓ সঠিক" : ""}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <p className="text-xs leading-6 text-muted-foreground">
                  আগে import করা id আবার এলে সেটি বাদ যাবে; উত্তর বা status
                  overwrite হবে না। মাঝপথে থামলে একই ফাইল ও mapping দিয়ে আবার
                  চালাতে পারবেন। Import চলাকালে এই পেজ খোলা রাখুন।
                </p>
                {(busy || done > 0) && (
                  <div role="status">
                    <progress
                      className="w-full"
                      max={Math.max(1, selected.length)}
                      value={done}
                    />
                    <p className="text-sm">
                      {done} / {selected.length} record প্রক্রিয়া হয়েছে
                    </p>
                  </div>
                )}
              </>
            )}
            {error && (
              <p role="alert" className="ad-form-error">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="rounded-xl bg-muted p-4 text-sm">
                {message}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              {busy ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    stop.current = true;
                    setMessage("চলমান ব্যাচ শেষ হলে থামবে…");
                  }}
                >
                  বর্তমান ব্যাচের পরে থামান
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setOpen(false)}>
                  বন্ধ করুন
                </Button>
              )}
              <Button
                disabled={
                  busy ||
                  reading ||
                  !selected.length ||
                  !!preview?.errors.length
                }
                onClick={run}
              >
                {busy
                  ? "Import হচ্ছে…"
                  : `${selected.length.toLocaleString("bn-BD")}টি প্রশ্ন Import করুন`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
