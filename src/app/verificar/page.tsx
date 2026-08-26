"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  Search,
  SearchX,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { explorerAddressUrl, shortenAddress } from "@/lib/solana";

type Credencial = {
  assetId: string;
  nome: string;
  categoria: string;
  cargaHoraria: number;
  data: string;
  emissor: string;
  frozen: boolean;
  owner?: string | null;
};

type Resposta =
  | { tipo: "ativo"; credencial: Credencial }
  | { tipo: "carteira"; owner: string; credenciais: Credencial[] };

type Resultado = {
  consulta: string;
  resposta: Resposta | null;
  erro: string | null;
};

/**
 * Consulta a API e **devolve** o resultado, sem tocar em estado. Igual à página
 * de credenciais: mantém o efeito com um único `setState`, já depois do await.
 */
async function carregar(consulta: string): Promise<Resultado> {
  try {
    const resposta = await fetch(`/api/verify?q=${encodeURIComponent(consulta)}`, {
      cache: "no-store",
    });
    const corpo = await resposta.json();
    if (!resposta.ok) {
      return {
        consulta,
        resposta: null,
        erro: corpo.error ?? "Não foi possível verificar.",
      };
    }
    return { consulta, resposta: corpo as Resposta, erro: null };
  } catch {
    return {
      consulta,
      resposta: null,
      erro: "Falha de conexão com o servidor. Verifique sua internet e tente de novo.",
    };
  }
}

export default function VerificarPage() {
  return (
    <Suspense fallback={<Esqueleto />}>
      <Verificador />
    </Suspense>
  );
}

function Verificador() {
  const router = useRouter();
  const params = useSearchParams();
  const consultaUrl = params.get("q")?.trim() ?? "";

  const [entrada, setEntrada] = useState(consultaUrl);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  // Permite compartilhar o resultado por link: /verificar?q=<endereço>.
  useEffect(() => {
    if (!consultaUrl) return;
    let cancelado = false;
    void (async () => {
      const r = await carregar(consultaUrl);
      if (!cancelado) setResultado(r);
    })();
    return () => {
      cancelado = true;
    };
  }, [consultaUrl]);

  // Só vale o resultado da consulta que está na URL agora.
  const atual = resultado?.consulta === consultaUrl ? resultado : null;
  const buscando = Boolean(consultaUrl) && atual === null;

  async function refazer() {
    if (!consultaUrl) return;
    setResultado(null);
    setResultado(await carregar(consultaUrl));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const consulta = entrada.trim();
    if (!consulta) return;
    if (consulta === consultaUrl) {
      // Mesma consulta: a URL não muda, então o efeito não dispara.
      void refazer();
      return;
    }
    router.push(`/verificar?q=${encodeURIComponent(consulta)}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Verificar credencial
      </h1>
      <p className="text-muted-foreground mt-2 text-pretty">
        Confira a autenticidade de uma credencial direto na blockchain. É
        público: não precisa conectar carteira nenhuma.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Input
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          placeholder="Endereço da carteira ou id da credencial"
          className="font-mono"
          aria-label="Endereço da carteira ou id da credencial"
        />
        <Button type="submit" disabled={!entrada.trim()}>
          <Search className="size-4" /> Verificar
        </Button>
      </form>

      <p className="text-muted-foreground mt-2 text-xs">
        Os dois têm o mesmo formato, então não precisa escolher — a busca
        identifica sozinha o que você colou.
      </p>

      {buscando && <Esqueleto />}

      {atual?.erro && (
        <Card className="border-destructive/40 mt-8">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2 text-lg">
              <AlertCircle className="size-5" /> Não foi possível verificar
            </CardTitle>
            <CardDescription>{atual.erro}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => void refazer()}>
              Tentar de novo
            </Button>
          </CardContent>
        </Card>
      )}

      {atual?.resposta && <Resultado resposta={atual.resposta} />}
    </div>
  );
}

function Resultado({ resposta }: { resposta: Resposta }) {
  if (resposta.tipo === "ativo") {
    return (
      <div className="mt-8 space-y-4">
        <div className="text-primary flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="size-5" />
          Credencial autêntica, emitida por este app.
        </div>
        <CartaoCredencial credencial={resposta.credencial} mostrarDono />
      </div>
    );
  }

  const total = resposta.credenciais.reduce((s, c) => s + c.cargaHoraria, 0);

  if (resposta.credenciais.length === 0) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <SearchX className="size-5" /> Nenhuma credencial encontrada
          </CardTitle>
          <CardDescription>
            Não existe nenhuma credencial emitida por este app para{" "}
            <span className="font-mono">{shortenAddress(resposta.owner, 6)}</span>
            . Isso não quer dizer que o endereço seja inválido — só que ele não
            tem credenciais nossas.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <Card>
        <CardHeader>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <Wallet className="size-4" /> Credenciais de
            <a
              href={explorerAddressUrl(resposta.owner)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono hover:underline"
            >
              {shortenAddress(resposta.owner, 6)}
              <ExternalLink className="size-3" />
            </a>
          </CardDescription>
          <CardTitle className="text-2xl">
            {total} {total === 1 ? "hora" : "horas"} em{" "}
            {resposta.credenciais.length}{" "}
            {resposta.credenciais.length === 1 ? "credencial" : "credenciais"}
          </CardTitle>
        </CardHeader>
      </Card>

      {resposta.credenciais.map((c) => (
        <CartaoCredencial key={c.assetId} credencial={c} />
      ))}
    </div>
  );
}

function CartaoCredencial({
  credencial,
  mostrarDono = false,
}: {
  credencial: Credencial;
  mostrarDono?: boolean;
}) {
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
        <CardTitle className="text-xl text-balance">{credencial.nome}</CardTitle>
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

        {mostrarDono && credencial.owner && (
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Wallet className="size-4" /> Pertence a
            <a
              href={explorerAddressUrl(credencial.owner)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono hover:underline"
            >
              {shortenAddress(credencial.owner, 6)}
              <ExternalLink className="size-3" />
            </a>
          </div>
        )}

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

function Esqueleto() {
  return (
    <div className="mt-8 space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
