import InputDataEncoder from "@/components/tools/InputDataEncoder";
import { BetaBadge } from "@/components/tools/shared";
import { Container, PageHeader } from "@/components/ui";

export const metadata = { title: "Input Data Encoder" };

export default function InputDataEncoderPage() {
  return (
    <Container>
      <PageHeader
        title={
          <>
            Input Data Encoder
            <BetaBadge />
          </>
        }
        subtitle="Build transaction calldata from an ABI or a function signature, ready to paste into a wallet or a raw transaction."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card p-6">
          <InputDataEncoder />
        </section>
        <aside className="card p-5 text-sm text-muted">
          <p className="font-semibold text-ink">How to use</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              Paste a contract ABI (JSON) or signatures such as <code className="mono text-ink">transfer(address,uint256)</code>, one per line.
            </li>
            <li>Pick a function and fill in each argument.</li>
            <li>Integers accept decimal or 0x hex. Booleans accept true or false.</li>
            <li>
              Arrays and structs take JSON, e.g. <code className="mono text-ink">[&quot;0xabc…&quot;, &quot;0xdef…&quot;]</code> or{" "}
              <code className="mono text-ink">[1, &quot;0x…&quot;]</code> for a tuple.
            </li>
            <li>The output is the 4-byte selector followed by the ABI-encoded arguments.</li>
          </ul>
        </aside>
      </div>
    </Container>
  );
}
