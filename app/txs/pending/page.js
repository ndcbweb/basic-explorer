import AutoRefresh from "@/components/AutoRefresh";
import { AddressLink, Container, EmptyState, LinkTabs, MethodBadge, PageHeader } from "@/components/ui";
import { config } from "@/lib/config";
import { formatAmount, formatGwei, formatNumber, methodLabel, shortHash } from "@/lib/format";
import { safeRpc } from "@/lib/rpc";

export const metadata = { title: "Pending Transactions" };

function flatten(pool) {
  const rows = [];
  for (const [state, bySender] of Object.entries(pool || {})) {
    for (const byNonce of Object.values(bySender || {})) {
      for (const tx of Object.values(byNonce || {})) rows.push({ ...tx, state });
    }
  }
  return rows;
}

export default async function PendingTxsPage({ searchParams }) {
  const query = await searchParams;
  const view = query?.view === "queued" ? "queued" : "pending";
  const [pool, status] = await Promise.all([safeRpc("txpool_content", [], null), safeRpc("txpool_status", [], null)]);
  const all = flatten(pool);
  const rows = all
    .filter((tx) => tx.state === view)
    .sort((a, b) => {
      const pa = BigInt(a.maxFeePerGas || a.gasPrice || 0);
      const pb = BigInt(b.maxFeePerGas || b.gasPrice || 0);
      return pb > pa ? 1 : pb < pa ? -1 : 0;
    })
    .slice(0, 200);
  const pendingCount = status ? Number(status.pending) : all.filter((tx) => tx.state === "pending").length;
  const queuedCount = status ? Number(status.queued) : all.filter((tx) => tx.state === "queued").length;

  return (
    <Container>
      <AutoRefresh intervalMs={4000} />
      <PageHeader
        title="Pending Transactions"
        subtitle={
          pool
            ? `${formatNumber(pendingCount)} pending and ${formatNumber(queuedCount)} queued transactions in the mempool`
            : "The RPC node does not expose the txpool API"
        }
      />
      <LinkTabs
        active={view}
        tabs={[
          { id: "pending", label: `Pending (${formatNumber(pendingCount)})`, href: "/txs/pending" },
          { id: "queued", label: `Queued (${formatNumber(queuedCount)})`, href: "/txs/pending?view=queued" },
        ]}
      />
      <section className="card overflow-hidden">
        <div className="card-head">
          <p className="text-sm text-muted">
            {view === "pending"
              ? "Executable transactions waiting to be included in the next block, highest fee first"
              : "Transactions held back by a nonce gap or insufficient balance"}
          </p>
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Txn Hash</th>
                  <th scope="col">Method</th>
                  <th scope="col" className="text-right">Nonce</th>
                  <th scope="col">From</th>
                  <th scope="col">To</th>
                  <th scope="col" className="text-right">Amount</th>
                  <th scope="col" className="text-right">Gas Limit</th>
                  <th scope="col" className="text-right">Gas Price</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((tx) => (
                  <tr key={tx.hash}>
                    <td>
                      <span className="mono text-ink" title={tx.hash}>
                        {shortHash(tx.hash, 10, 6)}
                      </span>
                    </td>
                    <td>
                      <MethodBadge method={methodLabel(tx.input, tx.to)} />
                    </td>
                    <td className="text-right tabular-nums">{Number(tx.nonce)}</td>
                    <td>
                      <AddressLink address={tx.from?.toLowerCase()} />
                    </td>
                    <td>{tx.to ? <AddressLink address={tx.to.toLowerCase()} /> : <span className="chip">Contract Creation</span>}</td>
                    <td className="text-right tabular-nums">
                      {formatAmount(BigInt(tx.value || 0).toString())} <span className="text-muted">{config.currency}</span>
                    </td>
                    <td className="text-right text-muted tabular-nums">{formatNumber(Number(tx.gas))}</td>
                    <td className="text-right text-muted tabular-nums">
                      {tx.maxFeePerGas || tx.gasPrice ? `${formatGwei(tx.maxFeePerGas || tx.gasPrice)} Gwei` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={view === "pending" ? "No pending transactions" : "No queued transactions"}
            body="The mempool is empty right now. New transactions show up here until a validator seals them into a block."
          />
        )}
      </section>
    </Container>
  );
}
