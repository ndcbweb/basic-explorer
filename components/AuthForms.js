"use client";

import Link from "next/link";
import { useState } from "react";

function EyeIcon({ open }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      {open ? (
        <path
          fill="currentColor"
          d="M10 4c4.2 0 7.3 2.9 8.6 5.6a1 1 0 0 1 0 .8C17.3 13.1 14.2 16 10 16s-7.3-2.9-8.6-5.6a1 1 0 0 1 0-.8C2.7 6.9 5.8 4 10 4Zm0 1.5c-3.3 0-5.9 2.2-7.1 4.5 1.2 2.3 3.8 4.5 7.1 4.5s5.9-2.2 7.1-4.5c-1.2-2.3-3.8-4.5-7.1-4.5Zm0 1.75a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5Z"
        />
      ) : (
        <path
          fill="currentColor"
          d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l2.1 2.1A9.6 9.6 0 0 0 1.4 9.6a1 1 0 0 0 0 .8C2.7 13.1 5.8 16 10 16c1.6 0 3-.42 4.24-1.1l2.48 2.48a.75.75 0 1 0 1.06-1.06l-14.5-14.1ZM13.13 13.8A7.3 7.3 0 0 1 10 14.5c-3.3 0-5.9-2.2-7.1-4.5a8.1 8.1 0 0 1 2.48-3.06l1.6 1.6a2.75 2.75 0 0 0 3.78 3.78l2.37 2.48ZM10 4c4.2 0 7.3 2.9 8.6 5.6a1 1 0 0 1 0 .8 9.9 9.9 0 0 1-2 2.75l-1.06-1.06A8.1 8.1 0 0 0 17.1 10c-1.2-2.3-3.8-4.5-7.1-4.5-.6 0-1.17.07-1.72.2L7.06 4.48A9.3 9.3 0 0 1 10 4Z"
        />
      )}
    </svg>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete, aside = null, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className="field pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-faint hover:text-ink"
        >
          <EyeIcon open={!visible} />
        </button>
      </div>
    </div>
  );
}

function TextField({ id, label, value, onChange, hint, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} className="field" {...rest} />
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-lg border border-bad-700/25 bg-bad-50 px-4 py-3 text-sm text-bad-700">
      {message}
    </div>
  );
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

/** Full navigation so the header's account link picks up the new session. */
const go = (next) => window.location.assign(next);

export function LoginForm({ next }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [state, setState] = useState({ status: "idle" });

  const submit = async (event) => {
    event.preventDefault();
    setState({ status: "busy" });
    try {
      await postJson("/api/auth/login", { username: username.trim(), password, remember });
      go(next);
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <ErrorBox message={state.status === "error" ? state.message : null} />
      <TextField
        id="username"
        label="Username"
        value={username}
        onChange={setUsername}
        autoComplete="username"
        placeholder="Enter username"
        required
        autoFocus
      />
      <PasswordField
        id="password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        placeholder="Enter password"
        aside={
          <Link href="/lostpassword" className="text-sm">
            Forgot your password?
          </Link>
        }
      />
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          className="h-4 w-4 rounded border-line accent-brand-600"
        />
        Remember &amp; Auto Login
      </label>
      <button type="submit" className="btn-primary w-full uppercase tracking-wide" disabled={state.status === "busy"}>
        {state.status === "busy" ? "Signing in…" : "Login"}
      </button>
    </form>
  );
}

export function RegisterForm({ next }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "", terms: false });
  const [state, setState] = useState({ status: "idle" });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const username = form.username.trim();
    let message = null;
    if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) message = "Username must be 3-30 characters: letters, numbers and underscores only.";
    else if (form.password.length < 8) message = "Password must be at least 8 characters.";
    else if (form.password !== form.confirm) message = "Passwords do not match.";
    else if (!form.terms) message = "Please accept the Terms and Conditions.";
    if (message) {
      setState({ status: "error", message });
      return;
    }
    setState({ status: "busy" });
    try {
      await postJson("/api/auth/register", { username, email: form.email.trim(), password: form.password });
      go(next);
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <ErrorBox message={state.status === "error" ? state.message : null} />
      <TextField
        id="username"
        label="Username"
        value={form.username}
        onChange={set("username")}
        autoComplete="username"
        placeholder="Username has to be from 3 to 30 characters in length"
        hint="Letters, numbers and underscores only."
        required
        autoFocus
      />
      <TextField
        id="email"
        type="email"
        label="Email Address (optional)"
        value={form.email}
        onChange={set("email")}
        autoComplete="email"
        placeholder="A valid email address"
      />
      <PasswordField
        id="password"
        label="Password"
        value={form.password}
        onChange={set("password")}
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      <PasswordField
        id="confirm"
        label="Confirm Password"
        value={form.confirm}
        onChange={set("confirm")}
        autoComplete="new-password"
        placeholder="Re-enter your password"
      />
      <label className="flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={form.terms}
          onChange={(event) => set("terms")(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-line accent-brand-600"
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" target="_blank">
            Terms and Conditions
          </Link>
        </span>
      </label>
      <button type="submit" className="btn-primary w-full uppercase tracking-wide" disabled={state.status === "busy"}>
        {state.status === "busy" ? "Creating account…" : "Create an Account"}
      </button>
    </form>
  );
}
