"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { Check, Copy, LogOut, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shortenAddress } from "@/lib/solana";

const subscribeNoop = () => () => {};

export function WalletButton({ className }: { className?: string }) {
  const { wallets, select, publicKey, connected, connecting, disconnect } =
    useWallet();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // A detecção de carteiras só acontece no browser. Este hook devolve `false`
  // no servidor e `true` no cliente, evitando hydration mismatch sem precisar
  // de um setState dentro de effect.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const available = useMemo(
    () =>
      wallets.filter(
        (w) =>
          w.readyState === WalletReadyState.Installed ||
          w.readyState === WalletReadyState.Loadable,
      ),
    [wallets],
  );

  async function copyAddress() {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    toast.success("Endereço copiado");
    setTimeout(() => setCopied(false), 1500);
  }

  if (!mounted) {
    return (
      <Button variant="outline" className={className} disabled>
        <Wallet /> Conectar carteira
      </Button>
    );
  }

  if (connected && publicKey) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={className}>
            <Wallet />
            <span className="font-mono">
              {shortenAddress(publicKey.toBase58())}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={copyAddress}>
            {copied ? <Check /> : <Copy />} Copiar endereço
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void disconnect()}>
            <LogOut /> Desconectar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        className={className}
        disabled={connecting}
        onClick={() => setPickerOpen(true)}
      >
        <Wallet /> {connecting ? "Conectando..." : "Conectar carteira"}
      </Button>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Conectar carteira</DialogTitle>
            <DialogDescription>
              Certifique-se de que sua carteira está na rede <b>devnet</b>.
            </DialogDescription>
          </DialogHeader>

          {available.length === 0 ? (
            <div className="text-muted-foreground space-y-3 text-sm">
              <p>Nenhuma carteira Solana detectada neste navegador.</p>
              <Button asChild variant="outline" className="w-full">
                <a
                  href="https://phantom.app/download"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instalar a Phantom
                </a>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {available.map(({ adapter }) => (
                <Button
                  key={adapter.name}
                  variant="outline"
                  className="h-12 justify-start gap-3"
                  onClick={() => {
                    select(adapter.name);
                    setPickerOpen(false);
                  }}
                >
                  <Image
                    src={adapter.icon}
                    alt=""
                    width={24}
                    height={24}
                    unoptimized
                    className="size-6 rounded"
                  />
                  {adapter.name}
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
