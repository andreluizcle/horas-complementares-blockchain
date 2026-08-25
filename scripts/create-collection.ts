/**
 * Cria — uma única vez — a Core Collection que serve de carimbo do emissor.
 * Todo ativo mintado pelo app entra nela, e é por ela que a DAS API filtra
 * "o que este app emitiu" nas fases 4 e 5.
 *
 *   npm run collection:create
 */
import "dotenv/config";

import { createCollection } from "@metaplex-foundation/mpl-core";
import { generateSigner } from "@metaplex-foundation/umi";

import { getUmi } from "../src/lib/umi-core";
import { explorerAddressUrl } from "../src/lib/solana";

async function main() {
  if (process.env.COLLECTION_ADDRESS) {
    console.log(
      `COLLECTION_ADDRESS já existe no .env (${process.env.COLLECTION_ADDRESS}).`,
    );
    console.log("Apague a variável se quiser mesmo criar outra collection.");
    return;
  }

  const umi = getUmi();
  const saldo = await umi.rpc.getBalance(umi.identity.publicKey);
  console.log(`Carteira do app: ${umi.identity.publicKey}`);
  console.log(`Saldo: ${Number(saldo.basisPoints) / 1e9} SOL de devnet`);

  if (saldo.basisPoints === 0n) {
    console.error(
      "\nSaldo zerado. Abasteça a carteira em https://faucet.solana.com antes de continuar.",
    );
    process.exit(1);
  }

  const collection = generateSigner(umi);
  console.log(`\nCriando collection ${collection.publicKey}...`);

  await createCollection(umi, {
    collection,
    name: "Horas Complementares",
    uri: `${process.env.APP_URL ?? "http://localhost:3000"}/api/metadata/collection`,
  }).sendAndConfirm(umi);

  console.log("\n✓ Collection criada.");
  console.log(explorerAddressUrl(collection.publicKey));
  console.log(`\nCole no .env:\n\nCOLLECTION_ADDRESS=${collection.publicKey}\n`);
}

main().catch((erro) => {
  console.error("\nFalhou:", erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
