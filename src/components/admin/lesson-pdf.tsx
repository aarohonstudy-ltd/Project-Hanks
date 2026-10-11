"use client";
import { useState } from "react";
import { browserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
export default function LessonPdf({
  name,
  initial,
  onBusy,
}: {
  name: string;
  initial: string;
  onBusy: (value: boolean) => void;
}) {
  const [path, setPath] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    setBusy(true);
    onBusy(true);
    try {
      if (
        !/\.pdf$/i.test(file.name) ||
        file.size > 20 * 1024 * 1024 ||
        (await file.slice(0, 5).text()) !== "%PDF-"
      )
        throw Error("সঠিক PDF ফাইল দিন, সর্বোচ্চ 20 MB।");
      const next = `lessons/${crypto.randomUUID()}.pdf`;
      const { error } = await browserClient()
        .storage.from("course-materials")
        .upload(next, file, { contentType: "application/pdf", upsert: false });
      if (error)
        throw Error(
          "PDF আপলোড হয়নি। Admin login ও 011 SQL migration যাচাই করুন।",
        );
      setPath(next);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "আপলোড হয়নি। আবার চেষ্টা করুন।",
      );
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={path} />
      <input
        type="file"
        aria-label="PDF আপলোড করুন"
        accept="application/pdf,.pdf"
        disabled={busy}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          void upload(file);
        }}
      />
      <p className="text-sm text-muted-foreground">
        {busy
          ? "PDF আপলোড হচ্ছে…"
          : path
            ? "PDF সংযুক্ত আছে। পরিবর্তন করতে নতুন PDF আপলোড করুন।"
            : "সর্বোচ্চ 20 MB · শুধু enrolled শিক্ষার্থীরা download করতে পারবে।"}
      </p>
      {path && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => setPath("")}
        >
          PDF সরান
        </Button>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
