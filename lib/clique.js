import { keccak256, recoverAddress, size, slice, toRlp } from "viem";

const SEAL_LENGTH = 65;
const VANITY_LENGTH = 32;

function quantity(hex) {
  if (hex == null) return "0x";
  const value = BigInt(hex);
  if (value === 0n) return "0x";
  const digits = value.toString(16);
  return `0x${digits.length % 2 ? "0" : ""}${digits}`;
}

/**
 * Recovers the Clique PoA sealer of a block from its extraData signature.
 * Falls back to `miner` for non-Clique chains and the genesis block.
 */
export async function blockSigner(block) {
  const fallback = block.miner?.toLowerCase() || null;
  if (!block.extraData || Number(block.number) === 0) return fallback;
  const extraSize = size(block.extraData);
  if (extraSize < VANITY_LENGTH + SEAL_LENGTH) return fallback;

  const fields = [
    block.parentHash,
    block.sha3Uncles,
    block.miner,
    block.stateRoot,
    block.transactionsRoot,
    block.receiptsRoot,
    block.logsBloom,
    quantity(block.difficulty),
    quantity(block.number),
    quantity(block.gasLimit),
    quantity(block.gasUsed),
    quantity(block.timestamp),
    slice(block.extraData, 0, extraSize - SEAL_LENGTH),
    block.mixHash,
    block.nonce,
  ];
  if (block.baseFeePerGas != null) fields.push(quantity(block.baseFeePerGas));

  try {
    const signer = await recoverAddress({
      hash: keccak256(toRlp(fields)),
      signature: slice(block.extraData, extraSize - SEAL_LENGTH),
    });
    return signer.toLowerCase();
  } catch {
    return fallback;
  }
}
