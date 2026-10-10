import { diffStats } from "@/lib/diff";

const ROW = {
  same: { cls: "text-ink", sign: " " },
  add: { cls: "bg-ok-50 text-ok-700", sign: "+" },
  del: { cls: "bg-bad-50 text-bad-700", sign: "-" },
  skip: { cls: "bg-subtle text-faint", sign: "" },
};

const CONTEXT = 3;

/** Replaces long runs of unchanged lines with a single "skipped" marker. */
function collapse(rows) {
  const out = [];
  let i = 0;
  while (i < rows.length) {
    if (rows[i].type !== "same") {
      out.push(rows[i++]);
      continue;
    }
    let j = i;
    while (j < rows.length && rows[j].type === "same") j++;
    const head = i === 0 ? 0 : CONTEXT;
    const tail = j === rows.length ? 0 : CONTEXT;
    if (j - i > head + tail + 2) {
      out.push(...rows.slice(i, i + head));
      out.push({ type: "skip", text: `… ${j - i - head - tail} unchanged lines …` });
      out.push(...rows.slice(j - tail, j));
    } else {
      out.push(...rows.slice(i, j));
    }
    i = j;
  }
  return out;
}

/** Unified line diff produced by lib/diff.js diffLines(). */
export default function DiffView({ rows: allRows, leftLabel = "A", rightLabel = "B" }) {
  const stats = diffStats(allRows);
  const rows = collapse(allRows);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3 text-sm">
        <span className="chip border-bad-700/25 bg-bad-50 text-bad-700">−{stats.removed} only in {leftLabel}</span>
        <span className="chip border-ok-700/25 bg-ok-50 text-ok-700">+{stats.added} only in {rightLabel}</span>
        <span className="text-muted">{stats.same} identical lines</span>
      </div>
      {stats.added === 0 && stats.removed === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">Both inputs are identical.</p>
      ) : (
        <div className="max-h-[720px] overflow-auto">
          <table className="mono w-full border-collapse text-[12.5px] leading-relaxed">
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={ROW[row.type].cls}>
                  <td className="w-12 border-r border-line px-2 text-right text-faint select-none">{row.a ?? ""}</td>
                  <td className="w-12 border-r border-line px-2 text-right text-faint select-none">{row.b ?? ""}</td>
                  <td className="w-5 px-1 text-center select-none">{ROW[row.type].sign}</td>
                  <td className="pr-4 whitespace-pre">{row.text || " "}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
