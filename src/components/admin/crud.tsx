"use client";
import { useState } from "react";
import { Plus, Pencil, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Field, Row, AdminData } from "@/lib/admin/types";
import DataTable from "./table";
import Editor from "./editor";
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
}) {
  const [editing, setEditing] = useState<Row | null | undefined>(undefined);
  return (
    <>
      <div className="ad-toolbar">
        <p>{hint}</p>
        <Button onClick={() => setEditing(null)}>
          <Plus size={16} /> নতুন {title}
        </Button>
      </div>
      <DataTable
        rows={data.rows}
        columns={columns}
        actions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            disabled={Boolean(row.locked)}
            onClick={() => setEditing(row)}
          >
            {row.locked ? (
              <>
                <LockKeyhole size={14} /> লক করা
              </>
            ) : (
              <>
                <Pencil size={14} /> সম্পাদনা
              </>
            )}
          </Button>
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
        />
      )}
    </>
  );
}
