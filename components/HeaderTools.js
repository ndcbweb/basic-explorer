"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import SearchBar from "./SearchBar";

export function HeaderSearch() {
  const pathname = usePathname() || "/";
  if (pathname === "/") return null;
  return (
    <div className="hidden w-[380px] lg:block">
      <SearchBar size="sm" />
    </div>
  );
}

export function AddNetworkIcon({ chainId, chainName, currency }) {
  const [done, setDone] = useState(false);
  if (!chainId) return null;

  const add = async () => {
    if (!window.ethereum) {
      window.alert("Install MetaMask or another EVM wallet to add this network.");
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
      setDone(true);
    } catch {
      setDone(false);
    }
  };

  return (
    <button
      type="button"
      onClick={add}
      title={done ? "Network added" : `Add ${chainName} to wallet`}
      aria-label={`Add ${chainName} to wallet`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-600"
    >
      {done ? (
        <svg viewBox="0 0 20 20" className="h-4 w-4 text-ok-700" aria-hidden="true">
          <path fill="currentColor" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
          <path
            fill="currentColor"
            d="M3 6.25A2.25 2.25 0 0 1 5.25 4h9.5A2.25 2.25 0 0 1 17 6.25v.5h-3.25a2.75 2.75 0 0 0 0 5.5H17v1.5A2.25 2.25 0 0 1 14.75 16h-9.5A2.25 2.25 0 0 1 3 13.75v-7.5Zm10.75 2h3.75v2.5h-3.75a1.25 1.25 0 0 1 0-2.5Z"
          />
        </svg>
      )}
    </button>
  );
}
