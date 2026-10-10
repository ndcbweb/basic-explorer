import Link from "next/link";
import ListPage, { Notice } from "@/components/ListPage";
import { EmptyState } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: "Beacon Deposits" };

export default function BeaconDepositsPage() {
  return (
    <ListPage
      title="Beacon Deposits"
      subtitle="Validator deposits into the consensus layer deposit contract"
      basePath="/beacon/deposits"
      page={1}
      total={0}
      limit={25}
      above={
        config.consensus.key === "pos" ? (
          <Notice title="Genesis validators">
            {config.chainName}&apos;s validators were activated in the genesis state, so they made no deposit transactions. Deposits made later
            through the deposit contract are processed by the beacon chain.
          </Notice>
        ) : config.consensus.key === "dpos" ? (
          <Notice title={`${config.chainName} has no beacon chain`}>
            Validators stake through the StakeHub system contract (0x0000000000000000000000000000000000002002) rather than a beacon deposit
            contract. See the producers on the <Link href="/validators">Validators</Link> page.
          </Notice>
        ) : (
          <Notice title={`${config.chainName} has no beacon chain`}>
            This network uses Proof of Authority (Clique). Validators are authorised signers rather than staked depositors, so there is no
            deposit contract and no beacon deposits. See the active signers on the <Link href="/validators">Validators</Link> page.
          </Notice>
        )
      }
    >
      <EmptyState title="No beacon deposits" body="Deposits only exist on Proof of Stake networks with a beacon chain." />
    </ListPage>
  );
}
