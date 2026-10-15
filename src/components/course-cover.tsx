"use client";
/* eslint-disable @next/next/no-img-element -- Public course covers may use admin-provided HTTPS hosts. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
export default function CourseCover({
  src,
  title,
  className = "",
}: {
  src?: string | null;
  title: string;
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src)
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-sky-950 to-blue-800 p-5 text-center text-white ${className}`}
      >
        <BookOpen className="size-10 opacity-80" aria-hidden="true" />
        <span className="line-clamp-2 text-sm font-semibold sm:text-lg">
          {title}
        </span>
        <span className="text-[12px] tracking-[.2em] opacity-70">
          আরোহণ · LEARN EVERY DAY
        </span>
      </div>
    );
  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      className={`h-full w-full object-cover ${className}`}
      onError={() => setFailed(src)}
    />
  );
}
