import Link from "next/link";
import { Container } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: "Explorer API" };

const FEATURES = [
  { title: "Etherscan-compatible", body: "Same module/action query format and response envelope, so existing SDKs and scripts work by swapping the base URL." },
  { title: "Accounts & balances", body: "Native and token balances, normal transaction history, ERC-20 and ERC-721 transfer events, blocks validated." },
  { title: "Transactions & blocks", body: "Receipt and execution status checks, block lookup by timestamp." },
  { title: "Geth proxy", body: "eth_* calls through the same endpoint: blocks, receipts, calls, gas estimates and raw transaction broadcast." },
  { title: "Indexed data", body: "History comes from the explorer's own index, so address queries return instantly without an archive scan." },
  { title: "CORS enabled", body: "Call the API directly from browser dApps and dashboards." },
];

export default function ExplorerApiPage() {
  return (
    <Container>
      <section className="card mb-6 overflow-hidden">
        <div className="grid gap-6 p-8 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <p className="text-sm font-medium text-brand-600">{config.chainName} Explorer API</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Build on {config.chainName} with a familiar API</h1>
            <p className="mt-3 max-w-xl text-[15px] text-muted">
              Query accounts, transactions, tokens and blocks with the same requests you already use for Etherscan. No API key required.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/apis" className="btn-primary">
                Read the Docs
              </Link>
              <Link href="/apis/pricing" className="inline-flex items-center rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-canvas">
                View Plans
              </Link>
            </div>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-line bg-subtle p-4 font-mono text-[12px] leading-6 text-ink">
            {`GET /api?module=account
        &action=balance
        &address=0x…

{
  "status": "1",
  "message": "OK",
  "result": "1000000000000000000"
}`}
          </pre>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="card p-5">
            <p className="font-semibold text-ink">{feature.title}</p>
            <p className="mt-1 text-sm text-muted">{feature.body}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
