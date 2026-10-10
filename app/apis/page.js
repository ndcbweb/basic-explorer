import { headers } from "next/headers";
import ContentPage, { HelpCard } from "@/components/ContentPage";
import { config } from "@/lib/config";

export const metadata = { title: "API Documentation" };

const ENDPOINTS = [
  {
    id: "accounts",
    title: "Accounts",
    items: [
      { name: "Get native balance for a single address", q: "module=account&action=balance&address={address}&tag=latest" },
      { name: "Get native balance for multiple addresses (max 20)", q: "module=account&action=balancemulti&address={address},{address2}&tag=latest" },
      {
        name: "Get a list of normal transactions by address",
        q: "module=account&action=txlist&address={address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc",
      },
      { name: "Get a list of ERC-20 token transfer events", q: "module=account&action=tokentx&address={address}&page=1&offset=100&sort=desc" },
      { name: "Get a list of ERC-721 token transfer events", q: "module=account&action=tokennfttx&address={address}&page=1&offset=100&sort=desc" },
      { name: "Get ERC-20 token balance of an address", q: "module=account&action=tokenbalance&contractaddress={token}&address={address}&tag=latest" },
      { name: "Get list of blocks validated by address", q: "module=account&action=getminedblocks&address={address}&page=1&offset=10" },
    ],
  },
  {
    id: "transactions",
    title: "Transactions",
    items: [
      { name: "Check transaction receipt status", q: "module=transaction&action=gettxreceiptstatus&txhash={txhash}" },
      { name: "Check contract execution status", q: "module=transaction&action=getstatus&txhash={txhash}" },
    ],
  },
  {
    id: "blocks",
    title: "Blocks",
    items: [{ name: "Get block number by timestamp", q: "module=block&action=getblocknobytime&timestamp=1700000000&closest=before" }],
  },
  {
    id: "tokens",
    title: "Tokens & Stats",
    items: [{ name: "Get ERC-20 token total supply", q: "module=stats&action=tokensupply&contractaddress={token}" }],
  },
  {
    id: "proxy",
    title: "Geth Proxy",
    items: [
      { name: "eth_blockNumber", q: "module=proxy&action=eth_blockNumber" },
      { name: "eth_getBlockByNumber", q: "module=proxy&action=eth_getBlockByNumber&tag=latest&boolean=true" },
      { name: "eth_getTransactionByHash", q: "module=proxy&action=eth_getTransactionByHash&txhash={txhash}" },
      { name: "eth_getTransactionReceipt", q: "module=proxy&action=eth_getTransactionReceipt&txhash={txhash}" },
      { name: "eth_getTransactionCount", q: "module=proxy&action=eth_getTransactionCount&address={address}&tag=latest" },
      { name: "eth_call", q: "module=proxy&action=eth_call&to={token}&data=0x18160ddd&tag=latest" },
      { name: "eth_getCode", q: "module=proxy&action=eth_getCode&address={token}&tag=latest" },
      { name: "eth_gasPrice", q: "module=proxy&action=eth_gasPrice" },
      { name: "eth_estimateGas", q: "module=proxy&action=eth_estimateGas&to={address}&value=0x1&data=0x" },
      { name: "eth_sendRawTransaction (use POST for large payloads)", q: "module=proxy&action=eth_sendRawTransaction&hex={signedTx}" },
    ],
  },
];

export default async function ApisPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost";
  const proto = h.get("x-forwarded-proto") || "http";
  const base = `${proto}://${host}/api`;

  const toc = [
    { id: "introduction", label: "Introduction" },
    { id: "responses", label: "Response format" },
    ...ENDPOINTS.map((group) => ({ id: group.id, label: group.title })),
    { id: "json-rpc", label: "Direct JSON-RPC" },
  ];

  return (
    <ContentPage
      eyebrow="API Documentation"
      title={`${config.chainName} Explorer API`}
      lead="An Etherscan-compatible REST API backed by this explorer's index and the chain's JSON-RPC node. Existing Etherscan client code works by swapping the base URL."
      toc={toc}
      aside={
        <HelpCard title="Base URL">
          <code className="block rounded bg-subtle px-2 py-1.5 font-mono text-xs break-all text-ink">{base}</code>
          <p className="mt-3">No API key is required. Add <code className="font-mono">apikey</code> anyway if your client sends one; it is ignored.</p>
        </HelpCard>
      }
    >
      <h2 id="introduction">Introduction</h2>
      <p>
        Every request is a <strong>GET</strong> (or form/JSON <strong>POST</strong>) to <code>{base}</code> with a <code>module</code> and an{" "}
        <code>action</code> parameter. Addresses are case-insensitive. Amounts are returned as integer strings in the smallest unit (wei
        for {config.currency}, raw units for tokens).
      </p>
      <pre>
        <code>{`curl "${base}?module=account&action=balance&address=0x0000000000000000000000000000000000000000"`}</code>
      </pre>

      <h2 id="responses">Response format</h2>
      <p>
        Standard modules return <code>status</code> (<code>&quot;1&quot;</code> on success), <code>message</code> and <code>result</code>. The{" "}
        <code>proxy</code> module mirrors the raw JSON-RPC response.
      </p>
      <pre>
        <code>{`{\n  "status": "1",\n  "message": "OK",\n  "result": "40891626854930000000000"\n}`}</code>
      </pre>

      {ENDPOINTS.map((group) => (
        <section key={group.id}>
          <h2 id={group.id}>{group.title}</h2>
          {group.items.map((item) => (
            <div key={item.q} className="mb-5">
              <h3>{item.name}</h3>
              <pre>
                <code>{`${base}?${item.q}`}</code>
              </pre>
            </div>
          ))}
        </section>
      ))}

      <h2 id="json-rpc">Direct JSON-RPC</h2>
      <p>
        For full node access (wallets, subscriptions, raw calls) connect to the chain&apos;s JSON-RPC endpoint on port <code>8545</code> of
        this network&apos;s RPC host.
      </p>
      <pre>
        <code>{`curl -X POST -H "content-type: application/json" \\\n  --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}' \\\n  http://${host.split(":")[0]}:8545`}</code>
      </pre>
    </ContentPage>
  );
}
