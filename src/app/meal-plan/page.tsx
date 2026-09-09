import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BodyCompForm } from "@/components/meal-plan/body-comp-form";
import { EvidenceList } from "@/components/meal-plan/evidence-list";
import { TargetsCard } from "@/components/meal-plan/targets-card";
import { WeekPlan } from "@/components/meal-plan/week-plan";
import { bodyCompOption } from "@/lib/nutrition/body-comp";
import { isLowHistamineDiet } from "@/lib/nutrition/diets";
import { evidenceList } from "@/lib/nutrition/evidence";
import { weeklyPlan } from "@/lib/nutrition/meal-plans";
import { adaptiveCalories } from "@/lib/nutrition/targets";
import { requireAuthed } from "@/lib/session-page";
import { todayNutrition } from "@/lib/today";

function todayIndexMondayFirst() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function parseShift(raw: string | undefined) {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n < 50 ? n : 0;
}

export default async function MealPlanPage({ searchParams }: { searchParams: Promise<{ shift?: string }> }) {
  const { user, profile } = await requireAuthed();
  const params = await searchParams;
  const shift = parseShift(params.shift);
  const targets = adaptiveCalories(user.id, profile);
  const bodyComp = targets.bodyComp;
  const lowHistamine = isLowHistamineDiet(profile.activeDietId);
  const day = todayNutrition(user.id);

  const week = bodyComp
    ? weeklyPlan({
        filter: {
          goal: profile.goal,
          phase: bodyComp.goal,
          pattern: profile.dietaryPattern,
          lowHistamine,
          dietId: profile.activeDietId,
        },
        calories: targets.calories,
        protein: targets.protein,
        mealsPerDay: profile.mealsPerDay,
        offset: shift,
      })
    : null;

  return (
    <AppShell user={user} profile={profile} wide>
      <h1 className="display text-4xl">Meal plan</h1>
      <p className="mt-2 max-w-2xl text-muted">
        One question drives everything: do you want to get leaner, hold, or gain mass? The answer sets the
        calorie direction, the protein target, the fat floor, and which plates rotate through your week.
        Every number below links to a peer-reviewed source.
      </p>

      <div className="mt-6 space-y-6">
        {bodyComp ? (
          <>
            <TargetsCard profile={profile} targets={targets} bodyComp={bodyComp} />
            {week ? (
              <WeekPlan
                days={week.days}
                grocery={week.grocery}
                templateCount={week.templates.length}
                todayIndex={todayIndexMondayFirst()}
                shift={shift}
                hasLogs={day.logs.length > 0}
                calories={targets.calories}
                protein={targets.protein}
              />
            ) : null}
            <details className="rounded-3xl border border-line bg-surface">
              <summary className="cursor-pointer px-5 py-4">
                <span className="block text-sm font-semibold text-ink">Change the answer</span>
                <span className="mt-0.5 block text-xs text-muted">
                  Currently: {bodyCompOption(bodyComp.goal).label} · {profile.mealsPerDay} meals ·{" "}
                  {profile.dietaryPattern}
                  {profile.bodyFatPct ? ` · ~${profile.bodyFatPct}% body fat` : ""}
                </span>
              </summary>
              <div className="px-5 pb-5">
                <BodyCompForm profile={profile} />
              </div>
            </details>
          </>
        ) : (
          <BodyCompForm profile={profile} />
        )}

        <section className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold">How this plan is run</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <strong className="text-ink">1. Expenditure first.</strong> Resting energy is Mifflin-St Jeor times
              an activity factor from your training days. After ~8 morning weigh-ins and logged meals the app
              switches to an adaptive estimate from what you actually ate and what the scale did.
            </li>
            <li>
              <strong className="text-ink">2. Direction from the body-composition answer.</strong> Leaner: a
              deficit sized to body fat (0.5–1% of bodyweight a week), capped near 500 kcal so lifting can still
              hold muscle, never under the calorie floor. Gain: a 10–20% surplus scaled to training age
              (0.25–0.5%/week). Recomp and Maintain: expenditure, with the highest protein.
            </li>
            <li>
              <strong className="text-ink">3. Protein, then fat, then carbs.</strong> Protein is set per kg (or
              per kg of lean mass when body fat is known). Fat gets a floor of ~0.8–1.0 g/kg and at least 20% of
              calories. Carbohydrate takes what is left and sits around training.
            </li>
            <li>
              <strong className="text-ink">4. Spread protein across meals.</strong> About 0.4–0.55 g/kg per
              meal, every 3–4 hours, including one meal near training. Meal count itself does not change fat
              loss.
            </li>
            <li>
              <strong className="text-ink">5. Weekly check, small moves.</strong> Compare the 7-day average
              weight to the target rate. Off for two weeks in a row: move ±100–150 kcal, mostly carbs. Do not
              stack cardio to “earn” food.
            </li>
            <li>
              <strong className="text-ink">6. Time cap.</strong> A cut gets a maintenance week every 8–12
              weeks. A gain phase ends when you are gaining faster than 0.5%/week or want to see what you built.
              After a peak or mini-cut, Reverse.
            </li>
            <li>
              <strong className="text-ink">7. Stop signs.</strong> Under 18, pregnant or breastfeeding, insulin
              or glucose-lowering medication, eating-disorder history, BMI under 18.5, or essential body fat: the
              module holds you at maintenance and points you to a clinician. Dizziness, fainting, missed periods,
              or chest pain end the block.
            </li>
          </ol>
          <p className="mt-3 text-sm">
            <Link href="/knowledge#body-composition-nutrition" className="text-copper-2">
              Full note in the Guide →
            </Link>
          </p>
        </section>

        <EvidenceList
          evidence={evidenceList(
            bodyComp
              ? bodyComp.citations
              : [
                  "mifflin-1990",
                  "frankenfield-2005",
                  "issn-diets-2017",
                  "issn-protein-2017",
                  "helms-2014-jissn",
                  "iraki-2019",
                  "schoenfeld-aragon-2018",
                  "murphy-koehler-2022",
                  "aha-acc-tos-2013",
                  "iom-2005-macros",
                  "dga-2020",
                ],
          )}
        />
      </div>
    </AppShell>
  );
}
