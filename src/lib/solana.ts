import { clusterApiUrl } from "@solana/web3.js";

/**
 * Devnet é fixo de propósito. Este é um MVP de portfólio: nenhuma taxa é paga
 * com dinheiro real, então não existe caminho de configuração para mainnet.
 */
export const SOLANA_NETWORK = "devnet" as const;

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl(SOLANA_NETWORK);

export function explorerAddressUrl(address: string) {
  return `https://explorer.solana.com/address/${address}?cluster=${SOLANA_NETWORK}`;
}

export function explorerTxUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_NETWORK}`;
}

/** Encurta um endereço base58 para exibição: `7xKX...9fWq`. */
export function shortenAddress(address: string, chars = 4) {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
