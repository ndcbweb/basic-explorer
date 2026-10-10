import Link from "next/link";
import { notFound } from "next/navigation";
import { decodeFunctionData, erc20Abi } from "viem";
import CopyButton from "@/components/CopyButton";
import { AddressLink, Container, DetailList, DetailRow, EmptyState, PageHeader, StatusBadge, Tabs, TokenLink } from "@/components/ui";
import { config } from "@/lib/config";
import { formatAmount, formatDate, formatNumber, isHash, methodLabel, timeAgo } from "@/lib/format";
import { tokenTransfers } from "@/lib/queries";
import { rpc, safeRpc } from "@/lib/rpc";

export async function generateMetadata({ params }) {
  const { hash } = await params;
  return { title: `Transaction ${hash.slice(0, 12)}…` };
}

const TX_TYPES = { "0x0": "Legacy", "0x1": "EIP-2930", "0x2": "EIP-1559", "0x3": "EIP-4844" };

function decodeInput(input) {
  if (!input || input === "0x") return null;
  try {
    const decoded = decodeFunctionData({ abi: erc20Abi, data: input });
    const item = erc20Abi.find((entry) => entry.type === "function" && entry.name === decoded.functionName);
    return { name: decoded.functionName, inputs: item?.inputs || [], args: decoded.args || [] };
  } catch {
    return null;
  }
}

