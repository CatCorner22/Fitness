import { saveSettingsAction } from "@/app/actions/profile";
import { AppShell } from "@/components/app-shell";
import { PROGRAMS } from "@/lib/programs/catalog";
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

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">Settings</h1>
      <p className="mt-2 text-muted">
        Isolated to {user.displayName}. Jordan and Alex never share logs.
      </p>
      <form action={saveSettingsAction} className="mt-8 space-y-5 rounded-3xl border border-line bg-surface p-6">
        <label className="block text-sm text-muted">
          Display name
          <input name="displayName" defaultValue={user.displayName} className="mt-1" />
        </label>
        <label className="block text-sm text-muted">
          Program
          <select name="programId" defaultValue={profile.activeProgramId ?? "upper_lower"} className="mt-1">
            {PROGRAMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-muted">
            Session minutes
            <select name="sessionMinutes" defaultValue={profile.sessionMinutes} className="mt-1">
              {[30, 45, 60, 75, 90].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted">
            Days / week
            <input name="daysPerWeek" type="number" defaultValue={profile.daysPerWeek} className="mt-1" />
          </label>
          <label className="text-sm text-muted">
            Units
            <select name="units" defaultValue={profile.units} className="mt-1">
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </label>
          <label className="text-sm text-muted">
            Coach
            <select name="persona" defaultValue={profile.persona} className="mt-1">
              <option value="scientist">Scientist</option>
              <option value="garanimal">Garanimal</option>
            </select>
          </label>
          <label className="text-sm text-muted">
            Experience
            <select name="experience" defaultValue={profile.experience} className="mt-1">
              <option value="novice">Novice</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="text-sm text-muted">
            Goal
            <select name="goal" defaultValue={profile.goal} className="mt-1">
              <option value="general">General — maintain</option>
              <option value="powerlifting">Powerlifting — +150 kcal</option>
              <option value="bodybuilding">Bodybuilding — +250 kcal</option>
              <option value="strength_endurance">Strength + endurance — +100 kcal</option>
              <option value="pole_stage">Pole / stage — maintain</option>
              <option value="glute_specialization">Glute specialization — +200 kcal</option>
            </select>
          </label>
          <label className="text-sm text-muted">
            Sex
            <select name="sex" defaultValue={profile.sex} className="mt-1">
              <option value="unspecified">Unspecified</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label className="text-sm text-muted">
            Age
            <input name="age" type="number" defaultValue={profile.age ?? ""} className="mt-1" />
          </label>
          <label className="text-sm text-muted">
            Height
            <input name="height" type="number" step="0.1" defaultValue={heightDisplay} className="mt-1" />
          </label>
          <label className="text-sm text-muted">
            Weight
            <input name="weight" type="number" step="0.1" defaultValue={weightDisplay} className="mt-1" />
          </label>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm text-muted">Injuries</legend>
          {["shoulder", "knee", "low_back", "wrist", "elbow", "hip"].map((i) => (
            <label key={i} className="flex items-center gap-2 capitalize">
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
          <legend className="text-sm text-muted">Equipment available</legend>
          <p className="text-xs text-muted">Exercises swap automatically when gear is missing.</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {EQUIPMENT_OPTIONS.map((eq) => (
              <label key={eq.value} className="flex items-center gap-2 text-sm">
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
        <button className="rounded-2xl bg-copper px-5 py-3 font-semibold text-bg" type="submit">
          Save
        </button>
      </form>
    </AppShell>
  );
}