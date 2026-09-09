import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { STARTER_FOODS, foodFitsPattern } from "../src/lib/nutrition/starter-foods.ts";
import { EVIDENCE, ALL_EVIDENCE, evidenceList } from "../src/lib/nutrition/evidence.ts";
import {
  BODY_COMP_GOALS,
  BODY_COMP_OPTIONS,
  bodyFatBand,
  bodyCompTargets,
  lossRatePct,
  gainRatePct,
  proteinPerKgFor,
  progressVerdict,
} from "../src/lib/nutrition/body-comp.ts";
import {
  MEAL_PLAN_TEMPLATES,
  templatesFor,
  templateFitsPattern,
  templateIsLowHistamine,
  scalePlanToTargets,
  planTotals,
  foldToMealsPerDay,
  weeklyPlan,
} from "../src/lib/nutrition/meal-plans.ts";

function expect(condition, message) {
  assert.ok(condition, message);
}

// ---------------------------------------------------------------------------
// Evidence registry: every citation is peer-reviewed or a US federal/national
// body, has a country, and every id referenced from the planner resolves.
// ---------------------------------------------------------------------------
expect(ALL_EVIDENCE.length >= 20, `evidence registry has at least 20 entries (got ${ALL_EVIDENCE.length})`);
for (const e of ALL_EVIDENCE) {
  expect(e.id && e.short && e.citation && e.institution && e.country && e.claim, `${e.id} has all fields`);
  if (e.id !== "ace-bodyfat") expect(/\d{4}/.test(e.citation), `${e.id} citation has a year`);
}
const usCount = ALL_EVIDENCE.filter((e) => e.country === "US").length;
expect(usCount >= 18, `most evidence is US-based (${usCount} of ${ALL_EVIDENCE.length})`);
const nonUs = ALL_EVIDENCE.filter((e) => e.country !== "US");
expect(nonUs.every((e) => e.country === "Non-US (supporting)"), "non-US entries are marked as supporting evidence only");
expect(nonUs.length <= 3, `supporting non-US entries stay few (${nonUs.length})`);
for (const id of ["mifflin-1990", "issn-diets-2017", "issn-protein-2017", "murphy-koehler-2022", "iraki-2019", "helms-2014-jissn", "schoenfeld-aragon-2018", "mamerow-2014", "barakat-2020", "aha-acc-tos-2013", "iom-2005-macros", "dga-2020"]) {
  expect(EVIDENCE[id], `core evidence ${id} exists`);
}
expect(evidenceList(["mifflin-1990", "mifflin-1990", "dga-2020"]).length === 2, "evidenceList dedupes");

// ---------------------------------------------------------------------------
// Body-fat bands (ACE) and rates
// ---------------------------------------------------------------------------
expect(bodyFatBand(12, "female") === "essential", "12% female is essential fat");
expect(bodyFatBand(18, "female") === "athlete", "18% female is athletic");
expect(bodyFatBand(28, "female") === "average", "28% female is average");
expect(bodyFatBand(35, "female") === "high", "35% female is higher");
expect(bodyFatBand(4, "male") === "essential", "4% male is essential fat");
expect(bodyFatBand(10, "male") === "athlete", "10% male is athletic");
expect(bodyFatBand(20, "male") === "average", "20% male is average");
expect(bodyFatBand(30, "male") === "high", "30% male is higher");
expect(bodyFatBand(null, "male") === null, "unknown body fat has no band");
expect(bodyFatBand(0, "male") === null, "zero body fat has no band");

expect(lossRatePct("high") === 1.0 && lossRatePct("athlete") === 0.5, "loss rate runs 0.5–1% by band");
expect(lossRatePct("essential") === 0, "essential fat refuses a loss rate");
expect(lossRatePct(null) === 0.6, "unknown body fat sits at the conservative end");
expect(gainRatePct("novice") === 0.5 && gainRatePct("advanced") === 0.25, "gain rate 0.25–0.5% by experience");

