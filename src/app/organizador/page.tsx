"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { z } from "zod";
import { Check, Copy, ExternalLink, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CATEGORIAS,
  dataBrParaIso,
  formatarData,
  formatarHoras,
  isoParaDataBr,
  labelDaCategoria,
  mascararDataBr,
  novaAtividadeSchema,
} from "@/lib/activity";
import type { AtividadeDTO } from "@/lib/serializers";

type ErrosPorCampo = Partial<Record<string, string[]>>;

const VALORES_INICIAIS = {
  nome: "",
  categoria: "",
  cargaHoraria: "",
  data: isoParaDataBr(new Date().toISOString().slice(0, 10)),
  emissor: "",
};

export default function OrganizadorPage() {
  const [valores, setValores] = useState(VALORES_INICIAIS);
  const [erros, setErros] = useState<ErrosPorCampo>({});
  const [enviando, setEnviando] = useState(false);
  const [criada, setCriada] = useState<AtividadeDTO | null>(null);

  function setCampo(campo: keyof typeof VALORES_INICIAIS, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    // O campo guarda `dd/mm/aaaa`; o schema e a API falam ISO.
    const dataIso = dataBrParaIso(valores.data);
    if (!dataIso) {
      setErros((e) => ({ ...e, data: ["Data inválida. Use dd/mm/aaaa."] }));
      return;
    }

    const parsed = novaAtividadeSchema.safeParse({ ...valores, data: dataIso });
    if (!parsed.success) {
      setErros(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    setEnviando(true);
    try {
      const resposta = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const corpo = await resposta.json();

      if (!resposta.ok) {
        setErros(corpo.campos ?? {});
        toast.error(corpo.error ?? "Não foi possível criar a atividade.");
        return;
      }

      setCriada(corpo as AtividadeDTO);
      setValores(VALORES_INICIAIS);
      toast.success("Atividade criada", {
        description: "O link de check-in já está pronto para uso.",
      });
    } catch {
      toast.error("Falha de conexão", {
        description: "Não foi possível falar com o servidor. Tente de novo.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Nova atividade</h1>
      <p className="text-muted-foreground mt-2 text-pretty">
        Preencha os dados da atividade. Ao salvar, você recebe um link e um QR
        code de check-in para os participantes.
      </p>

      {criada && <AtividadeCriada atividade={criada} />}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Dados da atividade</CardTitle>
          <CardDescription>
            Essas informações vão gravadas na credencial de cada participante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <Campo id="nome" label="Nome da atividade" erro={erros.nome}>
              <Input
                id="nome"
                value={valores.nome}
                onChange={(e) => setCampo("nome", e.target.value)}
                placeholder="Palestra: Introdução a Sistemas Distribuídos"
                aria-invalid={Boolean(erros.nome)}
              />
            </Campo>

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo id="categoria" label="Categoria" erro={erros.categoria}>
                <Select
                  value={valores.categoria}
                  onValueChange={(v) => setCampo("categoria", v)}
                >
                  <SelectTrigger
                    id="categoria"
                    className="w-full"
                    aria-invalid={Boolean(erros.categoria)}
                  >
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>

              <Campo
                id="cargaHoraria"
                label="Carga horária (horas)"
                erro={erros.cargaHoraria}
              >
                <Input
                  id="cargaHoraria"
                  type="number"
                  min={1}
                  value={valores.cargaHoraria}
                  onChange={(e) => setCampo("cargaHoraria", e.target.value)}
                  placeholder="4"
                  aria-invalid={Boolean(erros.cargaHoraria)}
                />
              </Campo>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo id="data" label="Data" erro={erros.data}>
                <Input
                  id="data"
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  value={valores.data}
                  onChange={(e) => setCampo("data", mascararDataBr(e.target.value))}
                  aria-invalid={Boolean(erros.data)}
                />
              </Campo>

              <Campo id="emissor" label="Quem está emitindo" erro={erros.emissor}>
                <Input
                  id="emissor"
                  value={valores.emissor}
                  onChange={(e) => setCampo("emissor", e.target.value)}
                  placeholder="Centro Acadêmico de Computação"
                  aria-invalid={Boolean(erros.emissor)}
                />
              </Campo>
            </div>

            <Button type="submit" disabled={enviando} className="w-full sm:w-auto">
              {enviando ? <Loader2 className="animate-spin" /> : <Plus />}
              {enviando ? "Salvando..." : "Criar atividade"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Campo({
  id,
  label,
  erro,
  children,
}: {
  id: string;
  label: string;
  erro?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {erro?.[0] && <p className="text-destructive text-sm">{erro[0]}</p>}
    </div>
  );
}

function AtividadeCriada({ atividade }: { atividade: AtividadeDTO }) {
  const [copiado, setCopiado] = useState(false);
  // Montado no cliente, então `location.origin` existe e o QR funciona também
  // quando o app é acessado pelo IP da rede local (celular escaneando).
  const url = `${window.location.origin}/checkin/${atividade.id}`;

  async function copiar() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    toast.success("Link copiado");
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <Card className="mt-8 border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="size-5 text-emerald-600" />
          Atividade criada
        </CardTitle>
        <CardDescription>
          Mostre o QR code para os participantes fazerem check-in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="mx-auto rounded-lg bg-white p-3 sm:mx-0">
            <QRCodeSVG value={url} size={148} level="M" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-medium">{atividade.nome}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {labelDaCategoria(atividade.categoria)}
              </Badge>
              <Badge variant="secondary">
                {formatarHoras(atividade.cargaHoraria)}
              </Badge>
              <Badge variant="secondary">{formatarData(atividade.data)}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Emitido por {atividade.emissor}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Link de check-in</Label>
          <div className="flex gap-2">
            <Input readOnly value={url} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={copiar}>
              {copiado ? <Check /> : <Copy />}
              <span className="sr-only">Copiar link</span>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink />
                <span className="sr-only">Abrir link</span>
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
