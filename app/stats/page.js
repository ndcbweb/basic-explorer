import { AddressLink, Container, LinkTabs, PageHeader, TokenLink } from "@/components/ui";
import { config } from "@/lib/config";
import { compactNumber, formatNumber } from "@/lib/format";
import { topStatistics } from "@/lib/queries";

export const metadata = { title: "Top Statistics" };

const RANGES = { "24h": 86400, "3d": 3 * 86400, "7d": 7 * 86400 };
const fromWei = (value) => (value / 1e18).toLocaleString("en-US", { maximumFractionDigits: 6 });

function Board({ title, rows, value, unit, token = false }) {
  return (
    <section className="card overflow-hidden">
      <div className="card-head">
        <h2 className="card-title">{title}</h2>
      </div>
      {rows.length ? (
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col" className="w-10">#</th>
              <th scope="col">{token ? "Token" : "Address"}</th>
              <th scope="col" className="text-right">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.address}>
                <td className="text-muted">{i + 1}</td>
                <td>{token ? <TokenLink address={row.address} name={row.name} symbol={row.symbol} /> : <AddressLink address={row.address} />}</td>
                <td className="text-right tabular-nums">{value(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-muted">No activity in this window.</p>
      )}
    </section>
  );
}

export default async function TopStatsPage({ searchParams }) {
  const query = await searchParams;
  const range = RANGES[query?.range] ? query.range : "24h";
  const stats = topStatistics(Math.floor(Date.now() / 1000) - RANGES[range]);

  return (
    <Container>
      <PageHeader title="Top Statistics" subtitle={`The most active accounts and tokens on ${config.chainName}`} />
      <LinkTabs active={range} tabs={Object.keys(RANGES).map((id) => ({ id, label: id.toUpperCase(), href: `/stats?range=${id}` }))} />
      <h2 className="mb-3 text-cap">Transactions</h2>
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Board title="Top Txn Count Sent" rows={stats.senders} unit="Txns" value={(r) => formatNumber(r.n)} />
        <Board title="Top Txn Count Received" rows={stats.receivers} unit="Txns" value={(r) => formatNumber(r.n)} />
        <Board title="Top Txn Fees Paid" rows={stats.feePayers} unit={config.currency} value={(r) => fromWei(r.total)} />
        <Board title={`Top ${config.currency} Sender`} rows={stats.valueSent} unit={config.currency} value={(r) => fromWei(r.total)} />
        <Board title={`Top ${config.currency} Receiver`} rows={stats.valueReceived} unit={config.currency} value={(r) => fromWei(r.total)} />
        <Board title="Top Gas Used (Contracts)" rows={stats.gasUsers} unit="Gas" value={(r) => compactNumber(r.total)} />
      </div>
      <h2 className="mb-3 text-cap">Tokens</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <Board title="Top Transferred Tokens" rows={stats.tokens} unit="Transfers" value={(r) => formatNumber(r.n)} token />
        <Board title="Top Token Senders" rows={stats.tokenSenders} unit="Transfers" value={(r) => formatNumber(r.n)} />
      </div>
    </Container>
  );
}
