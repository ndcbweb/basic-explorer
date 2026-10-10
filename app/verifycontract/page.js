import ContractToolsTabs from "@/components/ContractToolsTabs";
import { Container, PageHeader } from "@/components/ui";
import VerifyContractForm from "@/components/VerifyContractForm";
import { config } from "@/lib/config";
import { isAddress } from "@/lib/format";
import { EVM_VERSIONS, LICENSES, listVersions } from "@/lib/solc";

export const metadata = { title: "Verify & Publish Contract Source Code" };
export const dynamic = "force-dynamic";

export default async function VerifyContractPage({ searchParams }) {
  const query = (await searchParams) || {};
  const versions = await listVersions();
  return (
    <Container>
      <PageHeader
        title="Verify & Publish Contract Source Code"
        subtitle={`Publish the Solidity source of a contract deployed on ${config.chainName}. The explorer recompiles it and compares the result with the on-chain runtime bytecode.`}
      />
      <ContractToolsTabs active="verify" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card p-6">
          <VerifyContractForm
            initialAddress={isAddress(query.a) ? query.a : ""}
            versions={versions}
            evmVersions={EVM_VERSIONS}
            licenses={LICENSES}
          />
        </section>
        <aside className="space-y-4">
          <div className="card p-5 text-sm text-muted">
            <p className="font-semibold text-ink">How matching works</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Use the exact compiler version, optimizer setting, runs and EVM version used at deployment.</li>
              <li>Single-file sources must be flattened: imports are not resolved. Use Standard-JSON input for multi-file projects.</li>
              <li>The trailing CBOR metadata and immutable values are ignored, so a different metadata hash still verifies as a partial match.</li>
              <li>Clique networks often run pre-Shanghai rules; pick an older EVM version if your deployment avoided PUSH0.</li>
            </ul>
          </div>
          <div className="card p-5 text-sm text-muted">
            <p className="font-semibold text-ink">Supported</p>
            <p className="mt-2">Solidity single file and Standard-JSON-Input. Vyper is not supported.</p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
