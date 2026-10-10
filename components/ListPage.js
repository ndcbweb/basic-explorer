import AutoRefresh from "./AutoRefresh";
import { Container, PageHeader, Pagination } from "./ui";

/** Standard paginated list page: header, optional tabs/notice, card with pagers top and bottom. */
export default function ListPage({ title, subtitle, basePath, page, total, limit, params = {}, note, refreshMs = 0, above = null, children }) {
  const pager = total > limit ? <Pagination page={page} total={total} pageSize={limit} basePath={basePath} params={params} /> : null;
  return (
    <Container>
      {refreshMs > 0 && page === 1 && <AutoRefresh intervalMs={refreshMs} />}
      <PageHeader title={title} subtitle={subtitle} />
      {above}
      <section className="card overflow-hidden">
        {(note || pager) && (
          <div className="card-head">
            <p className="text-sm text-muted">{note}</p>
            {pager}
          </div>
        )}
        {children}
        {pager && <div className="flex justify-end border-t border-line px-5 py-3">{pager}</div>}
      </section>
    </Container>
  );
}

export function Notice({ title, children }) {
  return (
    <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50 px-5 py-4 text-sm text-ink">
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="text-muted">{children}</div>
    </div>
  );
}
