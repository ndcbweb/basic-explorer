import Link from "next/link";
import ListPage, { Notice } from "@/components/ListPage";
import { EmptyState } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: "Uncles" };

export default function UnclesPage() {
  return (
    <ListPage
      title="Uncle Blocks"
      subtitle="Valid blocks that were mined but not included in the main chain"
      basePath="/uncles"
      page={1}
      total={0}
      limit={25}
      above={
        config.consensus.key === "pow" ? (
          <Notice title="Uncles on a Proof of Work chain">
            When two miners find a block at the same height, the losing block can be included later as an uncle and its miner still
            earns part of the reward. Uncles show up in the block that includes them.
          </Notice>
        ) : (
        <Notice title="Uncles do not occur on this network">
          Uncle (ommer) blocks were a Proof of Work concept. {config.chainName} uses {config.consensus.name}, so every block header has an empty
          uncle list. Replaced blocks, if any, are tracked under <Link href="/blocks-forked">Forked Blocks</Link>.
        </Notice>
        )
      }
    >
      <EmptyState
        title="No uncle blocks"
        body={config.consensus.key === "pow" ? "No uncles have been indexed yet." : "Proof of Authority chains never produce uncles."}
      />
    </ListPage>
  );
}
