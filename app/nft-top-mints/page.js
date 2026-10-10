import { AddressLink, Container, EmptyState, LinkTabs, PageHeader, TokenLink } from "@/components/ui";
import { formatNumber, timeAgo } from "@/lib/format";
import { nftTopMints } from "@/lib/queries";

export const metadata = { title: "Top NFT Mints" };

const RANGES = { "1h": 3600, "24h": 86400, "7d": 7 * 86400, "30d": 30 * 86400 };

export default async function TopMintsPage({ searchParams }) {
  const query = await searchParams;
  const range = RANGES[query?.range] ? query.range : "24h";
  const rows = nftTopMints(Math.floor(Date.now() / 1000) - RANGES[range]);

  return (
    <Container>
      <PageHeader title="Top NFT Mints" subtitle="Collections with the most tokens minted in the selected window" />
      <LinkTabs
        active={range}
        tabs={Object.keys(RANGES).map((id) => ({ id, label: id.toUpperCase(), href: `/nft-top-mints?range=${id}` }))}
      />
      <section className="card overflow-hidden">
        {rows.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col" className="w-12">#</th>
                  <th scope="col">Collection</th>
                  <th scope="col" className="text-right">Mints</th>
                  <th scope="col" className="text-right">Unique Minters</th>
                  <th scope="col" className="text-right">Last Mint</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.address}>
                    <td className="text-muted">{i + 1}</td>
                    <td>
                      {row.name || row.symbol ? <TokenLink address={row.address} name={row.name} symbol={row.symbol} /> : <AddressLink address={row.address} />}
                    </td>
                    <td className="text-right tabular-nums">{formatNumber(row.mints)}</td>
                    <td className="text-right tabular-nums">{formatNumber(row.minters)}</td>
                    <td className="text-right text-muted">{timeAgo(row.last_mint)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No mints in this window" body="Mint an ERC-721 token and its collection ranks here." />
        )}
      </section>
    </Container>
  );
}
