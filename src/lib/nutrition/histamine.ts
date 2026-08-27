export type HistamineLoad = "low" | "caution" | "high";

export const HISTAMINE_LABEL: Record<HistamineLoad, string> = {
  low: "usually tolerated",
  caution: "reintroduce carefully",
  high: "often avoided",
};

export const LOW_HISTAMINE_STAPLES = [
  "food-eggs",
  "food-chicken",
  "food-turkey",
  "food-rice",
  "food-potato",
  "food-apple",
] as const;

export function histamineRank(load: HistamineLoad | null | undefined) {
  if (load === "low") return 0;
  if (load == null) return 1;
  if (load === "caution") return 2;
  return 3;
}
