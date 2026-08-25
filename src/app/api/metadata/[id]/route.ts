import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { formatarData, formatarHoras, labelDaCategoria } from "@/lib/activity";

/**
 * Metadados off-chain apontados pelo `uri` do ativo Core — é daqui que
 * carteiras e exploradores tiram nome e imagem.
 *
 * Os dados que importam para a verificação (categoria, horas, data, emissor)
 * também vão on-chain no plugin Attributes, então a credencial continua
 * auditável mesmo que este endpoint saia do ar.
 */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/metadata/[id]">,
) {
  const { id } = await params;

  if (id === "collection") {
    return NextResponse.json({
      name: "Horas Complementares",
      description:
        "Credenciais de horas complementares emitidas na Solana devnet. Projeto de portfólio — sem valor real.",
      image: new URL("/api/metadata/collection/image", request.url).toString(),
      external_url: new URL("/verificar", request.url).toString(),
    });
  }

  const atividade = await prisma.activity.findUnique({ where: { id } });
  if (!atividade) {
    return NextResponse.json(
      { error: "Atividade não encontrada." },
      { status: 404 },
    );
  }

  const categoria = labelDaCategoria(atividade.categoria);

  return NextResponse.json({
    name: atividade.nome,
    symbol: "HORAS",
    description:
      `Credencial de horas complementares: ${categoria} de ` +
      `${formatarHoras(atividade.cargaHoraria)}, realizada em ` +
      `${formatarData(atividade.data)} e emitida por ${atividade.emissor}.`,
    image: new URL(`/api/metadata/${id}/image`, request.url).toString(),
    external_url: new URL(`/checkin/${id}`, request.url).toString(),
    attributes: [
      { trait_type: "Categoria", value: categoria },
      { trait_type: "Carga horária", value: String(atividade.cargaHoraria) },
      { trait_type: "Data", value: formatarData(atividade.data) },
      { trait_type: "Emissor", value: atividade.emissor },
    ],
  });
}
