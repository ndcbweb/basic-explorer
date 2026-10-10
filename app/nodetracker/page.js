import AutoRefresh from "@/components/AutoRefresh";
import { AddressLink, Container, PageHeader } from "@/components/ui";
import { config } from "@/lib/config";
import { formatNumber, timeAgo } from "@/lib/format";
import { validators } from "@/lib/queries";
import { rpcBatch } from "@/lib/rpc";

export const metadata = { title: "Node Tracker" };

export default async function NodeTrackerPage() {
  const [peersHex, client, syncing, netVersion, listening] = await rpcBatch([
    ["net_peerCount"],
    ["web3_clientVersion"],
    ["eth_syncing"],
    ["net_version"],
    ["net_listening"],
  ]).catch(() => []);
  const peers = peersHex ? Number(BigInt(peersHex)) : null;
  const signers = validators();
  const now = Math.floor(Date.now() / 1000);
  const [clientName, clientVersion, platform] = (client || "").split("/");

  const cards = [
    { label: "Peers of Explorer Node", value: peers ?? "—" },
    { label: "Sealing Validators", value: signers.filter((s) => now - s.last_seen < 600).length },
    { label: "Network ID", value: netVersion || config.chainId || "—" },
    { label: "Sync State", value: syncing ? "Syncing" : "Synced" },
  ];

  return (
    <Container>
      <AutoRefresh intervalMs={15000} />
      <PageHeader title={`${config.chainName} Node Tracker`} subtitle="Nodes and clients visible from the explorer's node" />
      <section className="card mb-6 grid grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
        {cards.map((card) => (
          <div key={card.label} className="px-5 py-4">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">{card.label}</p>
            <p className="mt-1 text-xl font-semibold text-ink tabular-nums">{card.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">Client Distribution</h2>
          </div>
          <dl className="divide-y divide-line text-sm">
            {[
              ["Client", clientName || "—"],
              ["Version", clientVersion || "—"],
              ["Platform", platform || "—"],
              ["P2P Listening", listening == null ? "—" : listening ? "Yes" : "No"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-muted">{label}</dt>
                <dd className="font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">
            Per-peer details need the node&apos;s admin API, which is kept private on this network.
          </p>
        </section>

        <section className="card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">Signer Nodes</h2>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Signer</th>
                  <th scope="col" className="text-right">Blocks</th>
                  <th scope="col" className="text-right">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {signers.map((s) => (
                  <tr key={s.address}>
                    <td>
                      <AddressLink address={s.address} />
                    </td>
                    <td className="text-right tabular-nums">{formatNumber(s.blocks)}</td>
                    <td className="text-right text-muted">{timeAgo(s.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Container>
  );
}
