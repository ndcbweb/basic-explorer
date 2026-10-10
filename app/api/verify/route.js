import { compareBytecode, creationTx, getVerified, runtimeHash, saveVerified } from "@/lib/contracts";
import { isAddress } from "@/lib/format";
import { rpc, safeRpc } from "@/lib/rpc";
import { buildInput, compile, EVM_VERSIONS, listVersions, VERSION_PATTERN } from "@/lib/solc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const fail = (status, error, extra = {}) => Response.json({ ok: false, error, ...extra }, { status });

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.has("versions")) return Response.json({ versions: await listVersions() });
  const address = searchParams.get("address");
  if (!isAddress(address)) return fail(400, "Pass ?versions=1 or ?address=0x…");
  const row = getVerified(address);
  if (!row) return fail(404, "Contract source code not verified");
  return Response.json({ ok: true, contract: { ...row, abi: row.abi ? JSON.parse(row.abi) : null } });
}

function pickContract(contracts, wanted) {
  const [file, name] = wanted.includes(":") ? [wanted.slice(0, wanted.lastIndexOf(":")), wanted.slice(wanted.lastIndexOf(":") + 1)] : [null, wanted];
  return contracts.filter((c) => c.name === name && (!file || c.file === file));
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "Request body must be JSON");
  }

  const address = String(body.address || "").trim().toLowerCase();
  const compilerType = body.compilerType === "standard-json" ? "standard-json" : "single";
  const version = String(body.compilerVersion || "").trim();
  const contractName = String(body.contractName || "").trim();
  const evmVersion = EVM_VERSIONS.includes(body.evmVersion) ? body.evmVersion : "default";
  const runs = Math.max(1, Math.min(2 ** 32 - 1, Number.parseInt(body.runs, 10) || 200));
  const constructorArgs = String(body.constructorArgs || "").trim().replace(/^0x/i, "");

  if (!isAddress(address)) return fail(400, "Enter a valid contract address (0x followed by 40 hex characters).");
  if (!VERSION_PATTERN.test(version)) return fail(400, "Select a compiler version.");
  if (!/^[\w./:@-]+$/.test(contractName)) return fail(400, "Enter the contract name exactly as declared in the source.");
  if (!String(body.source || "").trim()) return fail(400, "Paste the contract source code.");
  if (constructorArgs && !/^[0-9a-fA-F]*$/.test(constructorArgs)) return fail(400, "Constructor arguments must be ABI-encoded hex.");
  if (getVerified(address)) return fail(409, "This contract's source code is already verified.", { address });

  let code;
  try {
    code = await rpc("eth_getCode", [address, "latest"]);
  } catch (error) {
    return fail(502, `Could not read bytecode from the node: ${error.message}`);
  }
  if (!code || code === "0x") return fail(400, `No contract bytecode found at ${address}. It is an externally owned account or the contract has not been deployed.`);

  let input;
  try {
    input = buildInput({
      compilerType,
      source: body.source,
      fileName: `${contractName.split(":").pop()}.sol`,
      optimization: body.optimization,
      runs,
      evmVersion,
    });
  } catch (error) {
    return fail(400, error.message);
  }

  let result;
  try {
    result = await compile(version, input);
  } catch (error) {
    return fail(500, `Compiler error: ${error.message}`);
  }
  if (result.errors.length) return fail(422, "Compilation failed.", { errors: result.errors, warnings: result.warnings });

  const candidates = pickContract(result.contracts, contractName);
  if (!candidates.length) {
    return fail(422, `Contract "${contractName}" was not found in the compiled output.`, {
      available: result.contracts.map((c) => `${c.file}:${c.name}`),
    });
  }

  let matched = null;
  let match = null;
  for (const candidate of candidates) {
    const deployed = candidate.evm?.deployedBytecode;
    match = compareBytecode(code, deployed?.object, deployed?.immutableReferences);
    if (match) {
      matched = candidate;
      break;
    }
  }
  if (!matched) {
    const compiledSize = (candidates[0].evm?.deployedBytecode?.object?.length || 0) / 2;
    return fail(
      422,
      "Bytecode mismatch: the compiled runtime bytecode does not match the bytecode deployed at this address. Check the compiler version, optimization, runs, EVM version and contract name.",
      { onchainSize: (code.length - 2) / 2, compiledSize }
    );
  }

  let args = constructorArgs;
  if (!args) {
    const creation = creationTx(address);
    const tx = creation ? await safeRpc("eth_getTransactionByHash", [creation.hash], null) : null;
    const initCode = (matched.evm?.bytecode?.object || "").toLowerCase();
    const txInput = (tx?.input || "").replace(/^0x/i, "").toLowerCase();
    if (initCode && txInput.length > initCode.length) args = txInput.slice(initCode.length);
  }

  const settings = input.settings || {};
  saveVerified({
    address,
    name: matched.name,
    compiler_version: version,
    compiler_type: compilerType,
    optimization: compilerType === "standard-json" ? Boolean(settings.optimizer?.enabled) : Boolean(body.optimization),
    runs: compilerType === "standard-json" ? (settings.optimizer?.runs ?? 200) : runs,
    evm_version: compilerType === "standard-json" ? settings.evmVersion || "default" : evmVersion,
    license: String(body.license || "").slice(0, 80) || null,
    source: compilerType === "standard-json" ? JSON.stringify(input) : String(body.source),
    abi: JSON.stringify(matched.abi || []),
    constructor_args: args || null,
    runtime_hash: runtimeHash(code),
    match_type: match,
  });

  return Response.json({ ok: true, address, name: matched.name, match, warnings: result.warnings });
}
