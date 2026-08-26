import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { buscarCredenciaisDaCarteira, DasError } from "@/lib/das";
import { ConfigError } from "@/lib/umi";

export async function GET(request: Request) {
  const owner = new URL(request.url).searchParams.get("owner")?.trim();

  if (!owner) {
    return NextResponse.json(
      { error: "Informe o endereço da carteira." },
      { status: 400 },
    );
  }

  let valido = false;
  try {
    valido = PublicKey.isOnCurve(new PublicKey(owner));
  } catch {
    valido = false;
  }
  if (!valido) {
    return NextResponse.json(
      { error: "Endereço de carteira Solana inválido." },
      { status: 400 },
    );
  }

  try {
    const credenciais = await buscarCredenciaisDaCarteira(owner);
    return NextResponse.json({ owner, credenciais });
  } catch (e) {
    if (e instanceof ConfigError) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    if (e instanceof DasError) {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
    console.error("Falha ao buscar credenciais:", e);
    return NextResponse.json(
      { error: "Não foi possível consultar as credenciais agora." },
      { status: 502 },
    );
  }
}
