import ExportDataForm from "@/components/tools/ExportDataForm";
import { Container, PageHeader } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: "Download Data (CSV Export)" };

export default async function ExportDataPage({ searchParams }) {
  const query = await searchParams;
  const address = typeof query?.a === "string" ? query.a : "";
  const type = typeof query?.type === "string" ? query.type : "txns";

  return (
    <Container>
      <PageHeader
        title="Download Data (CSV Export)"
        subtitle={`Export the transaction history of any ${config.chainName} address as a CSV file.`}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card p-6">
          <ExportDataForm key={`${address}-${type}`} initialAddress={address} initialType={type} />
        </section>
        <aside className="card p-5 text-sm text-muted">
          <p className="font-semibold text-ink">About the export</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>The earliest 5,000 records in the selected range are exported, oldest first.</li>
            <li>Dates are in UTC and both ends of the range are inclusive.</li>
            <li>
              Amounts are in {config.currency} (18 decimals); token values use each token&apos;s own decimals.
            </li>
            <li>
              Scripts can call <code className="mono text-ink">/api/export?type=txns&amp;address=0x…</code> directly. Types: txns, internal,
              erc20, nft.
            </li>
          </ul>
        </aside>
      </div>
    </Container>
  );
}
