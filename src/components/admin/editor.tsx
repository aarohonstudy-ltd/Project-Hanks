"use client";
import { useEffect, useRef, useState, useTransition } from "react";
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
import CourseImage from "./course-image";
import LessonPdf from "./lesson-pdf";
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
type EditorProps = {
  title: string;
  action: string;
  fields: Field[];
  row?: Row;
  defaults?: Record<string, unknown>;
  exam?: boolean;
  question?: boolean;
  // Prefill from `row` but save as a new row (used for locked rows).
  copy?: boolean;
  // Returns a message to block saving (checked before the server call).
  validate?: (payload: Record<string, unknown>) => string | undefined;
};
// Popup editor; the same form is used full-page via EditorForm.
export default function Editor({
  onClose,
  ...props
}: EditorProps & { onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const { row, copy, title } = props;
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !busy) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {copy ? "কপি করে নতুন" : row ? "সম্পাদনা" : "নতুন"} · {title}
          </DialogTitle>
          <DialogDescription>
            তথ্য পূরণ করে সংরক্ষণ করুন। প্রকাশিত তথ্য শিক্ষার্থীদের কাছে উপলব্ধ
            হবে।
          </DialogDescription>
        </DialogHeader>
        <EditorForm
          {...props}
          onBusy={setBusy}
          onDone={onClose}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
export function EditorForm({
  action,
  fields,
  row,
  defaults = {},
  exam = false,
  question = false,
  copy = false,
  validate,
  onBusy,
  onDone,
  onCancel,
}: EditorProps & {
  onBusy?: (busy: boolean) => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition(),
    [error, setError] = useState("");
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [examBusy, setExamBusy] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const busy = pending || uploading || examBusy;
  useEffect(() => onBusy?.(busy), [busy, onBusy]);
  // Bring a new error message into view (long forms scroll).
  useEffect(() => {
    if (error)
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);
  const formRef = useRef<HTMLFormElement>(null);
  const values: Record<string, unknown> = {
    ...defaults,
    ...row,
    ...(copy && { status: "draft", title: `${row?.title ?? ""} (কপি)` }),
  };
  const [items, setItems] = useState<ExamItem[]>(
    (row?.items ?? []) as ExamItem[],
  );
  return (
    <form
      ref={formRef}
      className="ad-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (uploading || pending || examBusy) return;
        const f = new FormData(e.currentTarget);
        const payload: Record<string, unknown> = {};
        if (row && !copy) payload.id = row.id;
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
        const invalid = validate?.(payload);
        if (invalid) {
          setError(invalid);
          return;
        }
        setError("");
        startTransition(async () => {
          const result = await saveAdmin(action, payload);
          if (result.error) setError(result.error);
          else {
            onDone();
            router.refresh();
          }
        });
      }}
    >
      <fieldset disabled={pending || examBusy} className="ad-fields">
        {fields.map((field) => {
          let value = values[field.key];
          if (field.type === "datetime-local") value = toDhaka(value);
          if (question && field.key === "options_text")
            value = ((row?.options ?? ["", "", "", ""]) as string[]).join("\n");
          if (question && field.key === "correct_number")
            value = Number(row?.correct_index ?? 0) + 1;
          return (
            <label
              key={field.key}
              className={`ad-field ${["textarea", "multi", "image", "pdf"].includes(field.type ?? "") ? "wide" : ""}`}
            >
              <span>
                {field.label}
                {field.required ? " *" : ""}
              </span>
              {field.type === "pdf" ? (
                <LessonPdf
                  name={field.key}
                  initial={String(value ?? "")}
                  onBusy={setUploading}
                />
              ) : field.type === "image" ? (
                <CourseImage
                  name={field.key}
                  initial={String(value ?? "")}
                  onBusy={setUploading}
                />
              ) : field.type === "textarea" ? (
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
              {field.hint && <small className="ad-hint">{field.hint}</small>}
            </label>
          );
        })}
      </fieldset>
      {exam && (
        <QuestionPicker
          items={items}
          setItems={setItems}
          onBusy={setExamBusy}
          getSettings={() => {
            const f = formRef.current ? new FormData(formRef.current) : null;
            return {
              title: String(f?.get("title") || "পরীক্ষার খসড়া"),
              exam_type: String(f?.get("exam_type") || "model_test"),
              duration_minutes: Number(f?.get("duration_minutes") || 30),
              pass_mark: Number(f?.get("pass_mark") || 0),
            };
          }}
          disabled={pending || uploading || examBusy}
        />
      )}
      {error && (
        <p role="alert" className="ad-form-error" ref={errorRef}>
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={pending || uploading || examBusy}
          onClick={onCancel}
        >
          বাতিল
        </Button>
        <Button type="submit" disabled={pending || uploading || examBusy}>
          {pending ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
        </Button>
      </div>
    </form>
  );
}
