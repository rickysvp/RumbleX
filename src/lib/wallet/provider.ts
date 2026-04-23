import { BrowserProvider, Eip1193Provider, TransactionResponse } from "ethers";

export interface WalletIntent {
  to: string;
  data: string;
  value: string;
}

function getEthereumProvider(): Eip1193Provider {
  const provider = (window as Window & { ethereum?: unknown }).ethereum;
  if (!provider) {
    throw new Error("No EVM wallet found. Please install MetaMask or another wallet.");
  }
  return provider as Eip1193Provider;
}

async function getBrowserProvider() {
  return new BrowserProvider(getEthereumProvider());
}

export async function connectEvmWallet() {
  const provider = await getBrowserProvider();
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const balance = await provider.getBalance(address);

  return {
    address,
    balance: balance.toString(),
  };
}

export async function readWalletBalance(address: string): Promise<string> {
  const provider = await getBrowserProvider();
  const balance = await provider.getBalance(address);
  return balance.toString();
}

export async function sendIntentTransaction(intent: WalletIntent): Promise<TransactionResponse> {
  const provider = await getBrowserProvider();
  const signer = await provider.getSigner();

  return signer.sendTransaction({
    to: intent.to,
    data: intent.data,
    value: BigInt(intent.value || "0"),
  });
}
