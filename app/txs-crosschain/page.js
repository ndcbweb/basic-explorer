import Link from "next/link";
import ListPage, { Notice } from "@/components/ListPage";
import { EmptyState } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: "Cross-Chain Transactions" };

export default function CrossChainPage() {
  return (
    <ListPage
      title="Cross-Chain Transactions"
      subtitle={`Bridge deposits and withdrawals between ${config.chainName} and other networks`}
      basePath="/txs-crosschain"
      page={1}
      total={0}
      limit={25}
      above={
        <Notice title="No bridge registered">
          {config.chainName} does not have a canonical bridge configured with this explorer yet. Once a bridge contract is deployed, its
          deposit and withdrawal events show up here. Meanwhile, contract-level value movements are visible on{" "}
          <Link href="/txs-internal">Internal Transactions</Link>.
        </Notice>
      }
    >
      <EmptyState title="No cross-chain transactions" body="Bridge activity will be listed here when a bridge is connected to this network." />
    </ListPage>
  );
}
