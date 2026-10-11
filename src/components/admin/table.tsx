import type { ReactNode } from "react";
import type { Row } from "@/lib/admin/types";
export function Badge({ value }: { value: unknown }) {
  return (
    <span className="ad-badge" data-status={String(value ?? "")}>
      {String(value ?? "—")}
    </span>
  );
}
export function text(value: unknown) {
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
}
export function date(value: unknown) {
  return value
    ? new Date(String(value)).toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",
      })
    : "—";
}
export default function DataTable({
  rows,
  columns,
  actions,
}: {
  rows: Row[];
  columns: { label: string; key: string; render?: (row: Row) => ReactNode }[];
  actions?: (row: Row) => ReactNode;
}) {
  if (!rows.length)
    return (
      <div className="ad-table-wrap ad-empty">
        কোনো তথ্য পাওয়া যায়নি। নতুন তথ্য যোগ করুন অথবা সার্চ পরিবর্তন করুন।
      </div>
    );
  return (
    <div className="ad-table-wrap">
      <table className="ad-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            {actions && <th>অ্যাকশন</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render ? c.render(row) : text(row[c.key])}
                </td>
              ))}
              {actions && <td>{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
