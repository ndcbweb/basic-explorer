import Link from "next/link";
import ContentPage, { HelpCard } from "@/components/ContentPage";
import { config } from "@/lib/config";

export const metadata = { title: "Explorer Premium" };

const FEATURES = [
  { title: "Bigger watch lists", body: "Track more addresses and get notified when they move funds." },
  { title: "Larger CSV exports", body: "Download full histories instead of the standard row limit." },
  { title: "Higher API throughput", body: "Dedicated capacity for production apps and analytics." },
  { title: "Ad-free experience", body: "A clean explorer for your whole team." },
];

export default function PremiumPage() {
  return (
    <ContentPage
      eyebrow="Explorer Premium"
      title={`${config.chainName} Explorer Premium`}
      lead="Extra capacity and power-user features for teams that rely on the explorer every day."
      aside={
        <HelpCard title="Interested?">
          Premium is set up per organisation. <Link href="/contact">Contact us</Link> to enable it for your team.
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
      <h2>Free features</h2>
      <p>
        Everything else stays free for everyone: search, all explorer pages, the <Link href="/apis">public API</Link>, and an account with a
        watch list and private name tags (<Link href="/register">sign up</Link>).
      </p>
    </ContentPage>
  );
}
