import { saveBodyCompAction } from "@/app/actions/meal-plan";
import type { ProfileRow } from "@/lib/auth";
import { BODY_COMP_OPTIONS, BODY_FAT_BANDS, bodyFatBand } from "@/lib/nutrition/body-comp";
import type { DietaryPattern } from "@/lib/types";

const PATTERNS: { id: DietaryPattern; label: string; hint: string }[] = [
  { id: "omnivore", label: "Everything", hint: "Meat, fish, eggs, dairy, plants" },
  { id: "pescatarian", label: "Pescatarian", hint: "Fish, eggs, dairy, plants" },
  { id: "vegetarian", label: "Vegetarian", hint: "Eggs, dairy, plants" },
  { id: "vegan", label: "Vegan", hint: "Plants only" },
];

function rangeLabel([lo, hi]: [number, number]) {
  return hi > 45 ? `${lo}%+` : `${lo}–${hi}%`;
}

function bandMidpoint(band: (typeof BODY_FAT_BANDS)[number], sex: ProfileRow["sex"]) {
  const [flo, fhi] = band.female;
  const [mlo, mhi] = band.male;
  const cap = (hi: number) => Math.min(hi, 45);
  if (sex === "female") return Math.round(((flo + cap(fhi)) / 2) * 10) / 10;
  if (sex === "male") return Math.round(((mlo + cap(mhi)) / 2) * 10) / 10;
  return Math.round(((flo + mlo + cap(fhi) + cap(mhi)) / 4) * 10) / 10;
}

export function BodyCompForm({ profile }: { profile: ProfileRow }) {
  const currentBand = bodyFatBand(profile.bodyFatPct, profile.sex);
  return (
    <form action={saveBodyCompAction} className="space-y-6 rounded-3xl border border-line bg-surface p-5">
      <fieldset className="space-y-2">
        <legend className="text-lg font-semibold">What do you want your body to do?</legend>
        <p className="text-sm text-muted">
          This is the main variable. A leaner plate and a mass plate are different diets, not the same food in
          different amounts.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {BODY_COMP_OPTIONS.map((option) => (
            <label
              key={option.id}
              className="flex min-h-16 cursor-pointer items-start gap-3 rounded-2xl border border-line bg-bg-2 px-4 py-3 has-[:checked]:border-copper has-[:checked]:bg-surface-2"
            >
              <input
                type="radio"
                name="bodyCompGoal"
                value={option.id}
                defaultChecked={profile.bodyCompGoal === option.id}
                className="mt-1 w-auto"
                required
              />
              <span>
                <span className="block font-semibold text-ink">{option.label}</span>
                <span className="block text-xs text-muted">{option.short}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Body fat, roughly</legend>
        <p className="text-xs text-muted">
          Optional. It sets how fast a cut can go and switches protein to a fat-free-mass basis. Pick the
          description that fits, or type a number if you have a DEXA or caliper reading. Bands follow the
          American Council on Exercise norms.
        </p>
        <div className="grid gap-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-line bg-bg-2 px-4 py-2 text-sm has-[:checked]:border-copper">
            <input type="radio" name="bodyFatBand" value="" defaultChecked={profile.bodyFatPct == null} className="w-auto" />
            <span>
              <span className="font-medium">Not sure</span>
              <span className="block text-xs text-muted">Uses a conservative 0.6%/week cut and bodyweight-based protein.</span>
            </span>
          </label>
          {BODY_FAT_BANDS.map((band) => {
            const mid = bandMidpoint(band, profile.sex);
            const range =
              profile.sex === "female"
                ? rangeLabel(band.female)
                : profile.sex === "male"
                  ? rangeLabel(band.male)
                  : `women ${rangeLabel(band.female)} · men ${rangeLabel(band.male)}`;
            return (
              <label
                key={band.band}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-line bg-bg-2 px-4 py-2 text-sm has-[:checked]:border-copper"
              >
                <input
                  type="radio"
                  name="bodyFatBand"
                  value={mid}
                  defaultChecked={profile.bodyFatPct != null && currentBand === band.band}
                  className="w-auto"
                />
                <span>
                  <span className="font-medium">{band.label}</span>
                  <span className="text-muted"> · {range}</span>
                  <span className="block text-xs text-muted">{band.cue}</span>
                </span>
              </label>
            );
          })}
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-line bg-bg-2 px-4 py-2 text-sm has-[:checked]:border-copper">
            <input type="radio" name="bodyFatBand" value="clear" className="w-auto" />
            <span className="text-muted">Clear my estimate</span>
          </label>
        </div>
        <label className="block text-sm text-muted">
          Exact reading (%), if you have one
          <input
            name="bodyFatPct"
            type="number"
            step="0.1"
            min={3}
            max={60}
            defaultValue={profile.bodyFatPct ?? ""}
            placeholder="e.g. 22"
            className="mt-1"
          />
        </label>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-muted">
          Meals per day
          <select name="mealsPerDay" defaultValue={profile.mealsPerDay} className="mt-1">
            {[3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} {n === 3 ? "· breakfast, lunch, dinner" : n === 4 ? "· three meals and a snack" : "· spread it out"}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs">
            Meal count does not change fat loss when calories match. It changes how much protein lands in each
            meal.
          </span>
        </label>
        <fieldset className="space-y-1 text-sm text-muted">
          <legend>What you eat</legend>
          {PATTERNS.map((p) => (
            <label key={p.id} className="flex min-h-10 items-center gap-2">
              <input
                type="radio"
                name="dietaryPattern"
                value={p.id}
                defaultChecked={profile.dietaryPattern === p.id}
                className="w-auto"
              />
              <span className="text-ink">{p.label}</span>
              <span className="text-xs">{p.hint}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <button className="btn-primary" type="submit">
        {profile.bodyCompGoal ? "Update my plan" : "Build my plan"}
      </button>
    </form>
  );
}
