import { logCheckinAction } from "@/app/actions/profile";

export function EnergyCheck({ fatigue }: { fatigue: number | null }) {
  return (
    <form action={logCheckinAction} className="rounded-3xl border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-copper">Energy</p>
      <p className="mt-1 text-sm text-muted">How recovered do you feel? 1 is wiped. 5 is ready. Coach uses this.</p>
      <div className="mt-3 grid grid-cols-5 gap-2" role="group" aria-label="Energy from 1 wiped to 5 ready">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="submit"
            name="fatigue"
            value={n}
            aria-pressed={fatigue === n}
            aria-label={`Energy ${n} of 5${n === 1 ? ", wiped" : n === 5 ? ", ready" : ""}`}
            className={`min-h-12 rounded-2xl border text-sm font-semibold ${
              fatigue === n
                ? "border-copper bg-copper/15 text-copper-2"
                : "border-line bg-bg-2 hover:border-copper/50 hover:text-copper-2"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">1 wiped · 5 ready</p>
    </form>
  );
}
