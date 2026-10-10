import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

const LIST_URL = "https://binaries.soliditylang.org/bin/list.json";
const BIN_URL = "https://binaries.soliditylang.org/bin";
const LIST_TTL_MS = 60 * 60 * 1000;
const MAX_LOADED = 4;

export const EVM_VERSIONS = [
  "default",
  "osaka",
  "prague",
  "cancun",
  "shanghai",
  "paris",
  "london",
  "berlin",
  "istanbul",
  "petersburg",
  "constantinople",
  "byzantium",
  "spuriousDragon",
  "tangerineWhistle",
  "homestead",
];

export const LICENSES = [
  "No License (None)",
  "The Unlicense (Unlicense)",
  "MIT License (MIT)",
  "GNU GPLv2 (GPL-2.0)",
  "GNU GPLv3 (GPL-3.0)",
  "GNU LGPLv2.1 (LGPL-2.1)",
  "GNU LGPLv3 (LGPL-3.0)",
  "BSD 2-clause (BSD-2-Clause)",
  "BSD 3-clause (BSD-3-Clause)",
  "Mozilla Public License 2.0 (MPL-2.0)",
  "Open Software License 3.0 (OSL-3.0)",
  "Apache 2.0 (Apache-2.0)",
  "GNU AGPLv3 (AGPL-3.0)",
  "Business Source License (BUSL-1.1)",
];

export const VERSION_PATTERN = /^v\d+\.\d+\.\d+(-nightly\.[\d.]+)?\+commit\.[0-9a-f]{8}$/;

/** Release builds of solc-js, newest first. Cached in memory; returns [] when the list is unreachable. */
export async function listVersions() {
  const cache = globalThis.__solcVersions;
  if (cache && Date.now() - cache.at < LIST_TTL_MS) return cache.versions;
  try {
    const res = await fetch(LIST_URL, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const versions = json.builds
      .filter((build) => !build.prerelease)
      .map((build) => `v${build.longVersion}`)
      .reverse();
    globalThis.__solcVersions = { at: Date.now(), versions };
    return versions;
  } catch {
    return cache?.versions || [];
  }
}

async function soljsonSource(version) {
  const dir = path.join(config.dataDir, "solc");
  const file = path.join(dir, `soljson-${version}.js`);
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  const res = await fetch(`${BIN_URL}/soljson-${version}.js`, { cache: "no-store", signal: AbortSignal.timeout(90000) });
  if (!res.ok) throw new Error(`Compiler ${version} could not be downloaded (HTTP ${res.status})`);
  const text = await res.text();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${file}.tmp`, text);
  fs.renameSync(`${file}.tmp`, file);
  return text;
}

/**
 * Loads a solc-js compiler of an exact version, caching instances on globalThis.
 * soljson is evaluated through Node's own module loader because the bundled
 * `module` object cannot host emscripten output.
 */
export async function loadCompiler(version) {
  if (!VERSION_PATTERN.test(version || "")) throw new Error("Unknown compiler version");
  const cache = (globalThis.__solcCompilers ||= new Map());
  if (!cache.has(version)) {
    const pending = (async () => {
      const { default: setupMethods } = await import("solc/wrapper");
      const source = await soljsonSource(version);
      const Module = process.getBuiltinModule("node:module");
      const filename = path.join(process.cwd(), `soljson-${version}.js`);
      const mod = new Module(filename);
      mod.filename = filename;
      mod.paths = Module._nodeModulePaths(process.cwd());
      mod._compile(source, filename);
      return setupMethods(mod.exports);
    })();
    cache.set(version, pending);
    pending.catch(() => cache.delete(version));
    while (cache.size > MAX_LOADED) cache.delete(cache.keys().next().value);
  }
  return cache.get(version);
}

const OUTPUT_SELECTION = {
  "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "evm.deployedBytecode.immutableReferences", "metadata"] },
};

/** Builds a standard-JSON input from the form fields used by the compiler and verifier. */
export function buildInput({ compilerType, source, fileName, optimization, runs, evmVersion }) {
  if (compilerType === "standard-json") {
    let input;
    try {
      input = typeof source === "string" ? JSON.parse(source) : source;
    } catch {
      throw new Error("Standard-JSON input is not valid JSON");
    }
    if (!input || typeof input.sources !== "object" || !Object.keys(input.sources).length) {
      throw new Error("Standard-JSON input must contain a non-empty `sources` object");
    }
    return {
      language: input.language || "Solidity",
      sources: input.sources,
      settings: { ...(input.settings || {}), outputSelection: OUTPUT_SELECTION },
    };
  }
  if (!source || !String(source).trim()) throw new Error("Source code is empty");
  const settings = {
    optimizer: { enabled: Boolean(optimization), runs: Number(runs) || 200 },
    outputSelection: OUTPUT_SELECTION,
  };
  if (evmVersion && evmVersion !== "default") settings.evmVersion = evmVersion;
  return { language: "Solidity", sources: { [fileName || "Contract.sol"]: { content: String(source) } }, settings };
}

/** Compiles a standard-JSON input; returns { errors, warnings, contracts: [{ file, name, ...output }] }. */
export async function compile(version, input) {
  const solc = await loadCompiler(version);
  const output = JSON.parse(
    solc.compile(JSON.stringify(input), { import: (p) => ({ error: `Import "${p}" not found. Use Standard-JSON input with all files included.` }) })
  );
  const messages = output.errors || [];
  const errors = messages.filter((m) => m.severity === "error").map((m) => m.formattedMessage || m.message);
  const warnings = messages.filter((m) => m.severity !== "error").map((m) => m.formattedMessage || m.message);
  const contracts = [];
  for (const [file, byName] of Object.entries(output.contracts || {})) {
    for (const [name, out] of Object.entries(byName)) contracts.push({ file, name, ...out });
  }
  return { errors, warnings, contracts, compilerVersion: solc.version() };
}
