import Link from "next/link";
import { Container, PageHeader } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: "API Pricing" };

const PLANS = [
  {
    name: "Free",
    price: "Free",
    cta: { label: "Start Building", href: "/apis" },
    features: ["All public API modules", "No API key needed", "Fair-use rate limits", "Community support"],
  },
  {
    name: "Dedicated",
    price: "Contact us",
    featured: true,
    cta: { label: "Contact Sales", href: "/contact" },
    features: ["Dedicated explorer + RPC instance", "Higher throughput", "Custom endpoints and data exports", "Priority support"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cta: { label: "Talk to Us", href: "/contact" },
    features: ["White-label explorer for your chain", "Uptime commitments", "Named engineer", "On-prem deployment option"],
  },
];

export default function PricingPage() {
  return (
    <Container>
      <PageHeader title="API Plans" subtitle={`Access ${config.chainName} data through the Explorer API`} />
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <section key={plan.name} className={`card flex flex-col p-6 ${plan.featured ? "ring-2 ring-brand-500" : ""}`}>
            {plan.featured && <span className="mb-3 self-start rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600">Most popular</span>}
            <h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
            <p className="mt-1 text-2xl font-semibold text-ink">{plan.price}</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-muted">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-ok-700" aria-hidden="true">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link href={plan.cta.href} className={`mt-6 ${plan.featured ? "btn-primary" : "inline-flex justify-center rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-canvas"}`}>
              {plan.cta.label}
            </Link>
          </section>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">
        The public API is free while in fair use. Heavy automated traffic may be throttled; reach out for a dedicated plan.
      </p>
    </Container>
  );
}
