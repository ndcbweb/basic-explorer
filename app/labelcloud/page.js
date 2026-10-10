import Link from "next/link";
import { AddressLink, Container, EmptyState, PageHeader, TokenLink } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { labelCounts, labelMembers } from "@/lib/queries";

export const metadata = { title: "Label Cloud" };

export default async function LabelCloudPage({ searchParams }) {
  const query = await searchParams;
  const labels = labelCounts();
  const active = labels.find((label) => label.id === query?.label) || null;
  const members = active ? labelMembers(active.id) : [];
  const tokenLabel = active && (active.id === "erc20" || active.id === "erc721");

  return (
    <Container>
      <PageHeader title="Label Cloud" subtitle="Browse addresses grouped by what they are on chain" />
      <section className="card mb-6 flex flex-wrap gap-3 p-5">
        {labels.map((label) => (
          <Link
            key={label.id}
            href={`/labelcloud?label=${label.id}`}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm ${
              active?.id === label.id ? "border-brand-500 bg-brand-50 text-brand-600" : "border-line text-ink hover:border-brand-100 hover:bg-brand-50"
            }`}
          >
            {label.label}
            <span className="rounded-full bg-canvas px-2 text-xs text-muted">{formatNumber(label.count)}</span>
          </Link>
        ))}
      </section>

      {active && (
        <section className="card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">{active.label}</h2>
            <span className="text-xs text-muted">{formatNumber(active.count)} addresses</span>
          </div>
          {members.length ? (
            <ul className="divide-y divide-line">
              {members.map((m) => (
                <li key={m.address} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  {tokenLabel ? <TokenLink address={m.address} name={m.name} symbol={m.symbol} /> : <AddressLink address={m.address} full />}
                  {m.n != null && !tokenLabel && <span className="text-muted tabular-nums">{formatNumber(m.n)}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No addresses with this label yet" />
          )}
        </section>
      )}
    </Container>
  );
}
