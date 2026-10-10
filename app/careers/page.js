import Link from "next/link";
import ContentPage, { HelpCard } from "@/components/ContentPage";

export const metadata = { title: "Careers" };

const VALUES = [
  { title: "Ship to real chains", body: "What you build runs on live networks that teams depend on every day." },
  { title: "Own the stack", body: "Nodes, indexers, APIs and UI: engineers here work across the whole explorer." },
  { title: "Open by default", body: "Much of our tooling is open source, including this explorer." },
];

export default function CareersPage() {
  return (
    <ContentPage
      eyebrow="Careers"
      title="Careers at Nadcab Labs"
      lead="Help build the infrastructure that powers new blockchain networks, from chain deployment to block explorers."
      aside={
        <HelpCard title="Open positions">
          Current openings are listed on{" "}
          <a href="https://www.nadcab.com" target="_blank" rel="noopener noreferrer">
            nadcab.com
          </a>
          . Don&apos;t see a fit? <Link href="/contact">Reach out</Link> anyway.
        </HelpCard>
      }
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {VALUES.map((value) => (
          <div key={value.title} className="rounded-xl border border-line bg-subtle p-5">
            <p className="font-semibold text-ink">{value.title}</p>
            <p className="mt-1 text-sm text-muted">{value.body}</p>
          </div>
        ))}
      </div>
      <h2>Teams we hire for</h2>
      <ul>
        <li>Blockchain infrastructure: node operations, consensus and networking</li>
        <li>Backend: indexers, APIs and data pipelines</li>
        <li>Frontend: explorer and console product experience</li>
        <li>Developer relations and technical support</li>
      </ul>
      <h2>How to apply</h2>
      <p>
        Apply through the careers section on{" "}
        <a href="https://www.nadcab.com" target="_blank" rel="noopener noreferrer">
          nadcab.com
        </a>
        . Contributions to the{" "}
        <a href="https://github.com/ndcbweb/basic-explorer" target="_blank" rel="noopener noreferrer">
          explorer repository
        </a>{" "}
        are a great way to show your work.
      </p>
    </ContentPage>
  );
}
