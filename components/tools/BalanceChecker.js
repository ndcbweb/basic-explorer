"use client";

import Link from "next/link";
import { useState } from "react";
import { FieldLabel, Notice } from "./shared";

function grouped(text) {
  if (text == null) return "—";
  const [whole, fraction] = text.split(".");
  const sign = whole.startsWith("-") ? "-" : "";
  const body = BigInt(whole.replace("-", "")).toLocaleString("en-US");
  return `${sign}${body}${fraction ? `.${fraction}` : ""}`;
}

export default function BalanceChecker({ currency }) {
  const [address, setAddress] = useState("");
  const [mode, setMode] = useState("date");
  const [block, setBlock] = useState("");
  const [date, setDate] = useState("");
  const [token, setToken] = useState("");
  const [state, setState] = useState({ status: "idle" });

  const submit = async (event) => {
    event.preventDefault();
    const addr = address.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return setState({ status: "error", message: "Enter a valid 0x address." });
    if (token.trim() && !/^0x[0-9a-fA-F]{40}$/.test(token.trim()))
      return setState({ status: "error", message: "The token contract must be a valid 0x address." });
    if (mode === "block" && !/^\d+$/.test(block.trim())) return setState({ status: "error", message: "Enter a block number." });
    if (mode === "date" && !date) return setState({ status: "error", message: "Pick a date." });

    const query = new URLSearchParams({ address: addr });
    if (mode === "block") query.set("block", block.trim());
    else query.set("date", date);
    if (token.trim()) query.set("token", token.trim());
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/tools/balance?${query}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setState({ status: "done", result: json });
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  };

  const result = state.result;

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <FieldLabel htmlFor="bal-address">Address</FieldLabel>
          <input
            id="bal-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            spellCheck={false}
            placeholder="0x…"
            className="field font-mono text-[13px]"
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Snapshot at</legend>
          <div className="mb-3 flex gap-4 text-sm text-ink">
            {[
              ["date", "Date (end of day, UTC)"],
              ["block", "Block number"],
            ].map(([id, label]) => (
              <label key={id} className="inline-flex items-center gap-2">
                <input type="radio" name="bal-mode" checked={mode === id} onChange={() => setMode(id)} />
                {label}
              </label>
            ))}
          </div>
          {mode === "date" ? (
            <input type="date" aria-label="Date" value={date} onChange={(event) => setDate(event.target.value)} className="field" />
          ) : (
            <input
              aria-label="Block number"
              inputMode="numeric"
              value={block}
              onChange={(event) => setBlock(event.target.value)}
              placeholder="e.g. 1"
              className="field"
            />
          )}
        </fieldset>
        <div>
          <FieldLabel htmlFor="bal-token" hint="optional — ERC-20 contract">
            Token contract address
          </FieldLabel>
          <input
            id="bal-token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            spellCheck={false}
            placeholder="0x…"
            className="field font-mono text-[13px]"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={state.status === "loading"}>
          {state.status === "loading" ? "Looking up…" : "Lookup"}
        </button>
      </form>

      {state.status === "error" && <Notice tone="bad">{state.message}</Notice>}

      {state.status === "done" && result && (
        <div className="overflow-hidden rounded-lg border border-line">
          <dl className="divide-y divide-line text-sm">
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr]">
              <dt className="text-muted">Address</dt>
              <dd className="mono break-all">
                <Link href={`/address/${result.address}`}>{result.address}</Link>
              </dd>
            </div>
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr]">
              <dt className="text-muted">Block</dt>
              <dd>
                <Link href={`/block/${result.blockNumber}`}>#{result.blockNumber.toLocaleString("en-US")}</Link>
                {result.timestamp && (
                  <span className="ml-2 text-muted">{new Date(result.timestamp * 1000).toUTCString().replace("GMT", "UTC")}</span>
                )}
              </dd>
            </div>
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr]">
              <dt className="text-muted">{currency} balance</dt>
              <dd className="font-semibold break-all text-ink">
                {grouped(result.balanceFormatted)} {currency}
                <span className="ml-2 font-normal text-faint">({result.balance} wei)</span>
              </dd>
            </div>
            {result.token && (
              <div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr]">
                <dt className="text-muted">
                  {result.token.name || "Token"}
                  {result.token.symbol ? ` (${result.token.symbol})` : ""} balance
                </dt>
                <dd className="break-all">
                  {result.token.error ? (
                    <span className="text-bad-700">{result.token.error}</span>
                  ) : (
                    <span className="font-semibold text-ink">
                      {grouped(result.token.balanceFormatted)} {result.token.symbol || ""}
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
