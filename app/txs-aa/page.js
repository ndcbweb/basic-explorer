import TypedTxList from "@/components/TypedTxList";
import { aaTxCount, aaTxs, ENTRY_POINTS, pageParams } from "@/lib/queries";

export const metadata = { title: "AA Transactions" };

export default async function AaTxsPage({ searchParams }) {
  const query = await searchParams;
  const { page, limit, offset } = pageParams(query);
  return (
    <TypedTxList
      title="Account Abstraction Transactions (ERC-4337)"
      noun="bundle transactions"
      basePath="/txs-aa"
      page={page}
      limit={limit}
      total={aaTxCount()}
      rows={aaTxs({ limit, offset })}
      note="Bundles submitted to the ERC-4337 EntryPoint contracts"
      emptyTitle="No account abstraction bundles"
      notice={{
        title: "No EntryPoint activity",
        body: `Bundlers call the canonical EntryPoint contracts (${ENTRY_POINTS.join(", ")}). Deploy an EntryPoint and a bundler on this chain to see user operations here.`,
      }}
    />
  );
}
