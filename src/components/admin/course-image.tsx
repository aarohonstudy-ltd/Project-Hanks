"use client";
import { useState } from "react";
import { browserClient } from "@/lib/supabase/client";
import CourseCover from "@/components/course-cover";
import { Button } from "@/components/ui/button";

export default function CourseImage({
  name,
  initial,
  onBusy,
}: {
  name: string;
  initial: string;
  onBusy: (busy: boolean) => void;
}) {
  const [url, setUrl] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    const extensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    if (!extensions[file.type] || file.size > 5 * 1024 * 1024) {
      setError("JPG, PNG অথবা WebP ছবি দিন, সর্বোচ্চ 5 MB।");
      return;
    }
    setBusy(true);
    onBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      bitmap.close();
      const client = browserClient();
      const path = `covers/${crypto.randomUUID()}.${extensions[file.type]}`;
      const { error } = await client.storage
        .from("course-images")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
          cacheControl: "31536000",
        });
      if (error)
        throw Error(
          "ছবি আপলোড হয়নি। Admin login ও 008 SQL migration চালানো হয়েছে কি না দেখুন।",
        );
      setUrl(
        client.storage.from("course-images").getPublicUrl(path).data.publicUrl,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "ছবি আপলোড হয়নি। আবার চেষ্টা করুন।",
      );
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <div className="aspect-video max-w-sm overflow-hidden rounded-xl border">
        <CourseCover key={url} src={url} title="কোর্সের কভার প্রিভিউ" />
      </div>
      <input
        aria-label="কোর্সের ছবি আপলোড"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          void upload(file);
        }}
      />
      <input
        aria-label="অথবা ছবির HTTPS লিংক"
        type="url"
        name={name}
        value={url}
        placeholder="অথবা https:// দিয়ে ছবির লিংক"
        pattern="https://.*"
        maxLength={2000}
        readOnly={busy}
        onChange={(e) => setUrl(e.target.value)}
      />
      {url && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => setUrl("")}
        >
          কভার সরান
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        {busy
          ? "ছবি আপলোড হচ্ছে…"
          : "JPG / PNG / WebP · সর্বোচ্চ 5 MB · 1600 × 1000 px হলে ভালো দেখাবে।"}
      </p>
      {error && (
        <p role="alert" className="ad-form-error">
          {error}
        </p>
      )}
    </div>
  );
}
