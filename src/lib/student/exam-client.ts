export type DraftAnswer = { index: number; revision: number };
export type FocusEvent = {
  id: string;
  kind: "hidden" | "blur" | "fullscreen_exit" | "pagehide";
};
export type ExamSync = {
  status: string;
  reason?: string;
  warnings: number;
  deadline: string;
  serverNow: string;
  revisions: Record<string, number>;
  answers?: Record<string, number>;
};
// One physical departure can produce blur, visibility and fullscreen events.
export class FocusEpisode {
  away = false;
  leave() {
    if (this.away) return false;
    this.away = true;
    return true;
  }
  returnToExam() {
    this.away = false;
  }
}
export function mergeDrafts(
  answers: Record<string, number>,
  revisions: Record<string, number>,
  cached: Record<string, DraftAnswer>,
  allowed: Set<string>,
  lockSaved = false,
) {
  const result: Record<string, DraftAnswer> = {};
  for (const [id, index] of Object.entries(answers))
    result[id] = { index, revision: revisions[id] ?? 0 };
  for (const [id, value] of Object.entries(cached))
    if (
      value &&
      typeof value === "object" &&
      allowed.has(id) &&
      !(lockSaved && Object.hasOwn(answers, id)) &&
      Number.isInteger(value.index) &&
      value.index >= 0 &&
      Number.isSafeInteger(value.revision) &&
      value.revision > (revisions[id] ?? 0)
    )
      result[id] = value;
  return result;
}
