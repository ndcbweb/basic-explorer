import Link from "next/link";
import ContentPage, { HelpCard } from "@/components/ContentPage";

export const metadata = { title: "Explorer as a Service" };

const FEATURES = [
  { title: "Full Etherscan-style UI", body: "Blocks, transactions, addresses, tokens, NFTs, validators, charts and network status out of the box." },
  { title: "Etherscan-compatible API", body: "Drop-in REST API so wallets, indexers and tooling integrate without code changes." },
  { title: "Your brand", body: "Network name, currency symbol and chain ID configured per deployment, with light and dark themes." },
  { title: "Deployed with your chain", body: "Provisioned automatically next to your RPC node when you launch a chain from Nadcab Console." },
  { title: "Lightweight", body: "Single container with an embedded database. No Postgres, no Elasticsearch, runs in under 400 MB of memory." },
  { title: "Open source", body: "Audit it, fork it or self-host it. The source lives on GitHub." },
];

export default function EaasPage() {
  return (
    <ContentPage
      eyebrow="Explorer as a Service"
      title="Explorer as a Service (EaaS)"
      lead="A production-ready block explorer for your EVM chain, launched and maintained by Nadcab Labs."
      aside={
        <HelpCard title="Get started">
          Launch a chain on{" "}
          <a href="https://console.nadcab.com" target="_blank" rel="noopener noreferrer">
            Nadcab Console
          </a>{" "}
          and the explorer is included. For a custom setup, <Link href="/contact">contact us</Link>.
        </HelpCard>
      }
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-xl border border-line bg-subtle p-5">
            <p className="font-semibold text-ink">{feature.title}</p>
            <p className="mt-1 text-sm text-muted">{feature.body}</p>
          </div>
        ))}
      </div>

      <h2>How it works</h2>
      <ol>
        <li>Create a chain in Nadcab Console: pick consensus, validators and tokenomics.</li>
        <li>Deploy. Validators, an RPC node and this explorer are provisioned together.</li>
        <li>The explorer indexes from genesis and is live as soon as the first block is sealed.</li>
      </ol>

      <h2>Who it&apos;s for</h2>
      <ul>
        <li>Enterprises running private or consortium EVM networks.</li>
        <li>Projects launching an app-chain or testnet that needs a public explorer.</li>
        <li>Teams migrating off heavyweight explorer stacks.</li>
      </ul>
    </ContentPage>
  );
}
