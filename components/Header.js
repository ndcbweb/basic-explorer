import Link from "next/link";
import { config } from "@/lib/config";
import Logo from "./Logo";
import NavBar from "./NavBar";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1320px] items-center gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-ink hover:text-ink">
          <Logo />
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold">{config.chainName}</span>
            <span className="block text-xs text-muted">Block Explorer</span>
          </span>
        </Link>
        <NavBar />
      </div>
    </header>
  );
}
