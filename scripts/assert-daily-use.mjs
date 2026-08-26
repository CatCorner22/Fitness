import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { STARTER_FOODS } from "../src/lib/nutrition/foods.ts";
import { itemsForEmptyMeals } from "../src/lib/nutrition/copy-meals.ts";
import { EQUIPMENT_OPTIONS } from "../src/lib/equipment.ts";
import { restAfterLoggedSet } from "../src/lib/rest.ts";
import { todayISO, yesterdayISO } from "../src/lib/utils.ts";
import { getSpiritConfig, resolveReads } from "../src/lib/spirit/config.ts";
import { resolveAuthSecret } from "../src/lib/auth-secret.ts";

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
expect(getSpiritConfig({ OPENAI_API_KEY: "k" }).enabled, "OPENAI_API_KEY enables Spirit");
expect(getSpiritConfig({ HF_TOKEN: "hf" }).semanticSearch, "HF_TOKEN enables semantic search");
expect(getSpiritConfig({ HUGGINGFACE_HUB_TOKEN: "hf" }).semanticSearch, "HUGGINGFACE_HUB_TOKEN alias works");
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
  "GARANIMAL_HF_MODEL",
  "SPIRIT_READS",
  "OPENAI_API_KEY",
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
  fs.readFileSync("src/lib/ai/spirit.ts", "utf8"),
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
  "GARANIMAL_HF_MODEL",
  "SPIRIT_READS",
  "OPENAI_API_KEY",
]) {
  expect(code.includes(name), `runtime code reads ${name}`);
}

console.log("assert-daily-use: ok");
