import { parseAbiItem } from "viem";

export function Notice({ tone = "info", children }) {
  const styles = {
    ok: "border-ok-700/25 bg-ok-50 text-ok-700",
    bad: "border-bad-700/25 bg-bad-50 text-bad-700",
    wait: "border-wait-700/25 bg-wait-50 text-wait-700",
    info: "border-brand-500/25 bg-brand-50 text-brand-700",
  };
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm break-words ${styles[tone]}`}>
      {children}
    </div>
  );
}

export function FieldLabel({ htmlFor, children, hint }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
      {children}
      {hint && <span className="ml-1.5 font-normal text-faint">{hint}</span>}
    </label>
  );
}

export function BetaBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-brand-500/30 bg-brand-50 px-2 py-0.5 align-middle text-[11px] font-semibold tracking-wide text-brand-700 uppercase">
      Beta
    </span>
  );
}

export function OutputBox({ children, className = "" }) {
  return (
    <pre className={`max-h-96 overflow-auto rounded-lg border border-line bg-subtle p-4 font-mono text-[13px] leading-6 break-all whitespace-pre-wrap text-ink ${className}`}>
      {children}
    </pre>
  );
}

/**
 * Accepts a JSON ABI (array, or an object with an `abi` field) or one human-readable
 * function signature per line, and returns the function fragments it contains.
 */
export function parseFunctions(text) {
  const source = (text || "").trim();
  if (!source) throw new Error("Enter an ABI or a function signature.");
  if (source.startsWith("[") || source.startsWith("{")) {
    let json;
    try {
      json = JSON.parse(source);
    } catch (error) {
      throw new Error(`ABI is not valid JSON: ${error.message}`);
    }
    const abi = Array.isArray(json) ? json : Array.isArray(json.abi) ? json.abi : [json];
    const fns = abi.filter((item) => item && (item.type === "function" || (!item.type && item.name)));
    if (!fns.length) throw new Error("The ABI has no functions.");
    return fns.map((item) => ({ ...item, type: "function", inputs: item.inputs || [], outputs: item.outputs || [] }));
  }
  const fns = [];
  for (const raw of source.split(/\n|;/)) {
    const line = raw.trim();
    if (!line) continue;
    const signature = /^function\s/.test(line) ? line : `function ${line}`;
    let item;
    try {
      item = parseAbiItem(signature);
    } catch (error) {
      throw new Error(`Could not parse "${line}": ${error.shortMessage || error.message}`);
    }
    if (item.type !== "function") throw new Error(`"${line}" is not a function signature.`);
    fns.push(item);
  }
  if (!fns.length) throw new Error("Enter an ABI or a function signature.");
  return fns;
}

export function formatType(param) {
  if (!param.type.startsWith("tuple")) return param.type;
  return `(${(param.components || []).map(formatType).join(",")})${param.type.slice(5)}`;
}

export function functionSignature(fn) {
  return `${fn.name}(${fn.inputs.map(formatType).join(",")})`;
}

const ARRAY_SUFFIX = /\[(\d*)\]$/;

export function isComplexType(type) {
  return type.startsWith("tuple") || ARRAY_SUFFIX.test(type);
}

/** Converts user input (strings, or parsed JSON for arrays/tuples) into values viem can encode. */
export function coerceArg(param, value) {
  const { type } = param;
  if (ARRAY_SUFFIX.test(type)) {
    const list = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(list)) throw new Error(`${param.name || type}: expected a JSON array`);
    const inner = { ...param, type: type.replace(ARRAY_SUFFIX, "") };
    return list.map((item) => coerceArg(inner, item));
  }
  if (type === "tuple") {
    const data = typeof value === "string" ? JSON.parse(value) : value;
    const components = param.components || [];
    if (Array.isArray(data)) return components.map((component, i) => coerceArg(component, data[i]));
    if (data && typeof data === "object") {
      const named = components.every((component) => component.name);
      if (named) return Object.fromEntries(components.map((component) => [component.name, coerceArg(component, data[component.name])]));
      return components.map((component, i) => coerceArg(component, data[i]));
    }
    throw new Error(`${param.name || "tuple"}: expected a JSON array or object`);
  }
  if (value == null) throw new Error(`${param.name || type}: value is required`);
  const text = String(value).trim();
  if (/^u?int\d*$/.test(type)) {
    if (!/^-?\d+$|^0x[0-9a-fA-F]+$/.test(text)) throw new Error(`${param.name || type}: "${text}" is not an integer`);
    return BigInt(text);
  }
  if (type === "bool") {
    if (["true", "1"].includes(text.toLowerCase())) return true;
    if (["false", "0", ""].includes(text.toLowerCase())) return false;
    throw new Error(`${param.name || type}: use true or false`);
  }
  if (type === "address") {
    if (!/^0x[0-9a-fA-F]{40}$/.test(text)) throw new Error(`${param.name || type}: "${text}" is not an address`);
    return text;
  }
  if (type.startsWith("bytes")) {
    if (!/^0x([0-9a-fA-F]{2})*$/.test(text)) throw new Error(`${param.name || type}: expected 0x-prefixed hex`);
    return text;
  }
  return typeof value === "string" ? value : text;
}

/** Renders decoded ABI values (bigints, nested arrays, structs) as readable text. */
export function displayValue(value) {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return String(value);
  return JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2);
}

/** Decodes hex bytes as UTF-8, replacing invalid sequences so arbitrary calldata still renders. */
export function hexToUtf8(hex) {
  const clean = (hex || "").replace(/^0x/i, "");
  if (!clean || clean.length % 2 || /[^0-9a-fA-F]/.test(clean)) return "";
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return new TextDecoder("utf-8").decode(bytes);
}
