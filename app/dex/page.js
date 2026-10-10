import AutoRefresh from "@/components/AutoRefresh";
import ListPage, { Notice } from "@/components/ListPage";
import { AddressLink, BlockLink, EmptyState, TxLink } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { rpc } from "@/lib/rpc";

export const metadata = { title: "DEX Tracker" };

const SWAP_V2 = "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822";
const SWAP_V3 = "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67";
const WINDOW = 20000;

async function recentSwaps() {
  const head = Number(BigInt(await rpc("eth_blockNumber")));
  const from = Math.max(0, head - WINDOW);
  const logs = await rpc("eth_getLogs", [{ fromBlock: `0x${from.toString(16)}`, toBlock: "latest", topics: [[SWAP_V2, SWAP_V3]] }], { timeoutMs: 20000 });
  return { head, from, logs: logs.slice(-100).reverse() };
}

export default async function DexPage() {
  let data = null;
  let error = null;
  try {
    data = await recentSwaps();
  } catch (e) {
    error = e.message;
  }
  const pools = data ? new Set(data.logs.map((l) => l.address.toLowerCase())).size : 0;

  return (
    <>
      <AutoRefresh intervalMs={15000} />
      <ListPage
        title="DEX Tracker"
        subtitle={data ? `${formatNumber(data.logs.length)} swaps across ${pools} pools in the last ${formatNumber(WINDOW)} blocks` : "Decentralised exchange activity"}
        basePath="/dex"
        page={1}
        total={0}
        limit={100}
        note="Uniswap V2 and V3 style Swap events, newest first"
        above={
          error ? (
            <Notice title="Could not load swaps">{error}</Notice>
          ) : data && !data.logs.length ? (
            <Notice title="No DEX deployed yet">
              No Uniswap-style pools have emitted swaps recently. Deploy a V2 or V3 compatible AMM and its trades show up here automatically.
            </Notice>
          ) : null
        }
      >
        {data?.logs.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Txn Hash</th>
                  <th scope="col">Block</th>
                  <th scope="col">Protocol</th>
                  <th scope="col">Pool</th>
                  <th scope="col">Sender</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr key={`${log.transactionHash}-${log.logIndex}`}>
                    <td>
                      <TxLink hash={log.transactionHash} />
                    </td>
                    <td>
                      <BlockLink number={Number(BigInt(log.blockNumber))} />
                    </td>
                    <td>
                      <span className="chip">{log.topics[0] === SWAP_V2 ? "V2" : "V3"}</span>
                    </td>
                    <td>
                      <AddressLink address={log.address.toLowerCase()} />
                    </td>
                    <td>
                      <AddressLink address={`0x${log.topics[1].slice(26)}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No swaps found" body="Swap events from AMM pools on this chain appear here." />
        )}
      </ListPage>
    </>
  );
}
