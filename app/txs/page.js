import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";
import { TxTable } from "@/components/tables";
import { Container, PageHeader, Pagination } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { latestTxs, pageParams, txCount } from "@/lib/queries";

export const metadata = { title: "Transactions" };

export default async function TxsPage({ searchParams }) {
  const query = await searchParams;
  const { page, limit, offset } = pageParams(query);
  const block = /^\d+$/.test(query?.block || "") ? Number(query.block) : null;
  const total = txCount({ block });
  const txs = latestTxs({ limit, offset, block });
  const params = block != null ? { block: String(block) } : {};

  return (
    <Container>
      {page === 1 && block == null && <AutoRefresh intervalMs={6000} />}
      <PageHeader
        title="Transactions"
        subtitle={
          block != null ? (
            <>
              For block <Link href={`/block/${block}`}>#{formatNumber(block)}</Link> · {formatNumber(total)} transactions
            </>
          ) : (
            `${formatNumber(total)} transactions found`
          )
        }
      />
      <section className="card overflow-hidden">
        <div className="card-head">
          <p className="text-sm text-muted">{block != null ? "Ordered by position in block" : "Showing the latest transactions first"}</p>
          <Pagination page={page} total={total} pageSize={limit} basePath="/txs" params={params} />
        </div>
        <TxTable txs={txs} showBlock={block == null} />
        <div className="flex justify-end border-t border-line px-5 py-3">
          <Pagination page={page} total={total} pageSize={limit} basePath="/txs" params={params} />
        </div>
      </section>
    </Container>
  );
}
