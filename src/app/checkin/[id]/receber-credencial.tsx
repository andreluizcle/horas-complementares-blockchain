"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  BadgeCheck,
  CircleAlert,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WalletButton } from "@/components/wallet-button";
import { explorerAddressUrl, explorerTxUrl, shortenAddress } from "@/lib/solana";

type Resultado = { assetId: string; signature: string; duplicada?: boolean };

export function ReceberCredencial({ activityId }: { activityId: string }) {
  const { publicKey, connected } = useWallet();
  const [emitindo, setEmitindo] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function receber() {
    if (!publicKey) return;
    setEmitindo(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          ownerWallet: publicKey.toBase58(),
        }),
      });
      const corpo = await resposta.json();

      if (resposta.status === 409 && corpo.assetId) {
        // Já tinha recebido: mostra a credencial existente em vez de um erro.
        setResultado({ ...corpo, duplicada: true });
        return;
      }
      if (!resposta.ok) {
        setErro(corpo.error ?? "Não foi possível emitir a credencial.");
        return;
      }
      setResultado(corpo as Resultado);
    } catch {
      setErro(
        "Falha de conexão com o servidor. Verifique sua internet e tente de novo.",
      );
    } finally {
      setEmitindo(false);
    }
  }

  if (resultado) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-600/30 bg-emerald-50/60 p-4 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 font-medium">
            <BadgeCheck className="size-5 text-emerald-600" />
            {resultado.duplicada
              ? "Você já tem esta credencial"
              : "Credencial emitida"}
          </div>
          <p className="text-muted-foreground mt-2 text-sm text-pretty">
            {resultado.duplicada
              ? "Esta atividade já foi creditada para a sua carteira — cada aluno recebe uma única credencial por atividade."
              : "A credencial já está na sua carteira e pode ser verificada por qualquer pessoa."}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <Linha rotulo="Credencial">
            <a
              href={explorerAddressUrl(resultado.assetId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono hover:underline"
            >
              {shortenAddress(resultado.assetId, 6)}
              <ExternalLink className="size-3" />
            </a>
          </Linha>
          <Linha rotulo="Transação">
            <a
              href={explorerTxUrl(resultado.signature)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono hover:underline"
            >
              {shortenAddress(resultado.signature, 6)}
              <ExternalLink className="size-3" />
            </a>
          </Linha>
        </div>

        <Separator />

        <Button asChild className="w-full">
          <a href="/minhas-credenciais">Ver minhas credenciais</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {erro && (
        <div className="border-destructive/40 bg-destructive/5 flex gap-3 rounded-lg border p-4">
          <CircleAlert className="text-destructive mt-0.5 size-5 shrink-0" />
          <p className="text-sm text-pretty">{erro}</p>
        </div>
      )}

      {!connected ? (
        <>
          <p className="text-muted-foreground text-sm text-pretty">
            Conecte sua carteira Solana em <b>devnet</b> para receber a
            credencial. Você não paga nada e não precisa assinar transação — a
            emissão é feita e paga por quem organiza.
          </p>
          <WalletButton className="w-full" />
        </>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            Enviaremos a credencial para{" "}
            <code className="font-mono">
              {shortenAddress(publicKey!.toBase58(), 6)}
            </code>
            .
          </p>
          <Button onClick={receber} disabled={emitindo} className="w-full">
            {emitindo ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {emitindo ? "Emitindo na blockchain..." : "Receber credencial"}
          </Button>
        </>
      )}
    </div>
  );
}

function Linha({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{rotulo}</span>
      {children}
    </div>
  );
}
