import UnitConverter from "@/components/UnitConverter";
import { Container, PageHeader } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: "Unit Converter" };

export default function UnitConverterPage() {
  return (
    <Container>
      <PageHeader
        title="Unit Converter"
        subtitle={`Convert between Wei, Gwei and ${config.currency}. Type in any field and the rest update instantly.`}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card px-6 py-3">
          <UnitConverter currency={config.currency} />
        </section>
        <aside className="card p-5 text-sm text-muted">
          <p className="font-semibold text-ink">About units</p>
          <p className="mt-2">
            {config.currency} has 18 decimals, so 1 {config.currency} is 10^18 Wei. Gas prices are usually quoted in Gwei (10^9 Wei), and the
            API and JSON-RPC always return amounts in Wei.
          </p>
        </aside>
      </div>
    </Container>
  );
}
