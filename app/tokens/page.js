import { BlockLink, Container, EmptyState, PageHeader, TokenLink } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { tokenList } from "@/lib/queries";

export const metadata = { title: "Tokens" };

export default function TokensPage() {
  const tokens = tokenList();
  return (
    <Container>
      <PageHeader title="Token Tracker" subtitle={`${formatNumber(tokens.length)} ERC-20 and ERC-721 tokens seen on chain`} />
      <section className="card overflow-hidden">
        {tokens.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col" className="w-12">#</th>
                  <th scope="col">Token</th>
                  <th scope="col">Type</th>
                  <th scope="col" className="text-right">Decimals</th>
                  <th scope="col" className="text-right">Transfers</th>
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
                    <td className="text-right text-muted">{token.decimals ?? "—"}</td>
                    <td className="text-right tabular-nums">{formatNumber(token.transfers)}</td>
                    <td className="text-right">{token.last_block != null ? <BlockLink number={token.last_block} /> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No tokens yet" body="Deploy an ERC-20 or ERC-721 contract and it shows up here after its first transfer." />
        )}
      </section>
    </Container>
  );
}
