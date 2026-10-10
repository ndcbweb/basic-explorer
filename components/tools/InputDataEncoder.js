"use client";

import { useMemo, useState } from "react";
import { encodeFunctionData, toFunctionSelector } from "viem";
import CopyButton from "@/components/CopyButton";
import { FieldLabel, Notice, OutputBox, coerceArg, formatType, functionSignature, isComplexType, parseFunctions } from "./shared";

const EXAMPLE = "transfer(address to, uint256 amount)";

function placeholderFor(param) {
  if (param.type.endsWith("]")) return 'JSON array, e.g. ["0x…", "0x…"]';
  if (param.type.startsWith("tuple")) return "JSON array or object for the struct";
  if (param.type === "address") return "0x…";
  if (param.type === "bool") return "true / false";
  if (param.type.startsWith("bytes")) return "0x…";
  if (/int/.test(param.type)) return "Integer (decimal or 0x hex)";
  return "Text";
}

export default function InputDataEncoder() {
  const [abiText, setAbiText] = useState(EXAMPLE);
  const [selected, setSelected] = useState(0);
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);

  const parsed = useMemo(() => {
    try {
      return { fns: parseFunctions(abiText) };
    } catch (error) {
      return { error: error.message, fns: [] };
    }
  }, [abiText]);

  const fn = parsed.fns[Math.min(selected, parsed.fns.length - 1)];

  const changeAbi = (text) => {
    setAbiText(text);
    setSelected(0);
    setValues({});
    setResult(null);
  };

  const encode = (event) => {
    event.preventDefault();
    if (!fn) return;
    try {
      const args = fn.inputs.map((param, i) => {
        const raw = values[i] ?? "";
        try {
          return coerceArg(param, raw);
        } catch (error) {
          throw new Error(`Argument ${i + 1}${param.name ? ` (${param.name})` : ""}: ${error.message.replace(/^[^:]*: /, "")}`);
        }
      });
      const data = encodeFunctionData({ abi: [fn], functionName: fn.name, args });
      setResult({ data });
    } catch (error) {
      setResult({ error: error.shortMessage || error.message });
    }
  };

  return (
    <form onSubmit={encode} className="space-y-5">
      <div>
        <FieldLabel htmlFor="enc-abi" hint="JSON ABI or one signature per line">
          ABI / Function signature
        </FieldLabel>
        <textarea
          id="enc-abi"
          rows={5}
          spellCheck={false}
          value={abiText}
          onChange={(event) => changeAbi(event.target.value)}
          placeholder='transfer(address,uint256) or [{"type":"function","name":"transfer",...}]'
          className="field font-mono text-xs"
        />
        {parsed.error && <p className="mt-1.5 text-sm text-bad-700">{parsed.error}</p>}
      </div>

      {parsed.fns.length > 0 && (
        <div>
          <FieldLabel htmlFor="enc-fn">Function</FieldLabel>
          <select
            id="enc-fn"
            value={selected}
            onChange={(event) => {
              setSelected(Number(event.target.value));
              setValues({});
              setResult(null);
            }}
            className="field font-mono text-xs"
          >
            {parsed.fns.map((item, i) => (
              <option key={`${functionSignature(item)}-${i}`} value={i}>
                {functionSignature(item)} — {toFunctionSelector(functionSignature(item))}
              </option>
            ))}
          </select>
        </div>
      )}

      {fn && fn.inputs.length > 0 && (
        <fieldset className="space-y-3 rounded-lg border border-line p-4">
          <legend className="px-1 text-sm font-medium text-ink">Arguments</legend>
          {fn.inputs.map((param, i) => {
            const id = `enc-arg-${i}`;
            const label = (
              <>
                {param.name || `arg${i}`} <span className="font-mono text-xs text-muted">{formatType(param)}</span>
              </>
            );
            return (
              <div key={id}>
                <FieldLabel htmlFor={id}>{label}</FieldLabel>
                {isComplexType(param.type) ? (
                  <textarea
                    id={id}
                    rows={3}
                    spellCheck={false}
                    value={values[i] ?? ""}
                    onChange={(event) => setValues({ ...values, [i]: event.target.value })}
                    placeholder={placeholderFor(param)}
                    className="field font-mono text-xs"
                  />
                ) : (
                  <input
                    id={id}
                    spellCheck={false}
                    value={values[i] ?? ""}
                    onChange={(event) => setValues({ ...values, [i]: event.target.value })}
                    placeholder={placeholderFor(param)}
                    className="field font-mono text-xs"
                  />
                )}
              </div>
            );
          })}
        </fieldset>
      )}

      <button type="submit" className="btn-primary" disabled={!fn}>
        Encode
      </button>

      {result?.error && <Notice tone="bad">{result.error}</Notice>}
      {result?.data && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">
              Encoded calldata <span className="font-normal text-faint">({(result.data.length - 2) / 2} bytes)</span>
            </span>
            <CopyButton value={result.data} label="Copy calldata" />
          </div>
          <OutputBox>{result.data}</OutputBox>
        </div>
      )}
    </form>
  );
}
