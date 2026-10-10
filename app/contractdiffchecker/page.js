import ContractToolsTabs from "@/components/ContractToolsTabs";
import DiffPasteForm from "@/components/DiffPasteForm";
import DiffView from "@/components/DiffView";
import LookupForm from "@/components/LookupForm";
import { AddressLink, Container, EmptyState, LinkTabs, PageHeader } from "@/components/ui";
import { flatSource, getVerified } from "@/lib/contracts";
import { diffLines, disassemble } from "@/lib/diff";
import { isAddress } from "@/lib/format";
import { safeRpc } from "@/lib/rpc";

export const metadata = { title: "Contract Diff Checker" };

async function sideFor(address) {
  const verified = getVerified(address);
  if (verified) return { address, kind: "source", label: verified.name, text: flatSource(verified) };
  const code = await safeRpc("eth_getCode", [address, "latest"], null);
  if (code == null) return { address, error: "bytecode could not be read from the node" };
  if (code === "0x") return { address, error: "has no deployed bytecode" };
  return { address, kind: "bytecode", label: "unverified bytecode", text: disassemble(code) };
}

export default async function DiffCheckerPage({ searchParams }) {
  const query = (await searchParams) || {};
  const mode = query.mode === "paste" ? "paste" : "address";
  const rawA = String(query.a || "").trim();
  const rawB = String(query.b || "").trim();

  let error = null;
  let sides = null;
  if (mode === "address" && (rawA || rawB)) {
    if (!isAddress(rawA) || !isAddress(rawB)) error = "Enter two valid 0x-prefixed contract addresses.";
    else {
      sides = await Promise.all([sideFor(rawA.toLowerCase()), sideFor(rawB.toLowerCase())]);
      const failed = sides.find((side) => side.error);
      if (failed) error = `${failed.address} ${failed.error}.`;
      else if (sides[0].kind !== sides[1].kind) {
        // Compare like with like: fall back to bytecode on both sides.
        const codes = await Promise.all(sides.map((side) => safeRpc("eth_getCode", [side.address, "latest"], "0x")));
        sides = sides.map((side, i) => ({ ...side, kind: "bytecode", text: disassemble(codes[i]) }));
      }
    }
  }
  const rows = sides && !error ? diffLines(sides[0].text, sides[1].text) : null;

  return (
    <Container>
      <PageHeader title="Contract Diff Checker" subtitle="Compare the verified source code of two contracts line by line. Unverified contracts are compared by disassembled bytecode." />
      <ContractToolsTabs active="diff" />
      <LinkTabs
        active={mode}
        tabs={[
          { id: "address", label: "Compare Addresses", href: "/contractdiffchecker" },
          { id: "paste", label: "Paste Source", href: "/contractdiffchecker?mode=paste" },
        ]}
      />
      {mode === "paste" ? (
        <section className="card overflow-hidden">
          <DiffPasteForm />
        </section>
      ) : (
        <>
          <section className="card mb-5 p-5">
            <LookupForm
              action="/contractdiffchecker"
              fields={[
                { name: "a", label: "Contract Address A", value: rawA },
                { name: "b", label: "Contract Address B", value: rawB },
              ]}
              submitLabel="Compare"
            />
          </section>
          {error && (
            <section className="card">
              <EmptyState title="Can't compare" body={error} />
            </section>
          )}
          {rows && (
            <section className="card overflow-hidden">
              <div className="card-head flex-wrap text-sm">
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <span className="chip border-bad-700/25 bg-bad-50 text-bad-700">A</span>
                  <AddressLink address={sides[0].address} />
                  <span className="text-muted">{sides[0].kind === "source" ? sides[0].label : "bytecode"}</span>
                </span>
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <span className="chip border-ok-700/25 bg-ok-50 text-ok-700">B</span>
                  <AddressLink address={sides[1].address} />
                  <span className="text-muted">{sides[1].kind === "source" ? sides[1].label : "bytecode"}</span>
                </span>
              </div>
              <DiffView rows={rows} leftLabel="A" rightLabel="B" />
            </section>
          )}
        </>
      )}
    </Container>
  );
}