expect(proteinPerKgFor("lean", null) === 2.2, "lean protein fallback is 2.2 g/kg BW");
const leanFfm = proteinPerKgFor("lean", 25);
expect(leanFfm > 1.9 && leanFfm < 2.0, `lean protein at 25% BF is 2.6 g/kg FFM ≈ ${leanFfm.toFixed(2)} g/kg BW`);
expect(proteinPerKgFor("gain", 15) === 1.8, "gain protein is 1.8 g/kg");
expect(proteinPerKgFor("lean", 50) >= 1.8, "protein never falls below 1.8 g/kg BW");

// ---------------------------------------------------------------------------
// Body-comp targets: lean vs gain must differ in direction, protein, carbs.
// ---------------------------------------------------------------------------
expect(BODY_COMP_GOALS.length === 4 && BODY_COMP_OPTIONS.length === 4, "four body-comp goals with UI copy");
expect(BODY_COMP_OPTIONS.every((o) => o.label && o.short && o.blurb), "each option has label/short/blurb");

const base = { sex: "female", weightKg: 70, heightCm: 168, age: 32, experience: "intermediate", mealsPerDay: 4, tdee: 2200, calorieFloor: 1400 };
const lean = bodyCompTargets({ ...base, goal: "lean", bodyFatPct: 28 });
const gain = bodyCompTargets({ ...base, goal: "gain", bodyFatPct: 28 });
const recomp = bodyCompTargets({ ...base, goal: "recomp", bodyFatPct: 28 });
const maintain = bodyCompTargets({ ...base, goal: "maintain", bodyFatPct: 28 });

expect(lean.delta < 0 && lean.calories < 2200, `lean eats under TDEE (delta ${lean.delta})`);
expect(gain.delta > 0 && gain.calories > 2200, `gain eats over TDEE (delta ${gain.delta})`);
expect(recomp.delta === 0 && recomp.calories === 2200, "recomp sits at maintenance");
expect(maintain.delta === 0 && maintain.calories === 2200, "maintain sits at maintenance");
expect(lean.weeklyRatePct === -0.75, `average band cuts at 0.75%/week (got ${lean.weeklyRatePct})`);
expect(gain.weeklyRatePct === 0.35, `intermediate gains at 0.35%/week (got ${gain.weeklyRatePct})`);
expect(lean.delta >= -500, `lean deficit capped at 500 kcal for non-high body fat (got ${lean.delta})`);
expect(gain.delta <= 500 && gain.delta <= 2200 * 0.2, `surplus capped at min(500, 20% TDEE) (got ${gain.delta})`);
expect(lean.proteinG > gain.proteinG, `lean protein (${lean.proteinG}) exceeds gain protein (${gain.proteinG})`);
expect(gain.carbsG > lean.carbsG, `gain carbs (${gain.carbsG}) exceed lean carbs (${lean.carbsG})`);
expect(recomp.proteinG >= maintain.proteinG, "recomp protein is at least maintenance protein");
expect(lean.guards.length === 0 && gain.guards.length === 0, "complete profile raises no guards");
expect(lean.fatG * 9 >= lean.calories * 0.2 - 9, "fat never below 20% of calories (IOM AMDR)");
expect(lean.carbsG >= 50, "carbs never below 50 g");
expect(Math.abs(lean.fiberG - (lean.calories / 1000) * 14) < 1, "fiber is 14 g / 1000 kcal (IOM)");
expect(lean.waterL === 2.7, "female water target 2.7 L (IOM 2004)");
expect(bodyCompTargets({ ...base, sex: "male", goal: "lean", bodyFatPct: 20 }).waterL === 3.7, "male water target 3.7 L");
expect(lean.mealsPerDay === 4 && lean.perMealProteinG === Math.round(lean.proteinG / 4), "per-meal protein is protein / meals");
expect(lean.perMealProteinPerKg >= 0.4, `lean per-meal protein reaches 0.4 g/kg (got ${lean.perMealProteinPerKg})`);
for (const t of [lean, gain, recomp, maintain]) {
  const macroKcal = t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9;
  expect(Math.abs(macroKcal - t.calories) <= 25, `${t.goal} macros sum to calories (${macroKcal} vs ${t.calories})`);
  expect(t.citations.every((id) => EVIDENCE[id]), `${t.goal} cites only registered evidence`);
  expect(t.citations.includes("mifflin-1990"), `${t.goal} cites the expenditure equation`);
  expect(Math.abs(t.carbRatio + t.fatRatio - 1) < 0.02, `${t.goal} carb+fat ratios sum to 1`);
}
expect(lean.citations.includes("murphy-koehler-2022") && lean.citations.includes("issn-diets-2017"), "lean cites deficit-cap evidence");
expect(gain.citations.includes("iraki-2019"), "gain cites the Iraki surplus review");
expect(recomp.citations.includes("barakat-2020"), "recomp cites Barakat");

