"use client";

import { useState } from "react";
import { FieldLabel, Notice } from "./shared";

const TYPES = [
  { id: "txns", label: "Transactions" },
  { id: "internal", label: "Internal Transactions" },
  { id: "erc20", label: "ERC-20 Token Transfers" },
  { id: "nft", label: "NFT (ERC-721) Transfers" },
];

export default function ExportDataForm({ initialAddress = "", initialType = "txns" }) {
  const [type, setType] = useState(TYPES.some((t) => t.id === initialType) ? initialType : "txns");
  const [address, setAddress] = useState(initialAddress);
  const [mode, setMode] = useState("date");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [state, setState] = useState({ status: "idle" });

  const download = async (event) => {
    event.preventDefault();
    const addr = address.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      setState({ status: "error", message: "Enter a valid 0x address (40 hex characters)." });
      return;
    }
    if (mode === "block" && ((from && !/^\d+$/.test(from)) || (to && !/^\d+$/.test(to)))) {
      setState({ status: "error", message: "Block numbers must be whole numbers." });
      return;
    }
    const query = new URLSearchParams({ type, address: addr });
    if (from) query.set(mode === "block" ? "startblock" : "startdate", from);
    if (to) query.set(mode === "block" ? "endblock" : "enddate", to);
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/export?${query}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Export failed (HTTP ${res.status}).`);
      }
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") || "")?.[1] || "export.csv";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setState({ status: "done", rows: Number(res.headers.get("x-export-rows") || 0), name });
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  };

  return (
    <form onSubmit={download} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Export type</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <label
              key={t.id}
              className={`cursor-pointer rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                type === t.id ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              <input type="radio" name="type" value={t.id} checked={type === t.id} onChange={() => setType(t.id)} className="sr-only" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <FieldLabel htmlFor="exp-address">Address</FieldLabel>
        <input
          id="exp-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          spellCheck={false}
          placeholder="0x…"
          className="field font-mono text-xs"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Filter by</legend>
        <div className="mb-3 flex gap-4 text-sm text-ink">
          {[
            ["date", "Date range"],
            ["block", "Block range"],
          ].map(([id, label]) => (
            <label key={id} className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === id}
                onChange={() => {
                  setMode(id);
                  setFrom("");
                  setTo("");
                }}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="exp-from" hint="optional">
              {mode === "block" ? "Start block" : "From (UTC)"}
            </FieldLabel>
            <input
              id="exp-from"
              type={mode === "block" ? "text" : "date"}
              inputMode={mode === "block" ? "numeric" : undefined}
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              placeholder={mode === "block" ? "0" : undefined}
              className="field"
            />
          </div>
          <div>
            <FieldLabel htmlFor="exp-to" hint="optional">
              {mode === "block" ? "End block" : "To (UTC)"}
            </FieldLabel>
            <input
              id="exp-to"
              type={mode === "block" ? "text" : "date"}
              inputMode={mode === "block" ? "numeric" : undefined}
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder={mode === "block" ? "latest" : undefined}
              className="field"
            />
          </div>
        </div>
      </fieldset>

      <button type="submit" className="btn-primary" disabled={state.status === "loading"}>
        {state.status === "loading" ? "Preparing…" : "Download CSV"}
      </button>

      {state.status === "error" && <Notice tone="bad">{state.message}</Notice>}
      {state.status === "done" && (
        <Notice tone="ok">
          Downloaded {state.name} with {state.rows.toLocaleString("en-US")} row{state.rows === 1 ? "" : "s"}.
          {state.rows >= 5000 && " The export is capped at 5,000 rows — narrow the range to get the rest."}
        </Notice>
      )}
    </form>
  );
}
