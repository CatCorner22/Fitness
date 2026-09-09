"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { MAX_PASSWORD, MAX_USERNAME, changePassword, createSession, destroySession, requireUser, verifyLogin } from "@/lib/auth";
import { clearLoginFailures, loginLocked, recordLoginFailure } from "@/lib/login-limiter";

async function clientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${forwarded || h.get("x-real-ip") || "local"}`;
}

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "").trim().toLowerCase().slice(0, MAX_USERNAME);
  const password = String(formData.get("password") || "").slice(0, MAX_PASSWORD + 1);
  const keys = [await clientKey(), `user:${username}`];

  if (loginLocked(keys)) redirect("/login?error=locked");

  const user = verifyLogin(username, password);
  if (!user) {
    recordLoginFailure(keys);
    redirect(loginLocked(keys) ? "/login?error=locked" : "/login?error=1");
  }
  clearLoginFailures(keys);
  await createSession(user);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  const current = String(formData.get("currentPassword") || "");
  const next = String(formData.get("newPassword") || "");
  const confirm = String(formData.get("confirmPassword") || "");
  const result = changePassword(user.id, current, next, confirm);
  if (result !== "ok") redirect(`/settings?password=${result}#password`);
  revalidatePath("/settings");
  redirect("/settings?toast=password#password");
}
