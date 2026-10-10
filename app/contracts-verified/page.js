import Link from "next/link";
import ContractToolsTabs from "@/components/ContractToolsTabs";
import { AddressLink, Container, EmptyState, PageHeader, Pagination } from "@/components/ui";
import { listVerified, verifiedCount } from "@/lib/contracts";
import { formatNumber, timeAgo } from "@/lib/format";
import { pageParams } from "@/lib/queries";

export const metadata = { title: "Verified Contracts" };

function shortLicense(license) {
  const match = /\(([^)]+)\)$/.exec(license || "");
  return match ? match[1] : license || "—";
}

export default async function VerifiedContractsPage({ searchParams }) {
  const query = (await searchParams) || {};
  const { page, limit, offset } = pageParams(query);
  const total = verifiedCount();
  const rows = listVerified({ limit, offset });

  return (
    <Container>
      <PageHeader title="Verified Contracts" subtitle={`${formatNumber(total)} contracts with verified source code`}>
        <Link href="/verifycontract" className="btn-primary hover:text-white">
          Verify Contract
        </Link>
      </PageHeader>
      <ContractToolsTabs active="verified" />
      <section className="card overflow-hidden">
        <div className="card-head">
          <p className="text-sm text-muted">Showing the most recently verified contracts</p>
          <Pagination page={page} total={total} pageSize={limit} basePath="/contracts-verified" />
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Address</th>
                  <th scope="col">Contract Name</th>
                  <th scope="col">Compiler</th>
                  <th scope="col">Version</th>
                  <th scope="col">Optimization</th>
                  <th scope="col">License</th>
                  <th scope="col">Verified</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.address}>
                    <td>
                      <AddressLink address={row.address} copy />
                    </td>
                    <td>
                      <Link href={`/address/${row.address}?tab=code`} className="font-medium">
                        {row.name}
                      </Link>
                    </td>
                    <td>
                      <span className="chip">{row.compiler_type === "standard-json" ? "Solidity (JSON)" : "Solidity"}</span>
                    </td>
                    <td className="mono text-muted">{row.compiler_version.replace(/^v/, "").split("+")[0]}</td>
                    <td>{row.optimization ? `Yes (${row.runs ?? 200})` : "No"}</td>
                    <td className="text-muted">{shortLicense(row.license)}</td>
                    <td className="whitespace-nowrap text-muted" title={new Date(row.verified_at * 1000).toISOString()}>
                      {timeAgo(row.verified_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No verified contracts yet" body="Verify a deployed contract's source code and it will be listed here." />
        )}
      </section>
    </Container>
  );
}
