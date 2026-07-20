import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-[780px] mx-auto px-5 pt-10 pb-16">
      <header className="mb-8">
        <div className="text-[11px] tracking-[0.35em] text-gold font-bold">
          CREDITOLOGY
        </div>
        <h1 className="font-display text-[34px] leading-tight mt-1 mb-1">
          Creditology <span className="text-terracotta">AI</span>{" "}
          <span className="text-gold italic">Pro</span>
        </h1>
        <div className="text-creamDim text-sm">
          Upload your report. Get the plan. Send the letters.
        </div>
      </header>

      <div className="bg-panel border border-line rounded-2xl p-6">
        <div className="text-cream text-[15px] leading-relaxed mb-4">
          Members only. Log in or create your account below.
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/login"
            className="bg-terracotta text-[#1A0F09] font-bold rounded-lg px-5 py-3 text-sm"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="border border-line text-gold rounded-lg px-5 py-3 text-sm"
          >
            Create account
          </Link>
        </div>
      </div>

      <footer className="text-center text-creamDim text-[11px] mt-12 tracking-wider">
        Creditology AI Pro · Educational software · Not legal advice · Not a
        credit repair service
      </footer>
    </main>
  );
}
