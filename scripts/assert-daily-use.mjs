import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { STARTER_FOODS } from "../src/lib/nutrition/starter-foods.ts";
import { itemsForEmptyMeals } from "../src/lib/nutrition/copy-meals.ts";
import { EQUIPMENT_OPTIONS } from "../src/lib/equipment.ts";
import { restAfterLoggedSet } from "../src/lib/rest.ts";
import { todayISO, yesterdayISO, optionalNumber, convertDisplayHeight, convertDisplayWeight, displayHeightToCm, displayWeightToKg } from "../src/lib/utils.ts";
import { getMealPlanTemplate, scalePlanToTargets } from "../src/lib/nutrition/meal-plans.ts";
import { getSpiritConfig, resolveReads } from "../src/lib/spirit/config.ts";
import { resolveAuthSecret } from "../src/lib/auth-secret.ts";
import { scheduledProgramDays } from "../src/lib/programs/schedule.ts";

function expect(condition, message) {
  assert.ok(condition, message);
}

const foodIds = STARTER_FOODS.map((f) => f.id);
expect(foodIds.length === new Set(foodIds).size, "starter food ids are unique");
expect(foodIds.includes("food-coffee"), "daily staples include coffee");
expect(foodIds.includes("food-overnight-oats"), "daily staples include overnight oats");
for (const food of STARTER_FOODS) {
  expect(food.calories >= 0 && food.protein >= 0, `${food.id} macros are non-negative`);
}

const eqValues = EQUIPMENT_OPTIONS.map((e) => e.value);
expect(eqValues.length === new Set(eqValues).size, "equipment option values are unique");

const typesSrc = fs.readFileSync(path.join("src", "lib", "types.ts"), "utf8");
const eqUnion = typesSrc.match(/export type Equipment =([\s\S]*?);/);
expect(Boolean(eqUnion), "Equipment union is present");
const typeValues = [...eqUnion[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]).sort();
expect(
  JSON.stringify([...eqValues].sort()) === JSON.stringify(typeValues),
  `equipment options match Equipment type (options=${[...eqValues].sort()} type=${typeValues})`,
);

const noon = new Date(2026, 7, 26, 12, 0, 0);
expect(todayISO(noon) === "2026-08-26", "todayISO uses local calendar date");
expect(yesterdayISO(noon) === "2026-08-25", "yesterdayISO is the previous local day");
const midnight = new Date(2026, 7, 26, 0, 5, 0);
expect(yesterdayISO(midnight) === "2026-08-25", "yesterdayISO is stable just after midnight");

expect(restAfterLoggedSet({ catalogRestSeconds: 90, moreSetsRemain: true }) === 90, "normal rest starts");
expect(restAfterLoggedSet({ catalogRestSeconds: 0, moreSetsRemain: true }) === 0, "flow rest 0 skips the timer");
expect(restAfterLoggedSet({ catalogRestSeconds: 90, moreSetsRemain: false }) === 0, "last set skips rest");
expect(
  restAfterLoggedSet({
    catalogRestSeconds: 0,
    moreSetsRemain: true,
    adviceRestSeconds: 90,
    useAdvice: false,
  }) === 0,
  "offline silent rest does not override catalog 0",
);
expect(
  restAfterLoggedSet({
    catalogRestSeconds: 45,
    moreSetsRemain: true,
    adviceRestSeconds: 120,
    useAdvice: true,
  }) === 120,
  "live advice rest wins when opted in",
);
expect(
  restAfterLoggedSet({
    catalogRestSeconds: 0,
    moreSetsRemain: true,
    adviceRestSeconds: 0,
    useAdvice: true,
  }) === 0,
  "advice rest 0 keeps the catalog skip",
);

const copied = itemsForEmptyMeals(
  [
    { meal: "breakfast", foodId: "food-eggs" },
    { meal: "lunch", foodId: "food-chicken" },
    { meal: "lunch", foodId: "food-rice" },
  ],
  ["breakfast"],
);
expect(copied.length === 2 && copied.every((row) => row.meal === "lunch"), "copy skips meals already logged today");
expect(itemsForEmptyMeals([{ meal: "snack" }], ["snack"]).length === 0, "fully overlapping day copies nothing");

