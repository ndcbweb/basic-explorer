/** EVM opcodes through Cancun (incl. PUSH0, TLOAD/TSTORE, MCOPY, BLOBHASH, BLOBBASEFEE). */
const BASE = {
  0x00: "STOP",
  0x01: "ADD",
  0x02: "MUL",
  0x03: "SUB",
  0x04: "DIV",
  0x05: "SDIV",
  0x06: "MOD",
  0x07: "SMOD",
  0x08: "ADDMOD",
  0x09: "MULMOD",
  0x0a: "EXP",
  0x0b: "SIGNEXTEND",
  0x10: "LT",
  0x11: "GT",
  0x12: "SLT",
  0x13: "SGT",
  0x14: "EQ",
  0x15: "ISZERO",
  0x16: "AND",
  0x17: "OR",
  0x18: "XOR",
  0x19: "NOT",
  0x1a: "BYTE",
  0x1b: "SHL",
  0x1c: "SHR",
  0x1d: "SAR",
  0x20: "KECCAK256",
  0x30: "ADDRESS",
  0x31: "BALANCE",
  0x32: "ORIGIN",
  0x33: "CALLER",
  0x34: "CALLVALUE",
  0x35: "CALLDATALOAD",
  0x36: "CALLDATASIZE",
  0x37: "CALLDATACOPY",
  0x38: "CODESIZE",
  0x39: "CODECOPY",
  0x3a: "GASPRICE",
  0x3b: "EXTCODESIZE",
  0x3c: "EXTCODECOPY",
  0x3d: "RETURNDATASIZE",
  0x3e: "RETURNDATACOPY",
  0x3f: "EXTCODEHASH",
  0x40: "BLOCKHASH",
  0x41: "COINBASE",
  0x42: "TIMESTAMP",
  0x43: "NUMBER",
  0x44: "PREVRANDAO",
  0x45: "GASLIMIT",
  0x46: "CHAINID",
  0x47: "SELFBALANCE",
  0x48: "BASEFEE",
  0x49: "BLOBHASH",
  0x4a: "BLOBBASEFEE",
  0x50: "POP",
  0x51: "MLOAD",
  0x52: "MSTORE",
  0x53: "MSTORE8",
  0x54: "SLOAD",
  0x55: "SSTORE",
  0x56: "JUMP",
  0x57: "JUMPI",
  0x58: "PC",
  0x59: "MSIZE",
  0x5a: "GAS",
  0x5b: "JUMPDEST",
  0x5c: "TLOAD",
  0x5d: "TSTORE",
  0x5e: "MCOPY",
  0x5f: "PUSH0",
  0xa0: "LOG0",
  0xa1: "LOG1",
  0xa2: "LOG2",
  0xa3: "LOG3",
  0xa4: "LOG4",
  0xf0: "CREATE",
  0xf1: "CALL",
  0xf2: "CALLCODE",
  0xf3: "RETURN",
  0xf4: "DELEGATECALL",
  0xf5: "CREATE2",
  0xfa: "STATICCALL",
  0xfd: "REVERT",
  0xfe: "INVALID",
  0xff: "SELFDESTRUCT",
};

export const OPCODES = { ...BASE };
for (let i = 1; i <= 32; i++) OPCODES[0x5f + i] = `PUSH${i}`;
for (let i = 1; i <= 16; i++) OPCODES[0x7f + i] = `DUP${i}`;
for (let i = 1; i <= 16; i++) OPCODES[0x8f + i] = `SWAP${i}`;

const hex = (n, width) => n.toString(16).padStart(width, "0");

/**
 * Disassembles bytecode into `[offset] OPCODE 0xdata` lines. Unknown bytes are shown as
 * `'xx'(Unknown Opcode)` and a truncated trailing PUSH keeps whatever bytes remain.
 */
export function disassemble(code) {
  const clean = code.trim().replace(/^0x/i, "").replace(/\s+/g, "");
  if (!clean) return { lines: [], count: 0 };
  if (/[^0-9a-fA-F]/.test(clean) || clean.length % 2) throw new Error("Bytecode must be hex with an even number of digits.");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);

  const lines = [];
  const width = Math.max(4, bytes.length.toString(16).length);
  let pc = 0;
  while (pc < bytes.length) {
    const op = bytes[pc];
    const name = OPCODES[op];
    const offset = `[${hex(pc, width)}]`;
    if (!name) {
      lines.push(`${offset} '${hex(op, 2)}'(Unknown Opcode)`);
      pc += 1;
      continue;
    }
    if (op >= 0x60 && op <= 0x7f) {
      const size = op - 0x5f;
      const data = Array.from(bytes.slice(pc + 1, pc + 1 + size), (b) => hex(b, 2)).join("");
      const truncated = data.length < size * 2 ? " (truncated)" : "";
      lines.push(`${offset} ${name} 0x${data}${truncated}`);
      pc += 1 + size;
      continue;
    }
    lines.push(`${offset} ${name}`);
    pc += 1;
  }
  return { lines, count: lines.length, size: bytes.length };
}
