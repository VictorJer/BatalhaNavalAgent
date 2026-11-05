# Design

## Context

O domínio (`src/app/dominio`) e o store (`src/app/estado/jogo-store.ts`) já expõem tudo o que a preparação precisa: `JogoStore` com seletores (`fase`, `frotaDoJogador`) e ações (`posicionar`, `remover`, `iniciarBatalha`), mais as funções puras de domínio `posicoesDe`, `tamanhoDe`, `posicoesOcupadas`, `estaCompleta` e `gerarFrotaAleatoria`. A UI atual é um placeholder (`app.ts`/`app.html`) e não há componentes além dele. O app é Zoneless, com Signals, Tailwind 4 (tema com cores `agua`, `acerto`, `navio` etc. em `styles.css`) e Lucide via `provideLucideIcons`. Testes usam TestBed + vitest com `provedoresDaAplicacao`.

Ver proposal.md para o motivo e as specs da delta `interface-de-preparacao` para os requisitos.

## Goals / Non-Goals

**Goals:**
- Tela de preparação jogável: posicionamento por "selecionar e clicar", remoção, geração automática e início da batalha.
- Componente de tabuleiro 10×10 reutilizável pela futura tela de batalha.
- Manter domínio e specs existentes inalterados; manter `npm test`, `build`, `lint` e `format:check` verdes.

**Non-Goals:**
- Tela de batalha, exibição de ataques/histórico e fim de partida (changes futuras).
- Alterar regras de domínio ou requisitos das specs existentes.
- Arrastar-e-soltar ou posicionamento por dois cliques (a interação escolhida é selecionar e clicar).

## Decisions

**D1 — Estrutura de componentes em `src/app/preparacao/`.** `TelaDePreparacao` (composição, estado de seleção, ligação ao store) e `Tabuleiro` (grade 10×10 puramente apresentacional, entradas: mapa de estado por célula, saída: célula clicada/apontada). *Alternativa considerada:* tudo em `app.*` — rejeitada porque o tabuleiro será reutilizado pela tela de batalha e a raiz ficaria ilegível. O shell `app.html` mantém o `<h1>Batalha Naval</h1>` (teste existente em `app.spec.ts`) e renderiza `TelaDePreparacao` somente quando `fase() === 'preparacao'`, com placeholder para as demais fases.

**D2 — Estado local da preparação em Signals na tela.** `selecionada` (`TipoEmbarcacao | null`), `orientacao` (padrão `horizontal`), `celulaApontada` e `mensagemDeRecusa` como signals; pendentes/posicionadas/progresso/encaixe como `computed`. *Alternativa:* estado no `JogoStore` — rejeitada: seleção e preview são efêmeros da UI, não mudam o estado da partida (o store continua a única fonte do estado do jogo, conforme `controle-da-partida`).

**D3 — Preview derivado, sem tocar no store.** O encaixe é calculado com `posicoesDe(origem, orientacao, tamanhoDe(tipo))`; `null` ⇒ inválido (fora do tabuleiro), caso contrário compara com `posicoesOcupadas` da frota excluindo o próprio tipo (repoisicionamento é permitido) ⇒ inválido (sobreposição). O clique sempre delega ao store `posicionar(...)`, que é quem decide aceitar ou recusar — o preview é apenas indicativo. *Alternativa:* tentar posicionar no hover para validação — rejeitada porque geraria eventos de histórico falsos se não houvesse descarte cuidadoso.

**D4 — Nova ação `posicionarFrotaAutomaticamente()` só no store.** Gera a frota com `gerarFrotaAleatoria(this.aleatorio)` (domínio já testado, garante frota completa e válida) e substitui `jogador.frota` com spread sobre a `Partida` imutável. O histórico recebe `embarcacao-removida` para cada tipo previamente posicionado e `embarcacao-posicionada` (com as posições) para cada um dos cinco tipos, na ordem de `TIPOS_DAS_EMBARCACOES`. *Alternativa:* nova função em `src/app/dominio/partida.ts` — rejeitada porque o proposal mantém o domínio inalterado; a validade da frota gerada já é garantida pelo domínio. *Nota:* um evento composto "frota-gerada" não existe no modelo de eventos de `historico-da-partida`, então reutiliza os tipos existentes.

**D5 — Mensagens de recusa em português, derivadas do `ResultadoPosicionamento`.** `fora-do-tabuleiro` → "A embarcação não cabe nessa posição"; `sobreposicao` → indica a embarcação conflitante. A mensagem é limpa ao concluir qualquer ação bem-sucedida (posicionar, remover, gerar). Botões e rótulos seguem o padrão de texto em português do projeto.

**D6 — Acessibilidade e responsividade.** Células são `<button>` com `aria-label` na coordenada (ex.: "B3"); preview e estados visuais só via classes CSS. Layout em duas colunas no desktop (tabuleiro à esquerda, painel à direita) e empilhado no mobile; grade com `aspect-square` e largura máxima para caber em 360px. Ícones Lucide registrados em `app.config.ts` conforme o botão usado.

**D7 — Testes.** Specs de componente junto aos arquivos (`tela-de-preparacao.spec.ts`, `tabuleiro.spec.ts`), TestBed com `provedoresDaAplicacao` e `JogoStore` (root). Para geração automática, sobrepõe-se `ALEATORIO` com sequência determinística — mesmo padrão do seed usado em `jogo-store.spec.ts`. Interação simulada por `.click()` em botões localizados por `aria-label`; `fixture.whenStable()` antes das asserções (padrão de `app.spec.ts`).

## Risks / Trade-offs

- [Preview no hover não existe em telas de toque] → o caminho de clique funciona sem preview; o preview é aprimoramento progressivo (o `celulaApontada` também pode ser atualizado por foco/teclado).
- [Substituição direta da frota no store contorna `posicionar` do domínio] → mitigado: só `gerarFrotaAleatoria` (contrato de domínio validado) alimenta a substituição, e a ação é restrita à fase `preparacao`, como as demais.
- [8 eventos de histórico por geração automática] → aceitável para partidas pequenas; alternativa (evento composto) exigiria delta na spec `historico-da-partida`, fora do escopo.
- [Mudança no `app.html` pode quebrar o teste de título] → o shell mantém o `<h1>Batalha Naval</h1>`; `app.spec.ts` continua válido e ganhará cobertura de fase em task própria.
