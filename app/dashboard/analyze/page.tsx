"use client";

import { useState } from "react";
import Link from "next/link";

const BUREAUS = ["Experian", "Equifax", "TransUnion"];

const PRIORITY_LABELS: Record<number, string> = {
  1: "Identity theft — §1681c-2 block",
  2: "Obsolete — past 7-year window",
  3: "Collection with errors",
  4: "Charge-off with errors",
  5: "Goodwill candidate",
  6: "Unauthorized inquiry",
};

type UploadItem = { file: File; bureau: string };

export default function AnalyzePage() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [saveReports, setSaveReports] = useState(false);
  const [screen, setScreen] = useState<"upload" | "analyzing" | "results">(
    "upload"
  );
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState("");

  const addFiles = (fileList: FileList) => {
    setError("");
    const next = [...uploads];
    for (const f of Array.from(fileList)) {
      if (f.type !== "application/pdf") {
        setError("Upload PDF reports only.");
        continue;
      }
      if (next.length >= 3) break;
      next.push({ file: f, bureau: BUREAUS[next.length % 3] });
    }
    setUploads(next.slice(0, 3));
  };

  const analyze = async () => {
    setScreen("analyzing");
    setError("");
    try {
      const formData = new FormData();
      formData.append("bureaus", JSON.stringify(uploads.map((u) => u.bureau)));
      formData.append("saveReports", String(saveReports));
      uploads.forEach((u, i) => formData.append(`file_${i}`, u.file));

      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Analysis failed.");

      setAnalysis(data.analysis);
      setScreen("results");
    } catch (e: any) {
      setError(e.message || "Analysis failed. Try again.");
      setScreen("upload");
    }
  };

  return (
    <main className="max-w-[780px] mx-auto px-5 pt-10 pb-16">
      <header className="flex justify-between items-start mb-8 gap-3">
        <div>
          <div className="text-[11px] tracking-[0.35em] text-gold font-bold">
            CREDITOLOGY
          </div>
          <h1 className="font-display text-[28px] mt-1">
            Run the Creditology Method
          </h1>
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

      {screen === "upload" && (
        <div>
          <div className="border border-dashed border-line rounded-2xl p-8 text-center bg-panel">
            <div className="font-display text-[20px] mb-2">
              Drop your credit report PDFs here
            </div>
            <div className="text-creamDim text-sm mb-4">
              Upload 1 to 3 reports — tag each one by bureau below.
            </div>
            <label className="inline-block bg-terracotta text-[#1A0F09] font-bold rounded-lg px-5 py-3 text-sm cursor-pointer">
              Choose PDF files
              <input
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
            </label>
          </div>

          {uploads.length > 0 && (
            <div className="mt-5">
              {uploads.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-panel border border-line rounded-lg px-4 py-3 mt-2"
                >
                  <div className="text-cream text-sm flex-1 truncate">
                    {u.file.name}
                  </div>
                  <select
                    value={u.bureau}
                    onChange={(e) =>
                      setUploads(
                        uploads.map((x, j) =>
                          j === i ? { ...x, bureau: e.target.value } : x
                        )
                      )
                    }
                    className="bg-panelSoft border border-line rounded text-cream text-sm px-2 py-1"
                  >
                    {BUREAUS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setUploads(uploads.filter((_, j) => j !== i))}
                    className="text-creamDim text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <label className="flex items-center gap-2 text-creamDim text-sm mt-4">
                <input
                  type="checkbox"
                  checked={saveReports}
                  onChange={(e) => setSaveReports(e.target.checked)}
                />
                Save my uploaded reports so I can revisit them later
                (otherwise they&apos;re deleted right after this analysis)
              </label>

              <button
                onClick={analyze}
                className="w-full bg-terracotta text-[#1A0F09] font-bold rounded-lg px-4 py-3 text-base mt-4"
              >
                Run the Creditology Method →
              </button>
            </div>
          )}
        </div>
      )}

      {screen === "analyzing" && (
        <div className="text-center py-20">
          <div className="font-display text-[24px] text-gold mb-3">
            Reading your report{uploads.length > 1 ? "s" : ""}…
          </div>
          <div className="text-creamDim text-sm max-w-[420px] mx-auto leading-relaxed">
            Extracting every account, checking dates of first delinquency,
            hunting cross-bureau inconsistencies, and building your dispute
            sequence. A full report can take a minute or two — don&apos;t
            close this tab.
          </div>
        </div>
      )}

      {screen === "results" && analysis && (
        <div>
          <div className="bg-panel border border-line rounded-2xl p-6">
            <div className="text-[10px] tracking-[0.3em] text-gold font-bold mb-2">
              THE PICTURE
            </div>
            <div className="text-cream text-[15px] leading-relaxed">
              {analysis.summary}
            </div>
          </div>

          <div className="text-[10px] tracking-[0.3em] text-gold font-bold mt-7 mb-2">
            YOUR DISPUTE SEQUENCE — IN ORDER
          </div>

          {[...(analysis.items || [])]
            .sort((a: any, b: any) => (a.priority || 9) - (b.priority || 9))
            .map((item: any, idx: number) => (
              <div
                key={item.id || idx}
                className="bg-panel border border-line border-l-[3px] border-l-terracotta rounded-xl p-4 mt-3"
              >
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-display italic text-gold text-xl">
                    {idx + 1}
                  </span>
                  <span className="font-display text-cream text-lg">
                    {item.account}
                  </span>
                  <span className="bg-panelSoft border border-line text-goldSoft text-xs rounded-full px-3 py-1">
                    {PRIORITY_LABELS[item.priority] || item.itemType}
                  </span>
                </div>
                <div className="text-creamDim text-xs mt-2">
                  {(item.bureaus || []).join(" · ")} — Balance {item.balance} —
                  Status {item.status} — DOFD {item.dofd}
                </div>
                {(item.issues || []).map((iss: string, i: number) => (
                  <div key={i} className="text-terracottaSoft text-xs mt-1">
                    ⚑ {iss}
                  </div>
                ))}
                <div className="text-creamDim text-xs mt-2 italic">
                  {item.why}
                </div>
              </div>
            ))}

          {analysis.plan?.length > 0 && (
            <div className="bg-panel border border-line rounded-2xl p-6 mt-6">
              <div className="text-[10px] tracking-[0.3em] text-gold font-bold mb-2">
                YOUR NEXT MOVES
              </div>
              {analysis.plan.map((step: string, i: number) => (
                <div key={i} className="flex gap-3 mt-2">
                  <span className="font-display text-gold">{i + 1}.</span>
                  <span className="text-cream text-sm leading-relaxed">
                    {step}
                  </span>
                </div>
              ))}
              <div className="text-creamDim text-xs mt-4 border-t border-line pt-3">
                Results take rounds — 30 to 45 days per dispute cycle is
                normal. No guarantees on scores or timelines; this is
                education, not legal advice. Stuck case? Bring it to the
                monthly live Cleanup Session.
              </div>
            </div>
          )}

          <div className="text-creamDim text-xs mt-8 text-center">
            Letter writing and identity theft screening for each item are
            coming in the next update.
          </div>
        </div>
      )}
    </main>
  );
}
