"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { deleteAdminRow, type StatusEntity } from "@/lib/admin/actions";
import type { Row } from "@/lib/admin/types";
// Shown only for archived rows; the database refuses if student history exists.
export default function DeleteButton({
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
  const name = String(row.title ?? row.name ?? row.question_text ?? "");
  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <Trash2 size={14} /> মুছে ফেলুন
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!pending) setOpen(o);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              স্থায়ীভাবে মুছে ফেলবেন?
            </DialogTitle>
            <DialogDescription>
              {name && (
                <>
                  “<b>{name.length > 120 ? `${name.slice(0, 120)}…` : name}</b>
                  ”{" "}
                </>
              )}
              চিরতরে মুছে যাবে, আর ফেরত আনা যাবে না। শিক্ষার্থীদের ফলাফল বা
              প্র্যাকটিসের রেকর্ড থাকলে মোছা যাবে না; সেক্ষেত্রে আর্কাইভ
              অবস্থায় রাখুন।
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="ad-form-error">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              বাতিল
            </Button>
            <Button
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() =>
                startTransition(async () => {
                  const r = await deleteAdminRow(entity, row.id);
                  if (r.error) setError(r.error);
                  else {
                    setOpen(false);
                    router.refresh();
                  }
                })
              }
            >
              <Trash2 size={14} />
              {pending ? "মুছে ফেলা হচ্ছে…" : "হ্যাঁ, মুছে ফেলুন"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
