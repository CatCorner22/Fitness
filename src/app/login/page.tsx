import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { KawaiiAvatar } from "@/components/kawaii-avatar";
import { getProfile, getSession } from "@/lib/auth";
import { getLook } from "@/lib/prefs";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) {
    const profile = getProfile(session.id);
    redirect(profile?.onboarded ? "/" : "/onboarding");
  }
  const params = await searchParams;
  const look = await getLook();
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <div className="flex items-center gap-3">
        <KawaiiAvatar id={look.avatar} size={56} />
        <h1 className="display text-5xl text-ink">Garanimal</h1>
      </div>
      <p className="mt-3 text-muted">Log the workout. Log the food. That is the app.</p>
      <form action={loginAction} className="mt-10 space-y-4 rounded-3xl border border-line bg-surface p-6">
        <label className="block text-sm text-muted">
          Username
          <input name="username" autoComplete="username" required className="mt-1" />
        </label>
        <label className="block text-sm text-muted">
          Password
          <input name="password" type="password" autoComplete="current-password" required className="mt-1" />
        </label>
        {params.error ? <p className="text-sm text-danger">Wrong username or password.</p> : null}
        <button type="submit" className="btn-primary">
          Enter
        </button>
        <details className="text-sm text-muted">
          <summary className="cursor-pointer">Demo house</summary>
          <p className="mt-2">alex or jordan, password household. Logs stay separate.</p>
        </details>
      </form>
    </div>
  );
}
