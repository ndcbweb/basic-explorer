import Link from "next/link";
import ContentPage from "@/components/ContentPage";
import { config } from "@/lib/config";

export const metadata = { title: "Priority Support" };

const PLANS = [
  {
    name: "Community",
    price: "Free",
    points: ["Knowledge Base and API docs", "GitHub issues", "Best-effort response"],
  },
  {
    name: "Priority",
    price: "Contact us",
    points: ["Dedicated support channel", "Faster response for incidents", "Help with explorer and node configuration"],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    points: ["Named engineer", "Custom explorer features and branding", "Uptime commitments for your network"],
  },
];

export default function PrioritySupportPage() {
  return (
    <ContentPage
      eyebrow="Priority Support"
      title="Priority Support"
      lead={`Get faster, hands-on help with ${config.chainName}, its nodes and this explorer.`}
    >
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-xl border p-5 ${plan.featured ? "border-brand-500 bg-brand-50" : "border-line bg-subtle"}`}
          >
            <p className="font-semibold text-ink">{plan.name}</p>
            <p className="mt-1 text-sm text-muted">{plan.price}</p>
            <ul className="mt-4 mb-0 flex-1 space-y-1.5 text-sm">
              {plan.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2>How to get priority support</h2>
      <p>
        Reach the team from your{" "}
        <a href="https://console.nadcab.com" target="_blank" rel="noopener noreferrer">
          Nadcab Console
        </a>{" "}
        project, or <Link href="/contact">contact us</Link> about enterprise terms.
      </p>
    </ContentPage>
  );
}
