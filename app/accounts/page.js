import { AddressLink, BlockLink, Container, EmptyState, PageHeader } from "@/components/ui";
import { config } from "@/lib/config";
import { formatAmount, formatNumber } from "@/lib/format";
import { topAccounts } from "@/lib/queries";
import { rpcBatch } from "@/lib/rpc";

export const metadata = { title: "Top Accounts" };

export default async function AccountsPage() {
  const accounts = topAccounts(50);
  const balances = await rpcBatch(accounts.map((account) => ["eth_getBalance", [account.address, "latest"]])).catch(() => []);
  const rows = accounts
    .map((account, i) => ({ ...account, balance: balances[i] ? BigInt(balances[i]) : 0n }))
    .sort((a, b) => (b.balance > a.balance ? 1 : b.balance < a.balance ? -1 : b.tx_count - a.tx_count));

  return (
    <Container>
      <PageHeader title="Top Accounts" subtitle={`Most active ${formatNumber(rows.length)} addresses, ranked by ${config.currency} balance`} />
      <section className="card overflow-hidden">
        {rows.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col" className="w-14">Rank</th>
                  <th scope="col">Address</th>
                  <th scope="col" className="text-right">Balance</th>
                  <th scope="col" className="text-right">Txn Count</th>
                  <th scope="col" className="text-right">Last Active Block</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.address}>
                    <td className="text-muted">{i + 1}</td>
                    <td>
                      <AddressLink address={row.address} full />
                    </td>
                    <td className="text-right tabular-nums">
                      {formatAmount(row.balance, 18, 4)} <span className="text-muted">{config.currency}</span>
                    </td>
                    <td className="text-right tabular-nums">{formatNumber(row.tx_count)}</td>
                    <td className="text-right">
                      <BlockLink number={row.last_block} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No accounts yet" body="Accounts appear once they send or receive a transaction." />
        )}
      </section>
    </Container>
  );
}
