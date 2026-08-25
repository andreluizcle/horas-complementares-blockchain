"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletButton } from "@/components/wallet-button";
import { explorerAddressUrl, shortenAddress } from "@/lib/solana";

const STEPS = [
  {
    title: "O organizador cria a atividade",
    body: "Nome, categoria, carga horária e data. O sistema gera um QR code de check-in.",
  },
  {
    title: "O aluno faz check-in na hora",
    body: "Escaneia o QR pelo celular, conecta a carteira e recebe a credencial na mesma hora.",
  },
  {
    title: "Qualquer um verifica",
    body: "A credencial vive na blockchain. Não depende de PDF, e-mail ou portal do aluno.",
  },
];

export default function Home() {
  const { publicKey, connected } = useWallet();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <section className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Horas complementares que se comprovam sozinhas
        </h1>
        <p className="text-muted-foreground mt-6 text-lg text-pretty">
          Hoje o aluno guarda o PDF do certificado, sobe num portal e espera a
          coordenação aprovar. Aqui, quem organiza a atividade faz o check-in e
          isso emite na hora uma credencial digital na carteira Solana do aluno.
          O histórico fica público e verificável por qualquer pessoa, sem
          intermediário.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <WalletButton />
          <Button asChild variant="ghost">
            <Link href="/organizador">
              Criar uma atividade <ArrowRight />
            </Link>
          </Button>
        </div>

        {connected && publicKey && (
          <Card className="mt-8">
            <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span className="text-muted-foreground">Carteira conectada:</span>
              <code className="font-mono">
                {shortenAddress(publicKey.toBase58(), 6)}
              </code>
              <a
                href={explorerAddressUrl(publicKey.toBase58())}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground ml-auto inline-flex items-center gap-1 text-xs"
              >
                Ver no Explorer <ExternalLink className="size-3" />
              </a>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="mt-20 grid gap-6 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <Card key={step.title}>
            <CardContent className="space-y-2">
              <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full font-mono text-sm">
                {i + 1}
              </div>
              <h2 className="font-medium">{step.title}</h2>
              <p className="text-muted-foreground text-sm text-pretty">
                {step.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <p className="text-muted-foreground mt-16 text-xs">
        MVP de portfólio rodando 100% na Solana devnet. Nenhum valor real é
        movimentado.
      </p>
    </div>
  );
}
