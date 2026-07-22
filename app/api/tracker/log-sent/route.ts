import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    trackedItemId,
    analysisId,
    account,
    itemType,
    bureaus,
    balance,
    status,
    dofd,
    issues,
    letterType,
  } = body || {};

  let itemId = trackedItemId;

  if (!itemId) {
    if (!account) {
      return NextResponse.json(
        { error: "Missing item details." },
        { status: 400 }
      );
    }
    const { data: newItem, error: itemErr } = await supabase
      .from("tracked_items")
      .insert({
        user_id: user.id,
        analysis_id: analysisId ?? null,
        account,
        item_type: itemType ?? null,
        bureaus: bureaus ?? [],
        balance: balance ?? null,
        status: status ?? null,
        dofd: dofd ?? null,
        issues: issues ?? [],
      })
      .select()
      .single();

    if (itemErr) {
      return NextResponse.json({ error: itemErr.message }, { status: 500 });
    }
    itemId = newItem.id;
  }

  const { count } = await supabase
    .from("tracker_rounds")
    .select("id", { count: "exact", head: true })
    .eq("tracked_item_id", itemId);

  const roundNumber = (count ?? 0) + 1;

  const { data: round, error: roundErr } = await supabase
    .from("tracker_rounds")
    .insert({
      tracked_item_id: itemId,
      user_id: user.id,
      round_number: roundNumber,
      letter_type: letterType ?? "dispute",
      sent_date: new Date().toISOString().slice(0, 10),
      response_type: "pending",
    })
    .select()
    .single();

  if (roundErr) {
    return NextResponse.json({ error: roundErr.message }, { status: 500 });
  }

  return NextResponse.json({ trackedItemId: itemId, round });
}
