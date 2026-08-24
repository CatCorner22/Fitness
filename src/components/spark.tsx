export function Spark({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <p className="text-sm text-muted">Log a few morning weights to see a trend.</p>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.1, max - min);
  const w = 640;
  const h = 120;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full">
      <polyline fill="none" stroke="#e07a3d" strokeWidth="3" points={pts} />
    </svg>
  );
}