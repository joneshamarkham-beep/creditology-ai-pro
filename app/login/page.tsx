import Link from "next/link";
import { login } from "@/lib/supabase/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="max-w-[420px] mx-auto px-5 pt-16 pb-16">
      <div className="text-[11px] tracking-[0.35em] text-gold font-bold">
        CREDITOLOGY
      </div>
      <h1 className="font-display text-[28px] mt-1 mb-6">Welcome back</h1>

      {searchParams?.error && (
        <div className="bg-[#3A211C] border border-danger text-[#F0BDB4] text-sm rounded-lg px-4 py-3 mb-4">
          {searchParams.error}
        </div>
      )}

      <form action={login} className="flex flex-col gap-3">
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
          placeholder="Password"
          className="bg-panelSoft border border-line rounded-lg text-cream placeholder-creamDim px-4 py-3 text-sm"
        />
        <button
          type="submit"
          className="bg-terracotta text-[#1A0F09] font-bold rounded-lg px-4 py-3 text-sm mt-2"
        >
          Log in
        </button>
      </form>

      <div className="text-creamDim text-sm mt-6">
        New here?{" "}
        <Link href="/signup" className="text-gold">
          Create an account
        </Link>
      </div>
    </main>
  );
}
