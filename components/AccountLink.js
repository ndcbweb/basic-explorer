"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AccountLink({ className = "" }) {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.user?.username) setUsername(json.user.username);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (username) {
    return (
      <Link href="/myaccount" className={className} title="My Account">
        <span className="inline-block max-w-[140px] truncate align-bottom">{username}</span>
      </Link>
    );
  }

  return (
    <Link href="/login" className={className}>
      Sign In
    </Link>
  );
}
