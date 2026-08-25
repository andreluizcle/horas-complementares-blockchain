import { NextResponse } from "next/server";
import { z } from "zod";
import { create, fetchCollection } from "@metaplex-foundation/mpl-core";
import { generateSigner, publicKey } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { PublicKey } from "@solana/web3.js";

import { prisma } from "@/lib/prisma";
import { ConfigError, getCollectionAddress, getUmi } from "@/lib/umi";
import { formatarData, labelDaCategoria } from "@/lib/activity";

/** Rent do ativo + taxa. Abaixo disso o mint falha por saldo insuficiente. */
const CUSTO_MINIMO_LAMPORTS = 3_500_000n;

const bodySchema = z.object({
  activityId: z.string().min(1),
  ownerWallet: z
    .string()
    .refine((valor) => {
      try {
        return PublicKey.isOnCurve(new PublicKey(valor));
      } catch {
        return false;
      }
    }, "Endereço de carteira Solana inválido."),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erro(400, "Corpo da requisição inválido.");
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return erro(400, "Dados inválidos para emitir a credencial.");
  }
  const { activityId, ownerWallet } = parsed.data;

  const atividade = await prisma.activity.findUnique({
    where: { id: activityId },
  });
  if (!atividade) {
    return erro(404, "Esta atividade não existe ou foi removida.");
  }

  // O banco tem unique(activityId, ownerWallet), mas checar antes evita
  // gastar uma transação para depois descobrir que é duplicata.
  const jaEmitida = await prisma.credential.findUnique({
    where: { activityId_ownerWallet: { activityId, ownerWallet } },
  });
  if (jaEmitida) {
    return NextResponse.json(
      {
        error: "Esta carteira já recebeu a credencial desta atividade.",
        assetId: jaEmitida.assetId,
        signature: jaEmitida.signature,
        duplicada: true,
      },
      { status: 409 },
    );
  }

  let umi;
  let collectionAddress;
  try {
    umi = getUmi();
    collectionAddress = getCollectionAddress();
  } catch (e) {
    if (e instanceof ConfigError) return erro(500, e.message);
    throw e;
  }

  // Sem saldo o erro do RPC é críptico; melhor detectar e explicar.
  const saldo = await umi.rpc.getBalance(umi.identity.publicKey);
  if (saldo.basisPoints < CUSTO_MINIMO_LAMPORTS) {
    return erro(
      503,
      "A carteira emissora está sem SOL de devnet. Avise o organizador para " +
        "abastecê-la em faucet.solana.com antes de tentar de novo.",
    );
  }

  const asset = generateSigner(umi);
  const origem = new URL(request.url).origin;

  try {
    const collection = await fetchCollection(umi, publicKey(collectionAddress));

    const { signature } = await create(umi, {
      asset,
      collection,
      // O aluno vira dono direto; quem paga e assina é a carteira do app.
      owner: publicKey(ownerWallet),
      name: atividade.nome,
      uri: `${origem}/api/metadata/${atividade.id}`,
      plugins: [
        {
          // Fonte de verdade da verificação pública: fica on-chain e não
          // depende deste servidor continuar existindo.
          type: "Attributes",
          attributeList: [
            { key: "categoria", value: labelDaCategoria(atividade.categoria) },
            { key: "cargaHoraria", value: String(atividade.cargaHoraria) },
            { key: "data", value: formatarData(atividade.data) },
            { key: "emissor", value: atividade.emissor },
            { key: "atividadeId", value: atividade.id },
          ],
        },
        {
          // Credencial é intransferível: congelada permanentemente, ninguém
          // vende nem repassa horas complementares para outro aluno.
          type: "PermanentFreezeDelegate",
          frozen: true,
          authority: { type: "UpdateAuthority" },
        },
      ],
    }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

    // O Umi devolve a assinatura como bytes; o Explorer espera base58.
    const assinaturaBase58 = base58.deserialize(signature)[0];

    const credencial = await prisma.credential.create({
      data: {
        assetId: asset.publicKey,
        activityId: atividade.id,
        ownerWallet,
        signature: assinaturaBase58,
      },
    });

    return NextResponse.json(
      {
        assetId: credencial.assetId,
        signature: credencial.signature,
        mintedAt: credencial.mintedAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("Falha ao mintar credencial:", e);
    const mensagem = e instanceof Error ? e.message : String(e);

    if (/insufficient|not enough|0x1\b/i.test(mensagem)) {
      return erro(
        503,
        "A carteira emissora ficou sem SOL de devnet no meio da emissão. " +
          "Tente novamente depois de abastecê-la.",
      );
    }
    if (/blockhash|timeout|expired/i.test(mensagem)) {
      return erro(
        504,
        "A transação não confirmou a tempo na devnet. Tente novamente — se a " +
          "credencial tiver sido emitida, ela aparecerá em Minhas credenciais.",
      );
    }
    return erro(
      502,
      "Não foi possível emitir a credencial na blockchain. Tente novamente " +
        "em instantes.",
    );
  }
}

function erro(status: number, mensagem: string) {
  return NextResponse.json({ error: mensagem }, { status });
}
