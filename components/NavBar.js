"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AccountLink from "./AccountLink";

const MENU = [
  { label: "Home", href: "/", match: (p) => p === "/" },
  {
    label: "Blockchain",
    match: (p) =>
      /^\/(txs?|txs-internal|txs-crosschain|txs-aa|txs-7702|beacon|blobs|blocks?|blocks-forked|uncles|validators|accounts|contracts-verified|address)(\/|$)/.test(p),
    items: [
      { label: "Transactions", href: "/txs" },
      { label: "Pending Transactions", href: "/txs/pending" },
      { label: "Contract Internal Transactions", href: "/txs-internal" },
      { label: "Cross-Chain Transactions", href: "/txs-crosschain" },
      { label: "Beacon Deposits", href: "/beacon/deposits" },
      { label: "Beacon Withdrawals", href: "/beacon/withdrawals" },
      { label: "View Blobs", href: "/blobs" },
      { label: "AA Transactions", href: "/txs-aa" },
      { label: "EIP-7702 Authorizations", href: "/txs-7702", badge: "Beta" },
      { divider: true },
      { label: "View Blocks", href: "/blocks" },
      { label: "Forked Blocks (Reorgs)", href: "/blocks-forked" },
      { label: "Uncles", href: "/uncles" },
      { label: "Validators", href: "/validators" },
      { divider: true },
      { label: "Top Accounts", href: "/accounts" },
      { label: "Verified Contracts", href: "/contracts-verified" },
    ],
  },
  {
    label: "Tokens",
    match: (p) => /^\/(tokens|token|tokentxns|tokenflow)(\/|$)/.test(p),
    items: [
      { label: "Top Tokens", hint: "(ERC-20)", href: "/tokens" },
      { label: "Token Transfers", hint: "(ERC-20)", href: "/tokentxns" },
      { label: "Token Flow Visualizer", href: "/tokenflow", badge: "Beta" },
    ],
  },
  {
    label: "NFTs",
    match: (p) => /^\/nft-/.test(p),
    items: [
      { label: "Top NFTs", href: "/tokens?type=erc721" },
      { label: "Top Mints", href: "/nft-top-mints" },
      { label: "Latest Trades", href: "/nft-trades" },
      { label: "Latest Transfers", href: "/tokentxns?type=erc721" },
      { label: "Latest Mints", href: "/nft-latest-mints" },
    ],
  },
  {
    label: "Resources",
    match: (p) => /^\/(charts|stats|leaderboard|directory|newsletter|knowledge-base|network-status|what-is-a-block-explorer)(\/|$)/.test(p),
    items: [
      { label: "Charts And Stats", href: "/charts" },
      { label: "Top Statistics", href: "/stats" },
      { label: "Leaderboard", href: "/leaderboard" },
      { divider: true },
      { label: "Directory", href: "/directory" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "Knowledge Base", href: "/knowledge-base" },
    ],
  },
  {
    label: "API",
    match: (p) => /^\/(explorer-api|apis)(\/|$)/.test(p),
    items: [
      { label: "Explorer API", href: "/explorer-api" },
      { label: "API Pricing", href: "/apis/pricing" },
      { label: "API Documentation", href: "/apis" },
    ],
  },
  {
    label: "More",
    mega: [
      {
        title: "Developer Tools",
        items: [
          { label: "Input Data Encoder", href: "/inputdata-encoder", icon: "code", badge: "Beta" },
          { label: "Input Data Decoder", href: "/inputdata-decoder", icon: "decode" },
          { label: "Unit Converter", href: "/unitconverter", icon: "convert" },
          { label: "Download Data (CSV Export)", href: "/exportdata", icon: "download" },
          { label: "Account Balance Checker", href: "/balancecheck-tool", icon: "wallet" },
          { label: "Broadcast Transaction", href: "/pushtx", icon: "send" },
          { label: "Bytecode to Opcode", href: "/opcode-tool", icon: "chip" },
        ],
      },
      {
        title: "Smart Contract Tools",
        items: [
          { label: "Code Reader", href: "/code-reader", icon: "code" },
          { label: "Verify Contract", href: "/verifycontract", icon: "check" },
          { label: "Similar Contract Search", href: "/find-similar-contracts", icon: "search" },
          { label: "Smart Contract Search", href: "/searchcontract", icon: "search" },
          { label: "Contract Diff Checker", href: "/contractdiffchecker", icon: "diff" },
          { label: "Solidity Online Compiler", href: "/compiler", icon: "doc" },
        ],
      },
      {
        title: "Explore",
        items: [
          { label: "Gas Tracker", href: "/gastracker", icon: "gas" },
          { label: "DEX Tracker", href: "/dex", icon: "convert" },
          { label: "Node Tracker", href: "/nodetracker", icon: "chip" },
          { label: "Label Cloud", href: "/labelcloud", icon: "tag" },
          { label: "Domain Name Lookup", href: "/name-lookup", icon: "search" },
        ],
      },
      {
        title: "Services",
        items: [
          { label: "Token Approvals", href: "/tokenapprovalchecker", icon: "shield" },
          { label: "Verified Signature", href: "/verifiedsignatures", icon: "check" },
          { label: "Input Data Messages (IDM)", href: "/idm", icon: "chat" },
          { label: "Advanced Filter", href: "/advanced-filter", icon: "filter" },
          { label: "Nadcab Console", href: "https://console.nadcab.com", icon: "link", external: true },
        ],
      },
    ],
  },
];

