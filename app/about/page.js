import Link from "next/link";
import ContentPage, { HelpCard } from "@/components/ContentPage";
import { config } from "@/lib/config";

export const metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="About Us"
      title={`About ${config.chainName} Explorer`}
      lead={`The ${config.chainName} Explorer is the window into ${config.chainName}: every block, transaction, address and token, indexed and searchable.`}
      toc={[
        { id: "mission", label: "Our mission" },
        { id: "what", label: "What you can do" },
        { id: "how", label: "How it works" },
        { id: "nadcab", label: "Built by Nadcab Labs" },
      ]}
      aside={
        <HelpCard title="Launch your own chain">
          This network was deployed with the <a href="https://console.nadcab.com" target="_blank" rel="noopener noreferrer">Nadcab Console</a>. Spin up
          your own EVM chain with validators, RPC and an explorer in minutes.
        </HelpCard>
      }
    >
      <h2 id="mission">Our mission</h2>
      <p>
        Blockchains are public ledgers, but raw ledger data is hard to read. Our mission is to make {config.chainName} transparent and
        accessible to everyone, whether you are a developer debugging a contract, a validator checking liveness, or a user confirming a
        payment.
      </p>

      <h2 id="what">What you can do</h2>
      <ul>
        <li>
          Track <Link href="/txs">transactions</Link>, <Link href="/blocks">blocks</Link> and <Link href="/txs/pending">pending transactions</Link> in real time.
        </li>
        <li>
          Inspect any address: {config.currency} balance, transaction history, token holdings and contract bytecode.
        </li>
        <li>
          Follow <Link href="/tokens">ERC-20 tokens</Link> and <Link href="/tokens?type=erc721">NFT collections</Link>, their transfers and holders.
        </li>
        <li>
          Monitor <Link href="/validators">validators</Link>, <Link href="/network-status">network health</Link> and{" "}
          <Link href="/charts">charts &amp; statistics</Link>.
        </li>
        <li>
          Build on the <Link href="/apis">Etherscan-compatible API</Link>.
        </li>
      </ul>

      <h2 id="how">How it works</h2>
      <p>
        The explorer runs alongside a full {config.chainName} node. A built-in indexer follows the chain head, stores blocks, transactions,
        receipts and token transfer events in a local database, and handles short reorganisations automatically. Live values such as
        balances are read straight from the node, so what you see always matches the chain.
      </p>

      <h2 id="nadcab">Built by Nadcab Labs</h2>
      <p>
        The explorer is developed by <a href="https://www.nadcab.com" target="_blank" rel="noopener noreferrer">Nadcab Labs</a> and is open source on{" "}
        <a href="https://github.com/ndcbweb/basic-explorer" target="_blank" rel="noopener noreferrer">GitHub</a>. Contributions and issue reports are welcome.
      </p>
    </ContentPage>
  );
}
