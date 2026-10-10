import AutoRefresh from "@/components/AutoRefresh";
import { AddressLink, BlockLink, Container, PageHeader } from "@/components/ui";
import { config } from "@/lib/config";
import { indexerStatus } from "@/lib/indexer";
import { formatGwei, formatNumber, timeAgo } from "@/lib/format";
import { avgBlockTime, validators } from "@/lib/queries";
import { rpcBatch } from "@/lib/rpc";

export const metadata = { title: "Network Status" };

const LEVELS = {
  ok: { label: "Operational", dot: "bg-emerald-500", cls: "border-ok-700/25 bg-ok-50 text-ok-700" },
  warn: { label: "Degraded", dot: "bg-amber-500", cls: "border-wait-700/25 bg-wait-50 text-wait-700" },
  down: { label: "Down", dot: "bg-red-500", cls: "border-bad-700/25 bg-bad-50 text-bad-700" },
};

function Pill({ level }) {
  const meta = LEVELS[level];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export default async function NetworkStatusPage() {
  const [blockHex, peersHex, syncing, gasHex, client, chainHex, latest] = await rpcBatch([
    ["eth_blockNumber"],
    ["net_peerCount"],
    ["eth_syncing"],
    ["eth_gasPrice"],
    ["web3_clientVersion"],
    ["eth_chainId"],
    ["eth_getBlockByNumber", ["latest", false]],
  ]).catch(() => []);

  const head = blockHex ? Number(BigInt(blockHex)) : null;
  const peers = peersHex ? Number(BigInt(peersHex)) : null;
  const lastTs = latest?.timestamp ? Number(BigInt(latest.timestamp)) : null;
  const age = lastTs ? Math.floor(Date.now() / 1000) - lastTs : null;
  const index = indexerStatus();
  const lag = head != null && index.indexed >= 0 ? Math.max(0, head - index.indexed) : null;
  const blockTime = avgBlockTime();
  const signers = validators();
  // Judge liveness against the newest indexed block so a lagging indexer is not reported as a dead validator.
  const indexedTip = signers.reduce((max, s) => Math.max(max, s.last_seen), 0);
  const now = lag != null && lag > 2 ? indexedTip : Math.floor(Date.now() / 1000);

  const rpcLevel = head == null ? "down" : "ok";
  const productionLevel = age == null ? "down" : age > 60 ? "down" : age > Math.max(15, (blockTime || 5) * 4) ? "warn" : "ok";
  const indexerLevel = lag == null ? "down" : lag > 50 ? "warn" : "ok";
  const peerLevel = peers == null ? "down" : peers === 0 ? "warn" : "ok";
  const overall = [rpcLevel, productionLevel, indexerLevel].includes("down")
    ? "down"
    : [productionLevel, indexerLevel, peerLevel].includes("warn")
      ? "warn"
      : "ok";

  const components = [
    { name: "JSON-RPC Endpoint", level: rpcLevel, detail: head != null ? `Responding · ${client || "unknown client"}` : "Not reachable" },
    {
      name: "Block Production",
      level: productionLevel,
      detail: lastTs ? `Last block ${timeAgo(lastTs)}${blockTime ? ` · avg ${blockTime.toFixed(2)} s` : ""}` : "No block data",
    },
    { name: "P2P Networking", level: peerLevel, detail: peers != null ? `${peers} connected peer${peers === 1 ? "" : "s"}` : "Unknown" },
    {
      name: "Explorer Indexer",
      level: indexerLevel,
      detail: lag != null ? (lag <= 2 ? "In sync with chain head" : `${formatNumber(lag)} blocks behind`) : "Waiting for chain",
    },
  ];

  return (
    <Container>
      <AutoRefresh intervalMs={10000} />
      <PageHeader title="Network Status" subtitle={`Live health of ${config.chainName}, refreshed every 10 seconds`} />

      <section className="card mb-6 flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-ink">
            {overall === "ok" ? "All systems operational" : overall === "warn" ? "Partial degradation" : "Major outage"}
          </p>
          <p className="mt-1 text-sm text-muted">
            Chain ID {chainHex ? Number(BigInt(chainHex)) : config.chainId || "—"} · Head block{" "}
            {head != null ? <BlockLink number={head} /> : "—"} · {syncing ? "Node syncing" : "Node synced"}
          </p>
        </div>
        <Pill level={overall} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">Components</h2>
          </div>
          <ul className="divide-y divide-line">
            {components.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="mt-0.5 truncate text-sm text-muted">{item.detail}</p>
                </div>
                <Pill level={item.level} />
              </li>
            ))}
          </ul>
        </section>

        <section className="card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">Network Metrics</h2>
          </div>
          <dl className="divide-y divide-line text-sm">
            {[
              ["Latest Block", head != null ? formatNumber(head) : "—"],
              ["Indexed Block", index.indexed >= 0 ? formatNumber(index.indexed) : "—"],
              ["Gas Price", gasHex ? `${formatGwei(gasHex)} Gwei` : "—"],
              ["Avg Block Time", blockTime ? `${blockTime.toFixed(2)} s` : "—"],
              ["Consensus", config.consensus.detail],
              ["Native Currency", config.currency],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right font-medium text-ink tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="card-head">
          <h2 className="card-title">Validator Liveness</h2>
        </div>
        <ul className="divide-y divide-line">
          {signers.length ? (
            signers.map((signer) => (
              <li key={signer.address} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
                <AddressLink address={signer.address} full />
                <span className="flex items-center gap-4 text-muted">
                  <span>{formatNumber(signer.blocks)} blocks</span>
                  <span>Last seen {timeAgo(signer.last_seen)}</span>
                  <Pill level={now - signer.last_seen < 120 ? "ok" : now - signer.last_seen < 600 ? "warn" : "down"} />
                </span>
              </li>
            ))
          ) : (
            <li className="px-5 py-6 text-sm text-muted">No validators indexed yet.</li>
          )}
        </ul>
      </section>
    </Container>
  );
}
