import ListPage from "@/components/ListPage";
import { AddressLink, EmptyState, TokenLink, TxLink } from "@/components/ui";
import { config } from "@/lib/config";
import { formatAmount, formatNumber, timeAgo } from "@/lib/format";
import { nftTradeCount, nftTrades, pageParams } from "@/lib/queries";

export const metadata = { title: "Latest NFT Trades" };

export default async function NftTradesPage({ searchParams }) {
  const query = await searchParams;
  const { page, limit, offset } = pageParams(query);
  const total = nftTradeCount();
  const rows = nftTrades({ limit, offset });

  return (
    <ListPage
      title="Latest NFT Trades"
      subtitle={`${formatNumber(total)} trades found`}
      basePath="/nft-trades"
      page={page}
      total={total}
      limit={limit}
      refreshMs={10000}
      note={`NFT transfers settled in a transaction that also paid ${config.currency}`}
    >
      {rows.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Txn Hash</th>
                <th scope="col">Age</th>
                <th scope="col">Collection</th>
                <th scope="col">Token ID</th>
                <th scope="col">Seller</th>
                <th scope="col">Buyer</th>
                <th scope="col" className="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.tx_hash}-${row.log_index}`}>
                  <td>
                    <TxLink hash={row.tx_hash} />
                  </td>
                  <td className="text-muted">{timeAgo(row.timestamp)}</td>
                  <td>
                    <TokenLink address={row.token} name={row.name} symbol={row.symbol} />
                  </td>
                  <td>
                    <span className="chip">{row.value.length > 12 ? `${row.value.slice(0, 10)}…` : row.value}</span>
                  </td>
                  <td>
                    <AddressLink address={row.from_addr} />
                  </td>
                  <td>
                    <AddressLink address={row.to_addr} />
                  </td>
                  <td className="text-right tabular-nums">
                    {formatAmount(row.price)} <span className="text-muted">{config.currency}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No NFT trades yet" body="Sales appear here when an NFT changes hands in a transaction that also pays for it." />
      )}
    </ListPage>
  );
}
