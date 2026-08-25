import type { ActivityModel } from "@/generated/prisma/models";

/** Formato de uma atividade enviado ao cliente (datas como string ISO curta). */
export type AtividadeDTO = {
  id: string;
  nome: string;
  categoria: string;
  cargaHoraria: number;
  data: string;
  emissor: string;
  createdAt: string;
};

export function serializarAtividade(atividade: ActivityModel): AtividadeDTO {
  return {
    id: atividade.id,
    nome: atividade.nome,
    categoria: atividade.categoria,
    cargaHoraria: atividade.cargaHoraria,
    data: atividade.data.toISOString().slice(0, 10),
    emissor: atividade.emissor,
    createdAt: atividade.createdAt.toISOString(),
  };
}
