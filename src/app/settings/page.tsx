import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { saveSettingsAction } from "@/app/actions/profile";
import { AppShell } from "@/components/app-shell";
import { LookStudio } from "@/components/look-studio";
import { EQUIPMENT_OPTIONS } from "@/lib/equipment";
import { PROGRAMS } from "@/lib/programs/catalog";
import { DIET_PROGRAMS } from "@/lib/nutrition/diets";
import { getAiOptIn, getLook, getTheme } from "@/lib/prefs";
import { requireAuthed } from "@/lib/session-page";
import { kgToDisplay } from "@/lib/utils";

export default async function SettingsPage() {
  const { user, profile } = await requireAuthed();
  const heightDisplay =
    profile.heightCm && profile.units === "lb"
      ? Math.round((profile.heightCm / 2.54) * 10) / 10
      : profile.heightCm ?? "";
  const weightDisplay = profile.weightKg ? kgToDisplay(profile.weightKg, profile.units) : "";
  const [aiOptIn, theme, look] = await Promise.all([getAiOptIn(), getTheme(), getLook()]);

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">You</h1>
      <p className="mt-2 text-muted">This is {user.displayName}&apos;s log. Other people in the house stay separate.</p>

      <div className="mt-6">
        <LookStudio initial={{ ...look, theme }} />
      </div>

      <nav className="mt-6 grid grid-cols-2 gap-2">
        {[
          ["/programs", "Plans", "Every drill, listed"],
          ["/assess", "Fitness check", "Scale from a baseline"],
          ["/diets", "Diet", "Cut, bulk, reverse, peak"],
          ["/course", "Nyx course", "Amateur night and pole class"],
          ["/progress", "Calendar", "Green trained, red rest"],
          ["/coach", "Coach", "Ask why a lift is banned"],
          ["/knowledge", "Guide", "The research notes"],
        ].map(([href, label, hint]) => (
          <Link
            key={href}
            className="min-h-16 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors hover:border-copper/40 hover:bg-surface-2"
            href={href}
          >
            <span className="block text-sm font-semibold text-ink">{label}</span>
            <span className="mt-0.5 block text-xs text-muted">{hint}</span>
          </Link>
        ))}
        <a className="min-h-16 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors hover:border-copper/40 hover:bg-surface-2" href="/api/export">
          <span className="block text-sm font-semibold text-ink">Download data</span>
          <span className="mt-0.5 block text-xs text-muted">CSV of your logs</span>
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
            <option value="pole_stage">Pole class</option>
            <option value="exotic_stage">Amateur night / exotic</option>
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
        <label className="block text-sm text-muted">
          Diet block
          <select name="dietId" defaultValue={profile.activeDietId ?? ""} className="mt-1">
            <option value="">Training-goal calories</option>
            {DIET_PROGRAMS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
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
              {["shoulder", "knee", "low_back", "wrist", "elbow", "hip", "ankle"].map((i) => (
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
