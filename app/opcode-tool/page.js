import OpcodeTool from "@/components/tools/OpcodeTool";
import { Container, PageHeader } from "@/components/ui";

export const metadata = { title: "Bytecode to Opcode Disassembler" };

export default function OpcodeToolPage() {
  return (
    <Container>
      <PageHeader
        title="Bytecode to Opcode Disassembler"
        subtitle="Turn EVM bytecode into a readable list of opcodes. Paste bytecode or enter a contract address."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card p-6">
          <OpcodeTool />
        </section>
        <aside className="card p-5 text-sm text-muted">
          <p className="font-semibold text-ink">Reading the output</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Each line is the byte offset in hex, the opcode, and any PUSH data.</li>
            <li>The table covers the Cancun instruction set, including PUSH0, TLOAD, TSTORE, MCOPY, BLOBHASH and BLOBBASEFEE.</li>
            <li>Bytes that are not opcodes (often the metadata hash at the end) show as Unknown Opcode.</li>
            <li>For an address, the deployed runtime code is fetched from the node.</li>
          </ul>
        </aside>
      </div>
    </Container>
  );
}
