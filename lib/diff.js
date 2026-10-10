const MAX_CELLS = 25_000_000;

/**
 * Line diff via longest common subsequence. Returns [{ type: "same"|"add"|"del", text, a, b }]
 * where a/b are 1-based line numbers in the left/right input.
 */
export function diffLines(left, right) {
  const a = String(left ?? "").replace(/\r\n/g, "\n").split("\n");
  const b = String(right ?? "").replace(/\r\n/g, "\n").split("\n");

  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const out = [];
  for (let i = 0; i < start; i++) out.push({ type: "same", text: a[i], a: i + 1, b: i + 1 });

  const n = endA - start;
  const m = endB - start;
  if ((n + 1) * (m + 1) > MAX_CELLS) {
    for (let i = start; i < endA; i++) out.push({ type: "del", text: a[i], a: i + 1 });
    for (let j = start; j < endB; j++) out.push({ type: "add", text: b[j], b: j + 1 });
  } else {
    const width = m + 1;
    const table = new Uint32Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        table[i * width + j] =
          a[start + i] === b[start + j]
            ? table[(i + 1) * width + j + 1] + 1
            : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[start + i] === b[start + j]) {
        out.push({ type: "same", text: a[start + i], a: start + i + 1, b: start + j + 1 });
        i++;
        j++;
      } else if (i < n && (j >= m || table[(i + 1) * width + j] >= table[i * width + j + 1])) {
        out.push({ type: "del", text: a[start + i], a: start + i + 1 });
        i++;
      } else {
        out.push({ type: "add", text: b[start + j], b: start + j + 1 });
        j++;
      }
    }
  }

  for (let k = 0; k < a.length - endA; k++) out.push({ type: "same", text: a[endA + k], a: endA + k + 1, b: endB + k + 1 });
  return out;
}

export function diffStats(rows) {
  let added = 0;
  let removed = 0;
  for (const row of rows) {
    if (row.type === "add") added++;
    else if (row.type === "del") removed++;
  }
  return { added, removed, same: rows.length - added - removed };
}

const OPCODES = {
  0x00: "STOP", 0x01: "ADD", 0x02: "MUL", 0x03: "SUB", 0x04: "DIV", 0x05: "SDIV", 0x06: "MOD", 0x07: "SMOD",
  0x08: "ADDMOD", 0x09: "MULMOD", 0x0a: "EXP", 0x0b: "SIGNEXTEND", 0x10: "LT", 0x11: "GT", 0x12: "SLT", 0x13: "SGT",
  0x14: "EQ", 0x15: "ISZERO", 0x16: "AND", 0x17: "OR", 0x18: "XOR", 0x19: "NOT", 0x1a: "BYTE", 0x1b: "SHL",
  0x1c: "SHR", 0x1d: "SAR", 0x1e: "CLZ", 0x20: "KECCAK256", 0x30: "ADDRESS", 0x31: "BALANCE", 0x32: "ORIGIN",
  0x33: "CALLER", 0x34: "CALLVALUE", 0x35: "CALLDATALOAD", 0x36: "CALLDATASIZE", 0x37: "CALLDATACOPY",
  0x38: "CODESIZE", 0x39: "CODECOPY", 0x3a: "GASPRICE", 0x3b: "EXTCODESIZE", 0x3c: "EXTCODECOPY",
  0x3d: "RETURNDATASIZE", 0x3e: "RETURNDATACOPY", 0x3f: "EXTCODEHASH", 0x40: "BLOCKHASH", 0x41: "COINBASE",
  0x42: "TIMESTAMP", 0x43: "NUMBER", 0x44: "PREVRANDAO", 0x45: "GASLIMIT", 0x46: "CHAINID", 0x47: "SELFBALANCE",
  0x48: "BASEFEE", 0x49: "BLOBHASH", 0x4a: "BLOBBASEFEE", 0x50: "POP", 0x51: "MLOAD", 0x52: "MSTORE",
  0x53: "MSTORE8", 0x54: "SLOAD", 0x55: "SSTORE", 0x56: "JUMP", 0x57: "JUMPI", 0x58: "PC", 0x59: "MSIZE",
  0x5a: "GAS", 0x5b: "JUMPDEST", 0x5c: "TLOAD", 0x5d: "TSTORE", 0x5e: "MCOPY", 0x5f: "PUSH0", 0xa0: "LOG0",
  0xa1: "LOG1", 0xa2: "LOG2", 0xa3: "LOG3", 0xa4: "LOG4", 0xf0: "CREATE", 0xf1: "CALL", 0xf2: "CALLCODE",
  0xf3: "RETURN", 0xf4: "DELEGATECALL", 0xf5: "CREATE2", 0xfa: "STATICCALL", 0xfd: "REVERT", 0xfe: "INVALID",
  0xff: "SELFDESTRUCT",
};

/** Disassembles runtime bytecode into one opcode per line (no offsets, so insertions diff cleanly). */
export function disassemble(hex) {
  const code = String(hex || "").replace(/^0x/i, "");
  const lines = [];
  for (let i = 0; i < code.length; i += 2) {
    const op = Number.parseInt(code.slice(i, i + 2), 16);
    if (op >= 0x60 && op <= 0x7f) {
      const size = op - 0x5f;
      lines.push(`PUSH${size} 0x${code.slice(i + 2, i + 2 + size * 2)}`);
      i += size * 2;
    } else if (op >= 0x80 && op <= 0x8f) {
      lines.push(`DUP${op - 0x7f}`);
    } else if (op >= 0x90 && op <= 0x9f) {
      lines.push(`SWAP${op - 0x8f}`);
    } else {
      lines.push(OPCODES[op] || `UNKNOWN 0x${code.slice(i, i + 2)}`);
    }
  }
  return lines.join("\n");
}
