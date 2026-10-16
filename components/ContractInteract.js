"use client";

import { useMemo, useState } from "react";
import { decodeFunctionResult, encodeFunctionData, getAddress } from "viem";
import { connectWallet, ensureChain, walletError } from "@/components/tools/wallet";

function parseAbi(raw) {
  if (!raw) return [];
  try {
    const value = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function isReadable(item) {
  return item?.type === "function" && (item.stateMutability === "view" || item.stateMutability === "pure" || item.constant === true);
}

function isWritable(item) {
  return item?.type === "function" && !isReadable(item);
}

function typeLabel(input) {
  return input.type + (input.name ? ` ${input.name}` : "");
}

function placeholder(input) {
  if (input.type === "address") return "0x…";
  if (input.type.startsWith("uint") || input.type.startsWith("int")) return "0";
  if (input.type === "bool") return "true";
  if (input.type.includes("[]")) return "[]";
  if (input.type === "string") return '""';
  return input.type;
}

function coerce(input, text) {
  const value = String(text ?? "").trim();
  if (input.type === "address") return getAddress(value);
  if (input.type === "bool") {
    if (/^(true|1)$/i.test(value)) return true;
    if (/^(false|0)$/i.test(value)) return false;
    throw new Error("bool must be true or false");
  }
  if (input.type.startsWith("uint") || input.type.startsWith("int") || input.type === "uint" || input.type === "int") {
    if (!/^-?\d+$/.test(value)) throw new Error(`${input.name || input.type} must be a whole number`);
    return BigInt(value);
  }
  if (input.type === "bytes" || /^bytes\d+$/.test(input.type)) {
    if (!/^0x[0-9a-fA-F]*$/.test(value)) throw new Error(`${input.name || input.type} must be 0x hex`);
    return value;
  }
  if (input.type.includes("[]") || input.type === "tuple" || input.type.startsWith("tuple")) {
    return JSON.parse(value || "[]");
  }
  return value;
}

function formatResult(value) {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return JSON.stringify(value.map((item) => (typeof item === "bigint" ? item.toString() : item)), null, 2);
  if (value && typeof value === "object") {
    return JSON.stringify(
      Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typeof item === "bigint" ? item.toString() : item])),
      null,
      2
    );
  }
  return String(value);
}

async function rpc(method, params) {
  const res = await fetch("/api/rpc", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method, params }),
  });
  const data = await res.json().catch(() => ({}));
  if (data.error) throw new Error(data.error.message || "RPC error");
  if (!res.ok) throw new Error(data.error || `RPC HTTP ${res.status}`);
  return data.result;
}

function MethodCard({ item, address, mode, chainId, currency }) {
  const inputs = item.inputs || [];
  const [args, setArgs] = useState(() => inputs.map(() => ""));
  const [payable, setPayable] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function run(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const values = inputs.map((input, i) => coerce(input, args[i]));
      const data = encodeFunctionData({ abi: [item], functionName: item.name, args: values });
      if (mode === "read") {
        const raw = await rpc("eth_call", [{ to: address, data }, "latest"]);
        const decoded = decodeFunctionResult({ abi: [item], functionName: item.name, data: raw });
        setResult(formatResult(decoded));
      } else {
        const from = await connectWallet();
        await ensureChain(chainId);
        const tx = { from, to: address, data };
        if (item.stateMutability === "payable" && payable.trim()) {
          const eth = Number(payable);
          if (!(eth >= 0) || Number.isNaN(eth)) throw new Error("Payable amount must be a number");
          tx.value = `0x${BigInt(Math.round(eth * 1e18)).toString(16)}`;
        }
        const hash = await window.ethereum.request({ method: "eth_sendTransaction", params: [tx] });
        setResult(hash);
      }
    } catch (err) {
      setError(walletError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={run} className="rounded-lg border border-line bg-subtle p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-sm font-semibold text-ink">{item.name}</p>
        <p className="text-xs text-muted">
          {item.stateMutability || (mode === "read" ? "view" : "nonpayable")}
          {inputs.length ? ` · ${inputs.map(typeLabel).join(", ")}` : ""}
        </p>
      </div>
      {inputs.length ? (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {inputs.map((input, i) => (
            <label key={`${input.name}-${i}`} className="block text-xs">
              <span className="text-muted">{typeLabel(input)}</span>
              <input
                className="mt-1 w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 font-mono text-sm text-ink"
                value={args[i]}
                placeholder={placeholder(input)}
                spellCheck={false}
                onChange={(event) => setArgs((prev) => prev.map((value, j) => (j === i ? event.target.value : value)))}
              />
            </label>
          ))}
        </div>
      ) : null}
      {mode === "write" && item.stateMutability === "payable" ? (
        <label className="mb-3 block text-xs">
          <span className="text-muted">Value ({currency || "ETH"})</span>
          <input
            className="mt-1 w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 font-mono text-sm text-ink"
            value={payable}
            placeholder="0"
            inputMode="decimal"
            onChange={(event) => setPayable(event.target.value)}
          />
        </label>
      ) : null}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? (mode === "read" ? "Querying…" : "Confirm in wallet…") : mode === "read" ? "Query" : "Write"}
      </button>
      {error ? <p className="mt-2 text-sm text-bad-700">{error}</p> : null}
      {result != null ? (
        <pre className="mono mt-2 max-h-48 overflow-auto rounded-md border border-line bg-canvas p-3 text-xs text-ink whitespace-pre-wrap break-all">
          {result}
        </pre>
      ) : null}
    </form>
  );
}

/** Read and Write Contract panels for a verified contract, driven by its published ABI. */
export default function ContractInteract({ address, abi: rawAbi, initialTab = "read", chainId = "", currency = "ETH" }) {
  const abi = useMemo(() => parseAbi(rawAbi), [rawAbi]);
  const reads = useMemo(() => abi.filter(isReadable), [abi]);
  const writes = useMemo(() => abi.filter(isWritable), [abi]);
  const [tab, setTab] = useState(initialTab === "write" ? "write" : "read");

  if (!reads.length && !writes.length) {
    return <p className="p-5 text-sm text-muted">This contract&apos;s ABI has no callable functions.</p>;
  }

  const list = tab === "read" ? reads : writes;

  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`chip ${tab === "read" ? "border-brand-100 bg-brand-50 text-brand-700" : ""}`} onClick={() => setTab("read")}>
          Read Contract ({reads.length})
        </button>
        <button type="button" className={`chip ${tab === "write" ? "border-brand-100 bg-brand-50 text-brand-700" : ""}`} onClick={() => setTab("write")}>
          Write Contract ({writes.length})
        </button>
      </div>
      {tab === "write" ? (
        <p className="text-xs text-muted">Writes are signed in your wallet on chain ID {chainId || "—"}. Connect the owner wallet before calling admin methods.</p>
      ) : (
        <p className="text-xs text-muted">Reads go through the explorer RPC. No wallet needed.</p>
      )}
      {list.length ? (
        <div className="space-y-3">
          {list.map((item, i) => (
            <MethodCard key={`${item.name}-${i}`} item={item} address={address} mode={tab} chainId={chainId} currency={currency} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No {tab} methods in this ABI.</p>
      )}
    </div>
  );
}
