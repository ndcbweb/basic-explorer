import NewsletterForm from "@/components/NewsletterForm";
import { Container, PageHeader } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: "Newsletter" };

export default function NewsletterPage() {
  return (
    <Container>
      <PageHeader title={`${config.chainName} Newsletter`} subtitle="Network upgrades, explorer features and ecosystem updates in your inbox" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card p-6">
          <NewsletterForm />
          <p className="mt-4 text-xs text-faint">
            Your address is stored only by this explorer&apos;s operator for sending updates. Unsubscribe any time by contacting us.
          </p>
        </section>
        <aside className="card p-5 text-sm text-muted">
          <p className="font-semibold text-ink">What you&apos;ll get</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Hard fork and maintenance announcements</li>
            <li>New explorer tools and API endpoints</li>
            <li>Highlights from projects building on {config.chainName}</li>
          </ul>
        </aside>
      </div>
    </Container>
  );
}
