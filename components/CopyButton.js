"use client";

import { useState } from "react";

export default function CopyButton({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-faint transition-colors hover:bg-canvas hover:text-ink"
    >
      {copied ? (
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-ok-700" aria-hidden="true">
          <path fill="currentColor" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 2.75A2.25 2.25 0 0 0 4.75 5v8A2.25 2.25 0 0 0 7 15.25h6A2.25 2.25 0 0 0 15.25 13V5A2.25 2.25 0 0 0 13 2.75H7ZM6.25 5c0-.41.34-.75.75-.75h6c.41 0 .75.34.75.75v8c0 .41-.34.75-.75.75H7a.75.75 0 0 1-.75-.75V5Z M2.75 7.5a.75.75 0 0 1 1.5 0V15c0 .41.34.75.75.75h6.5a.75.75 0 0 1 0 1.5H5A2.25 2.25 0 0 1 2.75 15V7.5Z"
          />
        </svg>
      )}
    </button>
  );
}
