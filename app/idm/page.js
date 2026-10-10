import { IdmDecodeForm, IdmSendForm } from "@/components/tools/IdmTools";
import { AddressLink, Container, EmptyState, PageHeader, Pagination, TxLink } from "@/components/ui";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { formatNumber, timeAgo } from "@/lib/format";

export const metadata = { title: "Input Data Messages (IDM)" };

const PAGE_SIZE = 25;

export default async function IdmPage({ searchParams }) {
  const query = await searchParams;
  const page = Math.max(1, Number.parseInt(query?.p, 10) || 1);
  const total = db().prepare("SELECT COUNT(*) AS n FROM txs WHERE idm IS NOT NULL").get().n;
  const rows = db()
    .prepare(
      `SELECT hash, from_addr, to_addr, contract_address, idm, timestamp FROM txs WHERE idm IS NOT NULL
       ORDER BY block_number DESC, tx_index DESC LIMIT ? OFFSET ?`
    )
    .all(PAGE_SIZE, (page - 1) * PAGE_SIZE);

  return (
    <Container>
      <PageHeader
        title="Input Data Messages (IDM)"
        subtitle={`Messages written into the input data of ${config.chainName} transactions · ${formatNumber(total)} found`}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card min-w-0 overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">Latest messages</h2>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/idm" />
          </div>
          {rows.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Txn Hash</th>
                    <th scope="col">Age</th>
                    <th scope="col">From</th>
                    <th scope="col">To</th>
                    <th scope="col">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.hash}>
                      <td>
                        <TxLink hash={row.hash} />
                      </td>
                      <td className="text-muted">{timeAgo(row.timestamp)}</td>
                      <td>
                        <AddressLink address={row.from_addr} />
                      </td>
                      <td>
                        <AddressLink address={row.to_addr || row.contract_address} />
                      </td>
                      <td className="max-w-[360px] truncate" title={row.idm}>
                        {row.idm}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No input data messages yet" body="Transactions whose input data is readable UTF-8 text show up here." />
          )}
          {total > PAGE_SIZE && (
            <div className="flex justify-end border-t border-line px-5 py-3">
              <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/idm" />
            </div>
          )}
        </section>
        <aside className="space-y-6">
          <div className="card p-5">
            <h2 className="card-title mb-3">Send a message</h2>
            <IdmSendForm chainId={config.chainId} />
          </div>
          <div className="card p-5">
            <h2 className="card-title mb-3">Decode a transaction</h2>
            <IdmDecodeForm />
          </div>
        </aside>
      </div>
    </Container>
  );
}
