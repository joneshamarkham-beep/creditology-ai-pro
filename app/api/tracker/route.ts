import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("tracked_items")
    .select("*, tracker_rounds(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data || []).map((item: any) => ({
    ...item,
    tracker_rounds: (item.tracker_rounds || []).sort(
      (a: any, b: any) => a.round_number - b.round_number
    ),
  }));

  return NextResponse.json({ items });
}
