# Proposal

## Why

O domínio (`src/app/dominio`) e o store (`src/app/estado`) estão prontos e testados, mas o jogo ainda não tem nenhuma interface utilizável — o app exibe apenas um placeholder. A tela de preparação é a primeira superfície jogável: sem ela, o jogador não consegue posicionar a frota nem iniciar uma batalha.

## What Changes

- Nova tela de preparação com o tabuleiro do jogador (10×10), lista das embarcações pendentes e painel de controle.
- Posicionamento por "selecionar e clicar": o jogador escolhe uma embarcação pendente, alterna a orientação (horizontal/vertical) e clica numa célula do tabuleiro para posicioná-la, com pré-visualização do encaixe no hover.
- Remoção/reposição de embarcações já posicionadas durante a preparação (clique na embarcação no tabuleiro ou no painel).
- Geração automática da frota do jogador (nova ação no `JogoStore` reutilizando `gerarFrotaAleatoria` e o token `ALEITORIO`).
- Exibição do motivo quando um posicionamento é recusado (fora do tabuleiro, sobreposição) e feedback de progresso (embarcações posicionadas / total).
- Botão "Iniciar batalha" habilitado somente com a frota completa; ao iniciar, a interface sai da preparação.
- Fora do escopo: tela de batalha, ataques, histórico visível e fim de partida (changes futuras).

## Capabilities

### New Capabilities

- `interface-de-preparacao`: comportamento observável da tela de preparação — exibição do tabuleiro do jogador e da frota pendente, seleção de embarcação e orientação, posicionamento por clique com pré-visualização, remoção, geração automática, feedback de recusa, progresso da frota e habilitação do início da batalha.

### Modified Capabilities

(nenhuma — as specs existentes `frota`, `combate`, `partida`, `controle-da-partida` e `historico-da-partida` descrevem regras de domínio e do store que permanecem válidas sem alteração de requisitos)

## Impact

- `src/app/` — novos componentes standalone da tela de preparação (tabuleiro, painel de embarcações, controles), `app.ts`/`app.html` passam a renderizar a UI por fase.
- `src/app/estado/jogo-store.ts` — nova ação para posicionar a frota do jogador automaticamente (reutiliza `gerarFrotaAleatoria` do domínio e o `ALEATORIO` já injetado).
- `src/app/dominio/` — sem alterações.
- Specs existentes — sem alterações (nenhuma delta de modificação).
- Testes: specs de componente junto aos novos componentes; `npm test`, `npm run build`, `npm run lint` e `npm run format:check` devem continuar verdes.
