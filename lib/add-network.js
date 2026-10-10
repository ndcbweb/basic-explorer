/** Asks the browser wallet to add (or switch to) this chain. Resolves false if the user dismissed it. */
export async function addNetworkToWallet({ chainId, chainName, currency, currencyName, rpcUrl }) {
  if (!window.ethereum) throw new Error("Install MetaMask or another EVM wallet to add this network.");
  const url = rpcUrl || `${window.location.protocol}//${window.location.hostname}:8545`;
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${Number(chainId).toString(16)}`,
          chainName,
          nativeCurrency: { name: currencyName || currency, symbol: currency, decimals: 18 },
          rpcUrls: [url],
          blockExplorerUrls: [window.location.origin],
        },
      ],
    });
    return true;
  } catch (error) {
    if (error?.code === 4001) return false;
    throw new Error(error?.message || "The wallet could not add this network.");
  }
}
