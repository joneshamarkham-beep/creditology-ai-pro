import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { METHOD_SYSTEM } from "@/lib/methodSystem";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  }

  const body = await req.json();
  const {
    letterType,
    memberName,
    memberAddress,
    account,
    bureaus,
    balance,
    status,
    dofd,
    issues,
    extraDetail,
  } = body || {};

  if (!letterType || !account) {
    return NextResponse.json(
      { error: "Missing item details." },
      { status: 400 }
    );
  }

  const prompt = `Write a complete, personalized ${letterType} letter following the Creditology Method.
Member: ${memberName || "[Member Name]"}
Address: ${memberAddress || "[Member Address]"}
Account: ${account}
Bureau(s) reporting: ${(bureaus || []).join(", ")}
Reported balance: ${balance} | Status: ${status} | DOFD: ${dofd}
Specific issues found: ${(issues || []).join("; ")}
Additional member details: ${extraDetail || "none provided"}
Requirements: factual and firm tone (warm and accountable if goodwill), cite the relevant FCRA/FDCPA right, describe the specific inaccuracy — never generic template language, request the correct remedy (deletion, correction, validation, or block), include placeholders in [brackets] for anything unknown. Output ONLY the letter text.`;

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
        max_tokens: 4096,
        system: METHOD_SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the letter engine. Try again." },
      { status: 502 }
    );
  }

  const data = await anthropicRes.json();

  if (data.error) {
    return NextResponse.json(
      { error: data.error.message || "Letter generation failed." },
      { status: 500 }
    );
  }

  const text = (data.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .trim();

  await supabase.from("usage_logs").insert({
    user_id: user.id,
    input_tokens: data.usage?.input_tokens ?? null,
    output_tokens: data.usage?.output_tokens ?? null,
    purpose: "letter",
  });

  return NextResponse.json({ letter: text });
}
