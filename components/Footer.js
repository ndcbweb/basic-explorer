import Link from "next/link";
import { config } from "@/lib/config";
import { indexerStatus } from "@/lib/indexer";
import { formatNumber } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { AddNetworkButton, BackToTop } from "./FooterActions";
import Logo from "./Logo";

const COLUMNS = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Brand Assets", href: "/brand-assets" },
      { label: "Contact Us", href: "/contact" },
      { label: "Careers", href: "/careers" },
      { label: "Terms & Privacy", href: "/terms" },
      { label: "Bug Bounty", href: "/bug-bounty" },
      { label: "Trust Center", href: "/trust-center" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "API Documentation", href: "/apis" },
      { label: "Knowledge Base", href: "/knowledge-base" },
      { label: "Network Status", href: "/network-status" },
      { label: "Newsletters", href: "/newsletter" },
      { label: "What is a Block Explorer?", href: "/what-is-a-block-explorer" },
    ],
  },
  {
    title: "Products & Services",
    links: [
      { label: "Explorer Premium", href: "/premium" },
      { label: "Advertise", href: "/advertise" },
      { label: "Explorer as a Service (EaaS)", href: "/explorer-as-a-service" },
      { label: "Explorer API", href: "/explorer-api" },
      { label: "Priority Support", href: "/priority-support" },
      { label: "Nadcab Console", href: "https://console.nadcab.com", external: true },
      { label: "Explorer Source Code", href: "https://github.com/ndcbweb/basic-explorer", external: true },
    ],
  },
];

const SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/ndcbweb/basic-explorer",
    path: "M10 1.5a8.5 8.5 0 0 0-2.69 16.57c.43.08.58-.18.58-.41v-1.45c-2.36.51-2.86-1.14-2.86-1.14-.39-.98-.95-1.24-.95-1.24-.77-.53.06-.52.06-.52.85.06 1.3.88 1.3.88.76 1.3 1.99.92 2.47.71.08-.55.3-.92.54-1.13-1.89-.21-3.87-.94-3.87-4.2 0-.93.33-1.69.88-2.28-.09-.22-.38-1.08.08-2.25 0 0 .72-.23 2.34.87a8.1 8.1 0 0 1 4.26 0c1.62-1.1 2.33-.87 2.33-.87.47 1.17.17 2.03.09 2.25.55.6.88 1.35.88 2.28 0 3.27-1.99 3.99-3.88 4.2.3.26.58.78.58 1.57v2.33c0 .23.15.5.59.41A8.5 8.5 0 0 0 10 1.5Z",
  },
  {
    label: "Nadcab Labs website",
    href: "https://www.nadcab.com",
    path: "M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-2.02 1.81A6.5 6.5 0 0 0 3.55 9.25h2.71c.08-2.06.66-4.01 1.72-5.44Zm4.04 0c1.06 1.43 1.64 3.38 1.72 5.44h2.71a6.5 6.5 0 0 0-4.43-5.44Zm.22 5.44c-.1-2.14-.83-4.06-2.24-5.47-1.41 1.41-2.14 3.33-2.24 5.47h4.48Zm-4.48 1.5c.1 2.14.83 4.06 2.24 5.47 1.41-1.41 2.14-3.33 2.24-5.47H7.76Zm-1.5 0H3.55a6.5 6.5 0 0 0 4.43 5.44c-1.06-1.43-1.64-3.38-1.72-5.44Zm7.48 0c-.08 2.06-.66 4.01-1.72 5.44a6.5 6.5 0 0 0 4.43-5.44h-2.71Z",
  },
  {
    label: "Nadcab Console",
    href: "https://console.nadcab.com",
    path: "M3 5.75A2.75 2.75 0 0 1 5.75 3h8.5A2.75 2.75 0 0 1 17 5.75v8.5A2.75 2.75 0 0 1 14.25 17h-8.5A2.75 2.75 0 0 1 3 14.25v-8.5Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h8.5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25h-8.5Zm.97 3.22a.75.75 0 0 1 1.06 0l1.75 1.75a.75.75 0 0 1 0 1.06l-1.75 1.75a.75.75 0 1 1-1.06-1.06L7.94 10 6.72 8.78a.75.75 0 0 1 0-1.06ZM10 12.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z",
  },
];

