import Link from "next/link";
import CopyButton from "./CopyButton";
import { formatDate } from "@/lib/format";
import { sourceFiles } from "@/lib/contracts";

export function CodeBlock({ title, value, copy = true, maxHeight = "max-h-[420px]", muted = false }) {
  return (
    <div>
      {title && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink">{title}</p>
          {copy && value ? <CopyButton value={value} label={`Copy ${title}`} /> : null}
        </div>
      )}
      <pre
        className={`mono ${maxHeight} overflow-auto rounded-md border border-line bg-canvas p-3 text-[12.5px] leading-relaxed ${
          muted ? "break-all whitespace-pre-wrap text-muted" : "whitespace-pre text-ink"
        }`}
      >
        {value || "—"}
      </pre>
    </div>
  );
}

function Fact({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-ink">{children}</p>
    </div>
  );
}

function prettyAbi(abi) {
  try {
    return JSON.stringify(JSON.parse(abi), null, 2);
  } catch {
    return abi || "[]";
  }
}

/** "Contract Source Code Verified" panel shared by the address page and the code reader. */
export default function ContractSource({ contract, code }) {
  const files = sourceFiles(contract);
  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ok-700/25 bg-ok-50 px-2.5 py-0.5 text-xs font-medium text-ok-700">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
            <path fill="currentColor" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.7-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06l1.47 1.47 3.97-3.97a.75.75 0 0 1 1.06 1.06Z" />
          </svg>
          Contract Source Code Verified
        </span>
        <span className="text-xs text-muted">
          {contract.match_type === "exact" ? "Exact match" : "Partial match (metadata differs)"} · verified {formatDate(contract.verified_at)}
        </span>
      </div>

      <div className="grid gap-4 rounded-lg border border-line bg-subtle p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Contract Name">{contract.name}</Fact>
        <Fact label="Compiler Version">{contract.compiler_version}</Fact>
        <Fact label="Optimization Enabled">{contract.optimization ? `Yes with ${contract.runs ?? 200} runs` : "No"}</Fact>
        <Fact label="Other Settings">
          {contract.evm_version || "default"} evmVersion{contract.license ? `, ${contract.license}` : ""}
        </Fact>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-ink">
          Contract Source Code {files.length > 1 ? `(${files.length} files)` : "(Solidity)"}
        </p>
        {files.map((file, i) => (
          <CodeBlock key={file.name} title={files.length > 1 ? `File ${i + 1} of ${files.length}: ${file.name}` : file.name} value={file.content} />
        ))}
      </div>

      <CodeBlock title="Contract ABI" value={prettyAbi(contract.abi)} maxHeight="max-h-[320px]" />

      {contract.constructor_args && <CodeBlock title="Constructor Arguments (ABI-encoded)" value={contract.constructor_args} muted maxHeight="max-h-[160px]" />}

      {code && <CodeBlock title="Deployed Bytecode" value={code} muted maxHeight="max-h-[240px]" />}
    </div>
  );
}

export function VerifyPrompt({ address, code }) {
  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-col gap-3 rounded-lg border border-wait-700/25 bg-wait-50 px-4 py-3 text-sm text-wait-700 sm:flex-row sm:items-center sm:justify-between">
        <span>Are you the contract creator? Verify and publish your contract source code today.</span>
        <Link href={`/verifycontract?a=${address}`} className="btn-primary shrink-0 text-center hover:text-white">
          Verify and Publish
        </Link>
      </div>
      {code && <CodeBlock title={`Contract Bytecode · ${((code.length - 2) / 2).toLocaleString("en-US")} bytes`} value={code} muted />}
    </div>
  );
}
