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

> **Não conhece blockchain?** O [CONCEITOS.md](./CONCEITOS.md) explica do zero cada peça
> usada aqui — blockchain, carteira, NFT, mint, Collection — e por que cada uma foi escolhida
> para este projeto. Não é preciso ler antes: o resto deste README se entende sozinho.

## Como funciona

1. **O organizador cria a atividade** — nome, categoria, carga horária, data e emissor. O sistema
   gera um QR code de check-in.
2. **O aluno faz check-in na hora** — escaneia o QR pelo celular, conecta a carteira e recebe a
   credencial na mesma hora.
3. **Qualquer um verifica** — a credencial vive na blockchain, com link direto pro Solana Explorer.

## As telas

### Início

![Página inicial](./prints/01-home.png)

Explica o problema em poucas linhas e conecta a carteira. O selo `devnet` no cabeçalho está
sempre visível — é um lembrete de que nada ali envolve dinheiro real. Depois de conectar, o
endereço aparece na tela com link para o Solana Explorer.

### Organizador — criar atividade

![Formulário de nova atividade](./prints/02-organizador.png)

Quem organiza preenche nome, categoria, carga horária, data e emissor. Esses dados são
exatamente o que vai gravado dentro da credencial de cada participante, então é a única tela
onde alguém digita algo. Ao salvar, o app gera um link de check-in e um QR code para projetar
ou imprimir no evento.

> **Fase 6, não implementada:** o QR de hoje é um link comum. Trocá-lo por um QR de Solana Pay
> (Transaction Request) era a fase opcional do escopo e ficou de fora.

### Check-in — o aluno recebe a credencial

O aluno escaneia o QR, vê os dados da atividade e clica em "receber credencial". A tela é
mobile-first porque na prática ela é aberta no celular, em pé, durante o evento.

O detalhe que mais importa aqui: **o aluno não paga nada e não assina transação nenhuma.** Quem
paga a taxa e assina é a carteira do app, no servidor. Do lado do aluno, é um clique. A tela de
sucesso mostra três links para o Explorer — a credencial, a transação e a Collection do emissor.

*(Sem print: esta tela é a única que depende de um evento real acontecendo, e os prints foram
tirados em uma sessão de desktop.)*

### Minhas credenciais

![Histórico de credenciais do aluno](./prints/03-minhas-credenciais.png)

O histórico do aluno, com o total de horas somado e um filtro por categoria — o filtro só
aparece quando há mais de uma categoria, para não ocupar espaço à toa.

Tudo nesta tela é lido **direto da blockchain** via DAS API, não do banco de dados. O selo
"Intransferível" em cada card não é enfeite: reflete o estado real do ativo on-chain.

### Verificação pública

![Busca pública de credenciais](./prints/04-verificar.png)

A única tela que não pede carteira nenhuma — é para a coordenação, o RH, ou qualquer pessoa
conferindo um certificado.

O campo aceita tanto um endereço de carteira quanto o id de uma credencial. Os dois são chaves
base58 de 32 bytes e **não dá para distinguir pelo formato**, então a busca tenta interpretar
como credencial primeiro e cai para carteira se não casar — quem usa não precisa escolher.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **shadcn/ui** para os componentes
- **Solana devnet** via `@solana/web3.js` + `@solana/wallet-adapter-react`
- **Metaplex Core** (`@metaplex-foundation/mpl-core` via Umi) para mintar cada credencial
- **Helius DAS API** para listar os ativos de uma carteira
- **Prisma + Postgres** para as atividades criadas antes do check-in

### Três decisões de arquitetura

**Collection Core como carimbo do emissor.** Todo ativo é mintado dentro de uma única Core
Collection cuja authority é o app. Assim a listagem filtra por `grouping: ['collection', ...]`
na DAS API, sem depender de heurística de nome ou metadados para saber o que este app emitiu.

**Dados da atividade on-chain, no plugin Attributes.** Categoria, horas, data e emissor não vivem
só no JSON off-chain — vão para o plugin `Attributes` do Core. A verificação pública lê a fonte
on-chain e continua funcionando mesmo que o servidor de metadados saia do ar.

