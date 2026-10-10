import TypedTxList from "@/components/TypedTxList";
import { pageParams, txsByType, txsByTypeCount } from "@/lib/queries";

export const metadata = { title: "Blob Transactions" };

export default async function BlobsPage({ searchParams }) {
  const query = await searchParams;
  const { page, limit, offset } = pageParams(query);
  return (
    <TypedTxList
      title="Blob Transactions (EIP-4844)"
      noun="blob-carrying transactions"
      basePath="/blobs"
      page={page}
      limit={limit}
      total={txsByTypeCount(3)}
      rows={txsByType(3, { limit, offset })}
      note="Type 3 transactions that attach data blobs, typically posted by rollups"
      emptyTitle="No blob transactions"
      notice={{
        title: "No blobs yet",
        body: "Blob transactions require the Cancun fork and a sender (usually a rollup sequencer) that posts blobs. None have been included on this chain so far.",
      }}
    />
  );
}