// High body fat: faster cut, 750 cap.
const highBf = bodyCompTargets({ ...base, weightKg: 100, tdee: 2800, goal: "lean", bodyFatPct: 40 });
expect(highBf.weeklyRatePct === -1.0, "high body fat cuts at 1%/week");
expect(highBf.delta >= -750 && highBf.delta < -500, `high body fat allows up to 750 kcal deficit (got ${highBf.delta})`);

// Novice gain: bigger surplus, but still capped.
const noviceGain = bodyCompTargets({ ...base, goal: "gain", bodyFatPct: 28, experience: "novice" });
expect(noviceGain.weeklyRatePct === 0.5 && noviceGain.delta >= gain.delta, "novice surplus is at least intermediate surplus");

// Safety guards.
const essential = bodyCompTargets({ ...base, goal: "lean", bodyFatPct: 11 });
expect(essential.guards.some((g) => g.code === "essential-fat"), "essential body fat blocks a deficit");
expect(essential.delta === 0 && essential.calories === 2200, "essential-fat guard holds maintenance");
const underweight = bodyCompTargets({ ...base, goal: "lean", weightKg: 48, heightCm: 170, bodyFatPct: 22 });
expect(underweight.guards.some((g) => g.code === "underweight"), "BMI < 18.5 blocks a deficit");
expect(underweight.delta === 0, "underweight guard holds maintenance");
const noWeight = bodyCompTargets({ ...base, goal: "lean", weightKg: null, tdee: null, bodyFatPct: null });
expect(noWeight.guards.some((g) => g.code === "no-weight") && noWeight.guards.some((g) => g.code === "no-tdee"), "missing profile raises no-weight and no-tdee guards");
expect(noWeight.calories >= 1400, "fallback calories respect the floor");
const floored = bodyCompTargets({ ...base, goal: "lean", tdee: 1500, bodyFatPct: 28 });
expect(floored.calories === 1400, `deficit clips at the calorie floor (got ${floored.calories})`);
expect(floored.notes.some((n) => /floor/i.test(n)), "floor clip is explained");

// Progress verdicts.
const insufficient = progressVerdict({ goal: "lean", weightKg: 70, targetWeeklyKg: -0.5, observedWeeklyKg: -0.5, weighIns: 3, spanDays: 5 });
expect(insufficient.status === "insufficient" && insufficient.adjustKcal === 0, "few weigh-ins → insufficient");
expect(progressVerdict({ goal: "lean", weightKg: 70, targetWeeklyKg: -0.5, observedWeeklyKg: -0.45, weighIns: 10, spanDays: 14 }).status === "on-track", "near target → on-track");
const slow = progressVerdict({ goal: "lean", weightKg: 70, targetWeeklyKg: -0.5, observedWeeklyKg: 0.1, weighIns: 10, spanDays: 14 });
expect(slow.status === "too-slow" && slow.adjustKcal === -125, "gaining on a cut → too-slow, -125 kcal");
const fast = progressVerdict({ goal: "lean", weightKg: 70, targetWeeklyKg: -0.5, observedWeeklyKg: -1.2, weighIns: 10, spanDays: 14 });
expect(fast.status === "too-fast" && fast.adjustKcal === 125, "losing >1%/week → too-fast, +125 kcal");
const gainSlow = progressVerdict({ goal: "gain", weightKg: 70, targetWeeklyKg: 0.25, observedWeeklyKg: -0.1, weighIns: 10, spanDays: 14 });
expect(gainSlow.status === "too-slow" && gainSlow.adjustKcal === 125, "losing on a bulk → too-slow, +125 kcal");
const gainFast = progressVerdict({ goal: "gain", weightKg: 70, targetWeeklyKg: 0.25, observedWeeklyKg: 0.8, weighIns: 10, spanDays: 14 });
expect(gainFast.status === "too-fast" && gainFast.adjustKcal === -125, "gaining >0.5%/week → too-fast, -125 kcal");
expect(progressVerdict({ goal: "maintain", weightKg: 70, targetWeeklyKg: 0, observedWeeklyKg: 0.05, weighIns: 10, spanDays: 14 }).status === "on-track", "maintenance within 0.25% → steady");
expect(progressVerdict({ goal: "recomp", weightKg: 70, targetWeeklyKg: 0, observedWeeklyKg: 0.4, weighIns: 10, spanDays: 14 }).status === "drifting", "recomp drifting up");

