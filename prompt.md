## Contexto

Estou construindo um projeto de portfólio: um MVP funcional (não é produto de produção) que resolve um problema real de universidades brasileiras.

Quase toda graduação no Brasil exige "horas complementares" — participação em palestras, cursos, monitorias, eventos de extensão — pro aluno se formar. Hoje isso é comprovado manualmente: o aluno guarda um PDF ou foto do certificado, sobe num portal do aluno, escolhe uma categoria, e espera a coordenação aprovar. É lento, burocrático, e fácil de perder o comprovante pelo caminho.

A ideia: quem organiza a atividade faz check-in dos participantes na hora, e isso emite automaticamente uma credencial digital (um NFT) na carteira Solana do aluno, com os dados da atividade. O aluno acumula essas credenciais como histórico verificável, e qualquer pessoa pode conferir a autenticidade publicamente, sem depender de PDF.

## Objetivo desta sessão

Construir, na Solana devnet (sem dinheiro real), um MVP que demonstre o fluxo completo: organizador cria atividade → aluno faz check-in e recebe a credencial → aluno vê sua carteira de credenciais → qualquer um verifica uma credencial publicamente.

Isso é peça de portfólio: priorize um fluxo ponta a ponta funcionando de verdade, mesmo que simples, em vez de uma tela bonita que não conecta em nada real.

## Stack sugerida

- Next.js (App Router) + TypeScript + Tailwind CSS
- Solana devnet
- `@solana/web3.js` + `@solana/wallet-adapter-react` (+ `wallet-adapter-react-ui`) pra conectar carteira (Phantom)
- Metaplex Core (via Umi, `@metaplex-foundation/mpl-core`) pra mintar cada credencial — prefira Core a NFTs "clássicos" (Token Metadata) pela simplicidade e custo bem mais baixo. Considere compressed NFTs (Bubblegum) só se eu pedir escala maior depois.
- RPC de devnet com suporte a DAS API (Helius tem tier gratuito) pra listar rapidamente os ativos de uma carteira, em vez de varrer a blockchain na unha
- Persistência simples pro que ainda não está on-chain (atividades criadas pelo organizador antes do check-in): SQLite via Prisma, ou até um JSON local — não precisa de banco robusto

Nota: bibliotecas do ecossistema Solana mudam rápido. Se algum pacote ou método abaixo estiver desatualizado, confira a documentação oficial atual do Metaplex/Solana antes de seguir, e me avise se a stack sugerida não fizer mais sentido.

## Escopo — construa nesta ordem, e pare pra eu validar entre as fases

**Fase 1 — Base do projeto**
Setup do Next.js + Tailwind. Página inicial simples explicando o projeto em 2-3 frases, com botão de conectar carteira Solana (devnet). Confirme que dá pra ver o endereço conectado na tela.

**Fase 2 — Organizador cria atividade**
Formulário simples: nome da atividade, categoria (palestra / curso / monitoria / evento de extensão / outro), carga horária, data, nome de quem está emitindo. Ao salvar, gera um link único de check-in (ex.: `/checkin/[id]`) e mostra esse link com um QR code gerado no client (Solana Pay ainda não — isso é fase 6).

**Fase 3 — Check-in e emissão da credencial**
Página `/checkin/[id]`: mostra os dados da atividade, botão "conectar carteira" e depois "receber credencial". Ao clicar, minta um ativo Metaplex Core na devnet, na carteira conectada, com os metadados da atividade (nome, categoria, horas, data, emissor). Mostre confirmação com link pro Solana Explorer (devnet) da transação.

**Fase 4 — Carteira do aluno**
Página `/minhas-credenciais`: aluno conecta a carteira, a página busca (via DAS API) todos os ativos Core que ele possui emitidos por este app, lista cada credencial (nome, categoria, horas, data, emissor), e mostra o total de horas acumuladas com filtro por categoria.

**Fase 5 — Verificação pública**
Página `/verificar`: campo de busca por endereço de carteira OU id do ativo — sem precisar conectar carteira nenhuma, é público. Mostra a(s) credencial(is) encontradas com link direto pro Solana Explorer como prova.

**Fase 6 (opcional, só se as anteriores estiverem sólidas) — Check-in via Solana Pay**
Troque o link simples das fases 2/3 por um QR code real via Solana Pay Transaction Request, pra replicar "aponta o celular, escaneia, recebe a credencial" sem digitar nada.

## Diretrizes técnicas

- Tudo em devnet. Nunca configure mainnet.
- Use um faucet de devnet SOL pra pagar as taxas de mint — não deve haver dinheiro real envolvido em nenhum momento.
- Trate erros de transação (carteira sem SOL de devnet, usuário rejeita a assinatura, RPC fora do ar) com mensagens claras na tela, não só no console.
- Não mocke dados silenciosamente: se uma busca de credenciais falhar ou vier vazia, mostre isso claramente em vez de simular um resultado.

## Diretrizes de design

Interface limpa e funcional — não precisa de identidade visual elaborada. Boa tipografia, espaçamento confortável, componentes simples (shadcn/ui é uma boa opção se ajudar a ir mais rápido). Pense em mobile-first na tela de check-in, já que na prática o aluno vai abrir isso pelo celular depois de escanear um QR.

## Fora de escopo — não construa isso agora

- Login/autenticação além de conectar carteira
- Emissão em lote de credenciais
- Qualquer integração real com sistemas de universidade
- Regras de permissão de produção (por enquanto, qualquer wallet pode criar atividades como organizador)

## Como quero trabalhar

Vá fase por fase. No fim de cada fase, me mostre o que funciona (comando pra rodar, o que testar) antes de seguir pra próxima. Se uma decisão técnica tiver mais de uma opção razoável — principalmente se afeta custo, complexidade, ou o que aparece na demo — me pergunte em vez de escolher silenciosamente.
