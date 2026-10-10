import AutoRefresh from "@/components/AutoRefresh";
import { TransferTable } from "@/components/tables";
import { Container, LinkTabs, PageHeader, Pagination } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { pageParams, tokenTransferCount, tokenTransfers } from "@/lib/queries";

export async function generateMetadata({ searchParams }) {
  const query = await searchParams;
  return { title: query?.type === "erc721" ? "NFT Transfers" : "Token Transfers" };
}

export default async function TokenTransfersPage({ searchParams }) {
  const query = await searchParams;
  const nft = query?.type === "erc721";
  const type = nft ? "ERC-721" : "ERC-20";
  const { page, limit, offset } = pageParams(query);
  const total = tokenTransferCount({ type });
  const transfers = tokenTransfers({ type, limit, offset });
  const params = nft ? { type: "erc721" } : {};

  return (
    <Container>
      {page === 1 && <AutoRefresh intervalMs={8000} />}
      <PageHeader
        title={nft ? "Non-Fungible Token Transfers (ERC-721)" : "Token Transfers (ERC-20)"}
        subtitle={`${formatNumber(total)} ${type} transfers found`}
      />
      <LinkTabs
        active={nft ? "erc721" : "erc20"}
        tabs={[
          { id: "erc20", label: "ERC-20 Transfers", href: "/tokentxns" },
          { id: "erc721", label: "NFT Transfers", href: "/tokentxns?type=erc721" },
        ]}
      />
      <section className="card overflow-hidden">
        <div className="card-head">
          <p className="text-sm text-muted">Showing the latest transfers first</p>
          <Pagination page={page} total={total} pageSize={limit} basePath="/tokentxns" params={params} />
        </div>
        <TransferTable transfers={transfers} />
        <div className="flex justify-end border-t border-line px-5 py-3">
          <Pagination page={page} total={total} pageSize={limit} basePath="/tokentxns" params={params} />
        </div>
      </section>
    </Container>
  );
}
