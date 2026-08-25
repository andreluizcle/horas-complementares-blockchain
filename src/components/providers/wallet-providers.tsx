"use client";

import { useCallback, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletError,
  WalletNotReadyError,
  WalletWindowClosedError,
} from "@solana/wallet-adapter-base";
import { toast } from "sonner";

import { RPC_ENDPOINT } from "@/lib/solana";

/**
 * A lista de wallets fica vazia de propósito: o wallet-adapter detecta
 * automaticamente qualquer carteira que implemente o Wallet Standard
 * (Phantom, Solflare, Backpack...), sem precisar do pacote
 * `@solana/wallet-adapter-wallets`, que traz centenas de dependências.
 */
export function SolanaProviders({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => RPC_ENDPOINT, []);

  // Erros de carteira chegam por aqui e não como exceção — sem este handler
  // eles morreriam no console, e a diretriz do projeto é mostrar na tela.
  const onError = useCallback((error: WalletError) => {
    if (
      error instanceof WalletWindowClosedError ||
      error.name === "WalletConnectionError"
    ) {
      toast.error("Conexão cancelada", {
        description: "Você fechou ou recusou a solicitação da carteira.",
      });
      return;
    }
    if (error instanceof WalletNotReadyError) {
      toast.error("Carteira não encontrada", {
        description: "Instale a extensão Phantom e recarregue a página.",
      });
      return;
    }
    toast.error("Erro na carteira", {
      description: error.message || "Não foi possível completar a operação.",
    });
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect onError={onError}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
