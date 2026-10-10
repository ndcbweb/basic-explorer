import CompilerForm from "@/components/CompilerForm";
import ContractToolsTabs from "@/components/ContractToolsTabs";
import { Container, PageHeader } from "@/components/ui";
import { EVM_VERSIONS, listVersions } from "@/lib/solc";

export const metadata = { title: "Solidity Online Compiler" };
export const dynamic = "force-dynamic";

export default async function CompilerPage() {
  const versions = await listVersions();
  return (
    <Container>
      <PageHeader
        title="Solidity Online Compiler"
        subtitle="Compile Solidity with any official solc release and get the ABI, bytecode, errors and warnings back."
      />
      <ContractToolsTabs active="compiler" />
      <div className="mb-4 rounded-lg border border-wait-700/25 bg-wait-50 px-4 py-3 text-sm text-wait-700">
        Only Solidity is supported. Vyper is not supported by this compiler. Imports are not resolved, so paste a flattened single file.
      </div>
      <section className="card p-6">
        <CompilerForm versions={versions} evmVersions={EVM_VERSIONS} defaultVersion={versions[0] || ""} />
      </section>
    </Container>
  );
}