const BRAND_ICONS = {
  twitter: { label: "X (Twitter)", viewBox: "0 0 24 24", path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" },
  telegram: { label: "Telegram", viewBox: "0 0 24 24", path: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" },
  discord: { label: "Discord", viewBox: "0 0 24 24", path: "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" },
  email: { label: "Email", path: "M3.75 4A1.75 1.75 0 0 0 2 5.75v8.5C2 15.22 2.78 16 3.75 16h12.5c.97 0 1.75-.78 1.75-1.75v-8.5C18 4.78 17.22 4 16.25 4H3.75Zm-.25 2.37v7.88c0 .14.11.25.25.25h12.5a.25.25 0 0 0 .25-.25V6.37l-6.1 4.07a.75.75 0 0 1-.8 0L3.5 6.37ZM16.1 5.5H3.9L10 9.56l6.1-4.06Z" },
};

/** Links set in Nadcab Console replace the default Nadcab socials. */
function footerSocials(settings) {
  const custom = [
    settings.website && { label: "Website", href: settings.website, path: SOCIALS[1].path },
    settings.twitter && { ...BRAND_ICONS.twitter, href: settings.twitter },
    settings.telegram && { ...BRAND_ICONS.telegram, href: settings.telegram },
    settings.discord && { ...BRAND_ICONS.discord, href: settings.discord },
    settings.github && { label: "GitHub", href: settings.github, path: SOCIALS[0].path },
    settings.email && { ...BRAND_ICONS.email, href: `mailto:${settings.email}` },
  ].filter(Boolean);
  return custom.length ? custom : SOCIALS;
}

function FooterLink({ link }) {
  const cls = "inline-flex items-center gap-1 text-xs text-ink transition-colors hover:text-brand-600";
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
      <svg viewBox="0 0 20 20" className="h-3 w-3 text-faint" aria-hidden="true">
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
  const settings = getSettings();

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5">
          <div className="flex items-center gap-2">
            {footerSocials(settings).map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                title={social.label}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-muted transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                <svg viewBox={social.viewBox || "0 0 20 20"} className="h-4 w-4" aria-hidden="true">
                  <path fill="currentColor" d={social.path} />
                </svg>
              </a>
            ))}
          </div>
          <BackToTop />
        </div>

        <div className="grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <Logo className="h-7 w-7" />
              <span className="text-base font-medium text-ink">Powered by {config.chainName}</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              {settings.footerAbout || <>{config.chainName} Explorer is a Block Explorer and Analytics Platform for {config.chainName}
              {config.chainId ? ` (Chain ID ${config.chainId})` : ""}, an EVM-compatible network built with Nadcab Labs.</>}
            </p>
            <div className="mt-5">
              <AddNetworkButton chainId={config.chainId} chainName={config.chainName} currency={config.currency} currencyName={config.currencyName} rpcUrl={config.publicRpcUrl} />
            </div>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-medium text-ink">{column.title}</h2>
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

        <div className="flex flex-col gap-2 border-t border-line py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          {settings.copyright ? (
            <p>{settings.copyright}</p>
          ) : (
            <p>
              {config.chainName} Explorer © {year} · Built by{" "}
              <a href="https://www.nadcab.com" target="_blank" rel="noopener noreferrer">
                Nadcab Labs
              </a>
            </p>
          )}
          {status && (
            <p className="inline-flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${syncing ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden="true" />
              {syncing
                ? `Indexing block ${formatNumber(status.indexed)} of ${formatNumber(status.head)}`
                : `Synced · Block ${formatNumber(Math.max(status.indexed, 0))}`}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
