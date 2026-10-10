import Link from "next/link";
import ContentPage from "@/components/ContentPage";
import { config } from "@/lib/config";

export const metadata = { title: "Contact Us" };

const CHANNELS = [
  {
    title: "Network & deployment support",
    body: `Questions about ${config.chainName}'s validators, RPC or your own deployment.`,
    href: "https://console.nadcab.com",
    cta: "Open Nadcab Console",
  },
  {
    title: "Explorer bugs & feature requests",
    body: "Found something broken or missing in the explorer? Open an issue on GitHub.",
    href: "https://github.com/ndcbweb/basic-explorer/issues",
    cta: "Open a GitHub issue",
  },
  {
    title: "Business & partnerships",
    body: "Enterprise chains, custom explorers and integration work.",
    href: "https://www.nadcab.com",
    cta: "Visit nadcab.com",
  },
];

export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="Contact Us"
      title="Contact Us"
      lead="Pick the channel that matches your question so it reaches the right team quickly."
    >
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {CHANNELS.map((channel) => (
          <div key={channel.title} className="flex flex-col rounded-xl border border-line bg-subtle p-5">
            <p className="font-semibold text-ink">{channel.title}</p>
            <p className="mt-1 mb-4 flex-1 text-sm text-muted">{channel.body}</p>
            <a href={channel.href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium">
              {channel.cta} →
            </a>
          </div>
        ))}
      </div>

      <h2>Before you reach out</h2>
      <ul>
        <li>
          <strong>Transaction stuck or missing?</strong> Check <Link href="/txs/pending">Pending Transactions</Link> and{" "}
          <Link href="/network-status">Network Status</Link> first.
        </li>
        <li>
          <strong>Lost funds or a wrong address?</strong> Transactions on {config.chainName} are final. Nobody, including the explorer team, can
          reverse them.
        </li>
        <li>
          <strong>Never share your private key or seed phrase.</strong> We will never ask for it.
        </li>
      </ul>
    </ContentPage>
  );
}
