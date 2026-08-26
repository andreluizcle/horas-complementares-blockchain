import "server-only";

import { heliusRpcUrl, getCollectionAddress } from "./umi-core";

/**
 * Erro de comunicação com a DAS API. Existe separado para a rota conseguir
 * distinguir "o RPC falhou" de "a carteira não tem credenciais" — o segundo
 * não é erro, e nunca deve ser mostrado como se fosse.
 */
export class DasError extends Error {}

/** Uma credencial já traduzida do formato da DAS para o domínio do app. */
export type CredencialOnChain = {
  assetId: string;
  nome: string;
  categoria: string;
  cargaHoraria: number;
  data: string;
  emissor: string;
  atividadeId: string | null;
  frozen: boolean;
};

type AtributoDas = { key?: string; value?: string };

type ItemDas = {
  id: string;
  burnt?: boolean;
  content?: { metadata?: { name?: string } };
  plugins?: {
    attributes?: { data?: { attribute_list?: AtributoDas[] } };
    permanent_freeze_delegate?: { data?: { frozen?: boolean } };
  };
};

async function chamarDas<T>(method: string, params: unknown): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(heliusRpcUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "horas", method, params }),
      cache: "no-store",
    });
  } catch {
    throw new DasError(
      "Não foi possível falar com o RPC da Solana. Verifique sua conexão e tente de novo.",
    );
  }

  if (!resposta.ok) {
    // As mensagens são escritas para quem está na tela, que costuma ser o
    // aluno: dizer "erro 401" não ajuda ninguém a resolver nada.
    if (resposta.status === 429) {
      throw new DasError(
        "O RPC está limitando as consultas no momento. Espere alguns segundos e tente de novo.",
      );
    }
    if (resposta.status === 401 || resposta.status === 403) {
      throw new DasError(
        "O RPC recusou o acesso. Avise quem organiza: a chave de API do RPC está inválida ou expirada.",
      );
    }
    if (resposta.status >= 500) {
      throw new DasError(
        "O RPC da Solana está fora do ar no momento. Tente de novo em alguns instantes.",
      );
    }
    throw new DasError(`O RPC respondeu com erro ${resposta.status}.`);
  }

  const corpo = await resposta.json();
  if (corpo.error) {
    throw new DasError(corpo.error.message ?? "O RPC recusou a consulta.");
  }
  return corpo.result as T;
}

function lerAtributos(item: ItemDas) {
  const lista = item.plugins?.attributes?.data?.attribute_list ?? [];
  const mapa = new Map<string, string>();
  for (const a of lista) {
    if (a.key) mapa.set(a.key, a.value ?? "");
  }
  return mapa;
}

/**
 * Traduz um item da DAS para o domínio. Os dados vêm dos Attributes on-chain,
 * não do JSON off-chain — é o que torna a credencial verificável mesmo se o
 * servidor de metadados sair do ar.
 */
function paraCredencial(item: ItemDas): CredencialOnChain {
  const attrs = lerAtributos(item);
  const horas = Number.parseInt(attrs.get("cargaHoraria") ?? "", 10);

  return {
    assetId: item.id,
    nome: item.content?.metadata?.name ?? "Credencial sem nome",
    categoria: attrs.get("categoria") ?? "Outro",
    cargaHoraria: Number.isFinite(horas) ? horas : 0,
    data: attrs.get("data") ?? "",
    emissor: attrs.get("emissor") ?? "Emissor não informado",
    atividadeId: attrs.get("atividadeId") ?? null,
    frozen: item.plugins?.permanent_freeze_delegate?.data?.frozen ?? false,
  };
}

/** Ordena da mais recente para a mais antiga, lendo `dd/mm/aaaa`. */
function ordenarPorDataDesc(a: CredencialOnChain, b: CredencialOnChain) {
  const iso = (d: string) => d.split("/").reverse().join("-");
  return iso(b.data).localeCompare(iso(a.data));
}

const LIMITE_POR_PAGINA = 100;

/**
 * Busca todas as credenciais emitidas por este app que pertencem a `owner`.
 * O filtro por `grouping` na nossa collection é o que garante "emitidas por
 * este app" — não dá para forjar entrando numa collection alheia.
 */
export async function buscarCredenciaisDaCarteira(owner: string) {
  const collection = getCollectionAddress();
  const encontradas: CredencialOnChain[] = [];

  // A DAS pagina; sem o laço uma carteira com mais de 100 credenciais
  // mostraria um total de horas silenciosamente errado.
  for (let page = 1; ; page += 1) {
    const resultado = await chamarDas<{ items?: ItemDas[] }>("searchAssets", {
      ownerAddress: owner,
      grouping: ["collection", collection],
      interface: "MplCoreAsset",
      burnt: false,
      page,
      limit: LIMITE_POR_PAGINA,
    });

    const itens = resultado.items ?? [];
    encontradas.push(...itens.filter((i) => !i.burnt).map(paraCredencial));

    if (itens.length < LIMITE_POR_PAGINA) break;
  }

  return encontradas.sort(ordenarPorDataDesc);
}

/** Busca uma credencial específica pelo id do ativo. Usada na fase 5. */
export async function buscarCredencialPorId(assetId: string) {
  const collection = getCollectionAddress();
  const item = await chamarDas<ItemDas & { grouping?: { group_key: string; group_value: string }[]; ownership?: { owner?: string } }>(
    "getAsset",
    { id: assetId },
  );

  const daNossaCollection = (item.grouping ?? []).some(
    (g) => g.group_key === "collection" && g.group_value === collection,
  );
  if (!daNossaCollection) return null;

  return {
    ...paraCredencial(item),
    owner: item.ownership?.owner ?? null,
  };
}
