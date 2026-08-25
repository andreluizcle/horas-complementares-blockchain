import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { novaAtividadeSchema } from "@/lib/activity";
import { serializarAtividade } from "@/lib/serializers";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  const parsed = novaAtividadeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos.",
        campos: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const { nome, categoria, cargaHoraria, data, emissor } = parsed.data;

  try {
    const atividade = await prisma.activity.create({
      data: {
        nome,
        categoria,
        cargaHoraria,
        // A data chega como `YYYY-MM-DD`; fixamos meia-noite UTC para que ela
        // volte exatamente igual na leitura, sem deslocamento de fuso.
        data: new Date(`${data}T00:00:00.000Z`),
        emissor,
      },
    });
    return NextResponse.json(serializarAtividade(atividade), { status: 201 });
  } catch (error) {
    console.error("Falha ao criar atividade:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar a atividade. Tente novamente." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const atividades = await prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { _count: { select: { credentials: true } } },
    });
    return NextResponse.json(
      atividades.map((a) => ({
        ...serializarAtividade(a),
        credenciaisEmitidas: a._count.credentials,
      })),
    );
  } catch (error) {
    console.error("Falha ao listar atividades:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as atividades." },
      { status: 500 },
    );
  }
}