**Credencial soulbound, via PermanentFreezeDelegate.** Um certificado que pudesse ser vendido não
comprovaria nada — bastaria comprar as horas de outra pessoa. Cada ativo carrega o plugin
`PermanentFreezeDelegate`, e a recusa foi verificada na prática, não deduzida de um nome de campo:
o dono legítimo, com saldo e assinando corretamente, tem a transferência rejeitada pelo programa
on-chain em `permanent_freeze_delegate.rs` (`custom program error 0x9`).

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

O banco é Postgres — qualquer provedor serve (Supabase, Neon, local). Cole a
connection string em `DATABASE_URL`; a mesma URL serve para dev e produção.

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `APP_KEYPAIR_SECRET` | Keypair de devnet (base58) que paga as taxas de mint. **Server-only.** |
| `HELIUS_API_KEY` | Chave gratuita da [Helius](https://helius.dev) para a DAS API |
| `COLLECTION_ADDRESS` | Endereço da Core Collection, gerado uma vez por script |
| `NEXT_PUBLIC_RPC_URL` | Opcional. Sem isso, usa o RPC público de devnet |
| `DATABASE_URL` | Connection string do Postgres (Supabase, Neon, local — qualquer um) |
| `DIRECT_URL` | Opcional. Conexão direta usada só pelas migrations, quando `DATABASE_URL` aponta para um pooler em modo *transaction* |

## Publicando na Vercel

O `uri` de cada credencial é montado a partir da URL da requisição, então
publicar resolve sozinho a limitação do `localhost`: a imagem da credencial
passa a renderizar na carteira e no Explorer.

1. **Banco.** Qualquer Postgres serve. No Supabase: *Project Settings →
   Database → Connection string*. Pegue as duas —
   o **pooler de transação** (porta 6543) para `DATABASE_URL`, que aguenta
   melhor o serverless, e a **conexão direta** ou o pooler em modo *session*
   (porta 5432) para `DIRECT_URL`, que as migrations exigem. Use as mesmas
   no `.env` local, para dev e produção ficarem no mesmo schema.
   *(Na Vercel também dá para criar um Neon por Storage → Create Database,
   que injeta `DATABASE_URL` sozinho.)*
2. **Variáveis.** Em *Settings → Environment Variables*, adicione
   `APP_KEYPAIR_SECRET`, `HELIUS_API_KEY`, `COLLECTION_ADDRESS` e, se
   estiver usando pooler, `DIRECT_URL` — com os mesmos valores do `.env`
   local. Nenhuma leva o prefixo `NEXT_PUBLIC_`.
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

## Limitações conhecidas

Este é um MVP de portfólio, e vale ser explícito sobre onde ele para:

- **Sem regras de permissão.** Qualquer carteira conectada cria atividades como organizador.
  Isso estava fora do escopo de propósito — num sistema real, emitir credencial em nome de uma
  instituição exigiria autorização de verdade.
- **Rodando em `localhost`, a imagem da credencial não aparece** na carteira nem no Explorer,
  porque nenhum dos dois consegue acessar o `uri` apontando para a sua máquina. Os dados que
  provam a credencial estão on-chain e aparecem normalmente. Publicado, isso se resolve sozinho.
- **A troca de SQLite para Postgres não foi exercitada contra um banco real** — o código compila
  e o schema foi gerado, mas o fluxo completo só foi testado em SQLite. O deploy na Vercel
  também ainda não foi feito.
- **Fase 6 (Solana Pay) não implementada** — era opcional no escopo original.

## Nota sobre `npm audit`

O audit reporta avisos que foram investigados um a um, e nenhum representa risco real aqui:

- **Moderados, de `uuid@8.3.2`** — puxado transitivamente por `jayson` ← `@solana/web3.js`.
  O advisory afeta apenas as funções `v3/v5/v6` quando recebem o argumento `buf`; o `jayson`
  usa somente `uuid.v4()` sem argumentos, então o caminho vulnerável nunca é executado. Não há
  correção a montante — depende do `jayson` atualizar o pin.
- **Altos, de `deepmerge-ts`** — puxado por `@prisma/config` ← `prisma`, que é
  **devDependency**: é a CLI do Prisma, nunca vai para o runtime em produção. O advisory é de
  stack exhaustion ao mesclar grafos de objetos recursivos, e a config deste projeto é um objeto
  pequeno e estático.
