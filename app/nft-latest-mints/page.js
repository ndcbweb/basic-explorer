import ListPage from "@/components/ListPage";
import { TransferTable } from "@/components/tables";
import { formatNumber } from "@/lib/format";
import { nftMintCount, nftMints, pageParams } from "@/lib/queries";

export const metadata = { title: "Latest NFT Mints" };

export default async function LatestMintsPage({ searchParams }) {
  const query = await searchParams;
  const { page, limit, offset } = pageParams(query);
  const total = nftMintCount();
  return (
    <ListPage
      title="Latest NFT Mints"
      subtitle={`${formatNumber(total)} ERC-721 tokens minted`}
      basePath="/nft-latest-mints"
      page={page}
      total={total}
      limit={limit}
      refreshMs={8000}
      note="ERC-721 transfers from the zero address, newest first"
    >
      <TransferTable transfers={nftMints({ limit, offset })} />
    </ListPage>
  );
}
