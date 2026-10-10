import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";
import SearchBar from "@/components/SearchBar";
import TxChart from "@/components/TxChart";
import { AddressLink, EmptyState, TxLink } from "@/components/ui";
import { config } from "@/lib/config";
import { formatAmount, formatGwei, formatNumber, timeAgo } from "@/lib/format";
import { avgBlockTime, latestBlocks, latestTxs, txCount, txHistory, validators } from "@/lib/queries";
import { safeRpc } from "@/lib/rpc";

function Stat({ label, value, sub, icon }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600" aria-hidden="true">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
        <p className="mt-0.5 truncate text-lg font-semibold text-ink tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
    </div>
  );
}

const icons = {
  block: (
    <svg viewBox="0 0 20 20" className="h-4.5 w-4.5"><path fill="currentColor" d="M10 1.5 17.5 5.75v8.5L10 18.5l-7.5-4.25v-8.5L10 1.5Zm0 1.73L4.53 6.33 10 9.43l5.47-3.1L10 3.23ZM4 7.6v5.78l5.25 2.98V10.6L4 7.6Zm7.75 8.76L16 13.38V7.6l-5.25 3v5.76Z" /></svg>
  ),
  tx: (
    <svg viewBox="0 0 20 20" className="h-4.5 w-4.5"><path fill="currentColor" d="M13.47 2.47a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H3.75a.75.75 0 0 1 0-1.5h11.44l-1.72-1.72a.75.75 0 0 1 0-1.06Zm-6.94 8a.75.75 0 0 1 0 1.06L4.81 13.25h11.44a.75.75 0 0 1 0 1.5H4.81l1.72 1.72a.75.75 0 1 1-1.06 1.06l-3-3a.75.75 0 0 1 0-1.06l3-3a.75.75 0 0 1 1.06 0Z" /></svg>
  ),
  clock: (
    <svg viewBox="0 0 20 20" className="h-4.5 w-4.5"><path fill="currentColor" d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 2a.75.75 0 0 1 .75.75v3.44l2.28 2.28a.75.75 0 1 1-1.06 1.06l-2.5-2.5A.75.75 0 0 1 9.25 10V6.25A.75.75 0 0 1 10 5.5Z" /></svg>
  ),
  gas: (
    <svg viewBox="0 0 20 20" className="h-4.5 w-4.5"><path fill="currentColor" d="M4 3.75A1.75 1.75 0 0 1 5.75 2h5.5A1.75 1.75 0 0 1 13 3.75V9h.25A2.25 2.25 0 0 1 15.5 11.25v2.5a.75.75 0 0 0 1.5 0V7.56l-1.53-1.53a.75.75 0 1 1 1.06-1.06l1.75 1.75c.14.14.22.33.22.53v6.5a2.25 2.25 0 0 1-4.5 0v-2.5a.75.75 0 0 0-.75-.75H13v6h.25a.75.75 0 0 1 0 1.5h-9.5a.75.75 0 0 1 0-1.5H4V3.75Zm1.5 0V8h6V3.75a.25.25 0 0 0-.25-.25h-5.5a.25.25 0 0 0-.25.25Z" /></svg>
  ),
  shield: (
    <svg viewBox="0 0 20 20" className="h-4.5 w-4.5"><path fill="currentColor" d="M9.7 1.57a.75.75 0 0 1 .6 0l6.25 2.7a.75.75 0 0 1 .45.69v4.29c0 4.04-2.6 7.37-6.8 9.2a.75.75 0 0 1-.6 0C5.4 16.62 2.8 13.29 2.8 9.25V4.96c0-.3.18-.57.45-.69l6.45-2.7Zm.3 1.51L4.3 5.46v3.79c0 3.26 2.03 6.03 5.7 7.7 3.67-1.67 5.7-4.44 5.7-7.7V5.46L10 3.08Z" /></svg>
  ),
  chain: (
    <svg viewBox="0 0 20 20" className="h-4.5 w-4.5"><path fill="currentColor" d="M8.4 5.03a3.75 3.75 0 0 1 5.3 0l1.27 1.27a3.75 3.75 0 0 1 0 5.3l-1.4 1.4a.75.75 0 1 1-1.06-1.06l1.4-1.4a2.25 2.25 0 0 0 0-3.18L12.64 6.1a2.25 2.25 0 0 0-3.18 0l-1.4 1.4A.75.75 0 1 1 7 6.43l1.4-1.4Zm-1 4.47a.75.75 0 0 1 0 1.06L6 11.96a2.25 2.25 0 0 0 0 3.18l1.27 1.27a2.25 2.25 0 0 0 3.18 0l1.4-1.4a.75.75 0 1 1 1.06 1.06l-1.4 1.4a3.75 3.75 0 0 1-5.3 0l-1.27-1.27a3.75 3.75 0 0 1 0-5.3l1.4-1.4a.75.75 0 0 1 1.06 0Zm4.13-1.03a.75.75 0 0 1 0 1.06l-2.97 2.97a.75.75 0 1 1-1.06-1.06l2.97-2.97a.75.75 0 0 1 1.06 0Z" /></svg>
  ),
};

