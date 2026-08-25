import { prisma } from "@/lib/prisma";
import { formatarData, formatarHoras, labelDaCategoria } from "@/lib/activity";

/** Escapa texto para interpolar com segurança dentro do SVG. */
function esc(texto: string) {
  return texto.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
}

/** Quebra o título em até 3 linhas para caber no cartão. */
function quebrarTitulo(titulo: string, porLinha = 22) {
  const linhas: string[] = [];
  let atual = "";
  for (const palavra of titulo.split(/\s+/)) {
    if ((atual + " " + palavra).trim().length > porLinha) {
      if (atual) linhas.push(atual);
      atual = palavra;
    } else {
      atual = (atual + " " + palavra).trim();
    }
    if (linhas.length === 3) break;
  }
  if (atual && linhas.length < 3) linhas.push(atual);
  const ultima = linhas.length - 1;
  if (linhas.length === 3 && titulo.length > porLinha * 3) {
    linhas[ultima] = linhas[ultima].slice(0, porLinha - 1) + "…";
  }
  return linhas;
}

function svg(campos: {
  titulo: string;
  categoria: string;
  horas: string;
  data: string;
  emissor: string;
}) {
  const linhas = quebrarTitulo(campos.titulo);
  const titulo = linhas
    .map(
      (linha, i) =>
        `<text x="64" y="${232 + i * 52}" class="t">${esc(linha)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <style>
    text { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; fill: #f8fafc; }
    .eyebrow { font-size: 22px; fill: #94a3b8; letter-spacing: 3px; }
    .t { font-size: 44px; font-weight: 600; }
    .rot { font-size: 22px; fill: #94a3b8; }
    .val { font-size: 26px; font-weight: 500; }
    .pill { font-size: 24px; font-weight: 600; fill: #0f172a; }
  </style>

  <rect width="800" height="800" fill="url(#bg)"/>
  <rect x="32" y="32" width="736" height="736" rx="28" fill="none" stroke="#334155" stroke-width="2"/>

  <text x="64" y="108" class="eyebrow">HORAS COMPLEMENTARES</text>

  <rect x="64" y="136" width="${28 + campos.categoria.length * 13}" height="44" rx="22" fill="#34d399"/>
  <text x="${78}" y="166" class="pill">${esc(campos.categoria)}</text>

  ${titulo}

  <line x1="64" y1="470" x2="736" y2="470" stroke="#334155" stroke-width="2"/>

  <text x="64" y="530" class="rot">Carga horária</text>
  <text x="64" y="568" class="val">${esc(campos.horas)}</text>

  <text x="400" y="530" class="rot">Data</text>
  <text x="400" y="568" class="val">${esc(campos.data)}</text>

  <text x="64" y="640" class="rot">Emitido por</text>
  <text x="64" y="678" class="val">${esc(campos.emissor)}</text>

  <text x="64" y="736" class="rot">Solana devnet · credencial verificável</text>
</svg>`;
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/metadata/[id]/image">,
) {
  const { id } = await params;

  const conteudo =
    id === "collection"
      ? svg({
          titulo: "Credenciais de horas complementares",
          categoria: "Coleção",
          horas: "—",
          data: "—",
          emissor: "Solana devnet",
        })
      : await (async () => {
          const atividade = await prisma.activity.findUnique({ where: { id } });
          if (!atividade) return null;
          return svg({
            titulo: atividade.nome,
            categoria: labelDaCategoria(atividade.categoria),
            horas: formatarHoras(atividade.cargaHoraria),
            data: formatarData(atividade.data),
            emissor: atividade.emissor,
          });
        })();

  if (!conteudo) return new Response("Atividade não encontrada.", { status: 404 });

  return new Response(conteudo, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
