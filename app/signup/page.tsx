import Link from "next/link";
import { signup } from "@/lib/supabase/actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string; check_email?: string };
}) {
  if (searchParams?.check_email) {
    return (
      <main className="max-w-[420px] mx-auto px-5 pt-16 pb-16">
        <div className="text-[11px] tracking-[0.35em] text-gold font-bold">
          CREDITOLOGY
        </div>
        <h1 className="font-display text-[28px] mt-1 mb-4">
          Check your email
        </h1>
        <div className="bg-panel border border-line rounded-2xl p-6 text-cream text-[15px] leading-relaxed">
          We sent you a confirmation link. Click it, then come back and log
          in.
        </div>
        <div className="text-creamDim text-sm mt-6">
          <Link href="/login" className="text-gold">
            Back to log in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[420px] mx-auto px-5 pt-16 pb-16">
      <div className="text-[11px] tracking-[0.35em] text-gold font-bold">
        CREDITOLOGY
      </div>
      <h1 className="font-display text-[28px] mt-1 mb-6">
        Create your account
      </h1>

      {searchParams?.error && (
        <div className="bg-[#3A211C] border border-danger text-[#F0BDB4] text-sm rounded-lg px-4 py-3 mb-4">
          {searchParams.error}
        </div>
      )}

      <form action={signup} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="bg-panelSoft border border-line rounded-lg text-cream placeholder-creamDim px-4 py-3 text-sm"
        />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Password (8+ characters)"
          className="bg-panelSoft border border-line rounded-lg text-cream placeholder-creamDim px-4 py-3 text-sm"
        />
        <button
          type="submit"
          className="bg-terracotta text-[#1A0F09] font-bold rounded-lg px-4 py-3 text-sm mt-2"
        >
          Create account
        </button>
      </form>

      <div className="text-creamDim text-sm mt-6">
        Already a member?{" "}
        <Link href="/login" className="text-gold">
          Log in
        </Link>
      </div>
    </main>
  );
}
