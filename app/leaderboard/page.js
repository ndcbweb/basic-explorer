import { AddressLink, Container, EmptyState, LinkTabs, PageHeader, TokenLink } from "@/components/ui";
import { config } from "@/lib/config";
import { compactNumber, formatNumber } from "@/lib/format";
import { contractLeaderboard } from "@/lib/queries";

export const metadata = { title: "Leaderboard" };

const RANGES = { "24h": 86400, "7d": 7 * 86400, "30d": 30 * 86400, all: null };

export default async function LeaderboardPage({ searchParams }) {
  const query = await searchParams;
  const range = query?.range in RANGES ? query.range : "7d";
  const since = RANGES[range] ? Math.floor(Date.now() / 1000) - RANGES[range] : 0;
  const rows = contractLeaderboard(since);

  return (
    <Container>
      <PageHeader title="Leaderboard" subtitle={`Smart contracts on ${config.chainName} ranked by unique users`} />
      <LinkTabs
        active={range}
        tabs={Object.keys(RANGES).map((id) => ({ id, label: id === "all" ? "All Time" : id.toUpperCase(), href: `/leaderboard?range=${id}` }))}
      />
      <section className="card overflow-hidden">
        {rows.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col" className="w-12">Rank</th>
                  <th scope="col">Contract</th>
                  <th scope="col">Type</th>
                  <th scope="col" className="text-right">Unique Users</th>
                  <th scope="col" className="text-right">Transactions</th>
                  <th scope="col" className="text-right">Gas Used</th>
                  <th scope="col" className="text-right">Fees ({config.currency})</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.address}>
                    <td className="text-muted">{i + 1}</td>
                    <td>{row.name || row.symbol ? <TokenLink address={row.address} name={row.name} symbol={row.symbol} /> : <AddressLink address={row.address} />}</td>
                    <td>
                      <span className="chip">{row.token_type || "Contract"}</span>
                    </td>
                    <td className="text-right tabular-nums">{formatNumber(row.users)}</td>
                    <td className="text-right tabular-nums">{formatNumber(row.txs)}</td>
                    <td className="text-right tabular-nums">{compactNumber(row.gas || 0)}</td>
                    <td className="text-right tabular-nums">{((row.fees || 0) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 6 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No contract activity in this window" body="Contracts appear here once users start calling them." />
        )}
      </section>
    </Container>
  );
}
