"use client";

import { useState } from "react";
import DiffView from "./DiffView";
import { diffLines } from "@/lib/diff";

export default function DiffPasteForm() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [rows, setRows] = useState(null);

  const submit = (event) => {
    event.preventDefault();
    setRows(diffLines(left, right));
  };

  return (
    <div>
      <form onSubmit={submit} className="space-y-4 p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="diff-left" className="mb-1.5 block text-sm font-medium text-ink">
              Source A
            </label>
            <textarea id="diff-left" value={left} onChange={(e) => setLeft(e.target.value)} rows={14} spellCheck={false} className="field font-mono text-[13px]" />
          </div>
          <div>
            <label htmlFor="diff-right" className="mb-1.5 block text-sm font-medium text-ink">
              Source B
            </label>
            <textarea id="diff-right" value={right} onChange={(e) => setRight(e.target.value)} rows={14} spellCheck={false} className="field font-mono text-[13px]" />
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={!left && !right}>
          Compare
        </button>
      </form>
      {rows && (
        <div className="border-t border-line">
          <DiffView rows={rows} leftLabel="A" rightLabel="B" />
        </div>
      )}
    </div>
  );
}
