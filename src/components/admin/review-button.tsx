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
export default function ReviewButton({
  label,
  description,
  action,
  payload,
}: {
  label: string;
  description: string;
  action: string;
  payload: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!pending) setOpen(o);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
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
              onClick={() =>
                startTransition(async () => {
                  const r = await saveAdmin(action, payload);
                  if (r.error) setError(r.error);
                  else {
                    setOpen(false);
                    router.refresh();
                  }
                })
              }
            >
              {pending ? "অপেক্ষা করুন…" : "নিশ্চিত করুন"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
