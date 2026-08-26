# Conceitos por trás do projeto

Este documento existe pra quem abrir este repositório sem experiência com blockchain — ou até com desenvolvimento em geral — e quiser entender o que cada peça da stack faz, e por que ela foi escolhida especificamente aqui.

Cada seção segue o mesmo formato: primeiro o conceito de forma independente do projeto (o que você encontraria em qualquer busca sobre o termo), depois por que ele está sendo usado neste projeto específico.

## Índice

**Blockchain, do zero**
- [O que é uma blockchain](#o-que-é-uma-blockchain)
- [O que é uma carteira (wallet)](#o-que-é-uma-carteira-wallet)
- [Mainnet e devnet](#mainnet-e-devnet)
- [NFT](#nft)
- [Mint](#mint)
- [Metaplex](#metaplex)
- [Core](#core)
- [Collection](#collection)
- [Soulbound (intransferível)](#soulbound-intransferível)
- [Dados on-chain e off-chain](#dados-on-chain-e-off-chain)
- [RPC](#rpc)
- [Helius](#helius)

**Desenvolvimento web**
- [Next.js](#nextjs)
- [TypeScript](#typescript)
- [Tailwind CSS](#tailwind-css)
- [shadcn/ui](#shadcnui)
- [Prisma](#prisma)
- [SQLite](#sqlite)

---

## Blockchain, do zero

### O que é uma blockchain

**O que é.** Uma blockchain é um livro de registros compartilhado entre muitos computadores ao mesmo tempo, em vez de guardado no servidor de uma única empresa. Toda vez que algo é registrado ali, esse registro é conferido pela rede e, uma vez aceito, fica lá permanentemente — ninguém consegue apagar ou editar silenciosamente depois. É essa combinação (público, distribuído, difícil de alterar) que faz uma blockchain funcionar como fonte de verdade sem depender de confiar numa empresa ou instituição específica.

**Por que está aqui.** O projeto usa a Solana como essa blockchain. A escolha não é arbitrária: emitir uma credencial pequena a cada palestra ou evento, potencialmente centenas de vezes por semestre, só é viável se cada emissão for barata e rápida. A Solana confirma transações em segundos e cobra frações de centavo por elas — outras blockchains mais conhecidas, como Ethereum, não oferecem esse mesmo custo pra esse tipo de emissão em volume.

### O que é uma carteira (wallet)

**O que é.** Uma carteira é o que identifica você numa blockchain — um par de chaves, uma pública (seu "endereço", que pode ser compartilhado) e uma privada (que só você deveria ter, e que autoriza qualquer ação em seu nome). Aplicativos de carteira, como a Phantom, guardam essa chave privada de forma segura e dão uma interface pra conectar, assinar transações e ver o que você possui.

**Por que está aqui.** É a carteira do aluno que recebe a credencial no momento do check-in, e é essa mesma carteira que a página "minhas credenciais" consulta depois. Ninguém precisa criar conta ou cadastro no sistema — a carteira já é a identidade.

### Mainnet e devnet

**O que é.** A maioria das blockchains tem mais de uma rede: a "mainnet" é a rede real, onde as transações envolvem valor de verdade. A "devnet" é uma rede paralela, com o mesmo funcionamento, mas usada só pra testes — o token nela não vale nada fora dali, e dá pra pedir SOL de teste de graça num "faucet".

**Por que está aqui.** Este é um MVP de portfólio: tudo roda na devnet, de propósito. Nenhum valor real é movimentado em nenhum momento, e não existe nem caminho de configuração pra mainnet.

### NFT

**O que é.** "Fungível" é quando duas unidades de algo são intercambiáveis — uma nota de R$10 vale exatamente o mesmo que qualquer outra nota de R$10. "Não-fungível" é o oposto: cada unidade é única, como um ingresso numerado de show, onde o ingresso #142 não é a mesma coisa que o #143. Um NFT (non-fungible token) é um registro na blockchain que diz "esse item específico, com essas características específicas, pertence a essa carteira específica". Pode representar arte, um item de jogo, um ingresso — ou uma credencial.

**Por que está aqui.** Cada atividade que um aluno completa vira um NFT: um registro único, com os dados daquela atividade (nome, categoria, carga horária, data), que fica guardado na carteira dele.

### Mint

**O que é.** Mint (cunhar) é o ato de criar um NFT na blockchain pela primeira vez — antes desse momento, ele não existe em lugar nenhum. O termo vem do sentido original da palavra: uma "mint" é a casa da moeda, o lugar físico onde moedas são fabricadas; "mintar" é o ato de bater essa moeda. No mundo cripto, o sentido é o mesmo, aplicado a um ativo digital — mintar é a transação que cria a conta na blockchain representando aquele item específico, com seus dados, normalmente entregando ele direto numa carteira. Como qualquer transação, tem uma taxa de rede associada.

**Por que está aqui.** É o momento central do projeto: quando o aluno clica em "receber credencial" depois do check-in, o app minta um novo ativo Core — dentro da Collection do projeto, já com os dados daquela atividade — direto na carteira dele. Antes desse clique a credencial não existe; depois, ela existe permanentemente.

### Metaplex

**O que é.** A Solana, sozinha, não sabe o que é um NFT — ela só entende contas e tokens genéricos. Metaplex é um conjunto de programas (código que roda na própria blockchain) e ferramentas que virou o padrão que praticamente todo mundo usa pra criar e organizar NFTs na Solana. A Solana é a estrada; o Metaplex é o padrão de placas de trânsito que todo mundo concordou em seguir — assim qualquer carteira, marketplace ou aplicativo consegue "ler" um NFT direito, não importa quem criou.

**Por que está aqui.** É o Metaplex que dá o vocabulário técnico — nome, descrição, atributos, agrupamento — que transforma "um registro genérico na Solana" em algo que qualquer carteira já sabe exibir como uma credencial reconhecível.

### Core

**O que é.** O Metaplex tem mais de um jeito de criar um NFT, cada um com um trade-off diferente de custo e complexidade. Core é o padrão mais recente e mais simples: cada ativo usa uma única conta (padrões mais antigos usavam três ou mais, o que custa mais caro em taxa), e vem com um sistema de "plugins" que permite anexar dados extras sem precisar escrever um programa novo.

**Por que está aqui.** Emitir uma credencial por palestra, evento ou monitoria, centenas de vezes por semestre, só faz sentido em escala se cada emissão for barata. Core é o equilíbrio certo entre custo baixo e simplicidade de implementação — a alternativa ainda mais barata (compressed NFTs) exigiria montar e manter uma estrutura adicional (uma "merkle tree") que adiciona complexidade sem necessidade neste estágio do projeto.

### Collection

**O que é.** Uma Collection agrupa vários NFTs como vindos da mesma origem confiável. É parecido com um carimbo oficial ou timbre de empresa: qualquer um pode desenhar um documento parecido, mas só quem tem o carimbo de verdade consegue carimbar oficialmente. Uma Collection é, ela mesma, uma conta na blockchain, e cada ativo pode se declarar "parte dela".

**Por que está aqui.** Todo ativo emitido pelo projeto pertence à mesma Collection, cuja autoridade é o próprio app. Isso permite perguntar diretamente "me mostra só o que essa Collection específica emitiu" — em vez de tentar adivinhar quais NFTs de uma carteira são credenciais de verdade só pelo nome, algo que qualquer pessoa poderia falsificar mintando um NFT parecido.

### Soulbound (intransferível)

**O que é.** Por padrão, um NFT pode ser transferido ou vendido — é do dono, e o dono faz o que quiser com ele. "Soulbound" (literalmente "preso à alma", termo emprestado de jogos de RPG) descreve um ativo que, uma vez recebido, não pode sair da carteira: não se vende, não se transfere, não se empresta. Tecnicamente isso é feito anexando ao ativo uma regra que faz a própria blockchain recusar qualquer tentativa de transferência.

**Por que está aqui.** É o que separa uma credencial de um colecionável. Um certificado de horas complementares que pudesse ser vendido não valeria nada como comprovação — bastaria comprar as horas de outra pessoa. Cada credencial emitida aqui usa o plugin `PermanentFreezeDelegate` do Core, e a recusa foi verificada na prática: o dono legítimo, com saldo e assinando corretamente, tem a transferência rejeitada pelo próprio programa on-chain.

### Dados on-chain e off-chain

**O que é.** Nem tudo de um NFT costuma ficar dentro da blockchain. O padrão mais comum é guardar na rede apenas o essencial e um endereço (uma URL) apontando para um arquivo em algum servidor, onde ficam nome, descrição e imagem. Isso é mais barato, mas cria uma dependência: se aquele servidor sair do ar ou mudar de dono, o NFT perde parte do seu conteúdo — problema conhecido no meio.

**Por que está aqui.** Como a credencial precisa ser verificável a longo prazo, os dados que provam a atividade — categoria, carga horária, data e emissor — são gravados **dentro da blockchain**, usando o plugin `Attributes` do Core. O arquivo externo continua existindo, mas só para a parte cosmética (imagem e descrição bonitas na carteira). Na prática: se o servidor deste projeto for desligado amanhã, as credenciais já emitidas continuam comprovando as horas.

### RPC

**O que é.** RPC (Remote Procedure Call) é o protocolo que um aplicativo usa pra "conversar" com uma blockchain — pra ler informação (o saldo de uma carteira, os dados de uma conta) ou pra enviar uma transação nova. Funciona como a linha telefônica entre o código do app e a rede.

**Por que está aqui.** Toda ação do projeto — conectar carteira, mintar uma credencial, consultar dados — passa por uma chamada RPC pra devnet da Solana.

### Helius

**O que é.** Helius é uma empresa que fornece infraestrutura pra ler blockchains, como a Solana, de forma rápida e organizada. Ela resolve um problema específico: a Solana não tem um jeito nativo e rápido de responder perguntas como "quais NFTs essa carteira específica possui" — isso, na prática, exigiria varrer o histórico inteiro da rede. A Helius mantém um índice pronto disso, chamado DAS API — parecido com um catálogo organizado de biblioteca, em vez de precisar ler livro por livro até achar o que se procura.

**Por que está aqui.** É a Helius que permite que a página "minhas credenciais" e a verificação pública respondam rápido, sem o projeto precisar rodar e manter sua própria indexação da blockchain — o que seria um trabalho de infraestrutura considerável pra um projeto solo.

---

## Desenvolvimento web

### Next.js

**O que é.** Next.js é um framework construído sobre o React (uma biblioteca muito usada pra construir interfaces) que junta, num projeto só, tanto as telas que o usuário vê quanto o código de servidor que roda por trás.

**Por que está aqui.** O projeto precisa das duas coisas: telas (organizador cria atividade, aluno vê suas credenciais) e lógica de servidor (a chave que paga a taxa de mint não pode ficar exposta no navegador). Next.js permite fazer os dois num único projeto, sem manter um backend separado.

### TypeScript

**O que é.** TypeScript é o JavaScript com um sistema de tipos por cima — ele avisa quando uma parte do código tenta usar um dado de um jeito incompatível com o que era esperado, antes mesmo de rodar.

**Por que está aqui.** SDKs de blockchain lidam com estruturas de dados sensíveis — chaves públicas, endereços, valores — onde um erro de tipo pode causar uma falha silenciosa numa transação real. TypeScript pega boa parte desses erros ainda durante o desenvolvimento.

### Tailwind CSS

**O que é.** Tailwind é uma forma de estilizar páginas usando classes utilitárias curtas direto no código (como `text-lg` ou `p-4`), em vez de escrever arquivos de CSS separados.

**Por que está aqui.** Acelera a construção de telas simples e funcionais sem precisar manter um sistema de design separado — apropriado pro escopo de um MVP.

### shadcn/ui

**O que é.** Uma coleção de componentes de interface prontos — botões, formulários, cartões — feita pra ser copiada pro projeto e ajustada, em vez de instalada como uma dependência fechada.

**Por que está aqui.** Evita reconstruir do zero elementos comuns de interface, como o formulário de criar atividade, deixando mais tempo pra parte que é de fato específica do projeto: a lógica on-chain.

### Prisma

**O que é.** Prisma é uma ferramenta que facilita a comunicação entre o código e um banco de dados — em vez de escrever comandos de banco na mão, você descreve os dados num formato mais simples e o Prisma cuida da tradução.

**Por que está aqui.** Guarda duas coisas: a atividade criada pelo organizador — que precisa existir em algum lugar entre a criação e o check-in do primeiro aluno — e um índice do que já foi emitido, usado para não mintar a mesma credencial duas vezes para a mesma carteira. Note que o banco **não é a fonte da verdade** de nenhuma credencial: essa é sempre a blockchain. Tanto que as telas "minhas credenciais" e "verificar" leem direto da rede e funcionariam mesmo se o banco sumisse.

### SQLite

**O que é.** Um banco de dados que roda como um arquivo único no disco, sem precisar de um servidor de banco de dados separado rodando em algum lugar. Basta o arquivo existir para a aplicação ler e escrever nele.

**Por que está aqui.** Como o banco guarda pouca coisa — e nada que seja fonte da verdade de uma credencial —, um banco de produção robusto seria exagero. SQLite é suficiente e não exige instalar nem configurar nada para rodar o projeto localmente.

**Uma ressalva que vale conhecer.** Plataformas de hospedagem modernas (Vercel, por exemplo) rodam o código em ambientes efêmeros, onde o sistema de arquivos é descartado entre requisições — um banco em arquivo simplesmente não sobrevive ali. Por isso publicar este projeto exigiria trocar o SQLite por um Postgres hospedado. Como o Prisma abstrai a diferença, essa troca mexe só na configuração de conexão, não no código do app.

---

## Para saber mais

Este documento cobre os conceitos isoladamente. Pra ver como eles se encaixam no fluxo completo do projeto — do organizador criando a atividade até a verificação pública da credencial — veja o [README](./README.md) principal.
