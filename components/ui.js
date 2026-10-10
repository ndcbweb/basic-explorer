import Link from "next/link";
import { shortHash } from "@/lib/format";
import CopyButton from "./CopyButton";

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <div className="mt-1 text-sm break-all text-muted">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

export function Container({ children, className = "" }) {
  return <div className={`mx-auto max-w-[1320px] px-4 py-6 sm:px-6 ${className}`}>{children}</div>;
}

export function AddressLink({ address, label, full = false, copy = false, head = 8, tail = 6 }) {
  if (!address) return <span className="text-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <Link href={`/address/${address}`} className="mono" title={address}>
        {label || (full ? address : shortHash(address, head, tail))}
      </Link>
      {copy && <CopyButton value={address} label="Copy address" />}
    </span>
  );
}

export function TxLink({ hash, full = false, copy = false }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Link href={`/tx/${hash}`} className="mono" title={hash}>
        {full ? hash : shortHash(hash, 10, 6)}
      </Link>
      {copy && <CopyButton value={hash} label="Copy transaction hash" />}
    </span>
  );
}

export function BlockLink({ number }) {
  return <Link href={`/block/${number}`}>{Number(number).toLocaleString("en-US")}</Link>;
}

export function TokenLink({ address, name, symbol }) {
  return (
    <Link href={`/token/${address}`} className="font-medium">
      {name || shortHash(address, 8, 6)}
      {symbol ? <span className="ml-1 text-muted">({symbol})</span> : null}
    </Link>
  );
}

const STATUS = {
  success: { label: "Success", cls: "border-emerald-200 bg-ok-50 text-ok-700" },
  failed: { label: "Failed", cls: "border-red-200 bg-bad-50 text-bad-700" },
  pending: { label: "Pending", cls: "border-amber-200 bg-wait-50 text-wait-700" },
};

export function StatusBadge({ status }) {
  const key = status == null ? "pending" : Number(status) === 1 ? "success" : "failed";
  const meta = STATUS[key];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function MethodBadge({ method }) {
  return (
    <span className="inline-block max-w-[120px] truncate rounded-md border border-line bg-[#f8f9fb] px-2 py-0.5 text-center text-xs font-medium text-ink">
      {method || "—"}
    </span>
  );
}

export function DirectionBadge({ direction }) {
  const styles = {
    IN: "border-emerald-200 bg-ok-50 text-ok-700",
    OUT: "border-amber-200 bg-wait-50 text-wait-700",
    SELF: "border-line bg-canvas text-muted",
  };
  return (
    <span className={`inline-flex w-11 justify-center rounded-md border py-0.5 text-[11px] font-semibold ${styles[direction]}`}>
      {direction}
    </span>
  );
}

export function DetailList({ children }) {
  return <dl className="divide-y divide-line">{children}</dl>;
}

export function DetailRow({ label, hint, children }) {
  return (
    <div className="grid gap-1 px-5 py-3.5 md:grid-cols-[260px_1fr] md:gap-6">
      <dt className="flex items-center gap-1.5 text-sm text-muted">
        {label}
        {hint && (
          <span title={hint} className="cursor-help text-faint" aria-label={hint}>
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM10 8.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 8.5Zm0-2.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"
              />
            </svg>
          </span>
        )}
      </dt>
      <dd className="min-w-0 text-sm break-words text-ink">{children}</dd>
    </div>
  );
}

export function EmptyState({ title, body, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-faint">
        <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 4.75A2.75 2.75 0 0 1 6.75 2h6.5A2.75 2.75 0 0 1 16 4.75v10.5A2.75 2.75 0 0 1 13.25 18h-6.5A2.75 2.75 0 0 1 4 15.25V4.75Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V4.75c0-.69-.56-1.25-1.25-1.25h-6.5ZM7 7a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 7Zm.75 2.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z"
          />
        </svg>
      </div>
      <p className="font-medium text-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
    </div>
  );
}

export function Tabs({ tabs, active, basePath }) {
  return (
    <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        const href = tab.id === tabs[0].id ? basePath : `${basePath}?tab=${tab.id}`;
        return (
          <Link
            key={tab.id}
            href={href}
            role="tab"
            aria-selected={selected}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              selected ? "bg-brand-600 text-white hover:text-white" : "bg-white text-muted ring-1 ring-line hover:text-ink"
            }`}
          >
            {tab.label}
            {tab.count != null && <span className={`ml-1.5 ${selected ? "text-white/80" : "text-faint"}`}>{tab.count}</span>}
          </Link>
        );
      })}
    </div>
  );
}

export function Pagination({ page, total, pageSize, basePath, params = {} }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p) => {
    const query = new URLSearchParams({ ...params, ...(p > 1 ? { p: String(p) } : {}) });
    const text = query.toString();
    return text ? `${basePath}?${text}` : basePath;
  };
  const button = (p, label, disabled, ariaLabel) =>
    disabled ? (
      <span className="rounded-md border border-line px-2.5 py-1 text-faint" aria-disabled="true">
        {label}
      </span>
    ) : (
      <Link href={href(p)} aria-label={ariaLabel} className="rounded-md border border-line bg-white px-2.5 py-1 text-brand-600 hover:bg-brand-50">
        {label}
      </Link>
    );

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1.5 text-xs font-medium">
      {button(1, "First", page <= 1, "First page")}
      {button(page - 1, "‹", page <= 1, "Previous page")}
      <span className="rounded-md border border-line bg-canvas px-2.5 py-1 text-muted">
        Page {page} of {pages}
      </span>
      {button(page + 1, "›", page >= pages, "Next page")}
      {button(pages, "Last", page >= pages, "Last page")}
    </nav>
  );
}
