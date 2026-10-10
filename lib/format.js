import { formatUnits } from "viem";

export function shortHash(value, head = 10, tail = 8) {
  if (!value) return "";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function formatNumber(value) {
  if (value == null) return "—";
  return Number(value).toLocaleString("en-US");
}

export function timeAgo(timestamp) {
  if (!timestamp) return "—";
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - Number(timestamp));
  if (seconds < 60) return `${seconds} sec${seconds === 1 ? "" : "s"} ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatDate(timestamp) {
  if (!timestamp) return "—";
  return new Date(Number(timestamp) * 1000).toUTCString().replace("GMT", "UTC");
}

/** Formats a raw integer amount (decimal string, hex or bigint) with token decimals. */
export function formatAmount(raw, decimals = 18, maxFraction = 6) {
  if (raw == null) return "0";
  const value = typeof raw === "bigint" ? raw : BigInt(raw);
  const text = formatUnits(value, decimals);
  const [whole, fraction = ""] = text.split(".");
  const grouped = BigInt(whole.replace("-", "")).toLocaleString("en-US");
  const sign = whole.startsWith("-") ? "-" : "";
  const trimmed = fraction.slice(0, maxFraction).replace(/0+$/, "");
  if (!trimmed && fraction && /[1-9]/.test(fraction)) return `<${sign}0.${"0".repeat(maxFraction - 1)}1`;
  return `${sign}${grouped}${trimmed ? `.${trimmed}` : ""}`;
}

export function formatGwei(raw) {
  if (raw == null) return "—";
  const value = BigInt(raw);
  // Idle PoA chains decay the base fee to a few wei; show the real figure instead of "<0.0001".
  return formatAmount(value, 9, value < 100000n ? 9 : 4);
}

export function compactNumber(value) {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function hexToNumber(hex) {
  return hex == null ? null : Number(BigInt(hex));
}

export function hexToDecimal(hex) {
  return hex == null ? null : BigInt(hex).toString();
}

const KNOWN_METHODS = {
  "0xa9059cbb": "Transfer",
  "0x095ea7b3": "Approve",
  "0x23b872dd": "Transfer From",
  "0x40c10f19": "Mint",
  "0x42966c68": "Burn",
  "0xd0e30db0": "Deposit",
  "0x2e1a7d4d": "Withdraw",
  "0x42842e0e": "Safe Transfer From",
  "0xb88d4fde": "Safe Transfer From",
  "0xa22cb465": "Set Approval For All",
  "0x3ccfd60b": "Withdraw",
  "0xf2fde38b": "Transfer Ownership",
  "0x715018a6": "Renounce Ownership",
};

export function methodLabel(input, to) {
  if (!to) return "Contract Creation";
  if (!input || input === "0x") return "Transfer";
  const selector = input.slice(0, 10).toLowerCase();
  return KNOWN_METHODS[selector] || selector;
}

/** Returns the UTF-8 text of calldata when it is a plain message rather than an ABI call. */
export function decodeIdm(input) {
  if (!input || input.length < 4 || input.length % 2) return null;
  const bytes = new Uint8Array((input.length - 2) / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(input.slice(2 + i * 2, 4 + i * 2), 16);
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
  // ABI calldata is full of NULs and control bytes; real messages are printable.
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) return null;
  return text.trim() ? text : null;
}

export const TX_TYPES = { 0: "Legacy", 1: "EIP-2930", 2: "EIP-1559", 3: "EIP-4844 (Blob)", 4: "EIP-7702 (Set Code)" };

export function isAddress(value) {
  return /^0x[0-9a-fA-F]{40}$/.test(value || "");
}

export function isHash(value) {
  return /^0x[0-9a-fA-F]{64}$/.test(value || "");
}
