"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ status: "idle" });

  const submit = async (event) => {
    event.preventDefault();
    setState({ status: "sending" });
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      setState(json.ok ? { status: "done", message: json.message } : { status: "error", message: json.error });
      if (json.ok) setEmail("");
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="newsletter-email" className="block text-sm font-medium text-ink">
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="field sm:flex-1"
        />
        <button type="submit" className="btn-primary" disabled={state.status === "sending"}>
          {state.status === "sending" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {state.status === "done" && (
        <p role="status" className="text-sm text-ok-700">
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-bad-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
