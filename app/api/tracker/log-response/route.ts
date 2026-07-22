import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeNextMove } from "@/lib/tracker";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  }

  const body = await req.json();
  const { roundId, responseType, responseDate, notes } = body || {};

  if (!roundId || !responseType) {
    return NextResponse.json(
      { error: "Missing round details." },
      { status: 400 }
    );
  }

  const { data: updated, error } = await supabase
    .from("tracker_rounds")
    .update({
      response_type: responseType,
      response_date: responseDate || new Date().toISOString().slice(0, 10),
      notes: notes || null,
    })
    .eq("id", roundId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const move = computeNextMove(updated.letter_type, responseType);

  return NextResponse.json({ round: updated, nextMove: move });
}
