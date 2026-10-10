import { compactNumber } from "@/lib/format";

const WIDTH = 300;
const HEIGHT = 80;
const PAD = 6;

function smoothPath(points) {
  if (points.length < 2) return "";
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[Math.max(0, i - 1)];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const [x3, y3] = points[Math.min(points.length - 1, i + 2)];
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6];
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return d;
}

export default function TxChart({ points }) {
  const counts = points.map((p) => p.count);
  const rawMax = Math.max(...counts);
  const rawMin = Math.min(...counts);
  const max = rawMax === rawMin ? rawMax + 1 : rawMax;
  const min = rawMax === rawMin ? Math.max(0, rawMin - 1) : rawMin;
  const step = WIDTH / Math.max(1, points.length - 1);
  const coords = points.map((p, i) => [i * step, PAD + (1 - (p.count - min) / (max - min)) * (HEIGHT - PAD * 2)]);
  const fmt = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const mid = Math.floor(points.length / 2);
  const total = counts.reduce((sum, n) => sum + n, 0);

  return (
    <figure>
      <figcaption className="text-xs font-medium tracking-wide text-muted uppercase">Transaction history in 14 days</figcaption>
      <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-2">
        <div className="flex h-20 flex-col justify-between py-0.5 text-right text-[11px] text-muted tabular-nums">
          <span>{compactNumber(max)}</span>
          <span>{compactNumber(min)}</span>
        </div>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-20 w-full overflow-visible" preserveAspectRatio="none" role="img" aria-label={`${total} transactions over the last 14 days`}>
          <path d={smoothPath(coords)} fill="none" stroke="#1f2937" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          {points.map((p, i) => (
            <rect key={p.day} x={coords[i][0] - step / 2} y="0" width={step} height={HEIGHT} fill="transparent">
              <title>{`${fmt(p.date)}: ${p.count.toLocaleString("en-US")} txns`}</title>
            </rect>
          ))}
        </svg>
        <span />
        <div className="mt-1 flex justify-between text-[11px] text-muted">
          <span>{fmt(points[0].date)}</span>
          <span>{fmt(points[mid].date)}</span>
          <span>{fmt(points[points.length - 1].date)}</span>
        </div>
      </div>
    </figure>
  );
}
