import TypedTxList from "@/components/TypedTxList";
import { pageParams, txsByType, txsByTypeCount } from "@/lib/queries";

export const metadata = { title: "EIP-7702 Authorizations" };

export default async function SetCodePage({ searchParams }) {
  const query = await searchParams;
  const { page, limit, offset } = pageParams(query);
  return (
    <TypedTxList
      title="EIP-7702 Authorizations"
      noun="set-code transactions"
      basePath="/txs-7702"
      page={page}
      limit={limit}
      total={txsByTypeCount(4)}
      rows={txsByType(4, { limit, offset })}
      note="Type 4 transactions where an account delegates its code to a smart contract"
      emptyTitle="No EIP-7702 transactions"
      notice={{
        title: "Not active on this chain",
        body: "EIP-7702 set-code transactions arrive with the Prague/Pectra fork. They will be listed here once the network supports them and accounts start delegating.",
      }}
    />
  );
}
