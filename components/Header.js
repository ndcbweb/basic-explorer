import Link from "next/link";
import { config } from "@/lib/config";
import { formatGwei, formatNumber } from "@/lib/format";
import { safeRpc } from "@/lib/rpc";
import { AddNetworkIcon, HeaderSearch, ThemeToggle } from "./HeaderTools";
import Logo from "./Logo";
import NavBar from "./NavBar";

export default async function Header() {
  const [gasPrice, headHex] = await Promise.all([
    safeRpc("eth_gasPrice", [], null, { timeoutMs: 1500 }),
    safeRpc("eth_blockNumber", [], null, { timeoutMs: 1500 }),
  ]);
  const head = headHex ? Number(BigInt(headHex)) : null;

  return (
    <header className="sticky top-0 z-40 bg-surface">
      <div className="border-b border-line">
        <div className="mx-auto flex h-11 max-w-[1320px] items-center justify-between gap-4 px-4 text-xs text-muted sm:px-6">
          <div className="flex min-w-0 items-center gap-4 overflow-hidden whitespace-nowrap">
            <span>
              {config.currency}
              {config.chainId ? (
                <>
                  : <span className="text-brand-600">Chain ID {config.chainId}</span>
                </>
              ) : null}
            </span>
            <span className="hidden items-center gap-1 sm:inline-flex">
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-faint" aria-hidden="true">
                <path fill="currentColor" d="M4 3.75A1.75 1.75 0 0 1 5.75 2h5.5A1.75 1.75 0 0 1 13 3.75V9h.25A2.25 2.25 0 0 1 15.5 11.25v2.5a.75.75 0 0 0 1.5 0V7.56l-1.53-1.53a.75.75 0 1 1 1.06-1.06l1.75 1.75c.14.14.22.33.22.53v6.5a2.25 2.25 0 0 1-4.5 0v-2.5a.75.75 0 0 0-.75-.75H13v6h.25a.75.75 0 0 1 0 1.5h-9.5a.75.75 0 0 1 0-1.5H4V3.75Zm1.5 0V8h6V3.75a.25.25 0 0 0-.25-.25h-5.5a.25.25 0 0 0-.25.25Z" />
              </svg>
              Gas: <span className="text-brand-600">{gasPrice ? `${formatGwei(gasPrice)} Gwei` : "—"}</span>
            </span>
            {head != null && (
              <span className="hidden md:inline">
                Block: <Link href={`/block/${head}`}>{formatNumber(head)}</Link>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <HeaderSearch />
            <AddNetworkIcon chainId={config.chainId} chainName={config.chainName} currency={config.currency} />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-ink hover:text-ink">
            <Logo className="h-7 w-7" />
            <span className="text-lg font-semibold">{config.chainName}</span>
          </Link>
          <NavBar />
        </div>
      </div>
    </header>
  );
}
