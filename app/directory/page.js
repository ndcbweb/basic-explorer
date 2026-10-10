import Link from "next/link";
import { AddressLink, BlockLink, Container, EmptyState, PageHeader, TokenLink } from "@/components/ui";
import { config } from "@/lib/config";
import { formatNumber } from "@/lib/format";
import { deployedContracts, labelMembers } from "@/lib/queries";

export const metadata = { title: "Directory" };

const LINKS = [
  { title: "Nadcab Console", body: "Launch and manage EVM chains like this one.", href: "https://console.nadcab.com" },
  { title: "Nadcab Labs", body: "The team behind this network and explorer.", href: "https://www.nadcab.com" },
  { title: "Explorer Source", body: "Open-source code for this block explorer.", href: "https://github.com/ndcbweb/basic-explorer" },
];

export default function DirectoryPage() {
  const contracts = deployedContracts(100);
  const validators = labelMembers("validator", 50);
  const tokens = contracts.filter((c) => c.token_type);
  const other = contracts.filter((c) => !c.token_type);

  return (
    <Container>
      <PageHeader title={`${config.chainName} Directory`} subtitle="Projects, tokens, contracts and infrastructure on this network" />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="card block p-5 hover:border-brand-100">
            <p className="font-semibold text-ink">{link.title} ↗</p>
            <p className="mt-1 text-sm text-muted">{link.body}</p>
          </a>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">Tokens &amp; NFTs</h2>
            <Link href="/tokens" className="text-sm">View all</Link>
          </div>
          {tokens.length ? (
            <ul className="divide-y divide-line">
              {tokens.map((c) => (
                <li key={c.address} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <TokenLink address={c.address} name={c.name} symbol={c.symbol} />
                  <span className="chip">{c.token_type}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No tokens listed" body="Token contracts appear once they emit their first transfer." />
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">Validators</h2>
            <Link href="/validators" className="text-sm">View all</Link>
          </div>
          {validators.length ? (
            <ul className="divide-y divide-line">
              {validators.map((v) => (
                <li key={v.address} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <AddressLink address={v.address} full />
                  <span className="text-muted">{formatNumber(v.n)} blocks</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No validators yet" />
          )}
        </section>

        <section className="card overflow-hidden lg:col-span-2">
          <div className="card-head">
            <h2 className="card-title">Smart Contracts</h2>
            <span className="text-xs text-muted">{formatNumber(other.length)} contracts</span>
          </div>
          {other.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Contract</th>
                    <th scope="col">Creator</th>
                    <th scope="col">Created In</th>
                    <th scope="col" className="text-right">Calls</th>
                  </tr>
                </thead>
                <tbody>
                  {other.map((c) => (
                    <tr key={c.address}>
                      <td>
                        <AddressLink address={c.address} />
                      </td>
                      <td>
                        <AddressLink address={c.creator} />
                      </td>
                      <td>
                        <BlockLink number={c.block_number} />
                      </td>
                      <td className="text-right tabular-nums">{formatNumber(c.calls)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No contracts deployed yet" body="Deploy a contract and it will be listed here." />
          )}
        </section>
      </div>
    </Container>
  );
}
