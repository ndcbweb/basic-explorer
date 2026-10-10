import AutoRefresh from "@/components/AutoRefresh";
import { AddressLink, BlockLink, Container, EmptyState, PageHeader } from "@/components/ui";
import { formatNumber, timeAgo } from "@/lib/format";
import { blockCount, validators } from "@/lib/queries";

export const metadata = { title: "Validators" };

export default function ValidatorsPage() {
  const rows = validators();
  const total = rows.reduce((sum, row) => sum + row.blocks, 0) || 1;
  const now = Math.floor(Date.now() / 1000);

  return (
    <Container>
      <AutoRefresh intervalMs={8000} />
      <PageHeader title="Validators" subtitle={`Proof of Authority signers · ${formatNumber(blockCount())} blocks indexed`} />
      <section className="card overflow-hidden">
        {rows.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col" className="w-14">#</th>
                  <th scope="col">Validator</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Blocks Validated</th>
                  <th scope="col">Share</th>
                  <th scope="col" className="text-right">Last Block</th>
                  <th scope="col" className="text-right">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const share = (row.blocks / total) * 100;
                  const active = now - row.last_seen < 300;
                  return (
                    <tr key={row.address}>
                      <td className="text-muted">{i + 1}</td>
                      <td>
                        <AddressLink address={row.address} full />
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            active ? "border-emerald-200 bg-ok-50 text-ok-700" : "border-line bg-canvas text-muted"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                          {active ? "Sealing" : "Idle"}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">{formatNumber(row.blocks)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${share}%` }} />
                          </div>
                          <span className="text-xs text-muted tabular-nums">{share.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <BlockLink number={row.last_block} />
                      </td>
                      <td className="text-right text-muted">{timeAgo(row.last_seen)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No validators seen yet" body="Signers appear here once their first block is indexed." />
        )}
      </section>
    </Container>
  );
}
