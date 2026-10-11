"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { saveAdmin } from "@/lib/admin/actions";
import type { Field, Row, ExamItem } from "@/lib/admin/types";
import QuestionPicker from "./question-picker";
export const statuses = [
  { id: "draft", title: "Draft — খসড়া" },
  { id: "published", title: "Published — প্রকাশিত" },
  { id: "archived", title: "Archived — আর্কাইভ" },
];
export const statusField: Field = {
  key: "status",
  label: "প্রকাশের অবস্থা",
  type: "select",
  choices: statuses,
  required: true,
};
export function toDhaka(value: unknown) {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() + 6 * 3600000).toISOString().slice(0, 16);
}
export default function Editor({
  title,
  action,
  fields,
  row,
  defaults = {},
  onClose,
  exam = false,
  question = false,
}: {
  title: string;
  action: string;
  fields: Field[];
  row?: Row;
  defaults?: Record<string, unknown>;
  onClose: () => void;
  exam?: boolean;
  question?: boolean;
}) {
  const [pending, startTransition] = useTransition(),
    [error, setError] = useState("");
  const router = useRouter();
  const values = { ...defaults, ...row };
  const [items, setItems] = useState<ExamItem[]>(
    (row?.items ?? []) as ExamItem[],
  );
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !pending) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {row ? "সম্পাদনা" : "নতুন"} · {title}
          </DialogTitle>
          <DialogDescription>
            তথ্য পূরণ করে সংরক্ষণ করুন। প্রকাশিত তথ্য শিক্ষার্থীদের কাছে উপলব্ধ
            হবে।
          </DialogDescription>
        </DialogHeader>
        <form
          className="ad-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const payload: Record<string, unknown> = {};
            if (row) payload.id = row.id;
            for (const field of fields) {
              if (field.type === "checkbox")
                payload[field.key] = f.get(field.key) === "on";
              else if (field.type === "multi")
                payload[field.key] = f.getAll(field.key);
              else if (field.type === "datetime-local") {
                const v = String(f.get(field.key) || "");
                payload[field.key] = v
                  ? new Date(v + ":00+06:00").toISOString()
                  : "";
              } else payload[field.key] = String(f.get(field.key) ?? "");
            }
            if (question) {
              payload.options = String(payload.options_text)
                .split("\n")
                .map((x) => x.trim());
              payload.correct_index = Number(payload.correct_number) - 1;
              delete payload.options_text;
              delete payload.correct_number;
            }
            if (exam) payload.items = items;
            setError("");
            startTransition(async () => {
              const result = await saveAdmin(action, payload);
              if (result.error) setError(result.error);
              else {
                onClose();
                router.refresh();
              }
            });
          }}
        >
          <fieldset disabled={pending} className="ad-fields">
            {fields.map((field) => {
              let value = values[field.key];
              if (field.type === "datetime-local") value = toDhaka(value);
              if (question && field.key === "options_text")
                value = ((row?.options ?? ["", "", "", ""]) as string[]).join(
                  "\n",
                );
              if (question && field.key === "correct_number")
                value = Number(row?.correct_index ?? 0) + 1;
              return (
                <label
                  key={field.key}
                  className={`ad-field ${["textarea", "multi"].includes(field.type ?? "") ? "wide" : ""}`}
                >
                  <span>
                    {field.label}
                    {field.required ? " *" : ""}
                  </span>
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.key}
                      required={field.required}
                      defaultValue={String(value ?? "")}
                      maxLength={field.key === "content" ? 100000 : 10000}
                    />
                  ) : field.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      name={field.key}
                      defaultChecked={Boolean(value)}
                    />
                  ) : field.type === "select" || field.type === "multi" ? (
                    <select
                      name={field.key}
                      required={field.required}
                      multiple={field.type === "multi"}
                      defaultValue={
                        field.type === "multi"
                          ? ((value ?? []) as string[])
                          : String(value ?? "")
                      }
                    >
                      {field.type !== "multi" && (
                        <option value="">নির্বাচন করুন</option>
                      )}
                      {field.choices?.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field.key}
                      type={field.type ?? "text"}
                      defaultValue={String(value ?? "")}
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      maxLength={field.type === "url" ? 2000 : 300}
                    />
                  )}
                  {field.hint && (
                    <small className="ad-hint">{field.hint}</small>
                  )}
                </label>
              );
            })}
          </fieldset>
          {exam && (
            <QuestionPicker
              items={items}
              setItems={setItems}
              disabled={pending}
            />
          )}
          {error && (
            <p role="alert" className="ad-form-error">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onClose}
            >
              বাতিল
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
