"use client";

import { useState } from "react";
import Link from "next/link";
import { ID_QUESTIONS, ANSWER_OPTIONS, screenVerdict, Verdict } from "@/lib/screening";

const BUREAUS = [
  "All 3 bureaus (tri-merge)",
  "Experian",
  "Equifax",
  "TransUnion",
];

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
  const [screen, setScreen] = useState<
    "upload" | "analyzing" | "results" | "letter"
  >("upload");
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Identity theft screening
  const [screeningId, setScreeningId] = useState<string | null>(null);
  const [screenAnswers, setScreenAnswers] = useState<Record<string, string>>({});
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});

  // Letter writing
  const [activeItem, setActiveItem] = useState<any>(null);
  const [memberName, setMemberName] = useState("");
  const [memberAddress, setMemberAddress] = useState("");
  const [extraDetail, setExtraDetail] = useState("");
  const [letter, setLetter] = useState("");
  const [letterLoading, setLetterLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loggedTrackedItemId, setLoggedTrackedItemId] = useState<string | null>(null);
  const [loggingTracker, setLoggingTracker] = useState(false);

  const addFiles = (fileList: FileList) => {
    setError("");
    const next = [...uploads];
    for (const f of Array.from(fileList)) {
      if (f.type !== "application/pdf") {
        setError("Upload PDF reports only.");
        continue;
      }
      if (next.length >= 3) break;
      // Most members upload one MyFreeScoreNow tri-merge PDF (all three
      // bureaus in one file), so default to that unless they add more files.
      const bureau = next.length === 0 ? BUREAUS[0] : BUREAUS[1 + (next.length % 3)];
      next.push({ file: f, bureau });
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
      setAnalysisId(data.id);
      setScreen("results");
    } catch (e: any) {
      setError(e.message || "Analysis failed. Try again.");
      setScreen("upload");
    }
  };

  const runScreen = (item: any) => {
    const v = screenVerdict(screenAnswers);
    setVerdicts({ ...verdicts, [item.id]: v });
    setAnalysis({
      ...analysis,
      items: analysis.items.map((x: any) =>
        x.id === item.id
          ? {
              ...x,
              letterType: v.letterType,
              priority: v.level === "fraud" ? 1 : x.priority,
            }
          : x
      ),
    });
    setScreeningId(null);
    setScreenAnswers({});
  };

  const openLetter = (item: any) => {
    setActiveItem(item);
    setLetter("");
    setError("");
    setLoggedTrackedItemId(null);
    setScreen("letter");
  };

  const logToTracker = async () => {
    if (!activeItem) return;
    setLoggingTracker(true);
    setError("");
    try {
      const res = await fetch("/api/tracker/log-sent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          account: activeItem.account,
          itemType: activeItem.itemType,
          bureaus: activeItem.bureaus,
          balance: activeItem.balance,
          status: activeItem.status,
          dofd: activeItem.dofd,
          issues: activeItem.issues,
          letterType: activeItem.letterType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't log that to your tracker.");
      setLoggedTrackedItemId(data.trackedItemId);
    } catch (e: any) {
      setError(e.message || "Couldn't log that to your tracker.");
    }
    setLoggingTracker(false);
  };

  const generateLetter = async () => {
    if (!activeItem) return;
    setLetterLoading(true);
    setLetter("");
    setCopied(false);
    setError("");
    try {
      const res = await fetch("/api/letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letterType: activeItem.letterType,
          memberName,
          memberAddress,
          account: activeItem.account,
          bureaus: activeItem.bureaus,
          balance: activeItem.balance,
          status: activeItem.status,
          dofd: activeItem.dofd,
          issues: activeItem.issues,
          extraDetail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Letter generation failed.");
      setLetter(data.letter);
    } catch (e: any) {
      setError(e.message || "Letter generation failed. Try again.");
    }
    setLetterLoading(false);
  };

  const copyLetter = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
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
          href={screen === "letter" ? "#" : "/dashboard"}
          onClick={(e) => {
            if (screen === "letter") {
              e.preventDefault();
              setScreen("results");
            }
          }}
          className="border border-line text-gold rounded-lg px-4 py-2 text-sm"
        >
          {screen === "letter" ? "Back to your sequence" : "Back"}
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
              Drop your credit report PDF here
            </div>
            <div className="text-creamDim text-sm mb-4">
              Upload your MyFreeScoreNow tri-merge (all three bureaus in one
              PDF) — that&apos;s the normal case. Uploading separate reports
              from each bureau instead also works, just tag each one below.
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

                {verdicts[item.id] && (
                  <div
                    className={`bg-panelSoft border rounded-lg px-4 py-3 mt-3 ${
                      verdicts[item.id].level === "fraud"
                        ? "border-terracotta"
                        : "border-line"
                    }`}
                  >
                    <div
                      className={`text-xs font-bold mb-1 ${
                        verdicts[item.id].level === "fraud"
                          ? "text-terracottaSoft"
                          : "text-goldSoft"
                      }`}
                    >
                      {verdicts[item.id].title}
                    </div>
                    <div className="text-creamDim text-xs leading-relaxed">
                      {verdicts[item.id].advice}
                    </div>
                  </div>
                )}

                {screeningId === item.id ? (
                  <div className="bg-panelSoft border border-line rounded-lg p-4 mt-3">
                    <div className="text-gold text-[11px] tracking-[0.25em] font-bold mb-3">
                      DO YOU RECOGNIZE THIS ACCOUNT?
                    </div>
                    {ID_QUESTIONS.map((qq) => (
                      <div key={qq.id} className="mb-3">
                        <div className="text-cream text-xs mb-1.5 leading-snug">
                          {qq.q}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {ANSWER_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              onClick={() =>
                                setScreenAnswers({ ...screenAnswers, [qq.id]: opt })
                              }
                              className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                                screenAnswers[qq.id] === opt
                                  ? "bg-terracotta text-[#1A0F09] border-terracotta"
                                  : "bg-transparent text-creamDim border-line"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <button
                        disabled={
                          Object.keys(screenAnswers).length < ID_QUESTIONS.length
                        }
                        onClick={() => runScreen(item)}
                        className="bg-terracotta text-[#1A0F09] font-bold rounded-lg px-4 py-2 text-xs disabled:opacity-50"
                      >
                        Get my verdict
                      </button>
                      <button
                        onClick={() => {
                          setScreeningId(null);
                          setScreenAnswers({});
                        }}
                        className="border border-line text-gold rounded-lg px-4 py-2 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap mt-3">
                    <button
                      onClick={() => openLetter(item)}
                      className="bg-terracotta text-[#1A0F09] font-bold rounded-lg px-4 py-2 text-xs"
                    >
                      Write the {item.letterType} letter
                    </button>
                    <button
                      onClick={() => {
                        setScreeningId(item.id);
                        setScreenAnswers({});
                      }}
                      className="border border-line text-gold rounded-lg px-4 py-2 text-xs"
                    >
                      {verdicts[item.id]
                        ? "Re-run ID theft screen"
                        : "Not sure it's yours? Screen it"}
                    </button>
                  </div>
                )}
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
        </div>
      )}

      {screen === "letter" && activeItem && (
        <div>
          <div className="bg-panel border border-line rounded-2xl p-6">
            <div className="text-[10px] tracking-[0.3em] text-gold font-bold mb-2">
              LETTER DETAILS — {String(activeItem.letterType || "").toUpperCase()}
            </div>
            <div className="font-display text-cream text-xl mb-4">
              {activeItem.account}
            </div>
            <input
              placeholder="Your full legal name"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="w-full bg-panelSoft border border-line rounded-lg text-cream placeholder-creamDim px-4 py-3 text-sm mb-2.5"
            />
            <input
              placeholder="Your mailing address"
              value={memberAddress}
              onChange={(e) => setMemberAddress(e.target.value)}
              className="w-full bg-panelSoft border border-line rounded-lg text-cream placeholder-creamDim px-4 py-3 text-sm mb-2.5"
            />
            <textarea
              placeholder="Anything else the letter should know (dates, what happened, what you want)"
              value={extraDetail}
              onChange={(e) => setExtraDetail(e.target.value)}
              className="w-full bg-panelSoft border border-line rounded-lg text-cream placeholder-creamDim px-4 py-3 text-sm mb-3 min-h-[70px]"
            />
            <button
              onClick={generateLetter}
              disabled={letterLoading}
              className="w-full bg-terracotta text-[#1A0F09] font-bold rounded-lg px-4 py-3 text-sm disabled:opacity-60"
            >
              {letterLoading ? "Writing your letter…" : "Generate my letter"}
            </button>
          </div>

          {letter && (
            <div className="bg-panel border border-line rounded-2xl p-6 mt-5">
              <div className="flex justify-between items-center">
                <div className="text-[10px] tracking-[0.3em] text-gold font-bold">
                  YOUR LETTER
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyLetter}
                    className="border border-line text-gold rounded-lg px-3 py-1.5 text-xs"
                  >
                    {copied ? "Copied ✓" : "Copy letter"}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="border border-line text-gold rounded-lg px-3 py-1.5 text-xs"
                  >
                    Print / Save as PDF
                  </button>
                </div>
              </div>
              <pre
                id="letter-print-area"
                className="whitespace-pre-wrap font-body text-cream text-sm leading-relaxed bg-panelSoft border border-line rounded-lg px-5 py-4 mt-3"
              >
                {letter}
              </pre>
              <div className="text-creamDim text-xs mt-2.5">
                Fill any [bracketed] blanks, print, sign, and send certified
                mail with return receipt. Keep a copy and the date.
              </div>
              <div className="mt-4">
                {loggedTrackedItemId ? (
                  <div className="text-goldSoft text-xs font-semibold">
                    Logged to your round tracker.
                  </div>
                ) : (
                  <button
                    onClick={logToTracker}
                    disabled={loggingTracker}
                    className="border border-line text-gold rounded-lg px-4 py-2 text-xs disabled:opacity-50"
                  >
                    {loggingTracker
                      ? "Logging…"
                      : "Once it's mailed, log it to my tracker"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
