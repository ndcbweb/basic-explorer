import AutoRefresh from "@/components/AutoRefresh";
import { AddressLink, BlockLink, Container, PageHeader, TokenLink } from "@/components/ui";
import { config } from "@/lib/config";
import { compactNumber, formatAmount, formatGwei, formatNumber } from "@/lib/format";
import { gasGuzzlers, recentBaseFees } from "@/lib/queries";
import { rpcBatch } from "@/lib/rpc";

export const metadata = { title: "Gas Tracker" };

const ACTIONS = [
  { name: `${config.currency} Transfer`, gas: 21000n },
  { name: "ERC-20 Transfer", gas: 65000n },
  { name: "ERC-20 Approve", gas: 46000n },
  { name: "NFT Mint", gas: 120000n },
  { name: "NFT Transfer", gas: 85000n },
  { name: "DEX Swap", gas: 150000n },
  { name: "Contract Deployment (small)", gas: 500000n },
];

function median(values) {
  if (!values.length) return 0n;
  const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return sorted[Math.floor(sorted.length / 2)];
}

// Fees on quiet PoA chains are a few wei, so tiny costs are shown in Gwei instead of rounding to 0.
const fmtCost = (wei) => (wei < 10n ** 12n ? `${formatAmount(wei, 9, 9)} Gwei` : formatAmount(wei, 18, 8));

export default async function GasTrackerPage() {
  const [history, gasPriceHex, headHex] = await rpcBatch([
    ["eth_feeHistory", [20, "latest", [10, 50, 90]]],
    ["eth_gasPrice"],
    ["eth_blockNumber"],
  ]).catch(() => [null, null, null]);

  const baseFees = (history?.baseFeePerGas || []).map((v) => BigInt(v));
  const nextBase = baseFees.length ? baseFees[baseFees.length - 1] : BigInt(gasPriceHex || 0);
  const rewards = history?.reward || [];
  const tip = (i) => median(rewards.map((r) => BigInt(r[i] || 0)));
  const tiers = [
    { name: "Low", tone: "text-ok-700", tip: tip(0), wait: "~ 1 block" },
    { name: "Average", tone: "text-brand-600", tip: tip(1), wait: "next block" },
    { name: "High", tone: "text-wait-700", tip: tip(2), wait: "next block" },
  ].map((tier) => ({ ...tier, price: nextBase + tier.tip }));

  const ratios = history?.gasUsedRatio || [];
  const utilisation = ratios.length ? (ratios.reduce((s, r) => s + r, 0) / ratios.length) * 100 : 0;
  const blocks = recentBaseFees(60);
  const maxFee = Math.max(1, ...blocks.map((b) => Number(b.base_fee || 0)));
  const guzzlers = gasGuzzlers(Math.floor(Date.now() / 1000) - 86400);

  return (
    <Container>
      <AutoRefresh intervalMs={10000} />
      <PageHeader
        title={`${config.chainName} Gas Tracker`}
        subtitle={
          <>
            Next block: {headHex ? <BlockLink number={Number(BigInt(headHex)) + 1} /> : "—"} · Base fee {formatGwei(nextBase)} Gwei · Avg utilisation{" "}
            {utilisation.toFixed(1)}%
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <section key={tier.name} className="card p-5 text-center">
            <p className="text-sm font-medium text-muted">{tier.name}</p>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${tier.tone}`}>{formatGwei(tier.price)} Gwei</p>
            <p className="mt-1 text-xs text-muted">
              Base {formatGwei(nextBase)} | Priority {formatGwei(tier.tip)}
            </p>
            <p className="mt-2 text-xs text-faint">{tier.wait}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">Estimated Cost of Transactions</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Action</th>
                <th scope="col" className="text-right">Gas</th>
                <th scope="col" className="text-right">Low</th>
                <th scope="col" className="text-right">Average</th>
                <th scope="col" className="text-right">High</th>
              </tr>
            </thead>
            <tbody>
              {ACTIONS.map((action) => (
                <tr key={action.name}>
                  <td>{action.name}</td>
                  <td className="text-right text-muted tabular-nums">{formatNumber(Number(action.gas))}</td>
                  {tiers.map((tier) => (
                    <td key={tier.name} className="text-right tabular-nums">
                      {fmtCost(action.gas * tier.price)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">Costs in {config.currency} unless marked Gwei. Gas amounts are typical values; real usage depends on the contract.</p>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Base Fee (last {blocks.length} blocks)</h2>
          </div>
          <div className="p-5">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-48 w-full text-brand-500" role="img" aria-label="Base fee per block">
              {blocks.map((b, i) => {
                const h = (Number(b.base_fee || 0) / maxFee) * 38;
                const w = 100 / Math.max(1, blocks.length);
                return (
                  <rect key={b.number} x={i * w + w * 0.15} y={40 - h} width={w * 0.7} height={Math.max(h, 0.3)} fill="currentColor">
                    <title>{`Block ${b.number}: ${formatGwei(b.base_fee || 0)} Gwei`}</title>
                  </rect>
                );
              })}
            </svg>
            <p className="mt-2 text-xs text-muted">Peak {formatGwei(BigInt(maxFee))} Gwei</p>
          </div>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="card-head">
          <h2 className="card-title">Top Gas Guzzlers (24h)</h2>
        </div>
        {guzzlers.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col" className="w-10">#</th>
                <th scope="col">Address</th>
                <th scope="col" className="text-right">Gas Used</th>
                <th scope="col" className="text-right">Txns</th>
                <th scope="col" className="text-right">Fees ({config.currency})</th>
              </tr>
            </thead>
            <tbody>
              {guzzlers.map((row, i) => (
                <tr key={row.address}>
                  <td className="text-muted">{i + 1}</td>
                  <td>{row.name ? <TokenLink address={row.address} name={row.name} symbol={row.symbol} /> : <AddressLink address={row.address} />}</td>
                  <td className="text-right tabular-nums">{compactNumber(row.gas || 0)}</td>
                  <td className="text-right tabular-nums">{formatNumber(row.txs)}</td>
                  <td className="text-right tabular-nums">{((row.fees || 0) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 8 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted">No gas was spent in the last 24 hours.</p>
        )}
      </section>
    </Container>
  );
}
