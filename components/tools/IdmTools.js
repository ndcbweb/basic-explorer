"use client";

import Link from "next/link";
import { useState } from "react";
import { stringToHex } from "viem";
import { FieldLabel, Notice, OutputBox, hexToUtf8 } from "./shared";
import { connectWallet, ensureChain, walletError } from "./wallet";

export function IdmSendForm({ chainId }) {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState({ status: "idle" });

  const send = async (event) => {
    event.preventDefault();
    if (!/^0x[0-9a-fA-F]{40}$/.test(to.trim())) return setState({ status: "error", message: "Enter a valid recipient address." });
    if (!message.trim()) return setState({ status: "error", message: "Write a message to send." });
    setState({ status: "sending" });
    try {
      const from = await connectWallet();
      await ensureChain(chainId);
      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from, to: to.trim(), value: "0x0", data: stringToHex(message) }],
      });
      setState({ status: "sent", hash });
    } catch (error) {
      setState({ status: "error", message: walletError(error) });
    }
  };

  return (
    <form onSubmit={send} className="space-y-4">
      <div>
        <FieldLabel htmlFor="idm-to">To address</FieldLabel>
        <input
          id="idm-to"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          spellCheck={false}
          placeholder="0x…"
          className="field font-mono text-xs"
        />
      </div>
      <div>
        <FieldLabel htmlFor="idm-message">Message</FieldLabel>
        <textarea id="idm-message" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} className="field" />
        <p className="mt-1 text-xs text-faint">
          {new TextEncoder().encode(message).length} bytes · sent as a 0-value transaction, you only pay gas.
        </p>
      </div>
      <button type="submit" className="btn-primary" disabled={state.status === "sending"}>
        {state.status === "sending" ? "Waiting for wallet…" : "Send Message"}
      </button>
      {state.status === "error" && <Notice tone="bad">{state.message}</Notice>}
      {state.status === "sent" && (
        <Notice tone="ok">
          Message sent.{" "}
          <Link href={`/tx/${state.hash}`} className="font-mono break-all">
            {state.hash}
          </Link>
        </Notice>
      )}
    </form>
  );
}

export function IdmDecodeForm() {
  const [hash, setHash] = useState("");
  const [state, setState] = useState({ status: "idle" });

  const decode = async (event) => {
    event.preventDefault();
    const value = hash.trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(value)) return setState({ status: "error", message: "Enter a valid transaction hash." });
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/tools/tx-input?hash=${value}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setState({ status: "done", tx: json, text: hexToUtf8(json.input) });
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  };

  return (
    <form onSubmit={decode} className="space-y-4">
      <div>
        <FieldLabel htmlFor="idm-hash">Transaction hash</FieldLabel>
        <input
          id="idm-hash"
          value={hash}
          onChange={(event) => setHash(event.target.value)}
          spellCheck={false}
          placeholder="0x…"
          className="field font-mono text-xs"
        />
      </div>
      <button type="submit" className="btn-primary" disabled={state.status === "loading"}>
        {state.status === "loading" ? "Loading…" : "Decode"}
      </button>
      {state.status === "error" && <Notice tone="bad">{state.message}</Notice>}
      {state.status === "done" && (
        <div className="space-y-2">
          <p className="text-sm text-muted">
            From <span className="text-ink">{state.tx.from}</span> to <span className="text-ink">{state.tx.to || "contract creation"}</span>
          </p>
          <OutputBox>{state.tx.input === "0x" ? "This transaction has no input data." : state.text || "—"}</OutputBox>
        </div>
      )}
    </form>
  );
}
