"use client";

import Link from "next/link";
import { useState } from "react";
import { encodeFunctionData, parseAbi } from "viem";
import { shortHash } from "@/lib/format";
import { connectWallet, ensureChain, walletError } from "./wallet";

const ABI = parseAbi([
  "function approve(address spender, uint256 amount)",
  "function setApprovalForAll(address operator, bool approved)",
]);

const ZERO = `0x${"0".repeat(40)}`;

export default function RevokeButton({ owner, token, spender, kind, tokenId, chainId }) {
  const [state, setState] = useState({ status: "idle" });

  const revoke = async () => {
    setState({ status: "pending" });
    try {
      const account = await connectWallet();
      if (account !== owner.toLowerCase()) throw new Error(`Connect the wallet of ${shortHash(owner, 8, 6)} to revoke this approval.`);
      await ensureChain(chainId);
      const data =
        kind === "all"
          ? encodeFunctionData({ abi: ABI, functionName: "setApprovalForAll", args: [spender, false] })
          : kind === "nft"
            ? encodeFunctionData({ abi: ABI, functionName: "approve", args: [ZERO, BigInt(tokenId)] })
            : encodeFunctionData({ abi: ABI, functionName: "approve", args: [spender, 0n] });
      const hash = await window.ethereum.request({ method: "eth_sendTransaction", params: [{ from: account, to: token, value: "0x0", data }] });
      setState({ status: "sent", hash });
    } catch (error) {
      setState({ status: "error", message: walletError(error) });
    }
  };

  if (state.status === "sent") {
    return (
      <Link href={`/tx/${state.hash}`} className="mono text-ok-700">
        Sent {shortHash(state.hash, 8, 4)}
      </Link>
    );
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={revoke}
        disabled={state.status === "pending"}
        className="rounded-md border border-bad-700/30 bg-bad-50 px-2.5 py-1 text-xs font-medium text-bad-700 transition-opacity hover:opacity-80 disabled:opacity-60"
      >
        {state.status === "pending" ? "Confirm in wallet…" : "Revoke"}
      </button>
      {state.status === "error" && <span className="max-w-[220px] text-xs whitespace-normal text-bad-700">{state.message}</span>}
    </span>
  );
}
