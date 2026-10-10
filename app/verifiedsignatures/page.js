import SignatureTool from "@/components/tools/SignatureTool";
import { Container, PageHeader } from "@/components/ui";

export const metadata = { title: "Verified Signature" };

export default function VerifiedSignaturesPage() {
  return (
    <Container>
      <PageHeader
        title="Verified Signature"
        subtitle="Prove ownership of an address by signing a message, or check that a signed message really came from an address."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card p-6">
          <SignatureTool />
        </section>
        <aside className="card p-5 text-sm text-muted">
          <p className="font-semibold text-ink">About message signatures</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Signing uses personal_sign (EIP-191), so it costs no gas and cannot move funds.</li>
            <li>Verification recovers the signer from the message and signature and compares it with the address.</li>
            <li>The message must match exactly, including spaces and line breaks.</li>
            <li>Smart-contract wallets (ERC-1271) are not supported; only externally owned accounts.</li>
          </ul>
        </aside>
      </div>
    </Container>
  );
}