// ---------------------------------------------------------------------------
// Foods: every food has a kind; pattern filters exclude the right kinds.
// ---------------------------------------------------------------------------
const kinds = new Set(["meat", "fish", "egg", "dairy", "plant"]);
for (const food of STARTER_FOODS) {
  expect(kinds.has(food.kind), `${food.id} has a food kind`);
  expect(["low", "caution", "high"].includes(food.histamine), `${food.id} has a histamine class`);
}
const chicken = STARTER_FOODS.find((f) => f.id === "food-chicken");
const salmon = STARTER_FOODS.find((f) => f.id === "food-salmon");
const eggs = STARTER_FOODS.find((f) => f.id === "food-eggs");
const tofu = STARTER_FOODS.find((f) => f.id === "food-tofu");
expect(chicken && salmon && eggs && tofu, "reference foods exist");
expect(foodFitsPattern(chicken, "omnivore") && !foodFitsPattern(chicken, "pescatarian"), "chicken is omnivore-only");
expect(foodFitsPattern(salmon, "pescatarian") && !foodFitsPattern(salmon, "vegetarian"), "salmon fits pescatarian, not vegetarian");
expect(foodFitsPattern(eggs, "vegetarian") && !foodFitsPattern(eggs, "vegan"), "eggs fit vegetarian, not vegan");
expect(foodFitsPattern(tofu, "vegan"), "tofu fits vegan");

// ---------------------------------------------------------------------------
// Templates: unique ids, only starter foods, every pattern has plates, and
// every phase has at least one plate per pattern where feasible.
// ---------------------------------------------------------------------------
const templateIds = MEAL_PLAN_TEMPLATES.map((t) => t.id);
expect(templateIds.length === new Set(templateIds).size, "template ids are unique");
expect(MEAL_PLAN_TEMPLATES.length >= 12, `catalog has at least 12 plates (got ${MEAL_PLAN_TEMPLATES.length})`);
const foodIds = new Set(STARTER_FOODS.map((f) => f.id));
for (const t of MEAL_PLAN_TEMPLATES) {
  expect(t.items.length >= 4, `${t.id} has at least four lines`);
  for (const item of t.items) expect(foodIds.has(item.foodId), `${t.id} references starter food ${item.foodId}`);
  expect(t.items.some((i) => i.meal === "breakfast") && t.items.some((i) => i.meal === "dinner"), `${t.id} covers breakfast and dinner`);
  if (t.phases) expect(t.phases.every((p) => BODY_COMP_GOALS.includes(p)), `${t.id} phases are valid`);
}
for (const pattern of ["omnivore", "pescatarian", "vegetarian", "vegan"]) {
  const fitting = MEAL_PLAN_TEMPLATES.filter((t) => templateFitsPattern(t, pattern));
  expect(fitting.length >= 2, `${pattern} has at least two plates (got ${fitting.length})`);
  for (const phase of BODY_COMP_GOALS) {
    const list = templatesFor({ goal: "general", phase, pattern });
    expect(list.length >= 1, `${pattern}/${phase} resolves at least one plate`);
    expect(list.every((t) => templateFitsPattern(t, pattern)), `${pattern}/${phase} never leaks a non-${pattern} plate`);
  }
}
expect(MEAL_PLAN_TEMPLATES.some((t) => templateIsLowHistamine(t)), "at least one low-histamine plate exists");
const lowHist = templatesFor({ goal: "general", phase: "lean", pattern: "omnivore", lowHistamine: true });
expect(lowHist.length >= 1 && lowHist.every(templateIsLowHistamine), "low-histamine filter is hard");

