import ListPage, { Notice } from "./ListPage";
import { TxTable } from "./tables";
import { formatNumber } from "@/lib/format";

/** List page for one transaction category (blob, set-code, account abstraction...). */
export default function TypedTxList({ title, noun, basePath, page, limit, total, rows, note, notice, emptyTitle }) {
  return (
    <ListPage
      title={title}
      subtitle={`${formatNumber(total)} ${noun} found`}
      basePath={basePath}
      page={page}
      total={total}
      limit={limit}
      refreshMs={10000}
      note={note}
      above={total === 0 && notice ? <Notice title={notice.title}>{notice.body}</Notice> : null}
    >
      <TxTable txs={rows} emptyTitle={emptyTitle} />
    </ListPage>
  );
}
