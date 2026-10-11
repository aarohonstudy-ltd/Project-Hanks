"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { readAdmin } from "@/lib/admin/actions";
import type { ExamItem, Row } from "@/lib/admin/types";
export default function QuestionPicker({
  items,
  setItems,
  disabled,
}: {
  items: ExamItem[];
  setItems: (items: ExamItem[]) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState(""),
    [rows, setRows] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [pending, startTransition] = useTransition(),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0);
  function search(n: number) {
    startTransition(async () => {
      const r = await readAdmin("questions", query, n);
      setError(r.error ?? "");
      if (r.data) {
        setRows(r.data.rows);
        setTotal(r.data.total);
        setPage(n);
      }
    });
  }
  return (
    <fieldset disabled={disabled} className="ad-items">
      <legend className="font-semibold mb-3">
        প্রশ্ন নির্বাচন · {items.length}টি
      </legend>
      <p className="ad-hint">
        নিচের ক্রমেই প্রশ্ন দেখাবে। Published প্রশ্ন যোগ করুন। প্রতি প্রশ্নের
        নম্বর ও ভুল উত্তরের কর্তন দিন।
      </p>
      {items.map((item, i) => (
        <div key={item.id} className="ad-item">
          <p>
            {i + 1}. {item.title}
          </p>
          <div className="ad-item-row">
            <label>
              নম্বর{" "}
              <input
                aria-label={`${i + 1} নম্বর`}
                type="number"
                required
                min="0.01"
                step="0.01"
                value={item.marks}
                onChange={(e) =>
                  setItems(
                    items.map((x, j) =>
                      j === i ? { ...x, marks: Number(e.target.value) } : x,
                    ),
                  )
                }
              />
            </label>
            <label>
              কর্তন{" "}
              <input
                aria-label={`${i + 1} কর্তন`}
                type="number"
                required
                min="0"
                step="0.01"
                max={item.marks}
                value={item.negative_marks}
                onChange={(e) =>
                  setItems(
                    items.map((x, j) =>
                      j === i
                        ? { ...x, negative_marks: Number(e.target.value) }
                        : x,
                    ),
                  )
                }
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={i === 0}
              onClick={() => {
                const copy = [...items];
                [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                setItems(copy);
              }}
            >
              ↑ উপরে
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setItems(items.filter((x) => x.id !== item.id))}
            >
              সরান
            </Button>
          </div>
        </div>
      ))}
      <div className="ad-search">
        <input
          aria-label="পরীক্ষার প্রশ্ন খুঁজুন"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="প্রশ্নের লেখা দিয়ে খুঁজুন"
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => search(1)}
        >
          প্রশ্ন খুঁজুন
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
      {rows.map((q) => (
        <div
          key={q.id}
          className="ad-item flex items-center justify-between gap-3"
        >
          <span>
            {String(q.question_text)} <small>({String(q.status)})</small>
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              q.status !== "published" ||
              items.some((i) => i.id === q.id) ||
              items.length >= 200
            }
            onClick={() =>
              setItems([
                ...items,
                {
                  id: q.id,
                  title: String(q.question_text),
                  marks: 1,
                  negative_marks: 0,
                },
              ])
            }
          >
            যোগ
          </Button>
        </div>
      ))}
      {total > 25 && (
        <div className="flex gap-4">
          <Button
            type="button"
            variant="ghost"
            disabled={pending || page === 1}
            onClick={() => search(page - 1)}
          >
            আগের
          </Button>
          <span>
            {page} / {Math.ceil(total / 25)}
          </span>
          <Button
            type="button"
            variant="ghost"
            disabled={pending || page * 25 >= total}
            onClick={() => search(page + 1)}
          >
            পরের
          </Button>
        </div>
      )}
    </fieldset>
  );
}
