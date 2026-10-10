"use client";

import { useState } from "react";

export function AddNetworkButton({ chainId, chainName, currency }) {
  const [state, setState] = useState("idle");
  if (!chainId) return null;

  const add = async () => {
    if (!window.ethereum) {
      setState("missing");
      return;
    }
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${Number(chainId).toString(16)}`,
            chainName,
            nativeCurrency: { name: currency, symbol: currency, decimals: 18 },
            rpcUrls: [`${window.location.protocol}//${window.location.hostname}:8545`],
            blockExplorerUrls: [window.location.origin],
          },
        ],
      });
      setState("added");
    } catch {
      setState("idle");
    }
  };

  const label = { idle: `Add ${chainName}`, added: "Network added", missing: "Install a wallet first" }[state];

  return (
    <button
      type="button"
      onClick={add}
      className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#8ea6e8]" aria-hidden="true">
        <path fill="currentColor" d="M10 3.5a.75.75 0 0 1 .75.75v5h5a.75.75 0 0 1 0 1.5h-5v5a.75.75 0 0 1-1.5 0v-5h-5a.75.75 0 0 1 0-1.5h5v-5A.75.75 0 0 1 10 3.5Z" />
      </svg>
      {label}
    </button>
  );
}

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="inline-flex items-center gap-1.5 text-sm text-[#aab6cc] transition-colors hover:text-white"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
        <path fill="currentColor" d="M4 3.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 3.25Zm5.47 2.47a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06l-2.72-2.72v8.69a.75.75 0 0 1-1.5 0V8.06l-2.72 2.72a.75.75 0 0 1-1.06-1.06l4-4Z" />
      </svg>
      Back to top
    </button>
  );
}
