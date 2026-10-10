"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import CopyButton from "./CopyButton";
import { EmptyState } from "./ui";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.assign("/login?next=/myaccount");
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

/** Runs a mutation, then re-renders the server page so lists and balances refresh. */
function useMutation() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [, startTransition] = useTransition();
  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      startTransition(() => router.refresh());
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-lg border border-bad-700/25 bg-bad-50 px-4 py-2.5 text-sm text-bad-700">
      {message}
    </div>
  );
}

function RemoveButton({ onClick, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-muted hover:border-bad-700/40 hover:bg-bad-50 hover:text-bad-700 disabled:opacity-50"
    >
      Remove
    </button>
  );
}

function AddressCell({ address }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Link href={`/address/${address}`} className="mono">
        {address}
      </Link>
      <CopyButton value={address} label="Copy address" />
    </span>
  );
}

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const logout = async () => {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.location.assign("/login");
  };
  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-subtle disabled:opacity-60"
    >
      {busy ? "Signing out…" : "Sign Out"}
    </button>
  );
}

export function WatchlistPanel({ items, limit, currency }) {
  const { busy, error, run } = useMutation();
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState(null);

  const add = async (event) => {
    event.preventDefault();
    const value = address.trim();
    if (!ADDRESS_RE.test(value)) {
      setLocalError("Enter a valid 0x address (40 hex characters).");
      return;
    }
    setLocalError(null);
    const ok = await run(() => request("POST", "/api/account/watchlist", { address: value, note }));
    if (ok) {
      setAddress("");
      setNote("");
    }
  };

  const remove = (addr) => run(() => request("DELETE", `/api/account/watchlist?address=${addr}`));

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Watch List</h2>
        <span className="chip">
          {items.length} / {limit} used
        </span>
      </div>
      <form onSubmit={add} className="grid gap-3 border-b border-line p-5 md:grid-cols-[1fr_1fr_auto]" noValidate>
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Address (0x…)"
          aria-label="Address to watch"
          spellCheck={false}
          className="field font-mono text-[13px]"
        />
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note"
          aria-label="Note"
          maxLength={200}
          className="field"
        />
        <button type="submit" className="btn-primary" disabled={busy || items.length >= limit}>
          Add Address
        </button>
        {(localError || error) && (
          <div className="md:col-span-3">
            <ErrorBox message={localError || error} />
          </div>
        )}
      </form>
      {items.length === 0 ? (
        <EmptyState title="Your watch list is empty" body="Add an address above to track its balance from this page." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Note</th>
                <th>Balance</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.address}>
                  <td>
                    <AddressCell address={item.address} />
                  </td>
                  <td className="max-w-[240px] truncate text-muted" title={item.note || ""}>
                    {item.note || <span className="text-faint">—</span>}
                  </td>
                  <td className="text-ink">
                    {item.balance == null ? (
                      <span className="text-faint">Unavailable</span>
                    ) : (
                      <>
                        {item.balance} <span className="text-muted">{currency}</span>
                      </>
                    )}
                  </td>
                  <td className="text-right">
                    <RemoveButton onClick={() => remove(item.address)} disabled={busy} label={`Remove ${item.address}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function TagsPanel({ items, limit }) {
  const { busy, error, run } = useMutation();
  const [address, setAddress] = useState("");
  const [tag, setTag] = useState("");
  const [localError, setLocalError] = useState(null);

  const add = async (event) => {
    event.preventDefault();
    const value = address.trim();
    if (!ADDRESS_RE.test(value)) return setLocalError("Enter a valid 0x address (40 hex characters).");
    if (!tag.trim()) return setLocalError("Enter a name tag.");
    setLocalError(null);
    const ok = await run(() => request("POST", "/api/account/tags", { address: value, tag: tag.trim() }));
    if (ok) {
      setAddress("");
      setTag("");
    }
  };

  const remove = (addr) => run(() => request("DELETE", `/api/account/tags?address=${addr}`));

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Private Name Tags</h2>
        <span className="chip">
          {items.length} / {limit} used
        </span>
      </div>
      <p className="px-5 pt-4 text-sm text-muted">
        Private name tags are only visible to you. Adding a tag to an address that already has one replaces it.
      </p>
      <form onSubmit={add} className="grid gap-3 border-b border-line p-5 md:grid-cols-[1fr_1fr_auto]" noValidate>
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Address (0x…)"
          aria-label="Address"
          spellCheck={false}
          className="field font-mono text-[13px]"
        />
        <input
          value={tag}
          onChange={(event) => setTag(event.target.value)}
          placeholder="Name tag (max 35 characters)"
          aria-label="Name tag"
          maxLength={35}
          className="field"
        />
        <button type="submit" className="btn-primary" disabled={busy}>
          Add Tag
        </button>
        {(localError || error) && (
          <div className="md:col-span-3">
            <ErrorBox message={localError || error} />
          </div>
        )}
      </form>
      {items.length === 0 ? (
        <EmptyState title="No private name tags yet" body="Label addresses you interact with so they are easy to recognise." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name Tag</th>
                <th>Address</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.address}>
                  <td>
                    <span className="chip text-ink">{item.tag}</span>
                  </td>
                  <td>
                    <AddressCell address={item.address} />
                  </td>
                  <td className="text-right">
                    <RemoveButton onClick={() => remove(item.address)} disabled={busy} label={`Remove tag for ${item.address}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function ApiKeysPanel({ items, limit }) {
  const { busy, error, run } = useMutation();
  const [name, setName] = useState("");

  const create = async (event) => {
    event.preventDefault();
    const ok = await run(() => request("POST", "/api/account/apikeys", { name: name.trim() }));
    if (ok) setName("");
  };

  const remove = (key) => {
    if (!window.confirm("Delete this API key? Applications using it will stop working.")) return;
    run(() => request("DELETE", `/api/account/apikeys?key=${key}`));
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">API Keys</h2>
        <span className="chip">
          {items.length} / {limit} used
        </span>
      </div>
      <p className="px-5 pt-4 text-sm text-muted">
        Pass your key as <code className="mono rounded bg-subtle px-1.5 py-0.5 text-ink">&amp;apikey=YourApiKeyToken</code> on
        requests to the explorer API. See the <Link href="/apis">API documentation</Link> for the available endpoints.
      </p>
      <form onSubmit={create} className="grid gap-3 border-b border-line p-5 md:grid-cols-[1fr_auto]" noValidate>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="App name (optional)"
          aria-label="API key name"
          maxLength={50}
          className="field"
        />
        <button type="submit" className="btn-primary" disabled={busy || items.length >= limit}>
          Create API Key
        </button>
        {error && (
          <div className="md:col-span-2">
            <ErrorBox message={error} />
          </div>
        )}
        {items.length >= limit && (
          <p className="text-xs text-faint md:col-span-2">You have reached the limit of {limit} keys. Delete one to create another.</p>
        )}
      </form>
      {items.length === 0 ? (
        <EmptyState title="No API keys yet" body="Create a key to identify your application when calling the API." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>App Name</th>
                <th>API Key Token</th>
                <th>Created</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.key}>
                  <td className="font-medium text-ink">{item.name}</td>
                  <td>
                    <span className="inline-flex items-center gap-1">
                      <span className="mono text-ink">{item.key}</span>
                      <CopyButton value={item.key} label="Copy API key" />
                    </span>
                  </td>
                  <td className="text-muted">{item.created}</td>
                  <td className="text-right">
                    <RemoveButton onClick={() => remove(item.key)} disabled={busy} label={`Delete API key ${item.name}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
