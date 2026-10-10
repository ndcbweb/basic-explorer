const WIDTH = 320;
const HEIGHT = 96;
const PAD_Y = 8;

export default function TxChart({ points }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const step = WIDTH / Math.max(1, points.length - 1);
  const coords = points.map((p, i) => [i * step, HEIGHT - PAD_Y - (p.count / max) * (HEIGHT - PAD_Y * 2)]);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;
  const fmt = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const total = points.reduce((sum, p) => sum + p.count, 0);

  return (
    <figure>
      <figcaption className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-semibold tracking-wide text-muted uppercase">Transaction history · 14 days</span>
        <span className="text-xs text-muted tabular-nums">{total.toLocaleString("en-US")} txns</span>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-24 w-full" preserveAspectRatio="none" role="img" aria-label={`${total} transactions over the last 14 days`}>
        <defs>
          <linearGradient id="txfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2c6bed" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2c6bed" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#txfill)" />
        <path d={line} fill="none" stroke="#2c6bed" strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={p.day} cx={coords[i][0]} cy={coords[i][1]} r="0" vectorEffect="non-scaling-stroke">
            <title>{`${fmt(p.date)}: ${p.count} txns`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-faint">
        <span>{fmt(points[0].date)}</span>
        <span>{fmt(points[points.length - 1].date)}</span>
      </div>
    </figure>
  );
}
