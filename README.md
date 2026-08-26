# Horas Complementares on-chain

Credenciais verificáveis de horas complementares emitidas na **Solana devnet**.

Toda graduação no Brasil exige horas complementares — palestras, cursos, monitorias, eventos
de extensão. Hoje a comprovação é manual: o aluno guarda o PDF do certificado, sobe num portal,
escolhe uma categoria e espera a coordenação aprovar. É lento, burocrático e fácil de perder o
comprovante pelo caminho.

Aqui, quem organiza a atividade faz o check-in dos participantes na hora, e isso emite
automaticamente uma credencial digital na carteira Solana do aluno. O aluno acumula um histórico
verificável, e qualquer pessoa confere a autenticidade publicamente — sem PDF, sem portal,
sem intermediário.

> **MVP de portfólio.** Roda 100% na devnet. Nenhum valor real é movimentado em momento algum,
> e não existe caminho de configuração para mainnet.

## Como funciona

1. **O organizador cria a atividade** — nome, categoria, carga horária, data e emissor. O sistema
   gera um QR code de check-in.
2. **O aluno faz check-in na hora** — escaneia o QR pelo celular, conecta a carteira e recebe a
   credencial na mesma hora.
3. **Qualquer um verifica** — a credencial vive na blockchain, com link direto pro Solana Explorer.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **shadcn/ui** para os componentes
- **Solana devnet** via `@solana/web3.js` + `@solana/wallet-adapter-react`
- **Metaplex Core** (`@metaplex-foundation/mpl-core` via Umi) para mintar cada credencial
- **Helius DAS API** para listar os ativos de uma carteira
- **Prisma + Postgres** para as atividades criadas antes do check-in

### Duas decisões de arquitetura

**Collection Core como carimbo do emissor.** Todo ativo é mintado dentro de uma única Core
Collection cuja authority é o app. Assim a listagem filtra por `grouping: ['collection', ...]`
na DAS API, sem depender de heurística de nome ou metadados para saber o que este app emitiu.

**Dados da atividade on-chain, no plugin Attributes.** Categoria, horas, data e emissor não vivem
só no JSON off-chain — vão para o plugin `Attributes` do Core. A verificação pública lê a fonte
on-chain e continua funcionando mesmo que o servidor de metadados saia do ar.

## Rodando localmente

```bash
npm install                  # roda `prisma generate` automaticamente
cp .env.example .env         # preencha as variáveis
npx prisma migrate deploy    # aplica o schema no Postgres
npm run dev
```

Abra http://localhost:3000 e conecte a carteira **na rede devnet**
(na Phantom: Configurações → Developer Settings → Testnet Mode → Devnet).
Qualquer carteira compatível com Wallet Standard funciona — a detecção é
automática, não há lista fixa no código.

O banco é Postgres. Crie um grátis no [Neon](https://neon.tech) e cole a
connection string em `DATABASE_URL`; a mesma URL serve para dev e produção.

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `APP_KEYPAIR_SECRET` | Keypair de devnet (base58) que paga as taxas de mint. **Server-only.** |
| `HELIUS_API_KEY` | Chave gratuita da [Helius](https://helius.dev) para a DAS API |
| `COLLECTION_ADDRESS` | Endereço da Core Collection, gerado uma vez por script |
| `NEXT_PUBLIC_RPC_URL` | Opcional. Sem isso, usa o RPC público de devnet |
| `DATABASE_URL` | Connection string do Postgres (Neon, Supabase, local — qualquer um) |

## Publicando na Vercel

O `uri` de cada credencial é montado a partir da URL da requisição, então
publicar resolve sozinho a limitação do `localhost`: a imagem da credencial
passa a renderizar na carteira e no Explorer.

1. **Banco.** No painel do projeto → *Storage* → *Create Database* → Neon.
   A integração injeta `DATABASE_URL` automaticamente. Use a mesma URL no
   `.env` local, para dev e produção ficarem no mesmo schema.
2. **Variáveis.** Em *Settings → Environment Variables*, adicione
   `APP_KEYPAIR_SECRET`, `HELIUS_API_KEY` e `COLLECTION_ADDRESS` com os
   mesmos valores do `.env` local. Nenhuma leva o prefixo `NEXT_PUBLIC_`.
3. **Deploy.** O script de build já roda `prisma migrate deploy` antes do
   `next build`, então o schema é aplicado no primeiro deploy.

A carteira do app precisa de SOL de devnet para emitir — confira com
`npm run wallet:status` e abasteça em https://faucet.solana.com se acabar.

> A Collection é criada uma vez, por script, e vale para qualquer ambiente:
> o mesmo `COLLECTION_ADDRESS` local e em produção. Não rode
> `collection:create` de novo ao publicar, senão as credenciais antigas
> ficam fora da collection nova e param de ser reconhecidas.

## Status

- [x] **Fase 1** — Base do projeto, conexão de carteira em devnet
- [x] **Fase 2** — Organizador cria atividade, gera link e QR de check-in
- [x] **Fase 3** — Check-in e emissão da credencial Metaplex Core (soulbound, dentro da collection)
- [x] **Fase 4** — Carteira do aluno, total de horas e filtro por categoria
- [x] **Fase 5** — Verificação pública, sem carteira
- [ ] **Fase 6** — Check-in via Solana Pay *(opcional)*

## Nota sobre `npm audit`

O audit reporta avisos moderados vindos de `uuid@8.3.2`, puxado transitivamente por
`jayson` ← `@solana/web3.js`. O advisory afeta apenas as funções `v3/v5/v6` quando recebem o
argumento `buf`; o `jayson` usa somente `uuid.v4()` sem argumentos, então o caminho vulnerável
nunca é executado. Não há correção disponível a montante — depende do `jayson` atualizar o pin.
