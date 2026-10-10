import Link from "next/link";
import ContentPage from "@/components/ContentPage";
import { config } from "@/lib/config";

export const metadata = { title: "Trust Center" };

const PILLARS = [
  {
    title: "Data integrity",
    body: "Every value is derived from the chain. The indexer re-verifies recent blocks and rewinds automatically on reorganisations.",
  },
  {
    title: "Open source",
    body: "The full explorer source is public, so anyone can audit how data is collected and displayed.",
  },
  {
    title: "Minimal data collection",
    body: "No accounts, no tracking cookies, no third-party analytics.",
  },
  {
    title: "Hardened infrastructure",
    body: "Validator signing keys stay on validator hosts with RPC bound to localhost; the explorer only talks to a read node.",
  },
];

export default function TrustCenterPage() {
  return (
    <ContentPage
      eyebrow="Trust Center"
      title="Trust Center"
      lead={`How we keep the ${config.chainName} Explorer accurate, secure and transparent.`}
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="rounded-xl border border-line bg-subtle p-5">
            <p className="font-semibold text-ink">{pillar.title}</p>
            <p className="mt-1 text-sm text-muted">{pillar.body}</p>
          </div>
        ))}
      </div>

      <h2>Transparency</h2>
      <ul>
        <li>
          Live system health is public on <Link href="/network-status">Network Status</Link>.
        </li>
        <li>
          Validator activity is visible on the <Link href="/validators">Validators</Link> page.
        </li>
        <li>
          Read our <Link href="/terms">Terms &amp; Privacy</Link> policy.
        </li>
      </ul>

      <h2>Security reports</h2>
      <p>
        If you find a vulnerability, please follow our <Link href="/bug-bounty">Bug Bounty</Link> disclosure process.
      </p>
    </ContentPage>
  );
}