// Lean phase never returns gain-only plates when lean plates exist, and vice versa.
const leanPlates = templatesFor({ goal: "general", phase: "lean", pattern: "omnivore" });
expect(leanPlates.every((t) => !(t.phases && t.phases.every((p) => p === "gain"))), "lean phase excludes gain-only plates");
const gainPlates = templatesFor({ goal: "powerlifting", phase: "gain", pattern: "omnivore" });
expect(gainPlates.every((t) => !(t.phases && t.phases.every((p) => p === "lean"))), "gain phase excludes lean-only plates");
expect(leanPlates.some((t) => t.phases?.includes("lean")), "lean phase surfaces a lean-tagged plate");
expect(gainPlates.some((t) => t.phases?.includes("gain")), "gain phase surfaces a gain-tagged plate");

// ---------------------------------------------------------------------------
// Scaling: every template hits realistic lean and gain targets across patterns,
// and scaling never introduces a food outside the template (pattern leak).
// ---------------------------------------------------------------------------
const scenarios = [
  { name: "lean-f", calories: lean.calories, protein: lean.proteinG },
  { name: "gain-f", calories: gain.calories, protein: gain.proteinG },
  { name: "lean-m", calories: 2100, protein: 170 },
  { name: "gain-m", calories: 3200, protein: 160 },
  { name: "floor", calories: 1400, protein: 130 },
];
for (const t of MEAL_PLAN_TEMPLATES) {
  const allowed = new Set(t.items.map((i) => i.foodId));
  for (const s of scenarios) {
    const items = scalePlanToTargets(t, s.calories, s.protein);
    const totals = planTotals(items);
    expect(items.every((i) => allowed.has(i.foodId)), `${t.id}/${s.name} scaling only uses template foods`);
    expect(items.every((i) => i.servings > 0 && i.servings % 0.5 === 0), `${t.id}/${s.name} servings are positive half-steps`);
    expect(
      Math.abs(totals.calories - s.calories) <= Math.max(150, s.calories * 0.08),
      `${t.id}/${s.name} calories near ${s.calories} (got ${Math.round(totals.calories)})`,
    );
    expect(
      totals.protein >= s.protein - 15 && totals.protein <= s.protein + 25,
      `${t.id}/${s.name} protein near ${s.protein} (got ${Math.round(totals.protein)})`,
    );
  }
}

// Fold to three meals removes the snack slot; four keeps it.
const strength = MEAL_PLAN_TEMPLATES.find((t) => t.id === "strength-plate");
const scaledStrength = scalePlanToTargets(strength, 2600, 180);
expect(scaledStrength.some((i) => i.meal === "snack"), "strength plate has a snack slot at 4 meals");
const three = foldToMealsPerDay(scaledStrength, 3);
expect(three.every((i) => i.meal !== "snack"), "3 meals folds the snack away");
expect(Math.abs(planTotals(three).protein - planTotals(scaledStrength).protein) < 0.01, "folding does not change totals");
expect(foldToMealsPerDay(scaledStrength, 4) === scaledStrength, "4 meals returns the same items");