export default async function TxPage({ params, searchParams }) {
  const { hash } = await params;
  const { tab = "overview" } = (await searchParams) || {};
  if (!isHash(hash)) notFound();

  const [tx, receipt, headHex] = await Promise.all([
    safeRpc("eth_getTransactionByHash", [hash]),
    safeRpc("eth_getTransactionReceipt", [hash]),
    rpc("eth_blockNumber"),
  ]);
  if (!tx) notFound();

  const pending = tx.blockNumber == null;
  const blockNumber = pending ? null : Number(BigInt(tx.blockNumber));
  const block = pending ? null : await safeRpc("eth_getBlockByNumber", [tx.blockNumber, false]);
  const timestamp = block ? Number(BigInt(block.timestamp)) : null;
  const confirmations = pending ? 0 : Number(BigInt(headHex)) - blockNumber + 1;
  const gasUsed = receipt ? BigInt(receipt.gasUsed) : null;
  const gasPrice = BigInt(receipt?.effectiveGasPrice || tx.gasPrice || "0x0");
  const fee = gasUsed != null ? gasUsed * gasPrice : null;
  const baseFee = block?.baseFeePerGas ? BigInt(block.baseFeePerGas) : null;
  const burnt = baseFee != null && gasUsed != null ? baseFee * gasUsed : null;
  const gasLimit = BigInt(tx.gas);
  const status = pending ? null : receipt ? Number(BigInt(receipt.status ?? "0x1")) : null;
  const transfers = tokenTransfers({ txHash: hash.toLowerCase() });
  const logs = receipt?.logs || [];
  const decoded = decodeInput(tx.input);
  const base = `/tx/${hash}`;

  return (
    <Container>
      <PageHeader title="Transaction Details" />
      <Tabs
        basePath={base}
        active={tab === "logs" ? "logs" : "overview"}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "logs", label: "Logs", count: logs.length },
        ]}
      />

      {tab === "logs" ? (
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Transaction Receipt Event Logs</h2>
          </div>
          {logs.length ? (
            <ol className="divide-y divide-line">
              {logs.map((log) => (
                <li key={log.logIndex} className="grid gap-3 px-5 py-4 md:grid-cols-[48px_1fr]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ok-50 text-sm font-semibold text-ok-700">
                    {Number(BigInt(log.logIndex))}
                  </span>
                  <dl className="grid gap-2 text-sm md:grid-cols-[90px_1fr]">
                    <dt className="text-muted">Address</dt>
                    <dd>
                      <AddressLink address={log.address.toLowerCase()} full />
                    </dd>
                    <dt className="text-muted">Topics</dt>
                    <dd className="space-y-1">
                      {log.topics.map((topic, i) => (
                        <p key={i} className="mono break-all">
                          <span className="chip mr-2">{i}</span>
                          {topic}
                        </p>
                      ))}
                    </dd>
                    <dt className="text-muted">Data</dt>
                    <dd className="mono rounded-md bg-canvas p-2.5 break-all text-muted">{log.data}</dd>
                  </dl>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="No event logs" body="This transaction did not emit any events." />
          )}
        </section>
      ) : (
        <section className="card">
          <DetailList>
            <DetailRow label="Transaction Hash" hint="Unique identifier of this transaction">
              <span className="inline-flex items-center gap-1">
                <span className="mono break-all">{tx.hash}</span>
                <CopyButton value={tx.hash} label="Copy transaction hash" />
              </span>
            </DetailRow>
            <DetailRow label="Status">
              <StatusBadge status={status} />
            </DetailRow>
            <DetailRow label="Block">
              {pending ? (
                <span className="text-muted">Pending</span>
              ) : (
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Link href={`/block/${blockNumber}`}>{formatNumber(blockNumber)}</Link>
                  <span className="chip">{formatNumber(confirmations)} Block Confirmations</span>
                </span>
              )}
            </DetailRow>
            <DetailRow label="Timestamp">
              {timestamp ? (
                <>
                  {timeAgo(timestamp)} <span className="text-muted">({formatDate(timestamp)})</span>
                </>
              ) : (
                "—"
              )}
            </DetailRow>
          </DetailList>

          <div className="border-t border-line" />
          <DetailList>
            <DetailRow label="From">
              <AddressLink address={tx.from.toLowerCase()} full copy />
            </DetailRow>
            <DetailRow label={tx.to ? "To" : "Contract Created"}>
              {tx.to ? (
                <AddressLink address={tx.to.toLowerCase()} full copy />
              ) : receipt?.contractAddress ? (
                <span className="inline-flex items-center gap-2">
                  <span className="chip">Contract</span>
                  <AddressLink address={receipt.contractAddress.toLowerCase()} full copy />
                </span>
              ) : (
                <span className="text-muted">Contract creation</span>
              )}
            </DetailRow>
            {transfers.length > 0 && (
              <DetailRow label={`Tokens Transferred (${transfers.length})`}>
                <ul className="space-y-1.5">
                  {transfers.map((row) => (
                    <li key={row.log_index} className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      <span className="text-muted">From</span>
                      <AddressLink address={row.from_addr} />
                      <span className="text-muted">To</span>
                      <AddressLink address={row.to_addr} />
                      <span className="text-muted">For</span>
                      <span className="font-medium tabular-nums">
                        {row.token_type === "ERC-721" ? `Token ID ${row.value}` : formatAmount(row.value, row.decimals ?? 18)}
                      </span>
                      <TokenLink address={row.token} name={row.name} symbol={row.symbol} />
                    </li>
                  ))}
                </ul>
              </DetailRow>
            )}
          </DetailList>

          <div className="border-t border-line" />
          <DetailList>
            <DetailRow label="Value">
              <span className="font-medium">
                {formatAmount(tx.value, 18, 18)} {config.currency}
              </span>
            </DetailRow>
            <DetailRow label="Transaction Fee">{fee != null ? `${formatAmount(fee, 18, 18)} ${config.currency}` : "Pending"}</DetailRow>
            <DetailRow label="Gas Price">
              {formatAmount(gasPrice, 9, 9)} Gwei <span className="text-muted">({formatAmount(gasPrice, 18, 18)} {config.currency})</span>
            </DetailRow>
          </DetailList>

          <div className="border-t border-line" />
          <DetailList>
            <DetailRow label="Gas Limit & Usage by Txn">
              {formatNumber(gasLimit)}
              {gasUsed != null && (
                <>
                  <span className="mx-2 text-faint">|</span>
                  {formatNumber(gasUsed)} <span className="text-muted">({(Number((gasUsed * 10000n) / (gasLimit || 1n)) / 100).toFixed(2)}%)</span>
                </>
              )}
            </DetailRow>
            {(baseFee != null || tx.maxFeePerGas) && (
              <DetailRow label="Gas Fees">
                <span className="flex flex-wrap gap-x-4 gap-y-1">
                  {baseFee != null && (
                    <span>
                      <span className="text-muted">Base:</span> {formatAmount(baseFee, 9, 9)} Gwei
                    </span>
                  )}
                  {tx.maxFeePerGas && (
                    <span>
                      <span className="text-muted">Max:</span> {formatAmount(tx.maxFeePerGas, 9, 9)} Gwei
                    </span>
                  )}
                  {tx.maxPriorityFeePerGas && (
                    <span>
                      <span className="text-muted">Max Priority:</span> {formatAmount(tx.maxPriorityFeePerGas, 9, 9)} Gwei
                    </span>
                  )}
                </span>
              </DetailRow>
            )}
            {burnt != null && (
              <DetailRow label="Burnt Fees">
                {formatAmount(burnt, 18, 18)} {config.currency}
              </DetailRow>
            )}
            <DetailRow label="Other Attributes">
              <span className="flex flex-wrap gap-2">
                <span className="chip">Txn Type: {TX_TYPES[tx.type] || tx.type}</span>
                <span className="chip">Nonce: {formatNumber(BigInt(tx.nonce))}</span>
                {tx.transactionIndex != null && <span className="chip">Position In Block: {formatNumber(BigInt(tx.transactionIndex))}</span>}
              </span>
            </DetailRow>
            <DetailRow label="Input Data">
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-muted">Method: </span>
                  <span className="font-medium">{methodLabel(tx.input, tx.to)}</span>
                </p>
                {decoded && (
                  <div className="rounded-md border border-line bg-canvas p-3 text-sm">
                    <p className="mono mb-2">
                      Function: {decoded.name}({decoded.inputs.map((input) => `${input.type} ${input.name}`).join(", ")})
                    </p>
                    <table className="w-full text-left text-[13px]">
                      <tbody>
                        {decoded.inputs.map((input, i) => (
                          <tr key={input.name || i} className="align-top">
                            <td className="py-0.5 pr-4 text-muted">{input.name || `arg${i}`}</td>
                            <td className="py-0.5 pr-4 text-muted">{input.type}</td>
                            <td className="mono py-0.5 break-all">{String(decoded.args[i])}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <pre className="mono max-h-56 overflow-auto rounded-md border border-line bg-canvas p-3 break-all whitespace-pre-wrap text-muted">
                  {tx.input}
                </pre>
              </div>
            </DetailRow>
          </DetailList>
        </section>
      )}
    </Container>
  );
}
