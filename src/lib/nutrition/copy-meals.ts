/** Keep yesterday/plan lines only for meal slots that are still empty today. */
export function itemsForEmptyMeals<T extends { meal: string }>(
  items: T[],
  filledMeals: Iterable<string>,
): T[] {
  const filled = filledMeals instanceof Set ? filledMeals : new Set(filledMeals);
  return items.filter((item) => !filled.has(item.meal));
}
