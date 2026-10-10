import AutoRefresh from "@/components/AutoRefresh";
import { BlockTable } from "@/components/tables";
import { Container, PageHeader, Pagination } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { blockCount, latestBlocks, pageParams } from "@/lib/queries";

export const metadata = { title: "Blocks" };

export default async function BlocksPage({ searchParams }) {
  const { page, limit, offset } = pageParams(await searchParams);
  const total = blockCount();
  const blocks = latestBlocks({ limit, offset });

  return (
    <Container>
      {page === 1 && <AutoRefresh intervalMs={6000} />}
      <PageHeader title="Blocks" subtitle={`${formatNumber(total)} blocks indexed`} />
      <section className="card overflow-hidden">
        <div className="card-head">
          <p className="text-sm text-muted">Showing the most recent blocks first</p>
          <Pagination page={page} total={total} pageSize={limit} basePath="/blocks" />
        </div>
        <BlockTable blocks={blocks} />
        <div className="flex justify-end border-t border-line px-5 py-3">
          <Pagination page={page} total={total} pageSize={limit} basePath="/blocks" />
        </div>
      </section>
    </Container>
  );
}
