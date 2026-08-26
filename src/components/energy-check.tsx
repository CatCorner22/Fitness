import { logCheckinAction } from "@/app/actions/profile";

export function EnergyCheck({ fatigue }: { fatigue: number | null }) {
  if (fatigue != null) {
    return (
      <p className="text-sm text-muted">
        Energy today: {fatigue}/5
      </p>
    );
  }

  return (
    <form action={logCheckinAction} className="rounded-3xl border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-copper">Energy</p>
      <p className="mt-1 text-sm text-muted">How recovered do you feel? Coach uses this.</p>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="submit"
            name="fatigue"
            value={n}
            className="min-h-12 rounded-2xl border border-line bg-bg-2 text-sm font-semibold hover:border-copper/50 hover:text-copper-2"
          >
            {n}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted">1 wiped · 5 ready</p>
    </form>
  );
}
