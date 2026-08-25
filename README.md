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
- **Prisma + SQLite** para as atividades criadas antes do check-in

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
npx prisma migrate deploy    # cria o SQLite local
npm run dev
```

Abra http://localhost:3000 e conecte a Phantom **na rede devnet**
(Configurações → Developer Settings → Testnet Mode → Devnet).

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `APP_KEYPAIR_SECRET` | Keypair de devnet (base58) que paga as taxas de mint. **Server-only.** |
| `HELIUS_API_KEY` | Chave gratuita da [Helius](https://helius.dev) para a DAS API |
| `COLLECTION_ADDRESS` | Endereço da Core Collection, gerado uma vez por script |
| `NEXT_PUBLIC_RPC_URL` | Opcional. Sem isso, usa o RPC público de devnet |
| `DATABASE_URL` | Caminho do SQLite local. Padrão: `file:./prisma/dev.db` |

## Status

- [x] **Fase 1** — Base do projeto, conexão de carteira em devnet
- [x] **Fase 2** — Organizador cria atividade, gera link e QR de check-in
- [ ] **Fase 3** — Check-in e emissão da credencial Metaplex Core
- [ ] **Fase 4** — Carteira do aluno, total de horas e filtro por categoria
- [ ] **Fase 5** — Verificação pública, sem carteira
- [ ] **Fase 6** — Check-in via Solana Pay *(opcional)*

## Nota sobre `npm audit`

O audit reporta avisos moderados vindos de `uuid@8.3.2`, puxado transitivamente por
`jayson` ← `@solana/web3.js`. O advisory afeta apenas as funções `v3/v5/v6` quando recebem o
argumento `buf`; o `jayson` usa somente `uuid.v4()` sem argumentos, então o caminho vulnerável
nunca é executado. Não há correção disponível a montante — depende do `jayson` atualizar o pin.
