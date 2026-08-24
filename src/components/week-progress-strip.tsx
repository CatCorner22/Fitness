type DayStatus = "done" | "skipped" | "open" | "today" | "upcoming";

export function WeekProgressStrip({
  days,
}: {
  days: { id: string; name: string; status: DayStatus }[];
}) {
  return (
    <section className="mb-6" aria-label="This week's sessions">
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted">This week</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
      {days.map((day) => (
        <div
          key={day.id}
          className={`min-w-[5.5rem] flex-1 rounded-2xl border px-2 py-2 text-center text-xs ${
            day.status === "today"
              ? "border-copper bg-copper/10 text-copper-2"
              : day.status === "done"
                ? "border-moss/40 bg-moss/10 text-moss"
                : day.status === "skipped"
                  ? "border-line bg-surface text-muted line-through"
                  : day.status === "open"
                    ? "border-copper-2/50 bg-surface-2 text-copper-2"
                    : "border-line bg-surface text-muted"
          }`}
          title={day.name}
        >
          <p className="truncate font-medium">{day.name}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide opacity-70">
            {day.status === "done"
              ? "done"
              : day.status === "skipped"
                ? "skip"
                : day.status === "open"
                  ? "live"
                  : day.status === "today"
                    ? "next"
                    : "—"}
          </p>
        </div>
      ))}
      </div>
    </section>
  );
}
