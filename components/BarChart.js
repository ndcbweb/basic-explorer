import { compactNumber } from "@/lib/format";

const fmtDay = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** Daily bar chart in plain SVG; bars inherit the brand colour so it follows the theme. */
export default function BarChart({ points, valueKey, format = compactNumber, unit = "" }) {
  const values = points.map((p) => p[valueKey]);
  const max = Math.max(1, ...values);
  const width = 100 / points.length;
  const mid = Math.floor(points.length / 2);

  return (
    <div>
      <div className="grid grid-cols-[auto_1fr] gap-x-2">
        <div className="flex h-40 flex-col justify-between text-right text-[11px] text-muted tabular-nums">
          <span>{format(max)}</span>
          <span>{format(max / 2)}</span>
          <span>0</span>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full text-brand-500" role="img" aria-label={`${valueKey} per day`}>
          {[0, 50, 100].map((y) => (
            <line key={y} x1="0" x2="100" y1={y} y2={y} className="text-line" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          {points.map((p, i) => {
            const h = (p[valueKey] / max) * 100;
            return (
              <rect key={p.day} x={i * width + width * 0.15} y={100 - h} width={width * 0.7} height={h} fill="currentColor" rx="0.4">
                <title>{`${fmtDay(p.date)}: ${format(p[valueKey])}${unit}`}</title>
              </rect>
            );
          })}
        </svg>
        <span />
        <div className="mt-1 flex justify-between text-[11px] text-muted">
          <span>{fmtDay(points[0].date)}</span>
          <span>{fmtDay(points[mid].date)}</span>
          <span>{fmtDay(points[points.length - 1].date)}</span>
        </div>
      </div>
    </div>
  );
}
