import { z } from "zod";

export const CATEGORIAS = [
  { value: "palestra", label: "Palestra" },
  { value: "curso", label: "Curso" },
  { value: "monitoria", label: "Monitoria" },
  { value: "extensao", label: "Evento de extensão" },
  { value: "outro", label: "Outro" },
] as const;

export type CategoriaValue = (typeof CATEGORIAS)[number]["value"];

const CATEGORIA_VALUES = CATEGORIAS.map((c) => c.value) as [
  CategoriaValue,
  ...CategoriaValue[],
];

export function labelDaCategoria(value: string) {
  return CATEGORIAS.find((c) => c.value === value)?.label ?? value;
}

/**
 * Validação compartilhada entre o formulário e a rota de API — o cliente usa
 * para dar feedback imediato, o servidor usa porque nunca se confia no cliente.
 */
export const novaAtividadeSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome da atividade (mínimo 3 caracteres).")
    .max(120, "O nome pode ter no máximo 120 caracteres."),
  categoria: z.enum(CATEGORIA_VALUES, {
    message: "Escolha uma categoria.",
  }),
  cargaHoraria: z.coerce
    .number()
    .int("A carga horária deve ser um número inteiro de horas.")
    .min(1, "A carga horária deve ser de pelo menos 1 hora.")
    .max(1000, "A carga horária parece alta demais (máximo 1000 horas)."),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data da atividade.")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida."),
  emissor: z
    .string()
    .trim()
    .min(2, "Informe quem está emitindo a credencial.")
    .max(120, "O emissor pode ter no máximo 120 caracteres."),
});

export type NovaAtividade = z.input<typeof novaAtividadeSchema>;

/** Formata `2026-03-14` (ou um Date) como `14/03/2026`, sem susto de fuso. */
export function formatarData(data: string | Date) {
  const iso = typeof data === "string" ? data : data.toISOString();
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/**
 * Aplica a máscara `dd/mm/aaaa` conforme o usuário digita, ignorando tudo que
 * não for dígito. Usado no formulário porque o `<input type="date">` nativo
 * renderiza no formato da locale do navegador, que não dá para controlar.
 */
export function mascararDataBr(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  const dia = digitos.slice(0, 2);
  const mes = digitos.slice(2, 4);
  const ano = digitos.slice(4, 8);
  return [dia, mes, ano].filter(Boolean).join("/");
}

/**
 * Converte `26/08/2026` em `2026-08-26`, ou devolve `null` se a data não
 * existir no calendário (31/02, mês 13, ano incompleto...).
 */
export function dataBrParaIso(valor: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor.trim());
  if (!m) return null;
  const [, dia, mes, ano] = m;
  const iso = `${ano}-${mes}-${dia}`;
  const d = new Date(`${iso}T00:00:00.000Z`);
  // Rejeita datas que o Date "conserta" sozinho, como 31/02 virando 03/03.
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) {
    return null;
  }
  return iso;
}

/** Converte `2026-08-26` em `26/08/2026` para preencher o campo mascarado. */
export function isoParaDataBr(iso: string) {
  return formatarData(iso);
}

export function formatarHoras(horas: number) {
  return `${horas} ${horas === 1 ? "hora" : "horas"}`;
}
