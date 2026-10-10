import { BlockLink, Container, EmptyState, LinkTabs, PageHeader, TokenLink } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { tokenList } from "@/lib/queries";

const TYPES = {
  erc20: { id: "erc20", label: "ERC-20", dbType: "ERC-20", title: "Token Tracker (ERC-20)", noun: "ERC-20 tokens" },
  erc721: { id: "erc721", label: "ERC-721", dbType: "ERC-721", title: "Non-Fungible Token Tracker (ERC-721)", noun: "ERC-721 collections" },
};

export async function generateMetadata({ searchParams }) {
  const query = await searchParams;
  return { title: query?.type === "erc721" ? "Top NFTs" : "Top Tokens" };
}

export default async function TokensPage({ searchParams }) {
  const query = await searchParams;
  const type = TYPES[query?.type] || TYPES.erc20;
  const tokens = tokenList({ type: type.dbType });
  const nft = type.id === "erc721";

  return (
    <Container>
      <PageHeader title={type.title} subtitle={`${formatNumber(tokens.length)} ${type.noun} seen on chain`} />
      <LinkTabs
        active={type.id}
        tabs={[
          { id: "erc20", label: "ERC-20 Tokens", href: "/tokens" },
          { id: "erc721", label: "NFTs (ERC-721)", href: "/tokens?type=erc721" },
        ]}
      />
      <section className="card overflow-hidden">
        {tokens.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col" className="w-12">#</th>
                  <th scope="col">{nft ? "Collection" : "Token"}</th>
                  <th scope="col">Type</th>
                  {!nft && <th scope="col" className="text-right">Decimals</th>}
                  <th scope="col" className="text-right">Transfers</th>
                  <th scope="col" className="text-right">{nft ? "Owners Reached" : "Recipients"}</th>
                  <th scope="col" className="text-right">Last Active Block</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token, i) => (
                  <tr key={token.address}>
                    <td className="text-muted">{i + 1}</td>
                    <td>
                      <TokenLink address={token.address} name={token.name} symbol={token.symbol} />
                    </td>
                    <td>
                      <span className="chip">{token.token_type}</span>
                    </td>
                    {!nft && <td className="text-right text-muted">{token.decimals ?? "—"}</td>}
                    <td className="text-right tabular-nums">{formatNumber(token.transfers)}</td>
                    <td className="text-right tabular-nums">{formatNumber(token.recipients)}</td>
                    <td className="text-right">{token.last_block != null ? <BlockLink number={token.last_block} /> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={nft ? "No NFT collections yet" : "No tokens yet"}
            body={`Deploy an ${type.label} contract and it shows up here after its first transfer.`}
          />
        )}
      </section>
    </Container>
  );
}
