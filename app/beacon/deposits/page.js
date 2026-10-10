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
        <Notice title={`${config.chainName} has no beacon chain`}>
          This network uses Proof of Authority (Clique). Validators are authorised signers rather than staked depositors, so there is no
          deposit contract and no beacon deposits. See the active signers on the <Link href="/validators">Validators</Link> page.
        </Notice>
      }
    >
      <EmptyState title="No beacon deposits" body="Deposits only exist on Proof of Stake networks with a beacon chain." />
    </ListPage>
  );
}
