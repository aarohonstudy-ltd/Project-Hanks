import katex from "katex";
import "katex/dist/katex.min.css";

// Splits text into plain and math parts: $...$ / \(...\) inline, $$...$$ / \[...\] display.
// A single $ needs non-space just inside both ends, so prices like "$5 and $10" stay text.
const MATH =
  /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$(?!\s)((?:\\.|[^$\\\n])+?)(?<!\s)\$/g;

function render(tex: string, displayMode: boolean) {
  return katex.renderToString(tex, {
    displayMode,
    throwOnError: false,
    trust: false,
    strict: "ignore",
  });
}

// Renders question text, options and explanations, typesetting any LaTeX in them.
export default function MathText({ children }: { children?: string | null }) {
  const text = children ?? "";
  if (!text.includes("$") && !text.includes("\\")) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(MATH)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const display = m[1] ?? m[2];
    const tex = (display ?? m[3] ?? m[4]).trim();
    parts.push(
      <span
        key={m.index}
        dangerouslySetInnerHTML={{ __html: render(tex, display !== undefined) }}
      />,
    );
    last = m.index + m[0].length;
  }
  if (!parts.length) return <>{text}</>;
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
