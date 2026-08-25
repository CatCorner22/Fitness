import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { saveSettingsAction } from "@/app/actions/profile";
import { AppShell } from "@/components/app-shell";
import { PROGRAMS } from "@/lib/programs/catalog";
import { getAiOptIn, getTheme } from "@/lib/prefs";
import { requireAuthed } from "@/lib/session-page";
import { kgToDisplay } from "@/lib/utils";
import type { Equipment } from "@/lib/types";

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: "barbell", label: "Barbell" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "cable", label: "Cable" },
  { value: "machine", label: "Machine" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "bands", label: "Bands" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "pullup_bar", label: "Pull-up bar" },
  { value: "bench", label: "Bench" },
  { value: "hip_thrust_bench", label: "Hip thrust bench" },
  { value: "trap_bar", label: "Trap bar" },
  { value: "landmine", label: "Landmine" },
  { value: "cardio_machine", label: "Cardio machine" },
];

export default async function SettingsPage() {
  const { user, profile } = await requireAuthed();
  const heightDisplay =
    profile.heightCm && profile.units === "lb"
      ? Math.round((profile.heightCm / 2.54) * 10) / 10
      : profile.heightCm ?? "";
  const weightDisplay = profile.weightKg ? kgToDisplay(profile.weightKg, profile.units) : "";
  const aiOptIn = await getAiOptIn();
  const theme = await getTheme();

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">You</h1>
      <p className="mt-2 text-muted">This is {user.displayName}&apos;s log. Other people in the house stay separate.</p>

      <nav className="mt-6 grid grid-cols-2 gap-2 text-sm">
        <Link className="rounded-2xl border border-line bg-surface px-4 py-3" href="/programs">
          Plans
        </Link>
        <Link className="rounded-2xl border border-line bg-surface px-4 py-3" href="/coach">
          Coach
        </Link>
        <Link className="rounded-2xl border border-line bg-surface px-4 py-3" href="/knowledge">
          Guide
        </Link>
        <a className="rounded-2xl border border-line bg-surface px-4 py-3" href="/api/export">
          Download data
        </a>
      </nav>

      <form action={saveSettingsAction} className="mt-8 space-y-5 rounded-3xl border border-line bg-surface p-5">
        <label className="block text-sm text-muted">
          Name
          <input name="displayName" defaultValue={user.displayName} className="mt-1" />
        </label>
        <label className="block text-sm text-muted">
          Goal
          <select name="goal" defaultValue={profile.goal} className="mt-1">
            <option value="general">Stay fit</option>
            <option value="powerlifting">Get stronger</option>
            <option value="bodybuilding">Build muscle</option>
            <option value="strength_endurance">Lift and cardio</option>
            <option value="pole_stage">Pole / stage</option>
            <option value="glute_specialization">Glute focus</option>
          </select>
        </label>
        <label className="block text-sm text-muted">
          Plan
          <select name="programId" defaultValue={profile.activeProgramId ?? "upper_lower"} className="mt-1">
            {PROGRAMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted block">
          Minutes
          <select name="sessionMinutes" defaultValue={profile.sessionMinutes} className="mt-1">
            {[30, 45, 60, 75, 90].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted block">
          Days / week
          <input name="daysPerWeek" type="number" defaultValue={profile.daysPerWeek} className="mt-1" />
        </label>
        <label className="text-sm text-muted block">
          Units
          <select name="units" defaultValue={profile.units} className="mt-1">
            <option value="lb">Pounds</option>
            <option value="kg">Kilograms</option>
          </select>
        </label>
        <label className="text-sm text-muted block">
          Weight
          <input name="weight" type="number" step="0.1" defaultValue={weightDisplay} className="mt-1" />
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="theme" value="light" defaultChecked={theme === "light"} className="w-auto" />
          Light screen
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="aiOptIn" value="1" defaultChecked={aiOptIn} className="mt-1 w-auto" />
          <span>Send workouts to a coach model. Off unless you check this. Your food, weight, and joints stay on this device until you turn it on.</span>
        </label>

        <details>
          <summary className="cursor-pointer text-sm text-muted">More</summary>
          <div className="mt-4 space-y-4">
            <label className="text-sm text-muted block">
              Coach voice
              <select name="persona" defaultValue={profile.persona} className="mt-1">
                <option value="scientist">Calm</option>
                <option value="garanimal">Tough</option>
              </select>
            </label>
            <label className="text-sm text-muted block">
              Experience
              <select name="experience" defaultValue={profile.experience} className="mt-1">
                <option value="novice">New</option>
                <option value="intermediate">Some training</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label className="text-sm text-muted block">
              Sex (calorie math only)
              <select name="sex" defaultValue={profile.sex} className="mt-1">
                <option value="unspecified">Unspecified</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </label>
            <label className="text-sm text-muted block">
              Age
              <input name="age" type="number" defaultValue={profile.age ?? ""} className="mt-1" />
            </label>
            <label className="text-sm text-muted block">
              Height
              <input name="height" type="number" step="0.1" defaultValue={heightDisplay} className="mt-1" />
            </label>
            <fieldset className="space-y-2">
              <legend className="text-sm text-muted">Sore joints (not a medical screen)</legend>
              {["shoulder", "knee", "low_back", "wrist", "elbow", "hip"].map((i) => (
                <label key={i} className="flex min-h-11 items-center gap-2 capitalize">
                  <input
                    type="checkbox"
                    name="injuries"
                    value={i}
                    defaultChecked={profile.injuries.includes(i as never)}
                    className="w-auto"
                  />
                  {i.replace("_", " ")}
                </label>
              ))}
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="text-sm text-muted">Gear you have</legend>
              <div className="mt-2 grid gap-2">
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <label key={eq.value} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="equipment"
                      value={eq.value}
                      defaultChecked={profile.equipment.includes(eq.value)}
                      className="w-auto"
                    />
                    {eq.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </details>
        <button className="btn-primary" type="submit">
          Save
        </button>
      </form>

      <form action={logoutAction} className="mt-6">
        <button className="btn-quiet w-full" type="submit">
          Log out
        </button>
      </form>
    </AppShell>
  );
}
