import { getSettings } from "./settings";

export const config = {
  rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
  // RPC endpoint wallets connect to; RPC_URL is usually a private address only this server can reach.
  publicRpcUrl: process.env.PUBLIC_RPC_URL || "",
  get chainName() {
    return getSettings().chainName || process.env.CHAIN_NAME || "Nadcab Chain";
  },
  chainId: process.env.CHAIN_ID || "",
  get currency() {
    return getSettings().currencySymbol || process.env.CURRENCY_SYMBOL || "ETH";
  },
  get currencyName() {
    return getSettings().currencyName || process.env.CURRENCY_NAME || process.env.CURRENCY_SYMBOL || "Ether";
  },
  // Addresses funded in genesis; they hold balances before any transaction mentions them.
  genesisAccounts: (process.env.GENESIS_ACCOUNTS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => /^0x[0-9a-f]{40}$/.test(item)),
  dataDir: process.env.DATA_DIR || "./data",
};
