import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, type Umi } from "@metaplex-foundation/umi";
import { mplCore } from "@metaplex-foundation/mpl-core";
import bs58 from "bs58";

import { SOLANA_NETWORK } from "@/lib/solana";

/**
 * Carrega a chave privada que paga as taxas de mint.
 *
 * Código da aplicação deve importar `@/lib/umi`, que embrulha este módulo com
 * `server-only` e quebra o build se alguém o puxar de um componente cliente.
 * Este arquivo existe separado porque `server-only` só funciona dentro do
 * bundler do Next — os scripts em `scripts/` rodam em Node puro e importam
 * daqui diretamente.
 */

export class ConfigError extends Error {}

/** RPC de devnet com DAS API. A chave nunca sai do servidor. */
export function heliusRpcUrl() {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    throw new ConfigError(
      "HELIUS_API_KEY não configurada. Copie .env.example para .env e preencha a chave.",
    );
  }
  return `https://${SOLANA_NETWORK}.helius-rpc.com/?api-key=${apiKey}`;
}

let cached: Umi | undefined;

/** Umi autenticado como a carteira do app, que assina e paga os mints. */
export function getUmi(): Umi {
  if (cached) return cached;

  const secret = process.env.APP_KEYPAIR_SECRET;
  if (!secret) {
    throw new ConfigError(
      "APP_KEYPAIR_SECRET não configurada. Rode `npm run keypair:new` para gerar uma.",
    );
  }

  let bytes: Uint8Array;
  try {
    bytes = bs58.decode(secret.trim());
  } catch {
    throw new ConfigError("APP_KEYPAIR_SECRET não é um base58 válido.");
  }
  if (bytes.length !== 64) {
    throw new ConfigError(
      `APP_KEYPAIR_SECRET deveria ter 64 bytes, tem ${bytes.length}.`,
    );
  }

  const umi = createUmi(heliusRpcUrl()).use(mplCore());
  const keypair = umi.eddsa.createKeypairFromSecretKey(bytes);
  cached = umi.use(keypairIdentity(keypair));
  return cached;
}

/** Endereço da Core Collection que carimba tudo que este app emitiu. */
export function getCollectionAddress() {
  const address = process.env.COLLECTION_ADDRESS;
  if (!address) {
    throw new ConfigError(
      "COLLECTION_ADDRESS não configurada. Rode `npm run collection:create` uma vez e cole o endereço no .env.",
    );
  }
  return address;
}
