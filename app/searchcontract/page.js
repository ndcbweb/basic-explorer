import Link from "next/link";
import ContractToolsTabs from "@/components/ContractToolsTabs";
import LookupForm from "@/components/LookupForm";
import { AddressLink, Container, EmptyState, PageHeader, Pagination } from "@/components/ui";
import { searchVerified, verifiedCount } from "@/lib/contracts";
import { formatNumber } from "@/lib/format";
import { pageParams } from "@/lib/queries";

export const metadata = { title: "Contract Search" };

function Highlight({ text, term }) {
  const lower = text.toLowerCase();
  const needle = term.toLowerCase();
  const parts = [];
  let from = 0;
  let index = lower.indexOf(needle);
  while (index !== -1 && needle) {
    parts.push(text.slice(from, index));
    parts.push(
      <mark key={index} className="rounded-sm bg-wait-50 text-wait-700">
        {text.slice(index, index + needle.length)}
      </mark>
    );
    from = index + needle.length;
    index = lower.indexOf(needle, from);
  }
  parts.push(text.slice(from));
  return parts;
}

export default async function SearchContractPage({ searchParams }) {
  const query = (await searchParams) || {};
  const term = String(query.q || "").trim().slice(0, 200);
  const { page, limit, offset } = pageParams(query);
  const result = term.length >= 2 ? searchVerified(term, { limit, offset }) : null;

  return (
    <Container>
      <PageHeader title="Contract Search" subtitle={`Search the names and source code of ${formatNumber(verifiedCount())} verified contracts.`} />
      <ContractToolsTabs active="search" />
      <section className="card mb-5 p-5">
        <LookupForm
          action="/searchcontract"
          fields={[{ name: "q", label: "Search term", value: term, placeholder: "e.g. transferFrom, Ownable, MyToken", mono: false }]}
          submitLabel="Search"
        />
        {term && term.length < 2 && <p className="mt-2 text-sm text-bad-700">Enter at least 2 characters.</p>}
      </section>

      {result && (
        <section className="card overflow-hidden">
          <div className="card-head">
            <p className="text-sm text-muted">
              {formatNumber(result.total)} contract{result.total === 1 ? "" : "s"} matching <span className="font-medium text-ink">“{term}”</span>
            </p>
            <Pagination page={page} total={result.total} pageSize={limit} basePath="/searchcontract" params={{ q: term }} />
          </div>
          {result.rows.length ? (
            <ul className="divide-y divide-line">
              {result.rows.map((row) => (
                <li key={row.address} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Link href={`/address/${row.address}?tab=code`} className="font-semibold">
                      <Highlight text={row.name} term={term} />
                    </Link>
                    <AddressLink address={row.address} />
                    <span className="chip">{row.compiler_version.split("+")[0]}</span>
                  </div>
                  {row.snippet && (
                    <div className="mt-2 overflow-hidden rounded-md border border-line bg-canvas">
                      <p className="border-b border-line px-3 py-1 text-xs text-muted">
                        {row.snippet.file} · line {row.snippet.line}
                      </p>
                      <pre className="mono overflow-x-auto px-3 py-2 text-xs leading-relaxed text-ink">
                        {row.snippet.lines.map((line, i) => (
                          <div key={i}>
                            <span className="mr-3 inline-block w-8 text-right text-faint select-none">{row.snippet.startLine + i}</span>
                            <Highlight text={line} term={term} />
                          </div>
                        ))}
                      </pre>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No matches" body="No verified contract name or source contains this text." />
          )}
        </section>
      )}
    </Container>
  );
}
