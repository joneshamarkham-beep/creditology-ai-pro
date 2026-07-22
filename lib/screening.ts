// Identity theft screening — the 6-question check and verdict logic.
// Pure client-side logic, no AI call needed.

export const ID_QUESTIONS = [
  { id: "recognize", q: "Do you recognize this company or creditor at all?" },
  {
    id: "opened",
    q: "Did you open this account, or give anyone permission to open it for you?",
  },
  { id: "payment", q: "Have you ever made a payment on this account?" },
  {
    id: "timing",
    q: "Does the open date match a time you actually applied for credit?",
  },
  {
    id: "family",
    q: "Could a family member, ex, or someone with access to your info have opened it?",
  },
  {
    id: "breach",
    q: "Around that time, was your info exposed — lost wallet, stolen mail, or a data breach notice?",
  },
];

export const ANSWER_OPTIONS = ["Yes", "No", "Not sure"];

export type Verdict = {
  level: "yours" | "family" | "fraud" | "gray";
  title: string;
  advice: string;
  letterType: string;
};

export function screenVerdict(answers: Record<string, string>): Verdict {
  const core = ["recognize", "opened", "payment", "timing"].filter(
    (k) => answers[k] === "No"
  ).length;
  const unsure = Object.values(answers).filter((v) => v === "Not sure").length;

  if (answers.opened === "Yes" || answers.payment === "Yes")
    return {
      level: "yours",
      title: "This account looks like yours",
      advice:
        "Identity theft isn't the play here — a §1681c-2 block would be improper. But it can still carry reporting errors: wrong balance, wrong DOFD, cross-bureau inconsistencies. Dispute the inaccuracies instead.",
      letterType: "dispute",
    };
  if (core >= 3 && answers.family === "Yes")
    return {
      level: "family",
      title: "Possible fraud by someone you know",
      advice:
        "Legally this can still be identity theft, but filing a police/FTC report may name that person and carries real consequences for them. This one deserves a conversation before paperwork — bring it to the monthly Cleanup Session before choosing a path.",
      letterType: "dispute",
    };
  if (core >= 3)
    return {
      level: "fraud",
      title: "Strong identity theft signals",
      advice:
        "Step 1: File an identity theft report at IdentityTheft.gov (free, takes about 10 minutes). Step 2: Consider a fraud alert or credit freeze with all three bureaus. Step 3: Come back and generate the §1681c-2 block letter — with your FTC report attached, bureaus must block the item within 4 business days.",
      letterType: "1681c-2 block",
    };
  if (core >= 1 || unsure >= 2)
    return {
      level: "gray",
      title: "Not clearly fraud — investigate first",
      advice:
        "Before claiming identity theft, request debt validation or dispute as 'not mine / unverified.' If the response reveals an account you truly never opened, run this screen again and escalate to the §1681c-2 path.",
      letterType: "debt validation",
    };
  return {
    level: "yours",
    title: "Likely your account",
    advice:
      "Treat this as a standard dispute or goodwill candidate — attack the inaccuracies, not the ownership.",
    letterType: "dispute",
  };
}
