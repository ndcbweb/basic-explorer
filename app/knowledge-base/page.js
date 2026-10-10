import Link from "next/link";
import ContentPage from "@/components/ContentPage";
import { config } from "@/lib/config";

export const metadata = { title: "Knowledge Base" };

const ARTICLES = [
  {
    id: "transaction",
    q: "How do I read a transaction page?",
    a: (
      <>
        <p>
          The <strong>Overview</strong> shows the status (Success, Failed or Pending), the block it landed in, the sender and recipient, the{" "}
          {config.currency} value and the fee. <strong>Transaction Fee</strong> = gas used × effective gas price. Token transfers triggered by
          the transaction are listed under <strong>ERC-20 Tokens Transferred</strong>, and the raw event logs are on the <strong>Logs</strong> tab.
        </p>
      </>
    ),
  },
  {
    id: "pending",
    q: "Why is my transaction pending?",
    a: (
      <>
        <p>A transaction stays pending until a validator includes it in a block. Common reasons it waits:</p>
        <ul>
          <li>The nonce is higher than the sender&apos;s next nonce, so an earlier transaction is missing (it shows under Queued).</li>
          <li>The gas price is below the node&apos;s minimum.</li>
          <li>The sender doesn&apos;t have enough {config.currency} for value plus gas.</li>
        </ul>
        <p>
          Check <Link href="/txs/pending">Pending Transactions</Link> to see what the node is holding.
        </p>
      </>
    ),
  },
  {
    id: "failed",
    q: "My transaction failed but I still paid a fee. Why?",
    a: (
      <p>
        Validators spent computation executing your transaction up to the point it reverted, so the gas used is still charged. The value you
        tried to send is returned. Common causes: insufficient token allowance, a contract&apos;s require() check failing, or too low a gas limit.
      </p>
    ),
  },
  {
    id: "poa",
    q: `How does ${config.chainName} produce blocks?`,
    a: (
      <p>
        {config.chainName} uses Proof of Authority (Clique). A fixed set of approved <Link href="/validators">validators</Link> take turns sealing
        blocks. The validator for each block is recovered from the block&apos;s signature and shown as <strong>Validated By</strong>.
      </p>
    ),
  },
  {
    id: "wallet",
    q: `How do I add ${config.chainName} to my wallet?`,
    a: (
      <p>
        Use the <strong>Add {config.chainName} Network</strong> button in the footer or the wallet icon in the header. It fills in the chain ID
        {config.chainId ? ` (${config.chainId})` : ""}, the RPC URL and the {config.currency} currency for you in MetaMask or any
        EIP-3085 wallet.
      </p>
    ),
  },
  {
    id: "tokens",
    q: "Why doesn't my token show up?",
    a: (
      <p>
        Tokens are discovered from their first <code>Transfer</code> event. Deploying a contract alone doesn&apos;t emit one; mint or transfer a
        token and it appears on <Link href="/tokens">Top Tokens</Link> within a few seconds.
      </p>
    ),
  },
  {
    id: "api",
    q: "Can I fetch this data programmatically?",
    a: (
      <p>
        Yes. The <Link href="/apis">Explorer API</Link> is Etherscan-compatible, so existing tooling works by changing the base URL.
      </p>
    ),
  },
];

export default function KnowledgeBasePage() {
  return (
    <ContentPage
      eyebrow="Knowledge Base"
      title="Knowledge Base"
      lead={`Answers to common questions about ${config.chainName} and this explorer.`}
      toc={ARTICLES.map((article) => ({ id: article.id, label: article.q }))}
    >
      {ARTICLES.map((article) => (
        <section key={article.id}>
          <h2 id={article.id}>{article.q}</h2>
          {article.a}
        </section>
      ))}
    </ContentPage>
  );
}
