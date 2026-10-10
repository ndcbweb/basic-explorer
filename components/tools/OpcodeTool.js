"use client";

import { useState } from "react";
import CopyButton from "@/components/CopyButton";
import { disassemble } from "./opcodes";
import { FieldLabel, Notice, OutputBox } from "./shared";

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export default function OpcodeTool() {
  const [input, setInput] = useState("");
  const [state, setState] = useState({ status: "idle" });

  const run = async (event) => {
    event.preventDefault();
    const value = input.trim();
    setState({ status: "loading" });
    try {
      let code = value;
      let source = null;
      if (ADDRESS.test(value)) {
        const res = await fetch(`/api/tools/code?address=${value}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        if (json.code === "0x") throw new Error("That address has no contract code (it is an externally owned account or self-destructed).");
        code = json.code;
        source = value.toLowerCase();
      }
      const result = disassemble(code);
      if (!result.count) throw new Error("Enter bytecode or a contract address.");
      setState({ status: "done", ...result, source, text: result.lines.join("\n") });
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={run} className="space-y-5">
        <div>
          <FieldLabel htmlFor="op-input" hint="bytecode hex or a contract address">
            Bytecode
          </FieldLabel>
          <textarea
            id="op-input"
            rows={6}
            spellCheck={false}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="0x6080604052… or 0x<contract address>"
            className="field font-mono text-[13px]"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={state.status === "loading" || !input.trim()}>
          {state.status === "loading" ? "Decoding…" : "Decode"}
        </button>
      </form>

      {state.status === "error" && <Notice tone="bad">{state.message}</Notice>}
      {state.status === "done" && (
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="text-sm text-muted">
              {state.source && <span className="mono mr-2 text-ink">{state.source}</span>}
              {state.size.toLocaleString("en-US")} bytes · {state.count.toLocaleString("en-US")} instructions
            </span>
            <CopyButton value={state.text} label="Copy opcodes" />
          </div>
          <OutputBox className="max-h-[36rem] !break-normal !whitespace-pre">{state.text}</OutputBox>
        </div>
      )}
    </div>
  );
}
