import BalanceChecker from "@/components/tools/BalanceChecker";
import { Container, PageHeader } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: "Account Balance Checker" };

export default function BalanceCheckPage() {
  return (
    <Container>
      <PageHeader
        title="Account Balance Checker"
        subtitle={`Look up the ${config.currency} or token balance of an address at any past block or date.`}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card p-6">
          <BalanceChecker currency={config.currency} />
        </section>
        <aside className="card p-5 text-sm text-muted">
          <p className="font-semibold text-ink">How it works</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>The explorer reads balances straight from an archive node, so any historical block works.</li>
            <li>A date resolves to the last block produced on or before 23:59:59 UTC of that day.</li>
            <li>Add an ERC-20 contract to also read its balanceOf() at the same block.</li>
          </ul>
        </aside>
      </div>
    </Container>
  );
}
