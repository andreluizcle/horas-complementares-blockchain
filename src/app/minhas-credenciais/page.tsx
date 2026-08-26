"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Clock,
  ExternalLink,
  Lock,
  RefreshCw,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletButton } from "@/components/wallet-button";
import { explorerAddressUrl, shortenAddress } from "@/lib/solana";

type Credencial = {
  assetId: string;
  nome: string;
  categoria: string;
  cargaHoraria: number;
  data: string;
  emissor: string;
  atividadeId: string | null;
  frozen: boolean;
};

const TODAS = "__todas__";

type Resultado = {
  owner: string;
  credenciais: Credencial[] | null;
  erro: string | null;
};

/**
 * Busca as credenciais e **devolve** o resultado, sem tocar em estado. Manter
 * isso fora do componente deixa o efeito com um único `setState`, já depois do
 * await, e permite descartar respostas de uma carteira que não é mais a atual.
 */
async function carregarCredenciais(owner: string): Promise<Resultado> {
  try {
    const resposta = await fetch(
      `/api/credentials?owner=${encodeURIComponent(owner)}`,
      { cache: "no-store" },
    );
    const corpo = await resposta.json();
    if (!resposta.ok) {
      return {
        owner,
        credenciais: null,
        erro: corpo.error ?? "Não foi possível buscar suas credenciais.",
      };
    }
    return { owner, credenciais: corpo.credenciais as Credencial[], erro: null };
  } catch {
    return {
      owner,
      credenciais: null,
      erro: "Falha de conexão com o servidor. Verifique sua internet e tente de novo.",
    };
  }
}

export default function MinhasCredenciaisPage() {
  const { publicKey, connected } = useWallet();
  const endereco = publicKey?.toBase58() ?? null;

  // O resultado carrega o endereço que o originou. Sem isso, trocar de
  // carteira mostraria as credenciais da anterior até a nova busca terminar.
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [recarregando, setRecarregando] = useState(false);
  const [filtro, setFiltro] = useState<string>(TODAS);

  useEffect(() => {
    if (!endereco) return;
    let cancelado = false;
    void (async () => {
      const r = await carregarCredenciais(endereco);
      // Se a carteira mudou no meio da busca, o resultado velho é descartado.
      if (!cancelado) setResultado(r);
    })();
    return () => {
      cancelado = true;
    };
  }, [endereco]);

  // Só aceita o resultado se ele for da carteira que está conectada agora.
  const atual = resultado && resultado.owner === endereco ? resultado : null;
  const credenciais = atual?.credenciais ?? null;
  const erro = atual?.erro ?? null;

  // Carregando é derivado: ou ainda não há resposta para esta carteira, ou o
  // usuário pediu uma atualização manual.
  const carregando = (Boolean(endereco) && atual === null) || recarregando;

  async function recarregar() {
    if (!endereco) return;
    setRecarregando(true);
    try {
      setResultado(await carregarCredenciais(endereco));
    } finally {
      setRecarregando(false);
    }
  }

  // As categorias do filtro vêm do que a carteira realmente tem, não de uma
  // lista fixa — assim o filtro nunca oferece uma opção que dá zero resultados.
  const categorias = useMemo(() => {
    if (!credenciais) return [];
    return [...new Set(credenciais.map((c) => c.categoria))].sort();
  }, [credenciais]);

  const visiveis = useMemo(() => {
    if (!credenciais) return [];
    return filtro === TODAS
      ? credenciais
      : credenciais.filter((c) => c.categoria === filtro);
  }, [credenciais, filtro]);

  const totalHoras = visiveis.reduce((soma, c) => soma + c.cargaHoraria, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Minhas credenciais
      </h1>
      <p className="text-muted-foreground mt-2 text-pretty">
        Seu histórico de horas complementares, lido direto da blockchain. Nada
        aqui depende do nosso banco de dados.
      </p>

      {!connected || !endereco ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="size-5" /> Conecte sua carteira
            </CardTitle>
            <CardDescription>
              As credenciais são buscadas pelo endereço da carteira conectada.
              Certifique-se de estar na <b>devnet</b>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletButton />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-2 text-sm">
            <span>Carteira:</span>
            <a
              href={explorerAddressUrl(endereco)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono hover:underline"
            >
              {shortenAddress(endereco, 6)}
              <ExternalLink className="size-3" />
            </a>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => void recarregar()}
              disabled={carregando}
            >
              <RefreshCw
                className={carregando ? "size-4 animate-spin" : "size-4"}
              />
              Atualizar
            </Button>
          </div>

          {carregando && credenciais === null && <Carregando />}

          {erro && (
            <Card className="border-destructive/40 mt-6">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                  <AlertCircle className="size-5" /> Não foi possível consultar
                </CardTitle>
                <CardDescription>{erro}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => void recarregar()}>
                  <RefreshCw className="size-4" /> Tentar de novo
                </Button>
              </CardContent>
            </Card>
          )}

          {credenciais !== null && credenciais.length === 0 && !erro && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  Nenhuma credencial encontrada
                </CardTitle>
                <CardDescription>
                  Esta carteira ainda não recebeu nenhuma credencial emitida por
                  este app. Faça o check-in em uma atividade para receber a
                  primeira.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {credenciais !== null && credenciais.length > 0 && (
            <>
              <Card className="mt-6">
                <CardContent className="flex flex-wrap items-baseline gap-x-6 gap-y-2 pt-6">
                  <div>
                    <div className="text-3xl font-semibold tabular-nums">
                      {totalHoras}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {totalHoras === 1 ? "hora" : "horas"}
                      {filtro !== TODAS && " nesta categoria"}
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div>
                    <div className="text-3xl font-semibold tabular-nums">
                      {visiveis.length}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {visiveis.length === 1 ? "credencial" : "credenciais"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {categorias.length > 1 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <BotaoFiltro
                    ativo={filtro === TODAS}
                    onClick={() => setFiltro(TODAS)}
                  >
                    Todas ({credenciais.length})
                  </BotaoFiltro>
                  {categorias.map((cat) => (
                    <BotaoFiltro
                      key={cat}
                      ativo={filtro === cat}
                      onClick={() => setFiltro(cat)}
                    >
                      {cat} (
                      {credenciais.filter((c) => c.categoria === cat).length})
                    </BotaoFiltro>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-4">
                {visiveis.map((c) => (
                  <CartaoCredencial key={c.assetId} credencial={c} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function BotaoFiltro({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={ativo ? "default" : "outline"}
      size="sm"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function CartaoCredencial({ credencial }: { credencial: Credencial }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{credencial.categoria}</Badge>
          {credencial.frozen && (
            <Badge variant="outline" className="gap-1 font-normal">
              <Lock className="size-3" /> Intransferível
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl text-balance">
          {credencial.nome}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <dl className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" />
            <span>
              {credencial.cargaHoraria}{" "}
              {credencial.cargaHoraria === 1 ? "hora" : "horas"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0" />
            <span>{credencial.data || "sem data"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0" />
            <span className="truncate" title={credencial.emissor}>
              {credencial.emissor}
            </span>
          </div>
        </dl>

        <a
          href={explorerAddressUrl(credencial.assetId)}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground inline-flex items-center gap-1 font-mono text-xs hover:underline"
        >
          {shortenAddress(credencial.assetId, 6)}
          <ExternalLink className="size-3" />
        </a>
      </CardContent>
    </Card>
  );
}

function Carregando() {
  return (
    <div className="mt-6 space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
