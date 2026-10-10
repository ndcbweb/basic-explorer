import ListPage, { Notice } from "@/components/ListPage";
import { AddressLink, BlockLink, EmptyState } from "@/components/ui";
import { config } from "@/lib/config";
import { formatAmount, formatNumber, timeAgo } from "@/lib/format";
import { beaconWithdrawalCount, beaconWithdrawals, pageParams } from "@/lib/queries";

export const metadata = { title: "Beacon Withdrawals" };

export default async function BeaconWithdrawalsPage({ searchParams }) {
  const query = await searchParams;
  const { page, limit, offset } = pageParams(query);
  const total = beaconWithdrawalCount();
  const rows = beaconWithdrawals({ limit, offset });

  return (
    <ListPage
      title="Beacon Withdrawals"
      subtitle={`${formatNumber(total)} withdrawals found`}
      basePath="/beacon/withdrawals"
      page={page}
      total={total}
      limit={limit}
      above={
        total === 0 ? (
          config.consensus.key === "pos" ? (
            <Notice title="No withdrawals yet">
              Withdrawals (EIP-4895) are swept by the beacon chain to each validator&apos;s withdrawal address and appear here once included in
              blocks.
            </Notice>
          ) : (
            <Notice title={`${config.consensus.name} network`}>
              Withdrawals (EIP-4895) are pushed by a beacon chain. {config.chainName} has no beacon chain, so blocks carry no withdrawals and
              this list stays empty.
            </Notice>
          )
        ) : null
      }
    >
      {rows.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Block</th>
                <th scope="col">Index</th>
                <th scope="col">Age</th>
                <th scope="col">Validator Index</th>
                <th scope="col">Recipient</th>
                <th scope="col" className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.block_number}-${row.idx}`}>
                  <td>
                    <BlockLink number={row.block_number} />
                  </td>
                  <td className="text-muted">{row.idx}</td>
                  <td className="text-muted">{timeAgo(row.timestamp)}</td>
                  <td className="tabular-nums">{formatNumber(row.validator_index)}</td>
                  <td>
                    <AddressLink address={row.address} />
                  </td>
                  <td className="text-right tabular-nums">
                    {formatAmount(row.amount_gwei, 9)} <span className="text-muted">{config.currency}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No withdrawals" body="Beacon withdrawals included in blocks are listed here." />
      )}
    </ListPage>
  );
}
