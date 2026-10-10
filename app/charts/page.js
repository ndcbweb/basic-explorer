import BarChart from "@/components/BarChart";
import { Container, PageHeader } from "@/components/ui";
import { config } from "@/lib/config";
import { compactNumber, formatNumber } from "@/lib/format";
import { avgBlockTime, chainTotals, dailyStats, recentTps } from "@/lib/queries";

export const metadata = { title: "Charts & Statistics" };

const DAYS = 30;

function sum(points, key) {
  return points.reduce((total, p) => total + p[key], 0);
}

export default function ChartsPage() {
  const points = dailyStats(DAYS);
  const totals = chainTotals();
  const blockTime = avgBlockTime();
  const tps = recentTps();

  const summary = [
    { label: "Total Blocks", value: formatNumber(totals.blocks) },
    { label: "Total Transactions", value: formatNumber(totals.txs) },
    { label: "Contracts Deployed", value: formatNumber(totals.contracts) },
    { label: "Tokens Tracked", value: formatNumber(totals.tokens) },
    { label: "Avg Block Time", value: blockTime ? `${blockTime.toFixed(2)} s` : "—" },
    { label: "Recent TPS", value: tps.toFixed(3) },
  ];

  const charts = [
    {
      title: "Daily Transactions",
      body: `Transactions included per day. ${formatNumber(sum(points, "txs"))} in the last ${DAYS} days.`,
      key: "txs",
    },
    {
      title: "Daily Blocks",
      body: `Blocks sealed by validators per day. ${formatNumber(sum(points, "blocks"))} in the last ${DAYS} days.`,
      key: "blocks",
    },
    {
      title: "Average Block Time",
      body: "Mean seconds between consecutive blocks per day.",
      key: "blockTime",
      format: (v) => v.toFixed(2),
      unit: " s",
    },
    {
      title: "Daily Gas Used",
      body: "Total gas consumed by all transactions per day.",
      key: "gas",
    },
    {
      title: "Active Addresses",
      body: "Unique addresses that sent at least one transaction per day.",
      key: "activeAddresses",
    },
  ];

  return (
    <Container>
      <PageHeader title={`${config.chainName} Charts & Statistics`} subtitle={`Network activity over the last ${DAYS} days, from the explorer index`} />

      <section className="card mb-6 grid grid-cols-2 divide-line md:grid-cols-3 lg:grid-cols-6 lg:divide-x">
        {summary.map((item) => (
          <div key={item.label} className="px-5 py-4">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-ink tabular-nums">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {charts.map((chart) => (
          <section key={chart.key} className="card">
            <div className="card-head">
              <h2 className="card-title">{chart.title}</h2>
            </div>
            <div className="p-5">
              <p className="mb-4 text-sm text-muted">{chart.body}</p>
              <BarChart points={points} valueKey={chart.key} format={chart.format || compactNumber} unit={chart.unit || ""} />
            </div>
          </section>
        ))}
      </div>
    </Container>
  );
}
