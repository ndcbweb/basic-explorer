import PushTxForm from "@/components/PushTxForm";
import { Container, PageHeader } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: "Broadcast Raw Transaction" };

export default function PushTxPage() {
  return (
    <Container>
      <PageHeader
        title="Broadcast Raw Transaction"
        subtitle={`Submit a signed transaction to ${config.chainName}. The explorer forwards it to the node with eth_sendRawTransaction.`}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card p-6">
          <PushTxForm />
        </section>
        <aside className="card p-5 text-sm text-muted">
          <p className="font-semibold text-ink">Before you send</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Sign offline with the correct chain ID{config.chainId ? ` (${config.chainId})` : ""}.</li>
            <li>The sender needs enough {config.currency} for value plus gas.</li>
            <li>The nonce must match the sender&apos;s next nonce or the transaction waits in the queue.</li>
            <li>Broadcasting cannot be undone once a validator includes it.</li>
          </ul>
        </aside>
      </div>
    </Container>
  );
}
