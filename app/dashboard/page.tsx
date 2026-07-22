import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/supabase/actions";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="max-w-[780px] mx-auto px-5 pt-10 pb-16">
      <header className="flex justify-between items-start mb-8 gap-3">
        <div>
          <div className="text-[11px] tracking-[0.35em] text-gold font-bold">
            CREDITOLOGY
          </div>
          <h1 className="font-display text-[28px] mt-1">Welcome back</h1>
          <div className="text-creamDim text-sm">{user.email}</div>
        </div>
        <form action={logout}>
          <button className="border border-line text-gold rounded-lg px-4 py-2 text-sm">
            Log out
          </button>
        </form>
      </header>

      <div className="bg-panel border border-line rounded-2xl p-6">
        <div className="text-[10px] tracking-[0.3em] text-gold font-bold mb-2">
          STATUS
        </div>
        <div className="text-cream text-[15px] leading-relaxed mb-4">
          You&apos;re logged in. Upload a report to run the Creditology
          Method.
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/dashboard/analyze"
            className="inline-block bg-terracotta text-[#1A0F09] font-bold rounded-lg px-5 py-3 text-sm"
          >
            Analyze a report
          </Link>
          <Link
            href="/dashboard/tracker"
            className="inline-block border border-line text-gold rounded-lg px-5 py-3 text-sm"
          >
            Round tracker
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
