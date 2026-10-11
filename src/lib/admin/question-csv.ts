export type ImportQuestion = {
  id: string;
  q: string;
  opts: string[];
  correct: number;
  exp: string;
  topic: string;
  subject: string;
  course: string;
  created_at: string;
  is_master: boolean;
};
export type CsvPreview = {
  rows: ImportQuestion[];
  errors: string[];
  total: number;
  courses: { name: string; count: number }[];
};

// RFC 4180-style CSV: quoted commas/newlines, doubled quotes, CRLF and UTF-8 BOM.
export function parseCsv(text: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false,
    closed = false;
  text = text.replace(/^\uFEFF/, "");
  const finishRow = () => {
    row.push(cell);
    if (row.some((v) => v.trim())) records.push(row);
    row = [];
    cell = "";
    closed = false;
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += char;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
      closed = false;
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      finishRow();
    } else if (char === '"' && cell === "" && !closed) quoted = true;
    else if (closed || char === '"')
      throw Error(`CSV record ${records.length + 1}: quotation mark ঠিক নেই।`);
    else cell += char;
    if (records.length > 10001 || row.length > 50 || cell.length > 100000)
      throw Error("CSV খুব বড়। সর্বোচ্চ 10,000 প্রশ্নের ফাইল দিন।");
  }
  if (quoted) throw Error("CSV-তে একটি quotation mark বন্ধ করা হয়নি।");
  if (cell || row.length || closed) finishRow();
  return records;
}

export function previewQuestionCsv(text: string): CsvPreview {
  const records = parseCsv(text),
    headers = records.shift()?.map((x) => x.trim()) ?? [];
  const required = [
    "id",
    "q",
    "opts",
    "correct",
    "exp",
    "topic",
    "subject",
    "course",
    "created_at",
    "is_master",
  ];
  const missing = required.filter((h) => !headers.includes(h));
  if (missing.length || new Set(headers).size !== headers.length)
    throw Error(`CSV header ঠিক করুন। প্রয়োজন: ${required.join(", ")}`);
  if (!records.length || records.length > 10000)
    throw Error("CSV-তে 1 থেকে 10,000টি প্রশ্ন থাকতে হবে।");
  const rows: ImportQuestion[] = [],
    errors: string[] = [],
    ids = new Set<string>(),
    courses = new Map<string, number>();
  for (const [index, values] of records.entries()) {
    try {
      if (values.length !== headers.length)
        throw Error("কলামের সংখ্যা মেলেনি।");
      const raw = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
      const id = raw.id.trim().toLowerCase();
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
          id,
        )
      )
        throw Error("সঠিক UUID id দিন।");
      if (ids.has(id)) throw Error("একই id একাধিকবার আছে।");
      ids.add(id);
      const opts: unknown = JSON.parse(raw.opts);
      if (
        !Array.isArray(opts) ||
        opts.length < 2 ||
        opts.length > 8 ||
        opts.some((x) => typeof x !== "string" || !x.trim() || x.length > 2000)
      )
        throw Error("opts-এ 2–8টি non-empty JSON string লাগবে।");
      if (!/^\d+$/.test(raw.correct.trim()))
        throw Error("correct-এ 0 থেকে শুরু হওয়া পূর্ণসংখ্যা দিন।");
      const correct = Number(raw.correct);
      if (correct >= opts.length)
        throw Error("সঠিক উত্তরের index অপশনের বাইরে।");
      for (const [key, max] of [
        ["q", 10000],
        ["topic", 1000],
        ["subject", 300],
        ["course", 300],
      ] as const)
        if (!raw[key].trim() || raw[key].length > max)
          throw Error(`${key} খালি বা অতিরিক্ত বড়।`);
      if (raw.exp.length > 20000) throw Error("ব্যাখ্যা অতিরিক্ত বড়।");
      if (!/^(true|false)$/i.test(raw.is_master.trim()))
        throw Error("is_master-এ true বা false দিন।");
      if (!raw.created_at.trim() || Number.isNaN(Date.parse(raw.created_at)))
        throw Error("created_at তারিখ ঠিক নেই।");
      const course = raw.course.trim();
      rows.push({
        id,
        q: raw.q,
        opts: opts as string[],
        correct,
        exp: raw.exp,
        topic: raw.topic.trim(),
        subject: raw.subject.trim(),
        course,
        created_at: raw.created_at,
        is_master: raw.is_master.trim().toLowerCase() === "true",
      });
      courses.set(course, (courses.get(course) ?? 0) + 1);
    } catch (e) {
      errors.push(
        `Record ${index + 2}: ${e instanceof Error ? e.message : "ডেটা ঠিক নেই।"}`,
      );
    }
  }
  return {
    rows,
    errors,
    total: records.length,
    courses: [...courses].map(([name, count]) => ({ name, count })),
  };
}

// Bounded by bytes as well as row count to stay below Next's 1 MB action limit.
export function importBatches(rows: ImportQuestion[]): ImportQuestion[][] {
  const batches: ImportQuestion[][] = [];
  let batch: ImportQuestion[] = [],
    bytes = 2;
  const encoder = new TextEncoder();
  for (const row of rows) {
    const size = encoder.encode(JSON.stringify(row)).length + 1;
    if (batch.length && (batch.length === 100 || bytes + size > 300000)) {
      batches.push(batch);
      batch = [];
      bytes = 2;
    }
    batch.push(row);
    bytes += size;
  }
  if (batch.length) batches.push(batch);
  return batches;
}