export default async function HomePage() {
  const [gasPrice, headHex] = await Promise.all([safeRpc("eth_gasPrice"), safeRpc("eth_blockNumber")]);
  const blocks = latestBlocks({ limit: 6 });
  const txs = latestTxs({ limit: 6 });
  const totalTxs = txCount();
  const blockTime = avgBlockTime();
  const signers = validators();
  const history = txHistory(14);
  const head = headHex ? Number(BigInt(headHex)) : blocks[0]?.number;

  return (
    <>
      <AutoRefresh intervalMs={5000} />
      <section className="relative overflow-hidden bg-night">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(#9fb7ff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[1320px] px-4 pt-10 pb-24 sm:px-6">
          <p className="mb-2 text-sm font-medium text-[#8ea6e8]">{config.chainId ? `Chain ID ${config.chainId}` : "EVM network"}</p>
          <h1 className="mb-5 text-2xl font-semibold tracking-tight text-white sm:text-[28px]">The {config.chainName} Explorer</h1>
          <div className="max-w-2xl">
            <SearchBar size="lg" />
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-14 max-w-[1320px] px-4 sm:px-6">
        <section className="card relative grid overflow-hidden shadow-[0_8px_30px_-12px_rgba(10,16,32,0.18)] lg:grid-cols-[1fr_1fr_1.2fr]" aria-label="Network statistics">
          <div className="divide-y divide-line border-line lg:border-r">
            <Stat label="Latest block" value={head != null ? formatNumber(head) : "—"} sub={blocks[0] ? timeAgo(blocks[0].timestamp) : null} icon={icons.block} />
            <Stat label="Transactions" value={formatNumber(totalTxs)} sub={blockTime ? `${blockTime.toFixed(1)}s avg block time` : null} icon={icons.tx} />
            <Stat label="Native currency" value={config.currency} sub={config.chainId ? `Chain ID ${config.chainId}` : null} icon={icons.chain} />
          </div>
          <div className="divide-y divide-line border-t border-line lg:border-t-0 lg:border-r">
            <Stat label="Gas price" value={gasPrice ? `${formatGwei(gasPrice)} Gwei` : "—"} sub="Current network price" icon={icons.gas} />
            <Stat label="Validators" value={formatNumber(signers.length)} sub="Proof of Authority signers" icon={icons.shield} />
            <Stat label="Block time" value={blockTime ? `${blockTime.toFixed(2)} s` : "—"} sub="Last 100 blocks" icon={icons.clock} />
          </div>
          <div className="border-t border-line px-5 py-4 lg:border-t-0">
            <TxChart points={history} />
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="card overflow-hidden" aria-labelledby="latest-blocks">
            <div className="card-head">
              <h2 id="latest-blocks" className="card-title">Latest Blocks</h2>
            </div>
            {blocks.length ? (
              <ul className="divide-y divide-line">
                {blocks.map((block) => (
                  <li key={block.number} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-canvas text-muted sm:flex" aria-hidden="true">
                      {icons.block}
                    </div>
                    <div className="w-20 shrink-0 sm:w-28">
                      <Link href={`/block/${block.number}`} className="font-medium">
                        {formatNumber(block.number)}
                      </Link>
                      <p className="text-xs text-muted">{timeAgo(block.timestamp)}</p>
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate">
                        <span className="text-muted">Validated by </span>
                        <AddressLink address={block.signer} />
                      </p>
                      <p className="text-xs text-muted">
                        {block.tx_count ? <Link href={`/txs?block=${block.number}`}>{block.tx_count} txns</Link> : "0 txns"}
                      </p>
                    </div>
                    <span className="chip hidden shrink-0 tabular-nums sm:inline-flex">
                      {formatAmount(block.fees || "0", 18, 5)} {config.currency}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Waiting for blocks" body="The indexer is syncing with the chain." />
            )}
            <Link href="/blocks" className="block border-t border-line bg-[#fafbfc] py-3 text-center text-xs font-semibold tracking-wide uppercase hover:bg-brand-50">
              View all blocks →
            </Link>
          </section>

          <section className="card overflow-hidden" aria-labelledby="latest-txs">
            <div className="card-head">
              <h2 id="latest-txs" className="card-title">Latest Transactions</h2>
            </div>
            {txs.length ? (
              <ul className="divide-y divide-line">
                {txs.map((tx) => (
                  <li key={tx.hash} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-canvas text-muted sm:flex" aria-hidden="true">
                      {icons.tx}
                    </div>
                    <div className="w-32 shrink-0 sm:w-36">
                      <TxLink hash={tx.hash} />
                      <p className="text-xs text-muted">{timeAgo(tx.timestamp)}</p>
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate">
                        <span className="text-muted">From </span>
                        <AddressLink address={tx.from_addr} />
                      </p>
                      <p className="truncate">
                        <span className="text-muted">To </span>
                        <AddressLink address={tx.to_addr || tx.contract_address} />
                      </p>
                    </div>
                    <span className="chip hidden shrink-0 tabular-nums sm:inline-flex">
                      {formatAmount(tx.value, 18, 4)} {config.currency}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No transactions yet" body="Send a transaction to the RPC endpoint and it will appear here within a few seconds." />
            )}
            <Link href="/txs" className="block border-t border-line bg-[#fafbfc] py-3 text-center text-xs font-semibold tracking-wide uppercase hover:bg-brand-50">
              View all transactions →
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
