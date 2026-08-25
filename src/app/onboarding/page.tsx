import { redirect } from "next/navigation";
import { saveOnboardingAction } from "@/app/actions/profile";
import { requireAuthed } from "@/lib/session-page";

export default async function OnboardingPage() {
  const { user, profile } = await requireAuthed({ allowOnboarding: true });
  if (profile?.activeProgramId && !profile.onboarded) redirect("/onboarding/assess");

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="display text-4xl">Hi {user.displayName}</h1>
      <p className="mt-3 text-muted">A few questions, then a short fitness check. You can change anything later.</p>
      <form action={saveOnboardingAction} className="mt-8 space-y-8">
        <input type="hidden" name="displayName" value={user.displayName} />
        <fieldset className="space-y-2">
          <legend className="text-lg font-semibold">What do you want?</legend>
          {[
            ["general", "Stay fit"],
            ["powerlifting", "Get stronger"],
            ["bodybuilding", "Build muscle"],
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3"
            >
              <input type="radio" name="goal" value={value} defaultChecked={value === "general"} className="w-auto" />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-lg font-semibold">When can you train?</legend>
          <label className="block text-sm text-muted">
            Days each week
            <select name="daysPerWeek" className="mt-1" defaultValue="3">
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} days
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-muted">
            Minutes per session
            <select name="sessionMinutes" className="mt-1" defaultValue="45">
              {[30, 45, 60, 75].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-muted">
            Units
            <select name="units" className="mt-1" defaultValue="lb">
              <option value="lb">Pounds</option>
              <option value="kg">Kilograms</option>
            </select>
          </label>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-lg font-semibold">For scoring the tests</legend>
          <label className="block text-sm text-muted">
            Age
            <input name="age" type="number" min={15} max={99} className="mt-1" />
          </label>
          <label className="block text-sm text-muted">
            Sex (norms only — not a gender interview)
            <select name="sex" className="mt-1" defaultValue="unspecified">
              <option value="unspecified">Unspecified</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label className="block text-sm text-muted">
            Height (optional, inches if pounds)
            <input name="height" type="number" step="0.1" className="mt-1" />
          </label>
          <label className="block text-sm text-muted">
            Bodyweight
            <input name="weight" type="number" step="0.1" className="mt-1" />
          </label>
          <p className="text-sm text-muted">Anything currently sore?</p>
          {["knee", "shoulder", "low_back"].map((i) => (
            <label key={i} className="flex min-h-12 items-center gap-3 capitalize">
              <input type="checkbox" name="injuries" value={i} className="w-auto" />
              {i.replace("_", " ")}
            </label>
          ))}
        </fieldset>

        <button type="submit" className="btn-primary">
          Next: fitness check
        </button>
        <p className="text-sm text-muted">
          Not medical advice. If something is sharp, hot, or numb — stop.
        </p>
      </form>
    </div>
  );
}
