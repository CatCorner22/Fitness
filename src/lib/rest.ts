/** Seconds of rest to start after a logged set. 0 means skip the timer. */
export function restAfterLoggedSet(options: {
  catalogRestSeconds: number;
  moreSetsRemain: boolean;
  adviceRestSeconds?: number | null;
  useAdvice?: boolean;
}): number {
  const catalog = Number.isFinite(options.catalogRestSeconds) ? options.catalogRestSeconds : 90;
  const advised = options.adviceRestSeconds;
  const rest =
    options.useAdvice && advised != null && Number.isFinite(advised) && advised > 0 ? advised : catalog;
  if (!options.moreSetsRemain || rest <= 0) return 0;
  return rest;
}
