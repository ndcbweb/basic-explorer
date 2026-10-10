"use client";

import { useState } from "react";
import { recoverMessageAddress, stringToHex, verifyMessage } from "viem";
import CopyButton from "@/components/CopyButton";
import { FieldLabel, Notice, OutputBox } from "./shared";
import { connectWallet, walletError } from "./wallet";

const TABS = [
  { id: "verify", label: "Verify Signature" },
  { id: "sign", label: "Sign Message" },
];

const isHex = (value) => /^0x([0-9a-fA-F]{2})*$/.test(value);

function messageFor(text, raw) {
  return raw ? { raw: text.trim() } : text;
}

function VerifyTab() {
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");
  const [raw, setRaw] = useState(false);
  const [state, setState] = useState({ status: "idle" });

  const verify = async (event) => {
    event.preventDefault();
    const addr = address.trim();
    const sig = signature.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return setState({ status: "error", message: "Enter a valid 0x address." });
    if (!/^0x[0-9a-fA-F]{130}$/.test(sig)) return setState({ status: "error", message: "Signature must be 65 bytes of 0x-prefixed hex (132 characters)." });
    if (raw && !isHex(message.trim())) return setState({ status: "error", message: "Hex messages must be 0x-prefixed with an even number of digits." });
    try {
      const msg = messageFor(message, raw);
      const [valid, recovered] = await Promise.all([
        verifyMessage({ address: addr, message: msg, signature: sig }),
        recoverMessageAddress({ message: msg, signature: sig }).catch(() => null),
      ]);
      setState({ status: "done", valid, recovered });
    } catch (error) {
      setState({ status: "error", message: error.shortMessage || error.message });
    }
  };

  return (
    <form onSubmit={verify} className="space-y-5">
      <div>
        <FieldLabel htmlFor="ver-address">Address</FieldLabel>
        <input
          id="ver-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          spellCheck={false}
          placeholder="0x…"
          className="field font-mono text-xs"
        />
      </div>
      <div>
        <FieldLabel htmlFor="ver-message">Message</FieldLabel>
        <textarea
          id="ver-message"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="The exact message that was signed"
          className="field"
        />
        <label className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={raw} onChange={(event) => setRaw(event.target.checked)} />
          Message is hex bytes (EIP-191 raw data)
        </label>
      </div>
      <div>
        <FieldLabel htmlFor="ver-signature">Signature hash</FieldLabel>
        <textarea
          id="ver-signature"
          rows={3}
          spellCheck={false}
          value={signature}
          onChange={(event) => setSignature(event.target.value)}
          placeholder="0x…"
          className="field font-mono text-xs"
        />
      </div>
      <button type="submit" className="btn-primary">
        Verify
      </button>
      {state.status === "error" && <Notice tone="bad">{state.message}</Notice>}
      {state.status === "done" &&
        (state.valid ? (
          <Notice tone="ok">
            <strong>Message signature verified.</strong> The signature was produced by {address.trim()}.
          </Notice>
        ) : (
          <Notice tone="bad">
            <strong>Signature is not valid for this address.</strong>
            {state.recovered && (
              <span className="mt-1 block font-mono text-xs">It recovers to {state.recovered}.</span>
            )}
          </Notice>
        ))}
    </form>
  );
}

function SignTab() {
  const [account, setAccount] = useState(null);
  const [message, setMessage] = useState("");
  const [state, setState] = useState({ status: "idle" });

  const connect = async () => {
    try {
      setAccount(await connectWallet());
      setState({ status: "idle" });
    } catch (error) {
      setState({ status: "error", message: walletError(error) });
    }
  };

  const sign = async (event) => {
    event.preventDefault();
    if (!message) return setState({ status: "error", message: "Enter a message to sign." });
    setState({ status: "signing" });
    try {
      const from = account || (await connectWallet());
      setAccount(from);
      const signature = await window.ethereum.request({ method: "personal_sign", params: [stringToHex(message), from] });
      setState({ status: "done", signature, signer: from, message });
    } catch (error) {
      setState({ status: "error", message: walletError(error) });
    }
  };

  return (
    <form onSubmit={sign} className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        {account ? (
          <span className="chip">
            Connected: <span className="text-ink">{account}</span>
          </span>
        ) : (
          <button type="button" onClick={connect} className="btn-primary">
            Connect Wallet
          </button>
        )}
      </div>
      <div>
        <FieldLabel htmlFor="sign-message">Message</FieldLabel>
        <textarea
          id="sign-message"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write the message you want to sign"
          className="field"
        />
      </div>
      <button type="submit" className="btn-primary" disabled={state.status === "signing"}>
        {state.status === "signing" ? "Waiting for wallet…" : "Sign Message"}
      </button>
      {state.status === "error" && <Notice tone="bad">{state.message}</Notice>}
      {state.status === "done" && (
        <div className="space-y-2">
          <Notice tone="ok">Message signed by {state.signer}. Share the address, message and signature so anyone can verify it.</Notice>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Signature</span>
            <CopyButton
              value={JSON.stringify({ address: state.signer, msg: state.message, sig: state.signature }, null, 2)}
              label="Copy as JSON"
            />
          </div>
          <OutputBox>{state.signature}</OutputBox>
        </div>
      )}
    </form>
  );
}

export default function SignatureTool() {
  const [tab, setTab] = useState("verify");
  return (
    <div>
      <div role="tablist" className="mb-5 flex gap-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === item.id ? "bg-brand-600 text-white" : "bg-surface text-muted ring-1 ring-line hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "verify" ? <VerifyTab /> : <SignTab />}
    </div>
  );
}
