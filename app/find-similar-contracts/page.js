import Link from "next/link";
import ContractToolsTabs from "@/components/ContractToolsTabs";
import LookupForm from "@/components/LookupForm";
import { AddressLink, BlockLink, Container, EmptyState, PageHeader, TxLink } from "@/components/ui";
import { codeHashFor, contractsWithHash, deployedCount, getVerified, refreshCodeHashes } from "@/lib/contracts";
import { formatNumber, isAddress, shortHash } from "@/lib/format";

export const metadata = { title: "Find Similar Contracts" };
export const maxDuration = 120;

export default async function FindSimilarPage({ searchParams }) {
  const query = (await searchParams) || {};
  const raw = String(query.a || "").trim();
  const address = isAddress(raw) ? raw.toLowerCase() : null;

  let target = null;
  let matches = [];
  let error = null;
  if (raw && !address) error = "Enter a 0x-prefixed address with 40 hex characters.";
  if (address) {
    target = await codeHashFor(address);
    if (target.code == null) error = "The bytecode could not be read from the RPC node. Try again shortly.";
    else if (!target.hash) error = "This address has no deployed bytecode, so there is nothing to compare.";
    else {
      try {
        await refreshCodeHashes();
      } catch {
        // Partial hash coverage still yields useful results.
      }
      matches = contractsWithHash(target.hash, address);
    }
  }
  const verified = address ? getVerified(address) : null;

  return (
    <Container>
      <PageHeader
        title="Find Similar Contracts"
        subtitle={`Finds deployed contracts whose runtime bytecode (metadata stripped) is identical. ${formatNumber(deployedCount())} contract creations indexed.`}
      />
      <ContractToolsTabs active="similar" />
      <section className="card mb-5 p-5">
        <LookupForm action="/find-similar-contracts" fields={[{ name: "a", label: "Contract Address", value: raw }]} submitLabel="Search" />
      </section>

      {error && (
        <section className="card">
          <EmptyState title="Can't search" body={error} />
        </section>
      )}

      {target?.hash && (
        <section className="card overflow-hidden">
          <div className="card-head flex-wrap">
            <div className="min-w-0 text-sm">
              <p className="text-ink">
                <AddressLink address={address} full />
                {verified && <span className="ml-2 chip border-ok-700/25 bg-ok-50 text-ok-700">{verified.name}</span>}
              </p>
              <p className="mt-0.5 text-muted">
                Runtime hash <span className="mono" title={target.hash}>{shortHash(target.hash, 12, 10)}</span> · {formatNumber(target.size)} bytes
              </p>
            </div>
            <span className="chip">{matches.length} similar</span>
          </div>
          {matches.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Address</th>
                    <th scope="col">Verified</th>
                    <th scope="col">Creation Txn</th>
                    <th scope="col">Block</th>
                    <th scope="col" className="text-right">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((row) => (
                    <tr key={row.address}>
                      <td>
                        <AddressLink address={row.address} copy />
                      </td>
                      <td>
                        {row.verified_name ? (
                          <Link href={`/address/${row.address}?tab=code`}>{row.verified_name}</Link>
                        ) : (
                          <Link href={`/verifycontract?a=${row.address}`} className="text-muted">
                            Unverified
                          </Link>
                        )}
                      </td>
                      <td>{row.tx_hash ? <TxLink hash={row.tx_hash} /> : <span className="text-faint">—</span>}</td>
                      <td>{row.block_number != null ? <BlockLink number={row.block_number} /> : "—"}</td>
                      <td className="text-right tabular-nums">{formatNumber(row.size)} B</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No similar contracts" body="No other indexed contract has the same runtime bytecode." />
          )}
        </section>
      )}
    </Container>
  );
}
