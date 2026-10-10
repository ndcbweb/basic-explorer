"use client";

import Link from "next/link";
import { useState } from "react";

export default function PushTxForm() {
  const [hex, setHex] = useState("");
  const [state, setState] = useState({ status: "idle" });

  const submit = async (event) => {
    event.preventDefault();
    const raw = hex.trim();
    if (!/^0x[0-9a-fA-F]+$/.test(raw)) {
      setState({ status: "error", message: "Enter a signed transaction as a 0x-prefixed hex string." });
      return;
    }
    setState({ status: "sending" });
    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ module: "proxy", action: "eth_sendRawTransaction", hex: raw }),
      });
      const json = await res.json();
      if (json.error) setState({ status: "error", message: json.error.message });
      else setState({ status: "sent", hash: json.result });
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label htmlFor="rawtx" className="block text-sm font-medium text-ink">
        Signed transaction hex
      </label>
      <textarea
        id="rawtx"
        value={hex}
        onChange={(event) => setHex(event.target.value)}
        rows={7}
        spellCheck={false}
        placeholder="0xf86c808504a817c800825208..."
        className="field font-mono text-xs"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={state.status === "sending"}>
          {state.status === "sending" ? "Sending…" : "Send Transaction"}
        </button>
        {hex && (
          <button type="button" onClick={() => setHex("")} className="text-sm text-muted hover:text-ink">
            Clear
          </button>
        )}
      </div>
      {state.status === "sent" && (
        <div role="status" className="rounded-lg border border-ok-700/25 bg-ok-50 px-4 py-3 text-sm text-ok-700">
          Transaction submitted.{" "}
          <Link href={`/tx/${state.hash}`} className="font-mono break-all">
            {state.hash}
          </Link>
        </div>
      )}
      {state.status === "error" && (
        <div role="alert" className="rounded-lg border border-bad-700/25 bg-bad-50 px-4 py-3 text-sm text-bad-700">
          {state.message}
        </div>
      )}
    </form>
  );
}
