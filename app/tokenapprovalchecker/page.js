import Link from "next/link";
import RevokeButton from "@/components/tools/RevokeButton";
import { AddressLink, Container, EmptyState, PageHeader, TokenLink, TxLink } from "@/components/ui";
import { config } from "@/lib/config";
import { formatAmount, formatNumber, isAddress, timeAgo } from "@/lib/format";
import { findApprovals } from "@/lib/token-approvals";

export const metadata = { title: "Token Approvals" };

function Allowance({ item }) {
  if (item.kind === "all") return <span className="chip">All tokens (ApprovalForAll)</span>;
  if (item.kind === "nft") return <span className="chip">Token ID #{item.tokenId}</span>;
  if (item.unlimited) return <span className="font-medium text-wait-700">Unlimited</span>;
  return (
    <span className="tabular-nums">
      {formatAmount(item.allowance, item.tokenDecimals ?? 18)} {item.tokenSymbol && <span className="text-muted">{item.tokenSymbol}</span>}
    </span>
  );
}

export default async function TokenApprovalsPage({ searchParams }) {
  const query = await searchParams;
  const address = typeof query?.a === "string" ? query.a.trim() : "";
  const valid = isAddress(address);

  let result = null;
  let error = null;
  if (address && !valid) error = "Enter a valid 0x address with 40 hex characters.";
  else if (valid) {
    try {
      result = await findApprovals(address);
    } catch (err) {
      error = `Could not load approvals from the node: ${err.message}`;
    }
  }

  return (
    <Container>
      <PageHeader
        title="Token Approvals"
        subtitle="Review and revoke the ERC-20 allowances and NFT approvals an address has granted to other contracts."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <form method="get" action="/tokenapprovalchecker" className="card flex flex-col gap-3 p-5 sm:flex-row">
            <label htmlFor="ta-address" className="sr-only">
              Address
            </label>
            <input
              id="ta-address"
              name="a"
              defaultValue={address}
              placeholder="Search by address (0x…)"
              spellCheck={false}
              className="field font-mono text-[13px]"
            />
            <button type="submit" className="btn-primary shrink-0">
              Check Approvals
            </button>
          </form>

          {error && (
            <div role="alert" className="rounded-lg border border-bad-700/25 bg-bad-50 px-4 py-3 text-sm text-bad-700">
              {error}
            </div>
          )}

          {result && (
            <section className="card overflow-hidden">
              <div className="card-head">
                <p className="text-sm text-muted">
                  {formatNumber(result.approvals.length)} active approval{result.approvals.length === 1 ? "" : "s"} for{" "}
                  <Link href={`/address/${result.owner}`} className="mono">
                    {result.owner}
                  </Link>
                  {result.revoked > 0 && ` · ${formatNumber(result.revoked)} revoked or used up`}
                </p>
              </div>
              {result.approvals.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Last Updated</th>
                        <th scope="col">Token</th>
                        <th scope="col">Approved Spender</th>
                        <th scope="col">Allowance</th>
                        <th scope="col" className="text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.approvals.map((item) => (
                        <tr key={`${item.token}-${item.kind}-${item.spender}-${item.tokenId ?? ""}`}>
                          <td>
                            <TxLink hash={item.txHash} />
                            <div className="text-xs text-muted">
                              Block {formatNumber(item.blockNumber)}
                              {item.timestamp ? ` · ${timeAgo(item.timestamp)}` : ""}
                            </div>
                          </td>
                          <td>
                            <TokenLink address={item.token} name={item.tokenName} symbol={item.tokenSymbol} />
                          </td>
                          <td>
                            <AddressLink address={item.spender} copy />
                          </td>
                          <td>
                            <Allowance item={item} />
                          </td>
                          <td className="text-right">
                            <RevokeButton
                              owner={result.owner}
                              token={item.token}
                              spender={item.spender}
                              kind={item.kind}
                              tokenId={item.tokenId}
                              chainId={config.chainId}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No active approvals" body="This address has not granted any token allowances that are still in effect." />
              )}
            </section>
          )}

          {!address && (
            <section className="card">
              <EmptyState title="Enter an address to get started" body="Approvals are read directly from Approval and ApprovalForAll events on the chain." />
            </section>
          )}
        </div>
        <aside className="card self-start p-5 text-sm text-muted">
          <p className="font-semibold text-ink">Why revoke approvals?</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>An approval lets a contract move your tokens without asking again. Unlimited approvals stay valid until revoked.</li>
            <li>Revoking sends approve(spender, 0) or setApprovalForAll(operator, false) from your wallet and costs a little {config.currency} for gas.</li>
            <li>Only the owner can revoke, so connect the wallet of the address you are checking.</li>
            <li>Allowances are read live from each token contract; spent or revoked ones are hidden.</li>
          </ul>
        </aside>
      </div>
    </Container>
  );
}
