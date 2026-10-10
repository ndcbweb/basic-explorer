import ListPage, { Notice } from "@/components/ListPage";
import { InternalTxTable } from "@/components/tables";
import { formatNumber } from "@/lib/format";
import { getMeta } from "@/lib/db";
import { internalTxCount, internalTxs, pageParams } from "@/lib/queries";

export const metadata = { title: "Contract Internal Transactions" };

export default async function InternalTxsPage({ searchParams }) {
  const query = await searchParams;
  const { page, limit, offset } = pageParams(query);
  const total = internalTxCount();
  const rows = internalTxs({ limit, offset });
  const traced = getMeta("trace_supported");

  return (
    <ListPage
      title="Contract Internal Transactions"
      subtitle={`${formatNumber(total)} internal transactions found`}
      basePath="/txs-internal"
      page={page}
      total={total}
      limit={limit}
      refreshMs={8000}
      note="Value transfers, contract creations and self-destructs made by contracts while executing a transaction"
      above={
        traced === "0" ? (
          <Notice title="Tracing unavailable">
            The connected node does not expose the <code>debug</code> API, so internal calls cannot be traced. Point the explorer at an
            archive node with <code>--http.api ...,debug</code> to enable this page.
          </Notice>
        ) : null
      }
    >
      <InternalTxTable rows={rows} />
    </ListPage>
  );
}
