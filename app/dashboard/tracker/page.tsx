"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { computeNextMove } from "@/lib/tracker";

const RESPONSE_OPTIONS = [
  { value: "deleted", label: "Deleted / removed" },
  { value: "updated", label: "Updated / corrected" },
  { value: "verified", label: "Verified / remains as reported" },
  { value: "no_response", label: "No response after 30 days" },
];

const RESPONSE_LABEL: Record<string, string> = {
  deleted: "Deleted / removed",
  updated: "Updated / corrected",
  verified: "Verified / remains as reported",
  no_response: "No response after 30 days",
};

export default function TrackerPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [busyRoundId, setBusyRoundId] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tracker");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load your tracker.");
      setItems(data.items || []);
    } catch (e: any) {
      setError(e.message || "Couldn't load your tracker.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveResponse = async (roundId: string) => {
    const draft = drafts[roundId] || {};
    if (!draft.responseType) return;
    setBusyRoundId(roundId);
    setError("");
    try {
      const res = await fetch("/api/tracker/log-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId,
          responseType: draft.responseType,
          responseDate: draft.responseDate,
          notes: draft.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save that response.");
      await load();
    } catch (e: any) {
      setError(e.message || "Couldn't save that response.");
    }
    setBusyRoundId(null);
  };

  const startNextRound = async (item: any, letterType: string) => {
    setBusyItemId(item.id);
    setError("");
    try {
      const res = await fetch("/api/tracker/log-sent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackedItemId: item.id, letterType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't start the next round.");
      await load();
    } catch (e: any) {
      setError(e.message || "Couldn't start the next round.");
    }
    setBusyItemId(null);
  };

  return (
    <main className="max-w-[780px] mx-auto px-5 pt-10 pb-16">
      <header className="flex justify-between items-start mb-8 gap-3">
        <div>
          <div className="text-[11px] tracking-[0.35em] text-gold font-bold">
            CREDITOLOGY
          </div>
          <h1 className="font-display text-[28px] mt-1">Round Tracker</h1>
        </div>
        <Link
          href="/dashboard"
          className="border border-line text-gold rounded-lg px-4 py-2 text-sm"
        >
          Back
        </Link>
      </header>

      {error && (
        <div className="bg-[#3A211C] border border-danger text-[#F0BDB4] text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-creamDim text-sm text-center py-10">Loading…</div>
      )}

      {!loading && items.length === 0 && (
        <div className="bg-panel border border-line rounded-2xl p-6 text-center">
          <div className="text-cream text-[15px] leading-relaxed mb-3">
            Nothing tracked yet. Generate a letter for an item and log it as
            sent, and it&apos;ll show up here.
          </div>
          <Link
            href="/dashboard/analyze"
            className="inline-block bg-terracotta text-[#1A0F09] font-bold rounded-lg px-5 py-3 text-sm"
          >
            Analyze a report
          </Link>
        </div>
      )}

      {items.map((item) => {
        const rounds = item.tracker_rounds || [];
        const latest = rounds[rounds.length - 1];
        const draft = latest ? drafts[latest.id] || {} : {};
        const move =
          latest && latest.response_type !== "pending"
            ? computeNextMove(latest.letter_type, latest.response_type)
            : null;

        return (
          <div
            key={item.id}
            className="bg-panel border border-line border-l-[3px] border-l-terracotta rounded-xl p-4 mt-4"
          >
            <div className="font-display text-cream text-lg">{item.account}</div>
            <div className="text-creamDim text-xs mt-1">
              {(item.bureaus || []).join(" · ")} — Balance {item.balance} —
              Status {item.status}
            </div>

            <div className="mt-3">
              {rounds.map((r: any) => (
                <div
                  key={r.id}
                  className="text-creamDim text-xs border-t border-line pt-2 mt-2 leading-relaxed"
                >
                  <span className="text-goldSoft font-semibold">
                    Round {r.round_number}
                  </span>{" "}
                  — sent {r.sent_date} as a {r.letter_type} letter.{" "}
                  {r.response_type !== "pending" && (
                    <>
                      Response: {RESPONSE_LABEL[r.response_type] || r.response_type}
                      {r.response_date ? ` on ${r.response_date}` : ""}.
                      {r.notes ? ` "${r.notes}"` : ""}
                    </>
                  )}
                </div>
              ))}
            </div>

            {latest && latest.response_type === "pending" && (
              <div className="bg-panelSoft border border-line rounded-lg p-4 mt-3">
                <div className="text-gold text-[11px] tracking-[0.25em] font-bold mb-3">
                  LOG THE RESPONSE
                </div>
                <select
                  value={draft.responseType || ""}
                  onChange={(e) =>
                    setDrafts({
                      ...drafts,
                      [latest.id]: { ...draft, responseType: e.target.value },
                    })
                  }
                  className="w-full bg-panelSoft border border-line rounded text-cream text-sm px-3 py-2 mb-2"
                >
                  <option value="">What did the bureau say?</option>
                  {RESPONSE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={draft.responseDate || ""}
                  onChange={(e) =>
                    setDrafts({
                      ...drafts,
                      [latest.id]: { ...draft, responseDate: e.target.value },
                    })
                  }
                  className="w-full bg-panelSoft border border-line rounded text-cream text-sm px-3 py-2 mb-2"
                />
                <textarea
                  placeholder="Notes (optional)"
                  value={draft.notes || ""}
                  onChange={(e) =>
                    setDrafts({
                      ...drafts,
                      [latest.id]: { ...draft, notes: e.target.value },
                    })
                  }
                  className="w-full bg-panelSoft border border-line rounded text-cream placeholder-creamDim text-sm px-3 py-2 mb-3 min-h-[60px]"
                />
                <button
                  disabled={!draft.responseType || busyRoundId === latest.id}
                  onClick={() => saveResponse(latest.id)}
                  className="bg-terracotta text-[#1A0F09] font-bold rounded-lg px-4 py-2 text-xs disabled:opacity-50"
                >
                  {busyRoundId === latest.id ? "Saving…" : "Save response"}
                </button>
              </div>
            )}

            {move && (
              <div className="bg-panelSoft border border-line rounded-lg p-4 mt-3">
                <div className="text-goldSoft text-xs font-bold mb-1">
                  {move.nextLetterType ? "Your next move" : "Resolved"}
                </div>
                <div className="text-creamDim text-xs leading-relaxed">
                  {move.advice}
                </div>
                {move.nextLetterType && (
                  <button
                    disabled={busyItemId === item.id}
                    onClick={() => startNextRound(item, move.nextLetterType!)}
                    className="bg-terracotta text-[#1A0F09] font-bold rounded-lg px-4 py-2 text-xs mt-3 disabled:opacity-50"
                  >
                    {busyItemId === item.id
                      ? "Starting…"
                      : `Start round ${rounds.length + 1}`}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="text-creamDim text-xs mt-8 text-center">
        Results take rounds — 30 to 45 days per cycle is normal. This is
        education, not legal advice. Stuck case? Bring it to the monthly
        live Cleanup Session.
      </div>
    </main>
  );
}
