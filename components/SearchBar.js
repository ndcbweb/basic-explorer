"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SearchBar({ size = "md", autoFocus = false }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const large = size === "lg";

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (event) => {
    event.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <label htmlFor={`search-${size}`} className="sr-only">
        Search by address, transaction hash, block number or block hash
      </label>
      <svg
        viewBox="0 0 20 20"
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-faint ${large ? "left-4 h-5 w-5" : "left-3 h-4 w-4"}`}
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M8.5 3a5.5 5.5 0 0 1 4.38 8.83l3.65 3.64a.75.75 0 1 1-1.06 1.06l-3.64-3.65A5.5 5.5 0 1 1 8.5 3Zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
        />
      </svg>
      <input
        id={`search-${size}`}
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoFocus={autoFocus}
        spellCheck={false}
        autoComplete="off"
        placeholder="Search by Address / Txn Hash / Block"
        className={`w-full rounded-lg border border-line bg-white text-ink placeholder:text-faint focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none ${
          large ? "h-13 pr-28 pl-12 text-base" : "h-10 pr-20 pl-9 text-sm"
        }`}
      />
      <button
        type="submit"
        className={`absolute top-1/2 -translate-y-1/2 rounded-md bg-brand-600 font-medium text-white transition-colors hover:bg-brand-700 ${
          large ? "right-1.5 h-10 px-5 text-sm" : "right-1 h-8 px-3 text-xs"
        }`}
      >
        Search
      </button>
    </form>
  );
}
