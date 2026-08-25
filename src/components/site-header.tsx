import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { WalletButton } from "@/components/wallet-button";

const NAV = [
  { href: "/organizador", label: "Organizador" },
  { href: "/minhas-credenciais", label: "Minhas credenciais" },
  { href: "/verificar", label: "Verificar" },
];

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <GraduationCap className="size-5" />
          <span className="hidden sm:inline">Horas Complementares</span>
        </Link>

        <Badge variant="secondary" className="font-mono text-xs">
          devnet
        </Badge>

        <nav className="text-muted-foreground ml-auto hidden gap-5 text-sm md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <WalletButton className="md:ml-0 ml-auto" />
      </div>
    </header>
  );
}
