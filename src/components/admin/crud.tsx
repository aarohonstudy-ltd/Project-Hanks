"use client";
import type { ReactNode } from "react";
import { useState } from "react";
import { Plus, Pencil, LockKeyhole, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Field, Row, AdminData } from "@/lib/admin/types";
import DataTable from "./table";
import Editor from "./editor";
import StatusButton, { isArchived } from "./status-button";
import DeleteButton from "./delete-button";
import type { StatusEntity } from "@/lib/admin/actions";
export default function Crud({
  title,
  action,
  data,
  fields,
  columns,
  defaults,
  hint,
  exam,
  question,
  extraActions,
  entity,
  lockedReason,
}: {
  title: string;
  action: string;
  data: AdminData;
  fields: Field[];
  columns: Parameters<typeof DataTable>[0]["columns"];
  defaults?: Record<string, unknown>;
  hint: string;
  exam?: boolean;
  question?: boolean;
  extraActions?: (row: Row) => ReactNode;
  // Adds an archive/restore button to every row.
  entity?: StatusEntity;
  // Shown on locked rows, which can be copied into a new row instead.
  lockedReason?: string;
}) {
  const [editing, setEditing] = useState<Row | null | undefined>(undefined);
  const [copying, setCopying] = useState(false);
  return (
    <>
      <div className="ad-toolbar">
        <p>{hint}</p>
        <Button
          onClick={() => {
            setCopying(false);
            setEditing(null);
          }}
        >
          <Plus size={16} /> নতুন {title}
        </Button>
      </div>
      {lockedReason && data.rows.some((row) => row.locked) && (
        <p className="ad-lock-note">
          <LockKeyhole size={14} /> {lockedReason}
        </p>
      )}
      <DataTable
        rows={data.rows}
        columns={columns}
        actions={(row) => (
          <div className="flex flex-wrap gap-2">
            {row.locked ? (
              <>
                <span className="ad-locked" title={lockedReason}>
                  <LockKeyhole size={14} /> লক করা
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  title="একই তথ্য দিয়ে নতুন একটি তৈরি করুন"
                  onClick={() => {
                    setCopying(true);
                    setEditing(row);
                  }}
                >
                  <Copy size={14} /> কপি করে নতুন
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCopying(false);
                  setEditing(row);
                }}
              >
                <Pencil size={14} /> সম্পাদনা
              </Button>
            )}
            {extraActions?.(row)}
            {entity && <StatusButton entity={entity} row={row} />}
            {entity && isArchived(entity, row) && (
              <DeleteButton entity={entity} row={row} />
            )}
          </div>
        )}
      />
      {editing !== undefined && (
        <Editor
          title={title}
          action={action}
          fields={fields}
          defaults={defaults}
          row={editing ?? undefined}
          onClose={() => setEditing(undefined)}
          exam={exam}
          question={question}
          copy={copying}
        />
      )}
    </>
  );
}
