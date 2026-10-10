"use client";

import { useState } from "react";
import CopyButton from "./CopyButton";
import { useCompilerVersions, VersionSelect } from "./VerifyContractForm";

const SAMPLE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Hello {
    uint256 public x = 1;

    function set(uint256 value) external {
        x = value;
    }
}
`;

function Output({ title, value }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">{title}</p>
        <CopyButton value={value} label={`Copy ${title}`} />
      </div>
      <pre className="mono max-h-56 overflow-auto rounded-md border border-line bg-canvas p-3 text-xs break-all whitespace-pre-wrap text-muted">{value}</pre>
    </div>
  );
}

export default function CompilerForm({ versions: initialVersions, evmVersions, defaultVersion }) {
  const versions = useCompilerVersions(initialVersions);
  const [source, setSource] = useState(SAMPLE);
  const [version, setVersion] = useState(defaultVersion || "");
  const [optimization, setOptimization] = useState(false);
  const [runs, setRuns] = useState(200);
  const [evmVersion, setEvmVersion] = useState("default");
  const [state, setState] = useState({ status: "idle" });

  const submit = async (event) => {
    event.preventDefault();
    setState({ status: "compiling" });
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source, compilerVersion: version, optimization, runs, evmVersion }),
      });
      setState({ status: "done", ...(await res.json()) });
    } catch (error) {
      setState({ status: "done", ok: false, error: error.message });
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="cc-version" className="mb-1.5 block text-sm font-medium text-ink">
              Compiler Version
            </label>
            <VersionSelect id="cc-version" value={version} onChange={setVersion} versions={versions} />
          </div>
          <div>
            <label htmlFor="cc-opt" className="mb-1.5 block text-sm font-medium text-ink">
              Optimization
            </label>
            <select id="cc-opt" value={optimization ? "1" : "0"} onChange={(e) => setOptimization(e.target.value === "1")} className="field">
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
          <div>
            <label htmlFor="cc-runs" className="mb-1.5 block text-sm font-medium text-ink">
              Runs
            </label>
            <input id="cc-runs" type="number" min="1" value={runs} disabled={!optimization} onChange={(e) => setRuns(e.target.value)} className="field disabled:opacity-60" />
          </div>
          <div>
            <label htmlFor="cc-evm" className="mb-1.5 block text-sm font-medium text-ink">
              EVM Version
            </label>
            <select id="cc-evm" value={evmVersion} onChange={(e) => setEvmVersion(e.target.value)} className="field">
              {evmVersions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="cc-source" className="mb-1.5 block text-sm font-medium text-ink">
            Solidity Source
          </label>
          <textarea id="cc-source" value={source} onChange={(e) => setSource(e.target.value)} rows={18} spellCheck={false} className="field font-mono text-xs" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary" disabled={state.status === "compiling" || !version}>
            {state.status === "compiling" ? "Compiling…" : "Compile"}
          </button>
          {state.status === "compiling" && <span className="text-sm text-muted">The first use of a compiler version downloads it, which can take a moment.</span>}
        </div>
      </form>

      {state.status === "done" && (
        <div className="space-y-4">
          {state.error && (
            <div role="alert" className="rounded-lg border border-bad-700/25 bg-bad-50 px-4 py-3 text-sm text-bad-700">
              {state.error}
            </div>
          )}
          {state.errors?.length > 0 && (
            <div role="alert" className="rounded-lg border border-bad-700/25 bg-bad-50 px-4 py-3 text-sm text-bad-700">
              <p className="mb-1 font-medium">Errors</p>
              <pre className="mono overflow-auto whitespace-pre-wrap">{state.errors.join("\n")}</pre>
            </div>
          )}
          {state.warnings?.length > 0 && (
            <div className="rounded-lg border border-wait-700/25 bg-wait-50 px-4 py-3 text-sm text-wait-700">
              <p className="mb-1 font-medium">Warnings</p>
              <pre className="mono overflow-auto whitespace-pre-wrap">{state.warnings.join("\n")}</pre>
            </div>
          )}
          {state.ok && (
            <div role="status" className="rounded-lg border border-ok-700/25 bg-ok-50 px-4 py-3 text-sm text-ok-700">
              Compiled {state.contracts?.length || 0} contract{state.contracts?.length === 1 ? "" : "s"} with {state.compilerVersion}.
            </div>
          )}
          {state.ok &&
            state.contracts?.map((contract) => (
              <section key={`${contract.file}:${contract.name}`} className="card overflow-hidden">
                <div className="card-head">
                  <h3 className="card-title">{contract.name}</h3>
                  <span className="chip">{contract.file}</span>
                </div>
                <div className="space-y-4 p-5">
                  <Output title="ABI" value={JSON.stringify(contract.abi, null, 2)} />
                  <Output title="Creation Bytecode" value={contract.bytecode} />
                  <Output title="Runtime Bytecode" value={contract.deployedBytecode} />
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
