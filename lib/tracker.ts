// Round tracker escalation logic — matches the path taught in Module 4:
// dispute -> method of verification -> furnisher dispute -> CFPB complaint.
// This is deterministic (no AI call), so it's instant and free to run.

export const RESPONSE_LABELS: Record<string, string> = {
  pending: "Awaiting response",
  deleted: "Deleted / removed",
  updated: "Updated / corrected",
  verified: "Verified / remains as reported",
  no_response: "No response after 30 days",
};

export type NextMove = {
  nextLetterType: string | null; // null means resolved, nothing further to send
  advice: string;
};

export function computeNextMove(
  letterType: string | null | undefined,
  responseType: string
): NextMove {
  const type = (letterType || "dispute").toLowerCase();

  if (responseType === "deleted") {
    return {
      nextLetterType: null,
      advice:
        "Resolved. Pull an updated report to confirm it's gone from every bureau you disputed it with.",
    };
  }

  if (responseType === "updated") {
    return {
      nextLetterType: type,
      advice:
        "Check whether the correction actually fixes the issue you flagged. If it does, you're done here. If it's only a partial fix, log another round and be specific about what's still wrong.",
    };
  }

  // From here down, responseType is "verified" or "no_response".

  if (type.includes("1681c-2") || type.includes("block")) {
    return {
      nextLetterType: "cfpb complaint",
      advice:
        "A block request denied despite an FTC identity theft report is unusual. File a CFPB complaint, and bring this one to the monthly live Cleanup Session or an attorney — this isn't a standard dispute anymore.",
    };
  }

  if (type.includes("goodwill")) {
    return {
      nextLetterType: "goodwill",
      advice:
        "Goodwill requests are never guaranteed, and pushing harder rarely helps. Wait a few months, build more on-time payments, and try again — or shift focus to disputing any factual inaccuracies on this account instead.",
    };
  }

  if (type.includes("method of verification")) {
    return {
      nextLetterType: "furnisher dispute",
      advice:
        "If they couldn't produce real verification details, dispute directly with the original creditor or collection agency. Furnishers have their own duty to investigate under the FCRA.",
    };
  }

  if (type.includes("furnisher")) {
    return {
      nextLetterType: "cfpb complaint",
      advice:
        "File a complaint with the Consumer Financial Protection Bureau at consumerfinance.gov/complaint. This goes on the bureau's compliance record and requires a formal response.",
    };
  }

  if (type.includes("cfpb")) {
    return {
      nextLetterType: null,
      advice:
        "You've run the full escalation path. This one may need the monthly live Cleanup Session or an attorney's input.",
    };
  }

  // Default: a standard dispute or debt validation letter came back
  // verified or with no response — time for a Method of Verification request.
  return {
    nextLetterType: "method of verification",
    advice:
      "Send a Method of Verification (MOV) letter. Demand the name of who verified it, what documents they reviewed, and who they contacted at the original creditor.",
  };
}
