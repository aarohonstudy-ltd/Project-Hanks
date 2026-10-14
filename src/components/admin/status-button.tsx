"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { setAdminStatus, type StatusEntity } from "@/lib/admin/actions";
import type { Row } from "@/lib/admin/types";
// What archiving means for students, per entity.
const effects: Record<StatusEntity, string> = {
  course:
    "কোর্সটি ক্যাটালগ থেকে সরে যাবে এবং এনরোল করা শিক্ষার্থীরাও এর লেসন দেখতে পারবে না। কোনো তথ্য মুছে যাবে না।",
  lesson: "লেসনটি শিক্ষার্থীদের কাছ থেকে লুকানো থাকবে। কোনো তথ্য মুছে যাবে না।",
  question:
    "প্রশ্নটি প্রশ্ন ব্যাংক ও প্র্যাকটিস থেকে সরে যাবে। আগের পরীক্ষা ও প্র্যাকটিসের ফলাফল ঠিক থাকবে।",
  exam: "পরীক্ষাটি শিক্ষার্থীদের তালিকা থেকে সরে যাবে। আগের ফলাফল ঠিক থাকবে। চলমান attempt থাকলে আর্কাইভ করা যাবে না।",
  subject:
    "এই বিষয়ে নতুন টপিক বা প্রশ্ন যোগ করা যাবে না এবং তালিকায় (আর্কাইভ) লেখা থাকবে। বিদ্যমান প্রশ্ন ও শিক্ষার্থীদের অ্যাক্সেস বদলাবে না।",
  topic:
    "এই টপিকে নতুন প্রশ্ন যোগ করা যাবে না এবং তালিকায় (আর্কাইভ) লেখা থাকবে। বিদ্যমান প্রশ্ন ও শিক্ষার্থীদের অ্যাক্সেস বদলাবে না।",
};
export function isArchived(entity: StatusEntity, row: Row) {
  return entity === "subject" || entity === "topic"
    ? Boolean(row.archived_at)
    : row.status === "archived";
}
export default function StatusButton({
  entity,
  row,
}: {
  entity: StatusEntity;
  row: Row;
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [pending, startTransition] = useTransition();
  const router = useRouter();
  const archived = isArchived(entity, row);
  const simple = entity === "subject" || entity === "topic";
  function change(status: string) {
    startTransition(async () => {
      const r = await setAdminStatus(entity, row.id, status);
      if (r.error) setError(r.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });
  }
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        {archived ? (
          <>
            <ArchiveRestore size={14} /> ফেরত আনুন
          </>
        ) : (
          <>
            <Archive size={14} /> আর্কাইভ
          </>
        )}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!pending) setOpen(o);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {archived ? "আর্কাইভ থেকে ফেরত আনুন" : "আর্কাইভ করুন"}
            </DialogTitle>
            <DialogDescription>
              {archived
                ? simple
                  ? "আবার নতুন কনটেন্ট যোগ করা যাবে।"
                  : "খসড়া হিসেবে ফেরত আনলে শুধু অ্যাডমিনরা দেখবেন; প্রকাশ করলে শিক্ষার্থীরাও দেখবে।"
                : effects[entity]}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="ad-form-error">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              বাতিল
            </Button>
            {!archived && (
              <Button disabled={pending} onClick={() => change("archived")}>
                {pending ? "অপেক্ষা করুন…" : "আর্কাইভ করুন"}
              </Button>
            )}
            {archived && simple && (
              <Button disabled={pending} onClick={() => change("active")}>
                {pending ? "অপেক্ষা করুন…" : "ফেরত আনুন"}
              </Button>
            )}
            {archived && !simple && (
              <>
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => change("draft")}
                >
                  খসড়া হিসেবে
                </Button>
                <Button disabled={pending} onClick={() => change("published")}>
                  {pending ? "অপেক্ষা করুন…" : "প্রকাশ করুন"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
