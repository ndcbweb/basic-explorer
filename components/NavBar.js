"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MENU = [
  { label: "Home", href: "/", match: (p) => p === "/" },
  {
    label: "Blockchain",
    match: (p) => /^\/(txs?|blocks?|validators|accounts|address)(\/|$)/.test(p),
    items: [
      { label: "Transactions", href: "/txs" },
      { label: "Pending Transactions", href: "/txs/pending" },
      { divider: true },
      { label: "View Blocks", href: "/blocks" },
      { label: "Validators", href: "/validators" },
      { divider: true },
      { label: "Top Accounts", href: "/accounts" },
    ],
  },
  {
    label: "Tokens",
    match: (p) => /^\/(tokens|token|tokentxns)(\/|$)/.test(p),
    items: [
      { label: "Top Tokens (ERC-20)", href: "/tokens" },
      { label: "Token Transfers (ERC-20)", href: "/tokentxns" },
    ],
  },
  {
    label: "NFTs",
    items: [
      { label: "Top NFTs (ERC-721)", href: "/tokens?type=erc721" },
      { label: "NFT Transfers", href: "/tokentxns?type=erc721" },
    ],
  },
  {
    label: "Resources",
    match: (p) => /^\/(charts|network-status|knowledge-base|what-is-a-block-explorer)(\/|$)/.test(p),
    items: [
      { label: "Charts & Stats", href: "/charts" },
      { label: "Network Status", href: "/network-status" },
      { divider: true },
      { label: "Knowledge Base", href: "/knowledge-base" },
      { label: "What is a Block Explorer?", href: "/what-is-a-block-explorer" },
    ],
  },
  {
    label: "Developers",
    match: (p) => /^\/(apis|pushtx|unitconverter)(\/|$)/.test(p),
    items: [
      { label: "API Documentation", href: "/apis" },
      { label: "Broadcast Transaction", href: "/pushtx" },
      { label: "Unit Converter", href: "/unitconverter" },
      { divider: true },
      { label: "JSON-RPC Spec", href: "https://ethereum.org/en/developers/docs/apis/json-rpc/", external: true },
      { label: "Explorer Source Code", href: "https://github.com/ndcbweb/basic-explorer", external: true },
    ],
  },
  {
    label: "More",
    match: (p) => /^\/(about|contact|explorer-as-a-service|priority-support|brand-assets|terms|bug-bounty|trust-center)(\/|$)/.test(p),
    items: [
      { label: "About Us", href: "/about" },
      { label: "Explorer as a Service", href: "/explorer-as-a-service" },
      { label: "Priority Support", href: "/priority-support" },
      { label: "Contact Us", href: "/contact" },
      { divider: true },
      { label: "Nadcab Console", href: "https://console.nadcab.com", external: true },
      { label: "Launch Your Own Chain", href: "https://console.nadcab.com", external: true },
    ],
  },
];

function Chevron({ open }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
      <path fill="currentColor" d="M5.22 7.72a.75.75 0 0 1 1.06 0L10 11.44l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.78a.75.75 0 0 1 0-1.06Z" />
    </svg>
  );
}

function MenuLink({ item, onNavigate, className }) {
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onNavigate}>
        {item.label}
        <svg viewBox="0 0 20 20" className="ml-1 inline h-3 w-3 opacity-50" aria-hidden="true">
          <path fill="currentColor" d="M11 3.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-6.22 6.22a.75.75 0 1 1-1.06-1.06l6.22-6.22h-2.69a.75.75 0 0 1-.75-.75Z" />
        </svg>
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

function Dropdown({ entry, active }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => !ref.current?.contains(event.target) && setOpen(false);
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const enter = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1 px-3 py-2 text-[15px] transition-colors ${active || open ? "text-brand-600" : "text-ink hover:text-brand-600"}`}
      >
        {entry.label}
        <Chevron open={open} />
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-50 min-w-[230px] rounded-xl border border-line border-t-2 border-t-brand-500 bg-surface p-2 shadow-[0_12px_32px_-12px_rgba(10,16,32,0.25)]">
          {entry.items.map((item, i) =>
            item.divider ? (
              <div key={`d${i}`} className="my-1.5 border-t border-line" role="separator" />
            ) : (
              <MenuLink
                key={item.label}
                item={item}
                onNavigate={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-canvas hover:text-brand-600"
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function NavBar() {
  const pathname = usePathname() || "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <>
      <nav aria-label="Main" className="hidden items-center lg:flex">
        {MENU.map((entry) =>
          entry.items ? (
            <Dropdown key={entry.label} entry={entry} active={entry.match?.(pathname)} />
          ) : (
            <Link
              key={entry.label}
              href={entry.href}
              aria-current={entry.match(pathname) ? "page" : undefined}
              className={`px-3 py-2 text-[15px] transition-colors ${entry.match(pathname) ? "text-brand-600" : "text-ink hover:text-brand-600"}`}
            >
              {entry.label}
            </Link>
          )
        )}
        <span className="mx-2 h-5 border-l border-line" aria-hidden="true" />
        <a
          href="https://console.nadcab.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2 py-2 text-[15px] text-ink hover:text-brand-600"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path fill="currentColor" d="M10 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 16.25C3 13.9 5.9 12 10 12s7 1.9 7 4.25a.75.75 0 0 1-1.5 0c0-1.13-2-2.75-5.5-2.75s-5.5 1.62-5.5 2.75a.75.75 0 0 1-1.5 0Z" />
          </svg>
          Console
        </a>
      </nav>

      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink lg:hidden"
        aria-expanded={mobileOpen}
        aria-controls="mobile-menu"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={() => setMobileOpen((value) => !value)}
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
          {mobileOpen ? (
            <path fill="currentColor" d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L8.94 10l-4.72 4.72a.75.75 0 1 0 1.06 1.06L10 11.06l4.72 4.72a.75.75 0 1 0 1.06-1.06L11.06 10l4.72-4.72a.75.75 0 0 0-1.06-1.06L10 8.94 5.28 4.22Z" />
          ) : (
            <path fill="currentColor" d="M3 5.75A.75.75 0 0 1 3.75 5h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 5.75Zm0 4.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10Zm.75 3.5a.75.75 0 0 0 0 1.5h12.5a.75.75 0 0 0 0-1.5H3.75Z" />
          )}
        </svg>
      </button>

      {mobileOpen && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-b border-line bg-surface px-4 pb-4 shadow-lg lg:hidden">
          {MENU.map((entry) =>
            entry.items ? (
              <div key={entry.label} className="border-b border-line py-2 last:border-0">
                <p className="px-2 py-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{entry.label}</p>
                {entry.items
                  .filter((item) => !item.divider)
                  .map((item) => (
                    <MenuLink key={item.label} item={item} className="block rounded-md px-2 py-2 text-[15px] text-ink hover:bg-canvas" />
                  ))}
              </div>
            ) : (
              <Link key={entry.label} href={entry.href} className="block border-b border-line px-2 py-3 text-[15px] text-ink">
                {entry.label}
              </Link>
            )
          )}
        </div>
      )}
    </>
  );
}
