"use client";
import { useRouter } from "next/navigation";
import type { Options } from "@/lib/admin/types";
import { EditorForm } from "./editor";
import { examDefaults, examFields, validateExam } from "./exam-fields";

export default function NewExamForm({ options }: { options: Options }) {
  const router = useRouter();
  const back = () => router.push("/admin/exams");
  return (
    <EditorForm
      title="পরীক্ষা"
      action="exam_save"
      fields={examFields(options)}
      defaults={examDefaults}
      validate={validateExam}
      exam
      onDone={back}
      onCancel={back}
    />
  );
}
