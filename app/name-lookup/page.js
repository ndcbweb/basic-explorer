import { AddressLink, Container, EmptyState, PageHeader, TokenLink } from "@/components/ui";
import { config } from "@/lib/config";
import { db } from "@/lib/db";

export const metadata = { title: "Domain Name Lookup" };

function lookup(term) {
  const like = `%${term.replace(/[%_]/g, "")}%`;
  return db()
    .prepare("SELECT address, name, symbol, token_type FROM tokens WHERE name LIKE ? OR symbol LIKE ? ORDER BY name LIMIT 25")
    .all(like, like);
}

export default async function NameLookupPage({ searchParams }) {
  const query = await searchParams;
  const term = (query?.q || "").trim().slice(0, 80);
  const results = term ? lookup(term) : [];

  return (
    <Container>
      <PageHeader title="Domain Name Lookup" subtitle="Resolve a human-readable name to an address" />
      <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50 px-5 py-4 text-sm text-muted">
        No naming service (such as ENS) is deployed on {config.chainName} yet, so <code>.eth</code>-style domains cannot be resolved. Lookups below
        match registered token and contract names instead.
      </div>
      <form method="get" className="card mb-6 flex flex-col gap-3 p-5 sm:flex-row">
        <input name="q" defaultValue={term} placeholder="Name or symbol, e.g. NTT" className="field sm:flex-1" aria-label="Name" />
        <button type="submit" className="btn-primary">Lookup</button>
      </form>
      {term && (
        <section className="card overflow-hidden">
          {results.length ? (
            <ul className="divide-y divide-line">
              {results.map((row) => (
                <li key={row.address} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <TokenLink address={row.address} name={row.name} symbol={row.symbol} />
                  <span className="flex items-center gap-3">
                    <span className="chip">{row.token_type}</span>
                    <AddressLink address={row.address} full />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={`No match for "${term}"`} body="Try a token name or symbol." />
          )}
        </section>
      )}
    </Container>
  );
}