// ---------------------------------------------------------------------------
// Weekly plan: seven days, rotation, grocery list, deterministic with offset.
// ---------------------------------------------------------------------------
for (const pattern of ["omnivore", "pescatarian", "vegetarian", "vegan"]) {
  for (const phase of ["lean", "gain"]) {
    const targets = phase === "lean" ? lean : gain;
    const week = weeklyPlan({ filter: { goal: "general", phase, pattern }, calories: targets.calories, protein: targets.proteinG, mealsPerDay: 4 });
    expect(week.days.length === 7, `${pattern}/${phase} week has 7 days`);
    expect(week.days.map((d) => d.day).join() === "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "days are Mon–Sun");
    expect(week.grocery.length > 0, `${pattern}/${phase} grocery list is populated`);
    const groceryTotal = week.grocery.reduce((n, g) => n + g.servings, 0);
    const dayTotal = week.days.reduce((n, d) => n + d.items.reduce((m, i) => m + i.servings, 0), 0);
    expect(Math.abs(groceryTotal - dayTotal) < 0.01, `${pattern}/${phase} grocery servings equal the week's servings`);
    for (const d of week.days) {
      expect(d.items.every((i) => foodFitsPattern(STARTER_FOODS.find((f) => f.id === i.foodId), pattern)), `${pattern}/${phase} ${d.day} fits the pattern`);
      expect(Math.abs(d.totals.calories - targets.calories) <= Math.max(150, targets.calories * 0.08), `${pattern}/${phase} ${d.day} calories near target`);
    }
    if (week.templates.length > 1) {
      const shuffled = weeklyPlan({ filter: { goal: "general", phase, pattern }, calories: targets.calories, protein: targets.proteinG, mealsPerDay: 4, offset: 1 });
      expect(shuffled.days[0].template.id === week.days[1].template.id, `${pattern}/${phase} offset shifts Monday's plate`);
    }
  }
}
const omniLean = weeklyPlan({ filter: { goal: "general", phase: "lean", pattern: "omnivore" }, calories: lean.calories, protein: lean.proteinG, mealsPerDay: 4 });
expect(new Set(omniLean.days.map((d) => d.template.id)).size >= 2, "omnivore lean week rotates at least two plates");

// ---------------------------------------------------------------------------
// Wiring: schema, migration, page, actions, links, toast, knowledge article.
// ---------------------------------------------------------------------------
const read = (...p) => fs.readFileSync(path.join(...p), "utf8");
const schema = read("src", "lib", "db", "schema.ts");
for (const col of ["bodyCompGoal", "bodyFatPct", "mealsPerDay", "dietaryPattern"]) expect(schema.includes(col), `schema has ${col}`);
const dbIndex = read("src", "lib", "db", "index.ts");
for (const col of ["body_comp_goal", "body_fat_pct", "meals_per_day", "dietary_pattern"]) expect(dbIndex.includes(col), `migration adds ${col}`);
const authSrc = read("src", "lib", "auth.ts");
for (const col of ["bodyCompGoal", "bodyFatPct", "mealsPerDay", "dietaryPattern"]) expect(authSrc.includes(col), `ProfileRow reads ${col}`);
expect(fs.existsSync(path.join("src", "app", "meal-plan", "page.tsx")), "/meal-plan page exists");
expect(fs.existsSync(path.join("src", "app", "actions", "meal-plan.ts")), "meal-plan server action exists");
for (const c of ["body-comp-form", "targets-card", "week-plan", "evidence-list"]) {
  expect(fs.existsSync(path.join("src", "components", "meal-plan", `${c}.tsx`)), `meal-plan component ${c} exists`);
}
expect(read("src", "app", "nutrition", "page.tsx").includes('"/meal-plan"'), "Eat links to /meal-plan");
expect(read("src", "app", "settings", "page.tsx").includes('"/meal-plan"'), "You links to /meal-plan");
expect(read("src", "lib", "revalidate.ts").includes("/meal-plan"), "nutrition revalidation covers /meal-plan");
expect(read("src", "components", "save-toast.tsx").includes("meal-plan"), "save toast has a meal-plan message");
const articles = read("src", "lib", "knowledge", "articles.ts");
expect(articles.includes('id: "body-composition-nutrition"'), "knowledge article for body-comp nutrition exists");
expect(articles.includes("Murphy & Koehler") && articles.includes("Iraki"), "article cites the deficit cap and surplus sources");
const targetsSrc = read("src", "lib", "nutrition", "targets.ts");
expect(targetsSrc.includes("bodyCompForProfile") && targetsSrc.includes("bodyCompTargets"), "nutritionSpec is wired to body-comp targets");

console.log("assert-meal-plan: ok");