expect(Number.isNaN(optionalNumber("")), "blank string is not a number");
expect(Number.isNaN(optionalNumber(null)), "null is not a number");
expect(optionalNumber("8") === 8, "numeric string parses");
expect(convertDisplayWeight(180, "lb", "kg") === 81.6, "180 lb converts to kg for the units fields");
expect(Math.abs(convertDisplayHeight(70, "lb", "kg") - 177.8) < 0.2, "70 in converts to cm");
expect(Math.abs((displayWeightToKg(82, "kg") ?? 0) - 82) < 0.01, "82 kg stores as 82 kg");
expect(Math.abs((displayHeightToCm(178, "kg") ?? 0) - 178) < 0.01, "178 cm stores as 178 cm");

function planTotals(id, calories, protein) {
  const template = getMealPlanTemplate(id);
  expect(Boolean(template), `meal plan ${id} exists`);
  const items = scalePlanToTargets(template, calories, protein);
  return items.reduce(
    (acc, item) => {
      acc.calories += item.calories;
      acc.protein += item.protein;
      return acc;
    },
    { calories: 0, protein: 0 },
  );
}

for (const [id, calories, protein] of [
  ["plant-forward", 1500, 168],
  ["low-histamine-plate", 1500, 168],
  ["strength-plate", 1600, 192],
]) {
  const totals = planTotals(id, calories, protein);
  expect(
    Math.abs(totals.calories - calories) <= 120,
    `${id} calories stay near ${calories} (got ${Math.round(totals.calories)})`,
  );
  expect(
    Math.abs(totals.protein - protein) <= 12,
    `${id} protein stays near ${protein} (got ${Math.round(totals.protein)})`,
  );
}

expect(scheduledProgramDays(["a", "b", "c", "d", "e", "f"], 3).join() === "a,b,c", "3-day week keeps the first three programmed days");
expect(scheduledProgramDays(["a", "b"], 6).join() === "a,b", "days-per-week cannot invent extra sessions");
expect(scheduledProgramDays(["a", "b", "c"], 0).join() === "a", "zero days still schedules one session");
expect(scheduledProgramDays([], 4).length === 0, "empty program stays empty");