const ICONS = {
  code: "M6.28 5.22a.75.75 0 0 1 0 1.06L2.56 10l3.72 3.72a.75.75 0 0 1-1.06 1.06L.97 10.53a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Zm7.44 0a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L17.44 10l-3.72-3.72a.75.75 0 0 1 0-1.06ZM11.38 2.3a.75.75 0 0 1 .53.92l-3.5 13a.75.75 0 1 1-1.45-.39l3.5-13a.75.75 0 0 1 .92-.53Z",
  decode: "M4 4.75A2.75 2.75 0 0 1 6.75 2h6.5A2.75 2.75 0 0 1 16 4.75v10.5A2.75 2.75 0 0 1 13.25 18h-6.5A2.75 2.75 0 0 1 4 15.25V4.75Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V4.75c0-.69-.56-1.25-1.25-1.25h-6.5ZM7 7a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 7Zm.75 2.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z",
  convert: "M13.2 2.24a.75.75 0 0 1 1.06.04l2.5 2.75a.75.75 0 0 1 0 1.01l-2.5 2.75a.75.75 0 1 1-1.1-1.01l1.36-1.5H4.75a.75.75 0 0 1 0-1.5h9.77l-1.36-1.48a.75.75 0 0 1 .04-1.06ZM6.8 10.24a.75.75 0 0 1 .04 1.06l-1.36 1.5h9.77a.75.75 0 0 1 0 1.5H5.48l1.36 1.48a.75.75 0 1 1-1.1 1.02l-2.5-2.75a.75.75 0 0 1 0-1.01l2.5-2.75a.75.75 0 0 1 1.06-.05Z",
  download: "M10 2a.75.75 0 0 1 .75.75v8.69l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 1.06-1.06l2.72 2.72V2.75A.75.75 0 0 1 10 2ZM3.75 15a.75.75 0 0 1 .75.75v.5c0 .14.11.25.25.25h10.5a.25.25 0 0 0 .25-.25v-.5a.75.75 0 0 1 1.5 0v.5A1.75 1.75 0 0 1 15.25 18H4.75A1.75 1.75 0 0 1 3 16.25v-.5a.75.75 0 0 1 .75-.75Z",
  wallet: "M3 6.25A2.25 2.25 0 0 1 5.25 4h9.5A2.25 2.25 0 0 1 17 6.25v.5h-3.25a2.75 2.75 0 0 0 0 5.5H17v1.5A2.25 2.25 0 0 1 14.75 16h-9.5A2.25 2.25 0 0 1 3 13.75v-7.5Zm10.75 2h3.75v2.5h-3.75a1.25 1.25 0 0 1 0-2.5Z",
  send: "M2.94 2.3a.75.75 0 0 1 .8-.1l13.5 6.75a.75.75 0 0 1 0 1.34l-13.5 6.75a.75.75 0 0 1-1.04-.9L4.6 10 2.7 3.86a.75.75 0 0 1 .24-.8Zm3 8.45-1.27 4.12L14.32 10 4.67 5.13l1.27 4.12h4.31a.75.75 0 0 1 0 1.5H5.94Z",
  chip: "M7 2.75a.75.75 0 0 0-1.5 0V4h-.75A1.75 1.75 0 0 0 3 5.75v.75H1.75a.75.75 0 0 0 0 1.5H3v4H1.75a.75.75 0 0 0 0 1.5H3v.75C3 15.22 3.78 16 4.75 16h.75v1.25a.75.75 0 0 0 1.5 0V16h6v1.25a.75.75 0 0 0 1.5 0V16h.75A1.75 1.75 0 0 0 17 14.25v-.75h1.25a.75.75 0 0 0 0-1.5H17V8h1.25a.75.75 0 0 0 0-1.5H17v-.75A1.75 1.75 0 0 0 15.25 4h-.75V2.75a.75.75 0 0 0-1.5 0V4H7V2.75ZM4.75 5.5h10.5c.14 0 .25.11.25.25v8.5a.25.25 0 0 1-.25.25H4.75a.25.25 0 0 1-.25-.25v-8.5c0-.14.11-.25.25-.25Z",
  check: "M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm3.53 5.47a.75.75 0 0 0-1.06 0L9 10.94 7.53 9.47a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4-4a.75.75 0 0 0 0-1.06ZM10 3.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z",
  search: "M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z",
  diff: "M6 2.75a.75.75 0 0 0-1.5 0V5H2.25a.75.75 0 0 0 0 1.5H4.5v2.25a.75.75 0 0 0 1.5 0V6.5h2.25a.75.75 0 0 0 0-1.5H6V2.75ZM11.75 14a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-6ZM16.28 3.72a.75.75 0 0 1 0 1.06l-12 12a.75.75 0 0 1-1.06-1.06l12-12a.75.75 0 0 1 1.06 0Z",
  doc: "M5.75 2A1.75 1.75 0 0 0 4 3.75v12.5c0 .97.78 1.75 1.75 1.75h8.5A1.75 1.75 0 0 0 16 16.25V7.06a1.75 1.75 0 0 0-.51-1.24l-3.31-3.31A1.75 1.75 0 0 0 10.94 2H5.75Zm-.25 1.75c0-.14.11-.25.25-.25H10.5v2.75c0 .97.78 1.75 1.75 1.75h2.25v8.25a.25.25 0 0 1-.25.25h-8.5a.25.25 0 0 1-.25-.25V3.75Zm6.5.31 2.19 2.19h-1.94a.25.25 0 0 1-.25-.25V4.06Z",
  gas: "M4 3.75A1.75 1.75 0 0 1 5.75 2h5.5A1.75 1.75 0 0 1 13 3.75V9h.25A2.25 2.25 0 0 1 15.5 11.25v2.5a.75.75 0 0 0 1.5 0V7.56l-1.53-1.53a.75.75 0 1 1 1.06-1.06l1.75 1.75c.14.14.22.33.22.53v6.5a2.25 2.25 0 0 1-4.5 0v-2.5a.75.75 0 0 0-.75-.75H13v6h.25a.75.75 0 0 1 0 1.5h-9.5a.75.75 0 0 1 0-1.5H4V3.75Zm1.5 0V8h6V3.75a.25.25 0 0 0-.25-.25h-5.5a.25.25 0 0 0-.25.25Z",
  tag: "M3 3.75C3 2.78 3.78 2 4.75 2h4.38c.46 0 .9.18 1.24.51l6.62 6.63a1.75 1.75 0 0 1 0 2.47l-4.38 4.38a1.75 1.75 0 0 1-2.47 0L3.51 9.37A1.75 1.75 0 0 1 3 8.13V3.75ZM4.75 3.5a.25.25 0 0 0-.25.25v4.38c0 .07.03.13.07.18l6.63 6.62a.25.25 0 0 0 .35 0l4.38-4.38a.25.25 0 0 0 0-.35L9.3 3.57a.25.25 0 0 0-.18-.07H4.75ZM7 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
  shield: "M9.66 1.58a.75.75 0 0 1 .68 0l6.25 3.13c.25.13.41.38.41.67v3.37c0 4.12-2.6 7.6-6.8 9.2a.75.75 0 0 1-.53 0C5.48 16.35 3 12.87 3 8.75V5.38c0-.29.16-.54.41-.67l6.25-3.13ZM4.5 5.84v2.91c0 3.38 1.95 6.24 5.5 7.69 3.55-1.45 5.5-4.31 5.5-7.69V5.84L10 3.09 4.5 5.84Z",
  chat: "M3.5 5.75c0-.97.78-1.75 1.75-1.75h9.5c.97 0 1.75.78 1.75 1.75v6.5c0 .97-.78 1.75-1.75 1.75H9.06l-3.28 2.63A.75.75 0 0 1 4.5 16v-2H5.25A1.75 1.75 0 0 1 3.5 12.25v-6.5ZM5.25 5.5a.25.25 0 0 0-.25.25v6.5c0 .14.11.25.25.25H6v1.94l2.28-1.83a.75.75 0 0 1 .47-.16h6a.25.25 0 0 0 .25-.25v-6.5a.25.25 0 0 0-.25-.25h-9.5Z",
  filter: "M2.75 4a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5H2.75ZM5 9.25a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 5 9.25ZM8 14a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5A.75.75 0 0 1 8 14Z",
  link: "M11 3.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-6.22 6.22a.75.75 0 1 1-1.06-1.06l6.22-6.22h-2.69a.75.75 0 0 1-.75-.75Z",
};

