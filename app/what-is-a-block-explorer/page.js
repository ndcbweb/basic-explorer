import Link from "next/link";
import ContentPage from "@/components/ContentPage";
import { config } from "@/lib/config";

export const metadata = { title: "What is a Block Explorer?" };

export default function WhatIsPage() {
  return (
    <ContentPage
      eyebrow="What is a Block Explorer?"
      title="What is a Block Explorer?"
      lead="A block explorer is a search engine for a blockchain. It turns the raw ledger into pages you can read, search and share."
      toc={[
        { id: "basics", label: "The basics" },
        { id: "uses", label: "What people use it for" },
        { id: "concepts", label: "Key concepts" },
        { id: "start", label: "Get started" },
      ]}
    >
      <h2 id="basics">The basics</h2>
      <p>
        Every node of {config.chainName} keeps a copy of the ledger: an ever-growing chain of blocks, each holding a batch of transactions.
        Nodes speak a machine protocol (JSON-RPC), not something a person can browse. A block explorer reads from a node, organises the data
        and presents it as web pages.
      </p>

      <h2 id="uses">What people use it for</h2>
      <ul>
        <li>
          <strong>Confirming payments.</strong> Paste a transaction hash to see whether it succeeded and how many confirmations it has.
        </li>
        <li>
          <strong>Checking balances.</strong> Look up any address to see its {config.currency} and token holdings.
        </li>
        <li>
          <strong>Debugging contracts.</strong> Inspect inputs, event logs and failures of contract calls.
        </li>
        <li>
          <strong>Monitoring the network.</strong> Watch block times, validator activity and throughput.
        </li>
      </ul>

      <h2 id="concepts">Key concepts</h2>
      <h3>Block</h3>
      <p>A bundle of transactions sealed by a validator. Blocks are numbered sequentially, and each links to the previous one by hash.</p>
      <h3>Transaction</h3>
      <p>A signed instruction from an account: send {config.currency}, call a contract or deploy a new one. Identified by a unique hash.</p>
      <h3>Address</h3>
      <p>
        A 20-byte identifier starting with <code>0x</code>. It belongs either to a person (externally owned account) or to a smart contract.
      </p>
      <h3>Gas</h3>
      <p>
        The unit of computation. Each transaction pays gas used × gas price in {config.currency} as a fee to process it.
      </p>
      <h3>Token</h3>
      <p>
        A smart contract that tracks balances of its own asset. ERC-20 tokens are fungible (like currencies); ERC-721 tokens are unique NFTs.
      </p>

      <h2 id="start">Get started</h2>
      <p>
        Type an address, transaction hash, block number or token into the search bar at the top, or start from the{" "}
        <Link href="/">home page</Link>&apos;s latest blocks and transactions.
      </p>
    </ContentPage>
  );
}
