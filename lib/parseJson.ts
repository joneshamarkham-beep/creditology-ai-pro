// Robust JSON extraction for Claude's analysis responses. Handles markdown
// fences and repairs truncated JSON (e.g. if a response got cut off).
export function parseJson(text: string): any {
  let clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  if (start === -1) throw new Error("No JSON found in analysis");
  clean = clean.slice(start);

  const end = clean.lastIndexOf("}");
  if (end !== -1) {
    try {
      return JSON.parse(clean.slice(0, end + 1));
    } catch {
      // fall through to repair pass
    }
  }

  let s = clean;
  const lastComplete = Math.max(
    s.lastIndexOf("},"),
    s.lastIndexOf('",'),
    s.lastIndexOf("],"),
    s.lastIndexOf("}")
  );
  if (lastComplete > 0) s = s.slice(0, lastComplete + 1);

  let inStr = false;
  let escaped = false;
  const stack: string[] = [];
  for (const ch of s) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    if (ch === "}" || ch === "]") stack.pop();
  }
  if (inStr) s += '"';
  s = s.replace(/,\s*$/, "");
  while (stack.length) s += stack.pop() === "{" ? "}" : "]";
  return JSON.parse(s);
}
