import { FAST_FOOD_BY_ID } from "@/lib/nutrition/fast-food";
import type { HistamineLoad } from "./histamine";
import { STARTER_FOODS } from "./starter-foods";

export type { HistamineLoad } from "./histamine";
export { STARTER_FOODS } from "./starter-foods";
export { HISTAMINE_LABEL, LOW_HISTAMINE_STAPLES, histamineRank } from "./histamine";

const HISTAMINE_BY_ID = new Map(STARTER_FOODS.map((food) => [food.id, food.histamine]));

export function histamineLoad(foodId: string | null | undefined): HistamineLoad | null {
  if (!foodId) return null;
  return HISTAMINE_BY_ID.get(foodId) ?? FAST_FOOD_BY_ID.get(foodId)?.histamine ?? null;
}
