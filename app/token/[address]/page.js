import { notFound } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import { TransferTable } from "@/components/tables";
import { AddressLink, Container, DetailList, DetailRow, EmptyState, Pagination, Tabs } from "@/components/ui";
import { formatAmount, formatNumber, isAddress } from "@/lib/format";
import { pageParams, tokenHolders, tokenInfo, tokenTransferCount, tokenTransfers } from "@/lib/queries";
import { safeRpc } from "@/lib/rpc";

export async function generateMetadata({ params }) {
  const { address } = await params;
  const token = isAddress(address) ? tokenInfo(address.toLowerCase()) : null;
  return { title: token?.name ? `${token.name} (${token.symbol || "?"})` : `Token ${address}` };
}

export default async function TokenPage({ params, searchParams }) {
  const { address: raw } = await params;
  const query = (await searchParams) || {};
  if (!isAddress(raw)) notFound();
  const address = raw.toLowerCase();
  const token = tokenInfo(address);
  if (!token) notFound();

  const supplyHex = await safeRpc("eth_call", [{ to: address, data: "0x18160ddd" }, "latest"]);
  const supply = supplyHex && supplyHex !== "0x" ? BigInt(supplyHex) : null;
  const decimals = token.decimals ?? (token.token_type === "ERC-721" ? 0 : 18);
  const totalTransfers = tokenTransferCount({ token: address });
  const holders = tokenHolders(address, token.token_type, 100);
  const { page, limit, offset } = pageParams(query);
  const tab = query.tab === "holders" ? "holders" : "transfers";
  const base = `/token/${address}`;

  return (
    <Container>
      <div className="mb-5 flex flex-col gap-1 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-medium">
            Token <span className="text-muted">{token.name || "Unnamed token"}</span>
          </h1>
          <span className="chip">{token.token_type}</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Overview</h2>
          </div>
          <DetailList>
            <DetailRow label="Max Total Supply">
              {supply != null ? (
                <span className="font-medium tabular-nums">
                  {formatAmount(supply, decimals)} {token.symbol || ""}
                </span>
              ) : (
                <span className="text-muted">Not reported by contract</span>
              )}
            </DetailRow>
            <DetailRow label="Holders">{formatNumber(holders.length)}</DetailRow>
            <DetailRow label="Total Transfers">{formatNumber(totalTransfers)}</DetailRow>
          </DetailList>
        </section>
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Other Info</h2>
          </div>
          <DetailList>
            <DetailRow label="Token Contract">
              <span className="inline-flex items-center gap-1">
                <AddressLink address={address} full />
                <CopyButton value={address} label="Copy contract address" />
              </span>
            </DetailRow>
            <DetailRow label="Symbol">{token.symbol || "—"}</DetailRow>
            <DetailRow label="Decimals">{token.decimals ?? "—"}</DetailRow>
          </DetailList>
        </section>
      </div>

      <div className="mt-6">
        <Tabs
          basePath={base}
          active={tab}
          tabs={[
            { id: "transfers", label: "Transfers", count: totalTransfers },
            { id: "holders", label: "Holders", count: holders.length },
          ]}
        />
        <section className="card overflow-hidden">
          {tab === "transfers" ? (
            <>
              <div className="card-head">
                <p className="text-sm text-muted">{formatNumber(totalTransfers)} transfers</p>
                <Pagination page={page} total={totalTransfers} pageSize={limit} basePath={base} />
              </div>
              <TransferTable transfers={tokenTransfers({ token: address, limit, offset })} showToken={false} />
            </>
          ) : holders.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col" className="w-14">Rank</th>
                    <th scope="col">Address</th>
                    <th scope="col" className="text-right">Quantity</th>
                    {supply ? <th scope="col" className="text-right">Percentage</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {holders.map((holder, i) => (
                    <tr key={holder.address}>
                      <td className="text-muted">{i + 1}</td>
                      <td>
                        <AddressLink address={holder.address} full />
                      </td>
                      <td className="text-right tabular-nums">{formatAmount(holder.balance, token.token_type === "ERC-721" ? 0 : decimals)}</td>
                      {supply ? (
                        <td className="text-right text-muted tabular-nums">
                          {(Number((holder.balance * 1000000n) / supply) / 10000).toFixed(4)}%
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No holders yet" />
          )}
        </section>
      </div>
    </Container>
  );
}
