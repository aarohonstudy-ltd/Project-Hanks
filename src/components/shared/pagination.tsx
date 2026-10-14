import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";

const bn = (n: number) => n.toLocaleString("bn-BD");

// Pages to show: first, last, and a window around the current page, with gaps as "…".
export function pageItems(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  let start = Math.max(2, Math.min(page - 1, pages - 4));
  let end = Math.min(pages - 1, Math.max(page + 1, 5));
  // Never hide a single page behind "…".
  if (start === 3) start = 2;
  if (end === pages - 2) end = pages - 1;
  const items: (number | "gap")[] = [1];
  if (start > 2) items.push("gap");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < pages - 1) items.push("gap");
  items.push(pages);
  return items;
}

const base =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border px-2.5 text-sm font-medium transition-colors";
const idle = "border-border bg-background hover:bg-muted";
const current = "border-primary bg-primary text-primary-foreground";
const off = "pointer-events-none opacity-40";

export default function Pagination({
  page,
  total,
  pageSize,
  unit = "টি",
  href,
  onChange,
  disabled = false,
  className,
}: {
  page: number;
  total: number;
  pageSize: number;
  // Suffix after the total, e.g. "টি প্রশ্ন" or " জন".
  unit?: string;
  // Link-based (server pages) or callback-based (client lists).
  href?: (page: number) => string;
  onChange?: (page: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  function control(
    target: number,
    content: React.ReactNode,
    extra: string,
    label: string,
    active = false,
  ) {
    const blocked = disabled || target < 1 || target > pages;
    const classes = cn(
      base,
      active ? current : idle,
      blocked && !active && off,
      extra,
    );
    if (active)
      return (
        <span aria-current="page" className={classes}>
          {content}
        </span>
      );
    if (href && !blocked)
      return (
        <Link href={href(target)} aria-label={label} className={classes}>
          {content}
        </Link>
      );
    return (
      <button
        type="button"
        aria-label={label}
        disabled={blocked}
        className={classes}
        onClick={() => onChange?.(target)}
      >
        {content}
      </button>
    );
  }
  return (
    <nav
      aria-label="পৃষ্ঠা নির্বাচন"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 py-4 text-sm",
        className,
      )}
    >
      <span className="text-muted-foreground">
        {total
          ? `${bn(from)}–${bn(to)} · মোট ${bn(total)}${unit}`
          : `মোট ০${unit}`}
      </span>
      {pages > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {control(
            page - 1,
            <>
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">আগের</span>
            </>,
            "",
            "আগের পৃষ্ঠা",
          )}
          {pageItems(page, pages).map((item, i) =>
            item === "gap" ? (
              <span
                key={`gap-${i}`}
                aria-hidden
                className="px-1 text-muted-foreground"
              >
                …
              </span>
            ) : (
              <span key={item}>
                {control(
                  item,
                  bn(item),
                  "",
                  `পৃষ্ঠা ${bn(item)}`,
                  item === page,
                )}
              </span>
            ),
          )}
          {control(
            page + 1,
            <>
              <span className="hidden sm:inline">পরের</span>
              <ChevronRight className="size-4" />
            </>,
            "",
            "পরের পৃষ্ঠা",
          )}
        </div>
      )}
    </nav>
  );
}
