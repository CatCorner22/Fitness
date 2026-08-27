type DayStatus = "done" | "skipped" | "open" | "today" | "upcoming";

const DAY_UI: Record<
  DayStatus,
  { className: string; label: string }
> = {
  today: { className: "border-copper bg-copper/10 text-copper-2", label: "next" },
  done: { className: "border-moss/40 bg-moss/10 text-moss", label: "done" },
  skipped: { className: "border-line bg-surface text-muted line-through", label: "skip" },
  open: { className: "border-copper-2/50 bg-surface-2 text-copper-2", label: "live" },
  upcoming: { className: "border-line bg-surface text-muted", label: "—" },
};

export function WeekProgressStrip({
  days,
}: {
  days: { id: string; name: string; status: DayStatus }[];
}) {
  return (
    <section className="mb-6" aria-label="This week's sessions">
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted">This week</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {days.map((day) => {
          const ui = DAY_UI[day.status];
          return (
            <div
              key={day.id}
              className={`min-w-[5.5rem] flex-1 rounded-2xl border px-2 py-2 text-center text-xs ${ui.className}`}
              title={day.name}
            >
              <p className="truncate font-medium">{day.name}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide opacity-70">{ui.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