function Chevron({ open }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
      <path fill="currentColor" d="M5.22 7.72a.75.75 0 0 1 1.06 0L10 11.44l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.78a.75.75 0 0 1 0-1.06Z" />
    </svg>
  );
}

function Badge({ children }) {
  return <span className="ml-1.5 rounded-full border border-line bg-subtle px-1.5 py-px text-[10px] font-medium text-muted">{children}</span>;
}

function MenuLink({ item, onNavigate, className }) {
  const body = (
    <>
      {item.icon && (
        <svg viewBox="0 0 20 20" className="mr-2 inline h-4 w-4 shrink-0 text-faint" aria-hidden="true">
          <path fill="currentColor" d={ICONS[item.icon]} />
        </svg>
      )}
      <span>{item.label}</span>
      {item.hint && <span className="ml-1 text-xs text-faint">{item.hint}</span>}
      {item.badge && <Badge>{item.badge}</Badge>}
    </>
  );
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onNavigate}>
        {body}
        <svg viewBox="0 0 20 20" className="ml-1 inline h-3 w-3 opacity-50" aria-hidden="true">
          <path fill="currentColor" d={ICONS.link} />
        </svg>
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      {body}
    </Link>
  );
}

function useDismiss(open, setOpen, ref) {
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
  }, [open, setOpen, ref]);
}

