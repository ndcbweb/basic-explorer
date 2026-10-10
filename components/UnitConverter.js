"use client";

import { useState } from "react";
import { formatUnits, parseUnits } from "viem";

const UNITS = [
  { name: "Wei", decimals: 0 },
  { name: "KWei", decimals: 3 },
  { name: "MWei", decimals: 6 },
  { name: "GWei", decimals: 9 },
  { name: "Szabo", decimals: 12 },
  { name: "Finney", decimals: 15 },
  { name: "Ether", decimals: 18 },
  { name: "KEther", decimals: 21 },
  { name: "MEther", decimals: 24 },
  { name: "GEther", decimals: 27 },
  { name: "TEther", decimals: 30 },
];

function display(wei, decimals) {
  const text = formatUnits(wei, decimals);
  return text.endsWith(".0") ? text.slice(0, -2) : text;
}

export default function UnitConverter({ currency }) {
  const [wei, setWei] = useState(10n ** 18n);
  const [editing, setEditing] = useState({ unit: null, text: "" });

  const change = (unit, text) => {
    setEditing({ unit: unit.name, text });
    const clean = text.trim().replace(/,/g, "");
    if (!clean) {
      setWei(0n);
      return;
    }
    if (!/^\d*\.?\d*$/.test(clean)) return;
    try {
      setWei(parseUnits(clean, unit.decimals));
    } catch {
      // keep the last valid value while typing
    }
  };

  return (
    <div className="divide-y divide-line">
      {UNITS.map((unit) => {
        const value = editing.unit === unit.name ? editing.text : display(wei, unit.decimals);
        const label = unit.name === "Ether" ? `Ether (${currency})` : unit.name;
        return (
          <div key={unit.name} className="grid items-center gap-2 py-3 sm:grid-cols-[1fr_200px]">
            <input
              id={`unit-${unit.name}`}
              inputMode="decimal"
              value={value}
              onChange={(event) => change(unit, event.target.value)}
              onBlur={() => setEditing({ unit: null, text: "" })}
              className="field font-mono"
              aria-label={label}
            />
            <label htmlFor={`unit-${unit.name}`} className="text-sm text-muted">
              <span className="font-medium text-ink">{label}</span>
              <span className="ml-2 text-xs text-faint">10^{unit.decimals}</span>
            </label>
          </div>
        );
      })}
    </div>
  );
}
