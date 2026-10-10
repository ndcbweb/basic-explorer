"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { addNetworkToWallet } from "@/lib/add-network";
import SearchBar from "./SearchBar";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // storage unavailable (private mode)
    }
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-600"
    >
      {dark ? (
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
          <path fill="currentColor" d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2Zm0 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm0 8.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM2 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 2 10Zm13 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 15 10ZM4.34 4.34a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06L4.34 5.4a.75.75 0 0 1 0-1.06Zm9.2 9.2a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06Zm2.12-9.2a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm-9.2 9.2a.75.75 0 0 1 0 1.06L5.4 15.66a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
          <path fill="currentColor" d="M7.46 2.3a.75.75 0 0 1 .12.82 6.5 6.5 0 0 0 8.6 8.6.75.75 0 0 1 1 .99A8 8 0 1 1 6.64 2.18a.75.75 0 0 1 .82.12Zm-1.6 2.05a6.5 6.5 0 1 0 9.1 9.1A8 8 0 0 1 5.86 4.35Z" />
        </svg>
      )}
    </button>
  );
}

export function HeaderSearch() {
  const pathname = usePathname() || "/";
  if (pathname === "/") return null;
  return (
    <div className="hidden w-[380px] lg:block">
      <SearchBar size="sm" />
    </div>
  );
}

export function AddNetworkIcon({ chainId, chainName, currency, currencyName, rpcUrl }) {
  const [done, setDone] = useState(false);
  if (!chainId) return null;

  const add = async () => {
    try {
      setDone(await addNetworkToWallet({ chainId, chainName, currency, currencyName, rpcUrl }));
    } catch (error) {
      setDone(false);
      window.alert(error.message);
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
