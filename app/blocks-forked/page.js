import ListPage, { Notice } from "@/components/ListPage";
import { AddressLink, BlockLink, EmptyState } from "@/components/ui";
import { config } from "@/lib/config";
import { formatNumber, shortHash, timeAgo } from "@/lib/format";
import { forkedBlockCount, forkedBlocks, pageParams } from "@/lib/queries";

export const metadata = { title: "Forked Blocks (Reorgs)" };

export default async function ForkedBlocksPage({ searchParams }) {
  const query = await searchParams;
  const { page, limit, offset } = pageParams(query);
  const total = forkedBlockCount();
  const rows = forkedBlocks({ limit, offset });

  return (
    <ListPage
      title="Forked Blocks (Reorgs)"
      subtitle={`${formatNumber(total)} blocks were replaced by a chain reorganisation`}
      basePath="/blocks-forked"
      page={page}
      total={total}
      limit={limit}
      note="Blocks the explorer had indexed that later dropped off the canonical chain"
      above={
        total === 0 ? (
          <Notice title="No reorgs observed">
            Validators on {config.chainName} take turns producing blocks, so reorganisations are rare. If competing blocks are ever produced,
            the losing ones are recorded here.
          </Notice>
        ) : null
      }
    >
      {rows.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Block</th>
                <th scope="col">Forked Block Hash</th>
                <th scope="col">Block Age</th>
                <th scope="col">Txn</th>
                <th scope="col">Sealed By</th>
                <th scope="col" className="text-right">Detected</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.hash}>
                  <td>
                    <BlockLink number={row.number} />
                  </td>
                  <td className="text-muted" title={row.hash}>
                    {shortHash(row.hash, 12, 8)}
                  </td>
                  <td className="text-muted">{timeAgo(row.timestamp)}</td>
                  <td>{row.tx_count}</td>
                  <td>
                    <AddressLink address={row.signer} />
                  </td>
                  <td className="text-right text-muted">{timeAgo(row.detected_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No forked blocks" body="Reorganised blocks appear here as soon as the indexer detects them." />
      )}
    </ListPage>
  );
}
