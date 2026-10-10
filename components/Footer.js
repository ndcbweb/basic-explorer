import Link from "next/link";
import { config } from "@/lib/config";
import { indexerStatus } from "@/lib/indexer";
import { formatNumber } from "@/lib/format";
import { AddNetworkButton, BackToTop } from "./FooterActions";
import Logo from "./Logo";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Blocks", href: "/blocks" },
      { label: "Transactions", href: "/txs" },
      { label: "Tokens", href: "/tokens" },
      { label: "Top Accounts", href: "/accounts" },
      { label: "Validators", href: "/validators" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Explorer Health API", href: "/api/health" },
      { label: "Explorer Source Code", href: "https://github.com/ndcbweb/basic-explorer", external: true },
      { label: "JSON-RPC Spec", href: "https://ethereum.org/en/developers/docs/apis/json-rpc/", external: true },
    ],
  },
  {
    title: "Nadcab Labs",
    links: [
      { label: "Nadcab Console", href: "https://console.nadcab.com", external: true },
      { label: "Launch Your Own Chain", href: "https://console.nadcab.com", external: true },
      { label: "About Nadcab Labs", href: "https://www.nadcab.com", external: true },
    ],
  },
];

function FooterLink({ link }) {
  const cls = "inline-flex items-center gap-1 text-sm text-[#aab6cc] transition-colors hover:text-white";
  if (!link.external) {
    return (
      <Link href={link.href} className={cls}>
        {link.label}
      </Link>
    );
  }
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {link.label}
      <svg viewBox="0 0 20 20" className="h-3 w-3 opacity-60" aria-hidden="true">
        <path fill="currentColor" d="M11 3.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-6.22 6.22a.75.75 0 1 1-1.06-1.06l6.22-6.22h-2.69a.75.75 0 0 1-.75-.75ZM4.75 6.5a.25.25 0 0 0-.25.25v8.5c0 .14.11.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 13.25 17h-8.5A1.75 1.75 0 0 1 3 15.25v-8.5C3 5.78 3.78 5 4.75 5h3.5a.75.75 0 0 1 0 1.5h-3.5Z" />
      </svg>
    </a>
  );
}

export default function Footer() {
  let status = null;
  try {
    status = indexerStatus();
  } catch {
    status = null;
  }
  const syncing = status && status.head != null && status.indexed < status.head - 2;
  const year = new Date().getUTCFullYear();

  return (
    <footer className="mt-16 bg-night text-white">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-6">
          <AddNetworkButton chainId={config.chainId} chainName={config.chainName} currency={config.currency} />
          <BackToTop />
        </div>

        <div className="grid gap-10 py-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="text-[15px] font-semibold">Powered by {config.chainName}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#aab6cc]">
              {config.chainName} Explorer is a block explorer and analytics platform for {config.chainName}
              {config.chainId ? ` (Chain ID ${config.chainId})` : ""}, an EVM-compatible network built with Nadcab Labs.
            </p>
            {status && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#aab6cc]">
                <span className={`h-2 w-2 rounded-full ${syncing ? "bg-amber-400" : "bg-emerald-400"}`} aria-hidden="true" />
                {syncing
                  ? `Indexing block ${formatNumber(status.indexed)} of ${formatNumber(status.head)}`
                  : `Synced · block ${formatNumber(Math.max(status.indexed, 0))}`}
              </p>
            )}
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold text-white">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-[#8b97ad] sm:flex-row sm:items-center sm:justify-between">
          <p>
            {config.chainName} Explorer © {year} · Built by{" "}
            <a href="https://www.nadcab.com" target="_blank" rel="noopener noreferrer" className="text-[#aab6cc] hover:text-white">
              Nadcab Labs
            </a>
          </p>
          <p>
            Native currency {config.currency}
            {config.chainId ? ` · Chain ID ${config.chainId}` : ""}
          </p>
        </div>
      </div>
    </footer>
  );
}
