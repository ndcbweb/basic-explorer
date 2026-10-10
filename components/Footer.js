import { config } from "@/lib/config";
import { indexerStatus } from "@/lib/indexer";
import { formatNumber } from "@/lib/format";

export default function Footer() {
  let status = null;
  try {
    status = indexerStatus();
  } catch {
    status = null;
  }
  const syncing = status && status.head != null && status.indexed < status.head - 2;

  return (
    <footer className="mt-12 border-t border-line bg-white">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          {config.chainName}
          {config.chainId ? ` · Chain ID ${config.chainId}` : ""} · Powered by Nadcab Labs
        </p>
        {status && (
          <p className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${syncing ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden="true" />
            {syncing
              ? `Indexing block ${formatNumber(status.indexed)} of ${formatNumber(status.head)}`
              : `Indexed up to block ${formatNumber(Math.max(status.indexed, 0))}`}
          </p>
        )}
      </div>
    </footer>
  );
}
