"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, verifyLogin } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const user = verifyLogin(username, password);
  if (!user) {
    redirect("/login?error=1");
  }
  await createSession(user);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}