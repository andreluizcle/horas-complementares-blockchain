import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { DasError, verificar } from "@/lib/das";
import { ConfigError } from "@/lib/umi";

export async function GET(request: Request) {
  const entrada = new URL(request.url).searchParams.get("q")?.trim();

  if (!entrada) {
    return NextResponse.json(
      { error: "Informe um endereço de carteira ou o id de uma credencial." },
      { status: 400 },
    );
  }

  // Carteira e id de ativo têm o mesmo formato; basta ser uma chave válida.
  let valido = false;
  try {
    valido = PublicKey.isOnCurve(new PublicKey(entrada));
  } catch {
    valido = false;
  }
  if (!valido) {
    return NextResponse.json(
      {
        error:
          "Isso não parece um endereço Solana. Cole o endereço de uma carteira ou o id de uma credencial.",
      },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await verificar(entrada));
  } catch (e) {
    if (e instanceof ConfigError) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    if (e instanceof DasError) {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
    console.error("Falha ao verificar:", e);
    return NextResponse.json(
      { error: "Não foi possível fazer a verificação agora." },
      { status: 502 },
    );
  }
}
