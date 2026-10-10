"use client";

import Link from "next/link";
import { useState } from "react";
import { decodeFunctionData, toFunctionSelector } from "viem";
import CopyButton from "@/components/CopyButton";
import { FieldLabel, Notice, OutputBox, displayValue, formatType, functionSignature, hexToUtf8, parseFunctions } from "./shared";

const HASH = /^0x[0-9a-fA-F]{64}$/;

function words(data) {
  const body = data.slice(10);
  const out = [];
  for (let i = 0; i < body.length; i += 64) out.push(body.slice(i, i + 64));
  return out;
}

export default function InputDataDecoder() {
  const [input, setInput] = useState("");
  const [abiText, setAbiText] = useState("");
  const [state, setState] = useState({ status: "idle" });

  const decode = async (event) => {
    event.preventDefault();
    let data = input.trim();
    let tx = null;
    setState({ status: "loading" });
    try {
      if (HASH.test(data)) {
        const res = await fetch(`/api/tools/tx-input?hash=${data}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        tx = json;
        data = json.input;
      }
      if (!/^0x([0-9a-fA-F]{2})*$/.test(data)) throw new Error("Input data must be 0x-prefixed hex with an even number of digits, or a transaction hash.");
      const result = { status: "done", data, tx, selector: data.length >= 10 ? data.slice(0, 10).toLowerCase() : null };
      if (abiText.trim() && result.selector) {
        const fns = parseFunctions(abiText);
        const fn = fns.find((item) => toFunctionSelector(functionSignature(item)) === result.selector);
        if (!fn) {
          result.decodeError = `No function in the ABI matches selector ${result.selector}.`;
        } else {
          try {
            const decoded = decodeFunctionData({ abi: [fn], data });
            result.fn = fn;
            result.args = decoded.args || [];
          } catch (error) {
            result.decodeError = error.shortMessage || error.message;
          }
        }
      }
      setState(result);
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  };

  const utf8 = state.status === "done" ? hexToUtf8(state.data) : "";

  return (
    <div className="space-y-5">
      <form onSubmit={decode} className="space-y-5">
        <div>
          <FieldLabel htmlFor="dec-data" hint="calldata hex or a transaction hash">
            Input data
          </FieldLabel>
          <textarea
            id="dec-data"
            rows={5}
            spellCheck={false}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="0xa9059cbb000000000000000000000000… or 0x<tx hash>"
            className="field font-mono text-[13px]"
          />
        </div>
        <div>
          <FieldLabel htmlFor="dec-abi" hint="optional — JSON ABI or signatures, one per line">
            ABI / Function signature
          </FieldLabel>
          <textarea
            id="dec-abi"
            rows={4}
            spellCheck={false}
            value={abiText}
            onChange={(event) => setAbiText(event.target.value)}
            placeholder="transfer(address to, uint256 amount)"
            className="field font-mono text-[13px]"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={state.status === "loading" || !input.trim()}>
          {state.status === "loading" ? "Decoding…" : "Decode"}
        </button>
      </form>

      {state.status === "error" && <Notice tone="bad">{state.message}</Notice>}

      {state.status === "done" && (
        <div className="space-y-5">
          {state.tx && (
            <p className="text-sm text-muted">
              Loaded input of transaction{" "}
              <Link href={`/tx/${state.tx.hash}`} className="mono break-all">
                {state.tx.hash}
              </Link>
            </p>
          )}

          {state.fn && (
            <div className="overflow-hidden rounded-lg border border-line">
              <div className="border-b border-line bg-subtle px-4 py-2.5 font-mono text-[13px] text-ink">
                Function: {functionSignature(state.fn)} <span className="text-muted">({state.selector})</span>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Name</th>
                      <th scope="col">Type</th>
                      <th scope="col">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.fn.inputs.map((param, i) => (
                      <tr key={i}>
                        <td className="text-muted">{i}</td>
                        <td>{param.name || `arg${i}`}</td>
                        <td className="mono text-muted">{formatType(param)}</td>
                        <td className="mono !whitespace-pre-wrap break-all">
                          {param.type === "address" ? (
                            <Link href={`/address/${state.args[i]}`}>{state.args[i]}</Link>
                          ) : (
                            displayValue(state.args[i])
                          )}
                        </td>
                      </tr>
                    ))}
                    {!state.fn.inputs.length && (
                      <tr>
                        <td colSpan={4} className="text-muted">
                          This function takes no arguments.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {state.decodeError && <Notice tone="bad">{state.decodeError}</Notice>}
          {!abiText.trim() && state.selector && (
            <Notice>Add an ABI or function signature to decode the arguments. The raw words are shown below.</Notice>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">Raw data</span>
              <CopyButton value={state.data} label="Copy input data" />
            </div>
            <OutputBox>
              {state.data === "0x"
                ? "0x (empty)"
                : state.selector
                  ? [`MethodID: ${state.selector}`, ...words(state.data).map((word, i) => `[${i}]: ${word}`)].join("\n")
                  : state.data}
            </OutputBox>
          </div>

          <div>
            <div className="mb-1.5 text-sm font-medium text-ink">UTF-8 view</div>
            <OutputBox>{utf8 || "—"}</OutputBox>
          </div>
        </div>
      )}
    </div>
  );
}