const PANEL = "rounded-xl border border-line border-t-2 border-t-brand-500 bg-surface shadow-[0_12px_32px_-12px_rgba(10,16,32,0.25)]";
const ITEM = "flex items-center rounded-md px-3 py-1.5 text-[0.8203125rem] text-ink hover:bg-canvas hover:text-brand-600";

function Dropdown({ entry, active }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const closeTimer = useRef(null);
  useDismiss(open, setOpen, ref);

  const enter = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div ref={ref} className={entry.mega ? "" : "relative"} onMouseEnter={enter} onMouseLeave={leave}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1 px-3 py-2 text-sm transition-colors ${active || open ? "text-brand-600" : "text-ink hover:text-brand-600"}`}
      >
        {entry.label}
        <Chevron open={open} />
      </button>
      {open && entry.mega && (
        <div role="menu" className={`absolute inset-x-4 top-full z-50 mx-auto max-w-[1288px] p-5 ${PANEL}`}>
          <div className="grid grid-cols-4 gap-6">
            {entry.mega.map((column) => (
              <div key={column.title}>
                <p className="mb-2 px-3 text-sm font-medium text-ink">{column.title}</p>
                {column.items.map((item) => (
                  <MenuLink key={item.label} item={item} onNavigate={() => setOpen(false)} className={ITEM} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {open && !entry.mega && (
        <div role="menu" className={`absolute top-full left-0 z-50 max-h-[75vh] min-w-[260px] overflow-y-auto p-2 ${PANEL}`}>
          {entry.items.map((item, i) =>
            item.divider ? (
              <div key={`d${i}`} className="my-1.5 border-t border-line" role="separator" />
            ) : (
              <MenuLink key={item.label} item={item} onNavigate={() => setOpen(false)} className={ITEM} />
            )
          )}
        </div>
      )}
    </div>
  );
}

const flatItems = (entry) => (entry.mega ? entry.mega.flatMap((column) => column.items) : entry.items.filter((item) => !item.divider));

export default function NavBar() {
  const pathname = usePathname() || "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <>
      <nav aria-label="Main" className="hidden items-center lg:flex">
        {MENU.map((entry) =>
          entry.items || entry.mega ? (
            <Dropdown key={entry.label} entry={entry} active={entry.match?.(pathname)} />
          ) : (
            <Link
              key={entry.label}
              href={entry.href}
              aria-current={entry.match(pathname) ? "page" : undefined}
              className={`px-3 py-2 text-sm transition-colors ${entry.match(pathname) ? "text-brand-600" : "text-ink hover:text-brand-600"}`}
            >
              {entry.label}
            </Link>
          )
        )}
        <span className="mx-2 h-5 border-l border-line" aria-hidden="true" />
        <span className="inline-flex items-center gap-1.5 px-2 py-2 text-sm text-ink">
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path fill="currentColor" d="M10 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 16.25C3 13.9 5.9 12 10 12s7 1.9 7 4.25a.75.75 0 0 1-1.5 0c0-1.13-2-2.75-5.5-2.75s-5.5 1.62-5.5 2.75a.75.75 0 0 1-1.5 0Z" />
          </svg>
          <AccountLink className="text-ink hover:text-brand-600" />
        </span>
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
        <div id="mobile-menu" className="absolute inset-x-0 top-full max-h-[80vh] overflow-y-auto border-b border-line bg-surface px-4 pb-4 shadow-lg lg:hidden">
          {MENU.map((entry) =>
            entry.items || entry.mega ? (
              <details key={entry.label} className="group border-b border-line py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between px-2 py-2.5 text-sm text-ink">
                  {entry.label}
                  <Chevron open={false} />
                </summary>
                <div className="pb-2">
                  {flatItems(entry).map((item) => (
                    <MenuLink key={item.label} item={item} className="flex items-center rounded-md px-3 py-2 text-[0.8203125rem] text-ink hover:bg-canvas" />
                  ))}
                </div>
              </details>
            ) : (
              <Link key={entry.label} href={entry.href} className="block border-b border-line px-2 py-3 text-sm text-ink">
                {entry.label}
              </Link>
            )
          )}
          <div className="px-2 py-3">
            <AccountLink className="text-sm text-ink" />
          </div>
        </div>
      )}
    </>
  );
}
