import { saveOnboardingAction } from "@/app/actions/profile";
import { PROGRAMS } from "@/lib/programs/catalog";
import { requireAuthed } from "@/lib/session-page";

export default async function OnboardingPage() {
  const { user } = await requireAuthed({ allowOnboarding: true });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm uppercase tracking-[0.2em] text-copper">Set the room up</p>
      <h1 className="display mt-2 text-4xl">Hey {user.displayName}. What are we building?</h1>
      <p className="mt-3 text-muted">
        This takes a minute. We use it to pick a program, size sessions to your clock, and keep banned lifts
        away from cranky joints.
      </p>
      <form action={saveOnboardingAction} className="mt-8 space-y-6">
        <label className="block text-sm text-muted">
          What should we call you?
          <input name="displayName" defaultValue={user.displayName} className="mt-1" />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm text-muted">Primary goal</legend>
          {[
            ["general", "General strength — maintain calories"],
            ["powerlifting", "Powerlifting — slight surplus"],
            ["bodybuilding", "Bodybuilding / physique — hypertrophy surplus"],
            ["strength_endurance", "Strength + endurance — extra carbs"],
            ["pole_stage", "Pole / stage prep — maintain, high protein"],
            ["glute_specialization", "Big Ass Program — surplus + protein"],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-ink">
              <input type="radio" name="goal" value={value} defaultChecked={value === "general"} className="w-auto" />
              {label}
            </label>
          ))}
        </fieldset>
        <label className="block text-sm text-muted">
          Starting program
          <select name="programId" className="mt-1" defaultValue="upper_lower">
            {PROGRAMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-muted">
            Experience
            <select name="experience" className="mt-1" defaultValue="novice">
              <option value="novice">Novice</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="text-sm text-muted">
            Session length
            <select name="sessionMinutes" className="mt-1" defaultValue="60">
              {[30, 45, 60, 75, 90].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted">
            Days / week you can train
            <input name="daysPerWeek" type="number" min={2} max={6} defaultValue={4} className="mt-1" />
          </label>
          <label className="text-sm text-muted">
            Units
            <select name="units" className="mt-1" defaultValue="lb">
              <option value="lb">Pounds</option>
              <option value="kg">Kilograms</option>
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm text-muted">
            Sex (for calorie math)
            <select name="sex" className="mt-1" defaultValue="unspecified">
              <option value="unspecified">Unspecified</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label className="text-sm text-muted">
            Age
            <input name="age" type="number" min={16} max={90} className="mt-1" />
          </label>
          <label className="text-sm text-muted">
            Height (in or cm)
            <input name="height" type="number" step="0.1" className="mt-1" />
          </label>
        </div>
        <label className="text-sm text-muted">
          Bodyweight (lb or kg, matching units)
          <input name="weight" type="number" step="0.1" className="mt-1" />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm text-muted">Joints we should work around</legend>
          {["shoulder", "knee", "low_back", "wrist", "elbow", "hip"].map((i) => (
            <label key={i} className="flex items-center gap-2 capitalize">
              <input type="checkbox" name="injuries" value={i} className="w-auto" />
              {i.replace("_", " ")}
            </label>
          ))}
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm text-muted">Coach voice</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="persona" value="scientist" defaultChecked className="w-auto" />
            Scientist — calm, cites the reason
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="persona" value="garanimal" className="w-auto" />
            Garanimal — Goggins-grade accountability, still will not wreck your joints
          </label>
        </fieldset>
        <button type="submit" className="w-full rounded-2xl bg-copper py-3 font-semibold text-bg">
          Build my week
        </button>
        <p className="text-xs text-muted">
          Not medical advice. If something is sharp, hot, or numb — stop. The coach is forbidden from telling you
          to train through that.
        </p>
      </form>
    </div>
  );
}