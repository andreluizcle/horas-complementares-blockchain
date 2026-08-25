/**
 * Gera uma keypair de devnet para o app e a acrescenta ao .env.
 * Nunca sobrescreve uma chave existente.
 *
 *   npm run keypair:new
 */
import "dotenv/config";
import { appendFileSync } from "node:fs";

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

if (process.env.APP_KEYPAIR_SECRET) {
  console.log("Já existe APP_KEYPAIR_SECRET no .env — nada a fazer.");
  console.log("Apague a variável se quiser mesmo gerar outra.");
  process.exit(0);
}

const keypair = Keypair.generate();
const hoje = new Date().toISOString().slice(0, 10);

appendFileSync(
  ".env",
  `\n# Keypair de devnet do app (gerada em ${hoje}). Server-only.\n` +
    `APP_KEYPAIR_SECRET=${bs58.encode(keypair.secretKey)}\n`,
);

console.log("✓ Keypair gravada no .env");
console.log(`Endereço público: ${keypair.publicKey.toBase58()}`);
console.log("\nAbasteça com SOL de devnet em https://faucet.solana.com");
