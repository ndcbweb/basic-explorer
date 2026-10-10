"use client";

import { useState } from "react";
import { addNetworkToWallet } from "@/lib/add-network";

export function AddNetworkButton({ chainId, chainName, currency, currencyName, rpcUrl }) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  if (!chainId) return null;

  const add = async () => {
    if (!window.ethereum) {
      setState("missing");
      return;
    }
    setError("");
    try {
      const added = await addNetworkToWallet({ chainId, chainName, currency, currencyName, rpcUrl });
      setState(added ? "added" : "idle");
    } catch (err) {
      setState("idle");
      setError(err.message);
    }
  };

  const label = { idle: `Add ${chainName} Network`, added: "Network added", missing: "Install a wallet first" }[state];

  return (
    <div className="grid justify-items-start gap-1.5">
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-normal text-ink transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-600"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4 text-brand-600" aria-hidden="true">
          <path
            fill="currentColor"
            d="M3 6.25A2.25 2.25 0 0 1 5.25 4h9.5A2.25 2.25 0 0 1 17 6.25v.5h-3.25a2.75 2.75 0 0 0 0 5.5H17v1.5A2.25 2.25 0 0 1 14.75 16h-9.5A2.25 2.25 0 0 1 3 13.75v-7.5Zm10.75 2h3.75v2.5h-3.75a1.25 1.25 0 0 1 0-2.5Z"
          />
        </svg>
        {label}
      </button>
      {error ? <p className="max-w-xs text-xs text-bad-700">{error}</p> : null}
    </div>
  );
}

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="inline-flex items-center gap-1.5 text-xs text-ink transition-colors hover:text-brand-600"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
        <path fill="currentColor" d="M4 3.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 3.25Zm5.47 2.47a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06l-2.72-2.72v8.69a.75.75 0 0 1-1.5 0V8.06l-2.72 2.72a.75.75 0 0 1-1.06-1.06l4-4Z" />
      </svg>
      Back to Top
    </button>
  );
}
