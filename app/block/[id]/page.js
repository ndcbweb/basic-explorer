import Link from "next/link";
import { notFound } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import { AddressLink, Container, DetailList, DetailRow, PageHeader } from "@/components/ui";
import { blockSigner } from "@/lib/clique";
import { config } from "@/lib/config";
import { formatAmount, formatDate, formatNumber, isHash, timeAgo } from "@/lib/format";
import { db } from "@/lib/db";
import { rpc, safeRpc, toHex } from "@/lib/rpc";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Block #${id}` };
}

async function loadBlock(id) {
  if (isHash(id)) return safeRpc("eth_getBlockByHash", [id, false]);
  if (/^\d+$/.test(id)) return safeRpc("eth_getBlockByNumber", [toHex(id), false]);
  return null;
}

export default async function BlockPage({ params }) {
  const { id } = await params;
  const block = await loadBlock(id);
  if (!block) notFound();

  const number = Number(BigInt(block.number));
  const head = Number(BigInt(await rpc("eth_blockNumber")));
  const signer = await blockSigner(block);
  const gasUsed = BigInt(block.gasUsed);
  const gasLimit = BigInt(block.gasLimit);
  const baseFee = block.baseFeePerGas ? BigInt(block.baseFeePerGas) : null;
  const feeRows = db().prepare("SELECT fee FROM txs WHERE block_number = ? AND fee IS NOT NULL").all(number);
  const fees = feeRows.reduce((sum, row) => sum + BigInt(row.fee), 0n);
  const burnt = baseFee != null ? baseFee * gasUsed : 0n;
  const timestamp = Number(BigInt(block.timestamp));
  const pct = Number((gasUsed * 10000n) / (gasLimit || 1n)) / 100;

  return (
    <Container>
      <PageHeader title={<>Block <span className="text-muted">#{formatNumber(number)}</span></>}>
        <div className="flex gap-2">
          {number > 0 && (
            <Link href={`/block/${number - 1}`} className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm" aria-label="Previous block">
              ‹ Prev
            </Link>
          )}
          {number < head && (
            <Link href={`/block/${number + 1}`} className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm" aria-label="Next block">
              Next ›
            </Link>
          )}
        </div>
      </PageHeader>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Overview</h2>
        </div>
        <DetailList>
          <DetailRow label="Block Height" hint="Position of this block in the chain">
            <span className="font-medium">{formatNumber(number)}</span>
          </DetailRow>
          <DetailRow label="Status">
            <span className="chip">{head - number >= 12 ? "Finalized" : `${head - number} block confirmations`}</span>
          </DetailRow>
          <DetailRow label="Timestamp">
            {timeAgo(timestamp)} <span className="text-muted">({formatDate(timestamp)})</span>
          </DetailRow>
          <DetailRow label="Transactions">
            {block.transactions.length ? (
              <Link href={`/txs?block=${number}`}>{block.transactions.length} transactions</Link>
            ) : (
              "0 transactions"
            )}{" "}
            <span className="text-muted">in this block</span>
          </DetailRow>
          <DetailRow label="Validated By" hint="Proof of Authority signer that sealed this block">
            <AddressLink address={signer} full copy />
          </DetailRow>
          <DetailRow label="Transaction Fees">
            {formatAmount(fees, 18, 10)} {config.currency}
          </DetailRow>
          <DetailRow label="Gas Used">
            {formatNumber(gasUsed)} <span className="text-muted">({pct.toFixed(2)}%)</span>
          </DetailRow>
          <DetailRow label="Gas Limit">{formatNumber(gasLimit)}</DetailRow>
          {baseFee != null && (
            <DetailRow label="Base Fee Per Gas">
              {formatAmount(baseFee, 18, 18)} {config.currency} <span className="text-muted">({formatAmount(baseFee, 9, 9)} Gwei)</span>
            </DetailRow>
          )}
          {baseFee != null && (
            <DetailRow label="Burnt Fees">
              {formatAmount(burnt, 18, 12)} {config.currency}
            </DetailRow>
          )}
          <DetailRow label="Size">{block.size ? `${formatNumber(BigInt(block.size))} bytes` : "—"}</DetailRow>
          <DetailRow label="Hash">
            <span className="inline-flex items-center gap-1">
              <span className="break-all">{block.hash}</span>
              <CopyButton value={block.hash} label="Copy block hash" />
            </span>
          </DetailRow>
          <DetailRow label="Parent Hash">
            {number > 0 ? (
              <Link href={`/block/${number - 1}`} className="break-all">
                {block.parentHash}
              </Link>
            ) : (
              <span className="break-all">{block.parentHash}</span>
            )}
          </DetailRow>
          <DetailRow label="State Root">
            <span className="break-all">{block.stateRoot}</span>
          </DetailRow>
          <DetailRow label="Extra Data">
            <span className="mono block max-h-24 overflow-auto break-all text-muted">{block.extraData}</span>
          </DetailRow>
        </DetailList>
      </section>
    </Container>
  );
}
