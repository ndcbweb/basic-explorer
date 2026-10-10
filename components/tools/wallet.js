export function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No browser wallet found. Install MetaMask (or another EIP-1193 wallet) and reload the page.");
  }
  return window.ethereum;
}

export async function connectWallet() {
  const provider = getProvider();
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!accounts?.length) throw new Error("The wallet did not return an account.");
  return accounts[0].toLowerCase();
}

/** Asks the wallet to switch to the explorer's chain; a no-op when no chain ID is configured. */
export async function ensureChain(chainId) {
  if (!chainId) return;
  const provider = getProvider();
  const wanted = `0x${BigInt(chainId).toString(16)}`;
  const current = await provider.request({ method: "eth_chainId" });
  if (current?.toLowerCase() === wanted) return;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: wanted }] });
  } catch {
    throw new Error(`Switch your wallet to chain ID ${chainId} and try again.`);
  }
}

export function walletError(error) {
  if (error?.code === 4001) return "Request rejected in the wallet.";
  return error?.shortMessage || error?.message || String(error);
}
