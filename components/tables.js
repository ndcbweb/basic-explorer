import Link from "next/link";
import { config } from "@/lib/config";
import { formatAmount, formatNumber, timeAgo } from "@/lib/format";
import { AddressLink, BlockLink, DirectionBadge, EmptyState, MethodBadge, TokenLink, TxLink } from "./ui";

function direction(row, viewer) {
  if (!viewer) return null;
  if (row.from_addr === viewer && row.to_addr === viewer) return "SELF";
  return row.from_addr === viewer ? "OUT" : "IN";
}

export function TxTable({ txs, viewer = null, showBlock = true, emptyTitle = "No transactions yet" }) {
  if (!txs.length) return <EmptyState title={emptyTitle} body="Transactions appear here as soon as they are mined." />;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Txn Hash</th>
            <th scope="col">Method</th>
            {showBlock && <th scope="col">Block</th>}
            <th scope="col">Age</th>
            <th scope="col">From</th>
            {viewer && <th scope="col" className="w-14" aria-label="Direction" />}
            <th scope="col">To</th>
            <th scope="col" className="text-right">Amount</th>
            <th scope="col" className="text-right">Txn Fee</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((tx) => (
            <tr key={tx.hash}>
              <td>
                <span className="inline-flex items-center gap-1.5">
                  {tx.status === 0 && (
                    <span className="text-bad-700" title="Failed" aria-label="Failed">
                      ●
                    </span>
                  )}
                  <TxLink hash={tx.hash} />
                </span>
              </td>
              <td>
                <MethodBadge method={tx.method} />
              </td>
              {showBlock && (
                <td>
                  <BlockLink number={tx.block_number} />
                </td>
              )}
              <td className="text-muted" title={new Date(tx.timestamp * 1000).toISOString()}>
                {timeAgo(tx.timestamp)}
              </td>
              <td>
                {viewer === tx.from_addr ? (
                  <span className="mono text-ink">{`${tx.from_addr.slice(0, 8)}…${tx.from_addr.slice(-6)}`}</span>
                ) : (
                  <AddressLink address={tx.from_addr} />
                )}
              </td>
              {viewer && (
                <td>
                  <DirectionBadge direction={direction(tx, viewer)} />
                </td>
              )}
              <td>
                {tx.to_addr ? (
                  viewer === tx.to_addr ? (
                    <span className="mono text-ink">{`${tx.to_addr.slice(0, 8)}…${tx.to_addr.slice(-6)}`}</span>
                  ) : (
                    <AddressLink address={tx.to_addr} />
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="chip">Create</span>
                    <AddressLink address={tx.contract_address} />
                  </span>
                )}
              </td>
              <td className="text-right tabular-nums">
                {formatAmount(tx.value)} <span className="text-muted">{config.currency}</span>
              </td>
              <td className="text-right text-muted tabular-nums">{tx.fee ? formatAmount(tx.fee, 18, 8) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BlockTable({ blocks }) {
  if (!blocks.length) return <EmptyState title="No blocks indexed yet" body="The indexer is catching up with the chain." />;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Block</th>
            <th scope="col">Age</th>
            <th scope="col">Txn</th>
            <th scope="col">Validated By</th>
            <th scope="col" className="text-right">Gas Used</th>
            <th scope="col" className="text-right">Gas Limit</th>
            <th scope="col" className="text-right">Base Fee</th>
            <th scope="col" className="text-right">Fees</th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((block) => {
            const used = Number(block.gas_used);
            const limit = Number(block.gas_limit) || 1;
            const pct = (used / limit) * 100;
            return (
              <tr key={block.number}>
                <td>
                  <BlockLink number={block.number} />
                </td>
                <td className="text-muted">{timeAgo(block.timestamp)}</td>
                <td>
                  {block.tx_count ? <Link href={`/txs?block=${block.number}`}>{block.tx_count}</Link> : <span className="text-muted">0</span>}
                </td>
                <td>
                  <AddressLink address={block.signer} />
                </td>
                <td className="text-right tabular-nums">
                  {formatNumber(used)}
                  <span className="ml-1 text-xs text-muted">({pct.toFixed(2)}%)</span>
                  <div className="mt-1 ml-auto h-1 w-24 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </td>
                <td className="text-right text-muted tabular-nums">{formatNumber(block.gas_limit)}</td>
                <td className="text-right text-muted tabular-nums">
                  {block.base_fee ? `${formatAmount(block.base_fee, 9, 4)} Gwei` : "—"}
                </td>
                <td className="text-right tabular-nums">
                  {formatAmount(block.fees || "0", 18, 8)} <span className="text-muted">{config.currency}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function TransferTable({ transfers, viewer = null, showToken = true }) {
  if (!transfers.length) return <EmptyState title="No token transfers" body="ERC-20 and ERC-721 transfers show up here once they happen." />;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Txn Hash</th>
            <th scope="col">Age</th>
            <th scope="col">From</th>
            {viewer && <th scope="col" className="w-14" aria-label="Direction" />}
            <th scope="col">To</th>
            <th scope="col" className="text-right">Amount</th>
            {showToken && <th scope="col">Token</th>}
          </tr>
        </thead>
        <tbody>
          {transfers.map((row) => (
            <tr key={`${row.tx_hash}-${row.log_index}`}>
              <td>
                <TxLink hash={row.tx_hash} />
              </td>
              <td className="text-muted">{timeAgo(row.timestamp)}</td>
              <td>
                <AddressLink address={row.from_addr} />
              </td>
              {viewer && (
                <td>
                  <DirectionBadge direction={direction(row, viewer)} />
                </td>
              )}
              <td>
                <AddressLink address={row.to_addr} />
              </td>
              <td className="text-right tabular-nums">
                {row.token_type === "ERC-721" ? (
                  <span className="chip">Token ID {row.value.length > 12 ? `${row.value.slice(0, 10)}…` : row.value}</span>
                ) : (
                  formatAmount(row.value, row.decimals ?? 18)
                )}
              </td>
              {showToken && (
                <td>
                  <TokenLink address={row.token} name={row.name} symbol={row.symbol} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
