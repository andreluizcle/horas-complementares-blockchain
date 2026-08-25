/**
 * Mostra endereço, saldo e quantos mints ainda cabem na carteira do app.
 *
 *   npm run wallet:status
 */
import "dotenv/config";

import { getUmi } from "../src/lib/umi-core";
import { explorerAddressUrl } from "../src/lib/solana";

/** Custo aproximado de um mint Core: rent do ativo + taxa da transação. */
const CUSTO_POR_MINT_SOL = 0.0035;

async function main() {
  const umi = getUmi();
  const endereco = umi.identity.publicKey;
  const saldo = Number((await umi.rpc.getBalance(endereco)).basisPoints) / 1e9;

  console.log(`Carteira do app: ${endereco}`);
  console.log(`Saldo:           ${saldo} SOL de devnet`);
  console.log(`Explorer:        ${explorerAddressUrl(endereco)}`);
  console.log(
    `\nDá para emitir ~${Math.floor(saldo / CUSTO_POR_MINT_SOL)} credenciais ` +
      `(estimando ${CUSTO_POR_MINT_SOL} SOL por mint).`,
  );

  if (saldo === 0) {
    console.log("\nAbasteça em https://faucet.solana.com");
  }
  if (process.env.COLLECTION_ADDRESS) {
    console.log(`\nCollection: ${process.env.COLLECTION_ADDRESS}`);
  } else {
    console.log("\nCollection ainda não criada — rode `npm run collection:create`.");
  }
}

main().catch((erro) => {
  console.error("Falhou:", erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
