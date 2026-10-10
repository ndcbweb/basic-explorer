"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const Label = ({ htmlFor, children, hint }) => (
  <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
    {children}
    {hint && <span className="ml-1 font-normal text-muted">{hint}</span>}
  </label>
);

export function useCompilerVersions(initial) {
  const [versions, setVersions] = useState(initial || []);
  useEffect(() => {
    if (versions.length) return;
    fetch("/api/verify?versions=1")
      .then((res) => res.json())
      .then((json) => setVersions(json.versions || []))
      .catch(() => {});
  }, [versions.length]);
  return versions;
}

export function VersionSelect({ id, value, onChange, versions }) {
  if (!versions.length) {
    return (
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="v0.8.24+commit.e11b9ed9"
        className="field mono"
        spellCheck={false}
      />
    );
  }
  return (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="field">
      <option value="">[Please Select]</option>
      {versions.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );
}

export default function VerifyContractForm({ initialAddress = "", versions: initialVersions, evmVersions, licenses }) {
  const versions = useCompilerVersions(initialVersions);
  const [form, setForm] = useState({
    address: initialAddress,
    compilerType: "single",
    compilerVersion: "",
    optimization: false,
    runs: 200,
    evmVersion: "default",
    license: licenses[2] || "",
    contractName: "",
    source: "",
    constructorArgs: "",
  });
  const [state, setState] = useState({ status: "idle" });
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const standard = form.compilerType === "standard-json";

  const submit = async (event) => {
    event.preventDefault();
    if (!/^0x[0-9a-fA-F]{40}$/.test(form.address.trim())) {
      setState({ status: "error", message: "Enter a valid contract address." });
      return;
    }
    setState({ status: "verifying" });
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, address: form.address.trim() }),
      });
      const json = await res.json();
      if (json.ok) setState({ status: "verified", ...json });
      else setState({ status: "error", message: json.error, errors: json.errors, available: json.available, address: json.address });
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <Label htmlFor="vc-address">Contract Address</Label>
        <input
          id="vc-address"
          value={form.address}
          onChange={(event) => set("address")(event.target.value)}
          placeholder="0x…"
          className="field mono"
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="vc-type">Compiler Type</Label>
          <select id="vc-type" value={form.compilerType} onChange={(event) => set("compilerType")(event.target.value)} className="field">
            <option value="single">Solidity (Single file)</option>
            <option value="standard-json">Solidity (Standard-JSON-Input)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="vc-version">Compiler Version</Label>
          <VersionSelect id="vc-version" value={form.compilerVersion} onChange={set("compilerVersion")} versions={versions} />
        </div>
        <div>
          <Label htmlFor="vc-license">Open Source License Type</Label>
          <select id="vc-license" value={form.license} onChange={(event) => set("license")(event.target.value)} className="field">
            {licenses.map((license) => (
              <option key={license} value={license}>
                {license}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="vc-name" hint={standard ? "(e.g. MyToken or contracts/MyToken.sol:MyToken)" : "(as declared in source)"}>
            Contract Name
          </Label>
          <input
            id="vc-name"
            value={form.contractName}
            onChange={(event) => set("contractName")(event.target.value)}
            placeholder="MyToken"
            className="field"
            spellCheck={false}
          />
        </div>
      </div>

      {!standard && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="vc-opt">Optimization</Label>
            <select
              id="vc-opt"
              value={form.optimization ? "1" : "0"}
              onChange={(event) => set("optimization")(event.target.value === "1")}
              className="field"
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
          <div>
            <Label htmlFor="vc-runs">Runs</Label>
            <input
              id="vc-runs"
              type="number"
              min="1"
              value={form.runs}
              disabled={!form.optimization}
              onChange={(event) => set("runs")(event.target.value)}
              className="field disabled:opacity-60"
            />
          </div>
          <div>
            <Label htmlFor="vc-evm">EVM Version</Label>
            <select id="vc-evm" value={form.evmVersion} onChange={(event) => set("evmVersion")(event.target.value)} className="field">
              {evmVersions.map((v) => (
                <option key={v} value={v}>
                  {v === "default" ? "default (compiler defaults)" : v}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="vc-source" hint={standard ? "(paste the full Standard-JSON input; its settings are used as-is)" : "(flattened, all imports inlined)"}>
          {standard ? "Standard-JSON Input" : "Contract Source Code"}
        </Label>
        <textarea
          id="vc-source"
          value={form.source}
          onChange={(event) => set("source")(event.target.value)}
          rows={16}
          spellCheck={false}
          placeholder={standard ? '{\n  "language": "Solidity",\n  "sources": { … },\n  "settings": { … }\n}' : "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract MyToken { … }"}
          className="field font-mono text-xs"
        />
      </div>

      <div>
        <Label htmlFor="vc-args" hint="(optional, ABI-encoded hex; detected from the creation transaction when left blank)">
          Constructor Arguments
        </Label>
        <textarea
          id="vc-args"
          value={form.constructorArgs}
          onChange={(event) => set("constructorArgs")(event.target.value)}
          rows={2}
          spellCheck={false}
          className="field font-mono text-xs"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={state.status === "verifying"}>
          {state.status === "verifying" ? "Compiling and verifying…" : "Verify and Publish"}
        </button>
        {state.status === "verifying" && <span className="text-sm text-muted">The first use of a compiler version downloads it, which can take a moment.</span>}
      </div>

      {state.status === "verified" && (
        <div role="status" className="rounded-lg border border-ok-700/25 bg-ok-50 px-4 py-3 text-sm text-ok-700">
          Successfully verified <strong>{state.name}</strong> ({state.match === "exact" ? "exact match" : "partial match, metadata differs"}).{" "}
          <Link href={`/address/${state.address}?tab=code`} className="font-medium underline">
            View contract source
          </Link>
        </div>
      )}
      {state.status === "error" && (
        <div role="alert" className="space-y-2 rounded-lg border border-bad-700/25 bg-bad-50 px-4 py-3 text-sm text-bad-700">
          <p>
            {state.message}
            {state.address && (
              <>
                {" "}
                <Link href={`/address/${state.address}?tab=code`} className="underline">
                  View it
                </Link>
              </>
            )}
          </p>
          {state.available?.length > 0 && <p>Contracts found: {state.available.join(", ")}</p>}
          {state.errors?.length > 0 && <pre className="mono max-h-60 overflow-auto whitespace-pre-wrap">{state.errors.join("\n")}</pre>}
        </div>
      )}
    </form>
  );
}
