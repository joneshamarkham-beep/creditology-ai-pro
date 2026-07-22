import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { METHOD_SYSTEM } from "@/lib/methodSystem";
import { parseJson } from "@/lib/parseJson";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  }

  const formData = await req.formData();
  const bureausRaw = formData.get("bureaus");
  const bureaus: string[] = bureausRaw ? JSON.parse(String(bureausRaw)) : [];
  const saveReports = formData.get("saveReports") === "true";

  const files: File[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("file_") && value instanceof File) {
      files.push(value);
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "No PDF files received." }, { status: 400 });
  }
  if (files.length > 3) {
    return NextResponse.json(
      { error: "Upload up to 3 reports at a time." },
      { status: 400 }
    );
  }
  for (const file of files) {
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted." },
        { status: 400 }
      );
    }
  }

  const content: any[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buf = Buffer.from(await file.arrayBuffer());
    content.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: buf.toString("base64"),
      },
    });
    const label = bureaus[i] || "credit";
    const description =
      label === "All 3 bureaus (tri-merge)"
        ? "The document above is the member's full tri-merge credit report, containing all three bureaus (Experian, Equifax, and TransUnion) in one file. Read all three bureaus' sections and cross-check accounts between them."
        : `The document above is the member's ${label} report.`;
    content.push({
      type: "text",
      text: description,
    });
  }

  content.push({
    type: "text",
    text: `Analyze the report(s) using the Creditology Method. Cover every account on the report that shows a genuine dispute opportunity under the method — do not artificially limit how many you list. If multiple bureaus were provided, cross-check the same accounts for balance, status, and date-of-first-delinquency differences between them; treat mismatches as strong dispute grounds and name them explicitly in "issues".
Respond with ONLY valid JSON, no preamble, no markdown fences, exactly this shape:
{"summary":"plain-English overview of this credit picture, 2-3 sentences","items":[{"id":"1","account":"name/partial number","itemType":"collection|charge-off|late payments|inquiry|identity theft|other","bureaus":["Experian"],"balance":"as reported","status":"as reported","dofd":"as reported or unknown","issues":["specific inaccuracy or inconsistency found"],"priority":3,"letterType":"dispute|debt validation|goodwill|1681c-2 block|method of verification","why":"strategy reason, one sentence"}],"plan":["next move, one sentence","next move","next move"]}
Include every item with genuine dispute grounds under the Creditology Method. If an item looks accurate with no dispute grounds, leave it out.`,
  });

  let anthropicRes: Response;
  try {
    anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 8192,
        system: METHOD_SYSTEM,
        messages: [{ role: "user", content }],
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the analysis engine. Try again." },
      { status: 502 }
    );
  }

  const data = await anthropicRes.json();

  if (data.error) {
    return NextResponse.json(
      { error: data.error.message || "Analysis failed." },
      { status: 500 }
    );
  }

  const text = (data.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  let parsed: any;
  try {
    parsed = parseJson(text);
  } catch {
    return NextResponse.json(
      { error: "The analysis came back incomplete. Try again." },
      { status: 500 }
    );
  }

  // Cost visibility: log token usage for this member/call.
  await supabase.from("usage_logs").insert({
    user_id: user.id,
    input_tokens: data.usage?.input_tokens ?? null,
    output_tokens: data.usage?.output_tokens ?? null,
    purpose: "analysis",
  });

  // Save the analysis so it's available later for letters / round tracker.
  const { data: saved } = await supabase
    .from("analyses")
    .insert({
      user_id: user.id,
      summary: parsed.summary,
      items: parsed.items,
      plan: parsed.plan,
      bureaus,
    })
    .select()
    .single();

  // Reports are NOT stored anywhere by default. Only if the member opted in
  // do we keep the original PDFs, in their own private storage folder.
  if (saveReports) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buf = Buffer.from(await file.arrayBuffer());
      const path = `${user.id}/${Date.now()}-${bureaus[i] || "report"}-${i}.pdf`;
      await supabase.storage.from("reports").upload(path, buf, {
        contentType: "application/pdf",
      });
    }
  }

  return NextResponse.json({ analysis: parsed, id: saved?.id ?? null });
}
