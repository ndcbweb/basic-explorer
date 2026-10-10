import { AddressLink, Container, EmptyState, PageHeader, TokenLink } from "@/components/ui";
import { formatAmount, isAddress, shortHash } from "@/lib/format";
import { tokenFlow } from "@/lib/queries";

export const metadata = { title: "Token Flow Visualizer" };

function FlowColumn({ title, flows, tone }) {
  const max = Math.max(1, ...flows.map((f) => f.count));
  return (
    <section className="card overflow-hidden">
      <div className="card-head">
        <h2 className="card-title">{title}</h2>
        <span className="text-xs text-muted">{flows.length} counterparties</span>
      </div>
      {flows.length ? (
        <ul className="divide-y divide-line">
          {flows.slice(0, 25).map((flow) => (
            <li key={`${flow.counterparty}-${flow.token}`} className="px-5 py-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <AddressLink address={flow.counterparty} />
                <span className="text-right tabular-nums">
                  {formatAmount(flow.amount, flow.decimals, 4)} <span className="text-muted">{flow.symbol || shortHash(flow.token, 6, 4)}</span>
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                  <div className={`h-full rounded-full ${tone}`} style={{ width: `${(flow.count / max) * 100}%` }} />
                </div>
                <span className="w-20 text-right text-xs text-muted">{flow.count} transfer{flow.count === 1 ? "" : "s"}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Nothing here" body="No transfers in this direction." />
      )}
    </section>
  );
}

export default async function TokenFlowPage({ searchParams }) {
  const query = await searchParams;
  const address = (query?.a || "").trim().toLowerCase();
  const token = isAddress(query?.token || "") ? query.token.toLowerCase() : null;
  const valid = isAddress(address);
  const flow = valid ? tokenFlow(address, token) : null;

  return (
    <Container>
      <PageHeader
        title={
          <>
            Token Flow Visualizer <span className="ml-1 align-middle chip">Beta</span>
          </>
        }
        subtitle="See where an address's tokens come from and where they go, grouped by counterparty"
      />
      <form method="get" className="card mb-6 flex flex-col gap-3 p-5 md:flex-row">
        <input name="a" defaultValue={address} placeholder="Address (0x…)" className="field font-mono md:flex-1" aria-label="Address" />
        <input name="token" defaultValue={token || ""} placeholder="Token contract (optional)" className="field font-mono md:w-96" aria-label="Token contract" />
        <button type="submit" className="btn-primary">Visualize</button>
      </form>

      {!address && <EmptyState title="Enter an address" body="Paste any wallet or contract address to map its token transfers." />}
      {address && !valid && <EmptyState title="Invalid address" body="Addresses are 0x followed by 40 hex characters." />}
      {flow && (
        <>
          <div className="card mb-6 flex flex-wrap items-center justify-center gap-6 p-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-semibold text-ok-700">{flow.inflows.length}</p>
              <p className="text-muted">senders</p>
            </div>
            <span className="text-faint" aria-hidden="true">→</span>
            <div className="rounded-xl border border-brand-100 bg-brand-50 px-5 py-3 text-center">
              <AddressLink address={address} />
              {flow.tokens.length > 0 && (
                <p className="mt-1 text-xs text-muted">
                  {flow.tokens.length} token{flow.tokens.length === 1 ? "" : "s"}:{" "}
                  {flow.tokens.slice(0, 4).map((t, i) => (
                    <span key={t.address}>
                      {i > 0 && ", "}
                      <TokenLink address={t.address} name={t.symbol || t.name} />
                    </span>
                  ))}
                </p>
              )}
            </div>
            <span className="text-faint" aria-hidden="true">→</span>
            <div className="text-center">
              <p className="text-2xl font-semibold text-wait-700">{flow.outflows.length}</p>
              <p className="text-muted">recipients</p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <FlowColumn title="Inflows (received from)" flows={flow.inflows} tone="bg-ok-700" />
            <FlowColumn title="Outflows (sent to)" flows={flow.outflows} tone="bg-wait-700" />
          </div>
        </>
      )}
    </Container>
  );
}