const plansSrc = fs.readFileSync(path.join("src", "lib", "nutrition", "meal-plans.ts"), "utf8");
const planFoodIds = [...plansSrc.matchAll(/line\("([^"]+)"/g)].map((m) => m[1]);
const missingPlanFoods = [...new Set(planFoodIds)].filter((id) => !foodIds.includes(id));
expect(missingPlanFoods.length === 0, `meal plans only reference starter foods: ${missingPlanFoods}`);

const loadSrc = fs.readFileSync(path.join("src", "lib", "autoregulation.ts"), "utf8");
expect(loadSrc.includes("No history yet"), "suggestNextLoad has a no-history reason");
expect(loadSrc.includes("overshot the target"), "suggestNextLoad has an overshoot reason");
expect(loadSrc.includes("under target"), "suggestNextLoad has an undershoot reason");
expect(loadSrc.includes("Repeat the load"), "suggestNextLoad has a match-window reason");

expect(!getSpiritConfig({}).enabled, "Spirit stays offline without AI keys");
expect(getSpiritConfig({ AI_GATEWAY_API_KEY: "k" }).enabled, "AI_GATEWAY_API_KEY enables Spirit");
// Only a gateway key may enable Spirit — the gateway client cannot
// authenticate with an OpenAI or HF key, so those must stay offline.
expect(!getSpiritConfig({ OPENAI_API_KEY: "k" }).enabled, "OPENAI_API_KEY alone keeps Spirit offline");
expect(!getSpiritConfig({ HF_TOKEN: "hf" }).enabled, "HF_TOKEN alone keeps Spirit offline");
expect(getSpiritConfig({ GARANIMAL_LIVE_MODEL: "openai/fast" }).liveModel === "openai/fast", "GARANIMAL_LIVE_MODEL routes live coaching");
expect(getSpiritConfig({ GARANIMAL_CHAT_MODEL: "openai/chat" }).chatModel === "openai/chat", "GARANIMAL_CHAT_MODEL routes chat");
expect(getSpiritConfig({ GARANIMAL_AI_MODEL: "openai/shared" }).liveModel === "openai/shared", "GARANIMAL_AI_MODEL is the shared default");
expect(resolveReads({}) === 1 && resolveReads({ SPIRIT_READS: "2" }) === 2, "SPIRIT_READS clamps to 1–3");
expect(resolveReads({ SPIRIT_READS: "9" }) === 3, "SPIRIT_READS max is 3");
expect(resolveReads({ SPIRIT_READS: "nope" }) === 1, "invalid SPIRIT_READS falls back to 1");

expect(resolveAuthSecret({ AUTH_SECRET: "garanimal-dev-secret-change-me-please-32b", NODE_ENV: "development" }).length >= 32, "dev AUTH_SECRET from .env.local is accepted");
expect(resolveAuthSecret({ NODE_ENV: "development" }).length >= 32, "dev fallback secret is long enough");

const example = fs.readFileSync(".env.example", "utf8");
for (const name of [
  "AUTH_SECRET",
  "TZ",
  "GARANIMAL_DATA_DIR",
  "DATABASE_PATH",
  "AI_GATEWAY_API_KEY",
  "GARANIMAL_AI_MODEL",
  "GARANIMAL_LIVE_MODEL",
  "GARANIMAL_CHAT_MODEL",
  "HF_TOKEN",
  "SPIRIT_READS",
  "GARANIMAL_PIONEER_MODEL",
  "PIONEER_READS",
  "PIONEER_DISABLED",
  "PIONEER_KILL",
  "PIONEER_LADDER_RESET",
  "HUGGINGFACE_HUB_TOKEN",
]) {
  expect(example.includes(name), `.env.example documents ${name}`);
}

const code = [
  fs.readFileSync("src/lib/db/index.ts", "utf8"),
  fs.readFileSync("src/lib/auth-secret.ts", "utf8"),
  fs.readFileSync("src/lib/spirit/config.ts", "utf8"),
  fs.readFileSync("src/lib/spirit/provider.ts", "utf8"),
  fs.readFileSync("src/lib/spirit/embeddings.ts", "utf8"),
  fs.readFileSync("src/lib/pioneer/config.ts", "utf8"),
  fs.readFileSync("src/lib/pioneer/persist-ladder.ts", "utf8"),
].join("\n");
for (const name of [
  "AUTH_SECRET",
  "GARANIMAL_DATA_DIR",
  "DATABASE_PATH",
  "AI_GATEWAY_API_KEY",
  "GARANIMAL_AI_MODEL",
  "GARANIMAL_LIVE_MODEL",
  "GARANIMAL_CHAT_MODEL",
  "HF_TOKEN",
  "HUGGINGFACE_HUB_TOKEN",
  "SPIRIT_READS",
  "GARANIMAL_PIONEER_MODEL",
  "PIONEER_READS",
  "PIONEER_DISABLED",
  "PIONEER_KILL",
  "PIONEER_LADDER_RESET",
]) {
  expect(code.includes(name), `runtime code reads ${name}`);
}

function hasWord(q, word) {
  return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(q);
}

expect(!hasWord("what should i eat for breakfast", "fast"), "breakfast does not match fasting word");
expect(hasWord("how do i start fasting", "fasting"), "fasting word matches");
expect(hasWord("what should i eat for breakfast", "eat"), "eat word matches in breakfast question");
expect(!hasWord("how do i pass this class", "ass"), "class does not match glute ass word");
expect(hasWord("build a bigger ass", "ass"), "ass word matches glute question");

const youPage = fs.readFileSync(path.join("src", "app", "settings", "page.tsx"), "utf8");
expect(youPage.includes('"/course"') && youPage.includes("Nyx course"), "You keeps a first-class Nyx course link");
expect(youPage.includes("LookStudio"), "kawaii Look studio stays on You");
expect(youPage.includes('value="garanimal"') && youPage.includes("Goggins"), "Goggins / Garanimal voice stays");
expect(youPage.includes("<details") && youPage.includes("Look and kawaii avatars"), "Look sits in a drill-down, not deleted");
const courseIndex = fs.readFileSync(path.join("src", "app", "course", "page.tsx"), "utf8");
expect(courseIndex.includes("Nyx courses"), "Nyx course index stays");
expect(fs.existsSync(path.join("src", "components", "kawaii-avatar.tsx")), "kawaii avatar component stays");

console.log("assert-daily-use: ok");
