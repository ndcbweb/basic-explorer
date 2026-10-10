import Link from "next/link";
import ContentPage, { HelpCard } from "@/components/ContentPage";
import { config } from "@/lib/config";

export const metadata = { title: "Advertise" };

const PLACEMENTS = [
  { title: "Header banner", body: "A text banner shown in the explorer's top bar across all pages." },
  { title: "Featured token", body: "Highlight your token on the home page and token tracker." },
  { title: "Sponsored directory listing", body: "A featured slot for your project in the Directory." },
];

export default function AdvertisePage() {
  return (
    <ContentPage
      eyebrow="Advertise"
      title={`Advertise on ${config.chainName} Explorer`}
      lead={`Reach the developers, validators and users who check ${config.chainName} every day.`}
      aside={
        <HelpCard title="Get in touch">
          Tell us about your project and goals on the <Link href="/contact">contact page</Link>.
        </HelpCard>
      }
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {PLACEMENTS.map((p) => (
          <div key={p.title} className="rounded-xl border border-line bg-subtle p-5">
            <p className="font-semibold text-ink">{p.title}</p>
            <p className="mt-1 text-sm text-muted">{p.body}</p>
          </div>
        ))}
      </div>
      <h2>Guidelines</h2>
      <ul>
        <li>Ads are clearly labelled as sponsored.</li>
        <li>We do not run ads for unverified tokens, giveaways or anything that asks for private keys.</li>
        <li>Every placement is reviewed before going live.</li>
      </ul>
    </ContentPage>
  );
}
