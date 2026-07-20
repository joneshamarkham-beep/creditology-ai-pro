"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || password.length < 8) {
    redirect(
      `/signup?error=${encodeURIComponent(
        "Enter a valid email and a password of at least 8 characters."
      )}`
    );
  }

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/signup?check_email=1");
}

export async function login(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
