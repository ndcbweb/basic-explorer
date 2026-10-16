import Link from "next/link";
import { notFound } from "next/navigation";
import ContractInteract from "@/components/ContractInteract";
import ContractSource, { VerifyPrompt } from "@/components/ContractSource";
import CopyButton from "@/components/CopyButton";
import { TransferTable, TxTable } from "@/components/tables";
import { AddressLink, Container, DetailList, DetailRow, EmptyState, Pagination, Tabs, TokenLink, TxLink } from "@/components/ui";
import { config } from "@/lib/config";
import { getVerified } from "@/lib/contracts";
import { formatAmount, formatNumber, isAddress } from "@/lib/format";
import {
  addressTokenBalances,
  addressTxCount,
  addressTxs,
  blocksValidated,
  contractCreation,
  pageParams,
  tokenInfo,
  tokenTransferCount,
  tokenTransfers,
} from "@/lib/queries";
import { safeRpc } from "@/lib/rpc";

export async function generateMetadata({ params }) {
  const { address } = await params;
  return { title: `Address ${address}` };
}

export default async function AddressPage({ params, searchParams }) {
  const { address: raw } = await params;
  const query = (await searchParams) || {};
  if (!isAddress(raw)) notFound();
  const address = raw.toLowerCase();

  const [balance, nonce, code] = await Promise.all([
    safeRpc("eth_getBalance", [address, "latest"], "0x0"),
    safeRpc("eth_getTransactionCount", [address, "latest"], "0x0"),
    safeRpc("eth_getCode", [address, "latest"], "0x"),
  ]);
  const isContract = code && code !== "0x";
  const token = isContract ? tokenInfo(address) : null;
  const creation = isContract ? contractCreation(address) : null;
  const verified = isContract ? getVerified(address) : null;
  const validated = blocksValidated(address);
  const totalTxs = addressTxCount(address);
  const totalTransfers = tokenTransferCount({ address });
  const holdings = addressTokenBalances(address);
  const { page, limit, offset } = pageParams(query);
  const tab = ["transfers", "holdings", "code", "read", "write"].includes(query.tab) ? query.tab : "txs";
  const base = `/address/${address}`;

  const tabs = [
    { id: "txs", label: "Transactions", count: totalTxs },
    { id: "transfers", label: "Token Transfers", count: totalTransfers },
    { id: "holdings", label: "Token Holdings", count: holdings.length },
  ];
  if (isContract) {
    tabs.push({ id: "code", label: verified ? "Contract ✓" : "Contract" });
    if (verified?.abi) {
      tabs.push({ id: "read", label: "Read Contract" });
      tabs.push({ id: "write", label: "Write Contract" });
    }
  }

  return (
    <Container>
      <div className="mb-5 flex flex-col gap-2 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-medium">{isContract ? "Contract" : "Address"}</h1>
          {validated > 0 && <span className="chip border-brand-100 bg-brand-50 text-brand-700">Validator</span>}
          {token && <span className="chip">{token.token_type}</span>}
          {verified && <span className="chip border-ok-700/25 bg-ok-50 text-ok-700">Source Code Verified</span>}
        </div>
        <p className="flex items-center gap-1 text-sm">
          <span className="break-all text-ink">{address}</span>
          <CopyButton value={address} label="Copy address" />
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Overview</h2>
          </div>
          <DetailList>
            <DetailRow label={`${config.currency} Balance`}>
              <span className="font-medium tabular-nums">
                {formatAmount(balance, 18, 8)} {config.currency}
              </span>
            </DetailRow>
            <DetailRow label="Token Holdings">
              {holdings.length ? (
                <span className="flex flex-wrap gap-1.5">
                  {holdings.slice(0, 4).map((item) => (
                    <span key={item.token} className="chip">
                      {item.token_type === "ERC-721" ? `${item.balance} NFT` : formatAmount(item.balance, item.decimals ?? 18, 4)}{" "}
                      {item.symbol || ""}
                    </span>
                  ))}
                  {holdings.length > 4 && <Link href={`${base}?tab=holdings`}>+{holdings.length - 4} more</Link>}
                </span>
              ) : (
                <span className="text-muted">None</span>
              )}
            </DetailRow>
            <DetailRow label="Transactions Sent" hint="Account nonce">
              {formatNumber(BigInt(nonce))}
            </DetailRow>
          </DetailList>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">More Info</h2>
          </div>
          <DetailList>
            {isContract ? (
              <DetailRow label="Contract Creator">
                {creation ? (
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <AddressLink address={creation.from_addr} />
                    <span className="text-muted">at txn</span>
                    <TxLink hash={creation.hash} />
                  </span>
                ) : (
                  <span className="text-muted">Created in genesis or not yet indexed</span>
                )}
              </DetailRow>
            ) : (
              <DetailRow label="Account Type">Externally owned account</DetailRow>
            )}
            {token && (
              <DetailRow label="Token Tracker">
                <TokenLink address={address} name={token.name} symbol={token.symbol} />
              </DetailRow>
            )}
            <DetailRow label="Blocks Validated" hint="Blocks produced by this address">
              {validated ? formatNumber(validated) : <span className="text-muted">0</span>}
            </DetailRow>
            <DetailRow label="Indexed Activity">
              {formatNumber(totalTxs)} transactions · {formatNumber(totalTransfers)} token transfers
            </DetailRow>
          </DetailList>
        </section>
      </div>

      <div className="mt-6">
        <Tabs tabs={tabs} active={tab} basePath={base} />
        <section className="card overflow-hidden">
          {tab === "txs" && (
            <>
              <div className="card-head">
                <p className="text-sm text-muted">Latest {formatNumber(Math.min(totalTxs, limit))} of {formatNumber(totalTxs)} transactions</p>
                <Pagination page={page} total={totalTxs} pageSize={limit} basePath={base} />
              </div>
              <TxTable txs={addressTxs(address, { limit, offset })} viewer={address} emptyTitle="No transactions for this address" />
            </>
          )}
          {tab === "transfers" && (
            <>
              <div className="card-head">
                <p className="text-sm text-muted">{formatNumber(totalTransfers)} token transfers</p>
                <Pagination page={page} total={totalTransfers} pageSize={limit} basePath={base} params={{ tab: "transfers" }} />
              </div>
              <TransferTable transfers={tokenTransfers({ address, limit, offset })} viewer={address} />
            </>
          )}
          {tab === "holdings" &&
            (holdings.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Token</th>
                      <th scope="col">Type</th>
                      <th scope="col" className="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((item) => (
                      <tr key={item.token}>
                        <td>
                          <TokenLink address={item.token} name={item.name} symbol={item.symbol} />
                        </td>
                        <td>
                          <span className="chip">{item.token_type}</span>
                        </td>
                        <td className="text-right tabular-nums">
                          {item.token_type === "ERC-721" ? `${item.balance} items` : formatAmount(item.balance, item.decimals ?? 18)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No token holdings" body="This address has not received any ERC-20 or ERC-721 tokens." />
            ))}
          {tab === "code" && (
            <>
              <div className="card-head">
                <p className="text-sm text-muted">
                  Contract bytecode · {formatNumber((code.length - 2) / 2)} bytes
                  {creation && (
                    <>
                      {" "}
                      · deployed in block <Link href={`/block/${creation.block_number}`}>{formatNumber(creation.block_number)}</Link>
                    </>
                  )}
                </p>
                <span className="flex gap-3 text-sm">
                  <Link href={`/find-similar-contracts?a=${address}`}>Similar contracts</Link>
                  <Link href={`/code-reader?a=${address}`}>Code reader</Link>
                  {verified?.abi ? (
                    <>
                      <Link href={`${base}?tab=read`}>Read Contract</Link>
                      <Link href={`${base}?tab=write`}>Write Contract</Link>
                    </>
                  ) : null}
                </span>
              </div>
              {verified ? <ContractSource contract={verified} code={code} /> : <VerifyPrompt address={address} code={code} />}
            </>
          )}
          {(tab === "read" || tab === "write") && verified?.abi ? (
            <>
              <div className="card-head">
                <p className="text-sm text-muted">
                  {tab === "read" ? "Read" : "Write"} methods from the verified ABI of {verified.name}
                </p>
                <span className="flex gap-3 text-sm">
                  <Link href={`${base}?tab=code`}>Source</Link>
                  <Link href={`${base}?tab=${tab === "read" ? "write" : "read"}`}>
                    {tab === "read" ? "Write Contract" : "Read Contract"}
                  </Link>
                </span>
              </div>
              <ContractInteract key={tab} address={address} abi={verified.abi} initialTab={tab} />
            </>
          ) : null}
        </section>
      </div>
    </Container>
  );
}
