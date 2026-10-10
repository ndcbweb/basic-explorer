import InputDataDecoder from "@/components/tools/InputDataDecoder";
import { BetaBadge } from "@/components/tools/shared";
import { Container, PageHeader } from "@/components/ui";

export const metadata = { title: "Input Data Decoder" };

export default function InputDataDecoderPage() {
  return (
    <Container>
      <PageHeader
        title={
          <>
            Input Data Decoder
            <BetaBadge />
          </>
        }
        subtitle="Decode transaction calldata into readable function arguments using an ABI or a function signature."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card p-6">
          <InputDataDecoder />
        </section>
        <aside className="card p-5 text-sm text-muted">
          <p className="font-semibold text-ink">How to use</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Paste raw calldata, or a transaction hash to load its input from the node.</li>
            <li>
              Add the contract ABI or a signature like <code className="mono text-ink">transfer(address,uint256)</code>. The function is
              matched by its 4-byte selector.
            </li>
            <li>Without an ABI you still get the selector, the 32-byte words and a UTF-8 view of the bytes.</li>
          </ul>
        </aside>
      </div>
    </Container>
  );
}
