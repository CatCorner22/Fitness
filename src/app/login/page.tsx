import { loginAction } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-12">
      <p className="text-sm uppercase tracking-[0.2em] text-copper">Household training</p>
      <h1 className="display mt-2 text-5xl text-ink">Garanimal</h1>
      <p className="mt-4 text-muted">
        Two users. Evidence-based programs. Fast logging. No bench dips, no behind-the-neck circus, no paywall
        on the set you are trying to record.
      </p>
      <form action={loginAction} className="mt-10 space-y-4 rounded-3xl border border-line bg-surface p-6">
        <label className="block text-sm text-muted">
          Username
          <input name="username" autoComplete="username" placeholder="alex or jordan" required className="mt-1" />
        </label>
        <label className="block text-sm text-muted">
          Password
          <input name="password" type="password" autoComplete="current-password" required className="mt-1" />
        </label>
        {params.error ? (
          <p className="text-sm text-danger">Wrong username or password. Try alex / household or jordan / household.</p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-2xl bg-copper px-4 py-3 font-semibold text-bg hover:bg-copper-2"
        >
          Enter
        </button>
        <p className="text-xs text-muted">
          Seeded household: <code>alex</code> / <code>household</code> and <code>jordan</code> /{" "}
          <code>household</code>. Logs stay isolated.
        </p>
      </form>
    </div>
  );
}