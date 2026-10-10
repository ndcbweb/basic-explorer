import ContractSource, { VerifyPrompt } from "@/components/ContractSource";
import ContractToolsTabs from "@/components/ContractToolsTabs";
import LookupForm from "@/components/LookupForm";
import { AddressLink, Container, EmptyState, PageHeader } from "@/components/ui";
import { getVerified } from "@/lib/contracts";
import { isAddress } from "@/lib/format";
import { safeRpc } from "@/lib/rpc";

export const metadata = { title: "Contract Code Reader" };

export default async function CodeReaderPage({ searchParams }) {
  const query = (await searchParams) || {};
  const raw = String(query.a || "").trim();
  const address = isAddress(raw) ? raw.toLowerCase() : null;
  const code = address ? await safeRpc("eth_getCode", [address, "latest"], null) : null;
  const verified = address ? getVerified(address) : null;

  let body = null;
  if (raw && !address) {
    body = <EmptyState title="Invalid address" body="Enter a 0x-prefixed address with 40 hex characters." />;
  } else if (address && code == null) {
    body = <EmptyState title="Node unavailable" body="The bytecode could not be read from the RPC node. Try again shortly." />;
  } else if (address && code === "0x" && !verified) {
    body = <EmptyState title="Not a contract" body="This address has no deployed bytecode. It is an externally owned account." />;
  } else if (address) {
    body = (
      <>
        <div className="card-head">
          <h2 className="card-title">
            Contract <AddressLink address={address} full />
          </h2>
        </div>
        {verified ? <ContractSource contract={verified} code={code} /> : <VerifyPrompt address={address} code={code} />}
      </>
    );
  }

  return (
    <Container>
      <PageHeader title="Code Reader" subtitle="Read the verified source code, ABI and bytecode of any contract." />
      <ContractToolsTabs active="reader" />
      <section className="card mb-5 p-5">
        <LookupForm action="/code-reader" fields={[{ name: "a", label: "Contract Address", value: raw }]} submitLabel="Read Code" />
      </section>
      {body && <section className="card overflow-hidden">{body}</section>}
    </Container>
  );
}
