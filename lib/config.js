export const config = {
  rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
  chainName: process.env.CHAIN_NAME || "Nadcab Chain",
  chainId: process.env.CHAIN_ID || "",
  currency: process.env.CURRENCY_SYMBOL || "ETH",
  dataDir: process.env.DATA_DIR || "./data",
};
