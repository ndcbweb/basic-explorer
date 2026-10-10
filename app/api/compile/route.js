import { buildInput, compile, EVM_VERSIONS, listVersions, VERSION_PATTERN } from "@/lib/solc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_SOURCE = 2_000_000;

export async function GET() {
  return Response.json({ versions: await listVersions() });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Request body must be JSON" }, { status: 400 });
  }
  const version = String(body.compilerVersion || "").trim();
  if (!VERSION_PATTERN.test(version)) return Response.json({ ok: false, error: "Select a compiler version." }, { status: 400 });
  if (String(body.source || "").length > MAX_SOURCE) return Response.json({ ok: false, error: "Source is too large." }, { status: 413 });

  let input;
  try {
    input = buildInput({
      compilerType: body.compilerType === "standard-json" ? "standard-json" : "single",
      source: body.source,
      fileName: "Contract.sol",
      optimization: body.optimization,
      runs: Number.parseInt(body.runs, 10) || 200,
      evmVersion: EVM_VERSIONS.includes(body.evmVersion) ? body.evmVersion : "default",
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 400 });
  }

  try {
    const result = await compile(version, input);
    return Response.json({
      ok: result.errors.length === 0,
      compilerVersion: result.compilerVersion,
      errors: result.errors,
      warnings: result.warnings,
      contracts: result.contracts.map((c) => ({
        file: c.file,
        name: c.name,
        abi: c.abi || [],
        bytecode: c.evm?.bytecode?.object ? `0x${c.evm.bytecode.object}` : "0x",
        deployedBytecode: c.evm?.deployedBytecode?.object ? `0x${c.evm.deployedBytecode.object}` : "0x",
      })),
    });
  } catch (error) {
    return Response.json({ ok: false, error: `Compiler error: ${error.message}` }, { status: 500 });
  }
}
