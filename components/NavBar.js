"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBar from "./SearchBar";

const LINKS = [
  { href: "/", label: "Home", match: (p) => p === "/" },
  { href: "/blocks", label: "Blocks", match: (p) => p.startsWith("/block") },
  { href: "/txs", label: "Transactions", match: (p) => p.startsWith("/tx") },
  { href: "/tokens", label: "Tokens", match: (p) => p.startsWith("/token") },
  { href: "/accounts", label: "Accounts", match: (p) => p.startsWith("/accounts") || p.startsWith("/address") },
  { href: "/validators", label: "Validators", match: (p) => p.startsWith("/validators") },
];

export default function NavBar() {
  const pathname = usePathname() || "/";
  const isHome = pathname === "/";

  return (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-6">
      {!isHome && (
        <div className="hidden max-w-md flex-1 md:block">
          <SearchBar />
        </div>
      )}
      <nav aria-label="Main" className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto">
        {LINKS.map((link) => {
          const active = link.match(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                active ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
