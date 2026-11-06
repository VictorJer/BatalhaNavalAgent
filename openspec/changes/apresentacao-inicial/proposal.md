# Proposal

## Why

O README prevê que a pessoa comece pela apresentação do jogo, mas a aplicação abre diretamente na preparação da frota. Falta uma entrada explícita que explique o objetivo antes de mostrar os controles de posicionamento.

## What Changes

- Exibir uma apresentação inicial separada ao abrir a aplicação, com uma explicação breve do jogo e uma ação clara para começar.
- Ao acionar essa entrada, mostrar a preparação já existente com frota vazia, sem alterar as regras ou antecipar a batalha.
- Manter o fluxo atual após o encerramento: “Nova partida” retorna diretamente à preparação, sem repetir a apresentação.
- Preservar o acesso por teclado e a legibilidade em tela estreita.
- Fora do escopo: mudanças nas regras, reposicionamento de embarcações, rotas, persistência, placar ou alterações na tela de batalha.

## Capabilities

### New Capabilities

- `interface-inicial`: apresentação do jogo e transição explícita para a preparação na primeira abertura da aplicação.

### Modified Capabilities

Nenhuma. As capacidades `partida`, `controle-da-partida` e `interface-de-preparacao` continuam definindo preparação, combate e reinício da mesma forma; a apresentação antecede a exibição da preparação, sem acrescentar uma fase ao domínio.

## Impact

- Shell em `src/app/app.ts` e `src/app/app.html`, com uma apresentação pequena e isolada da interface de preparação existente.
- Testes de integração em `src/app/app.spec.ts` para entrada inicial, acesso à preparação e reinício; eventuais testes dedicados à apresentação.
- Sem mudança no domínio, no `JogoStore`, em dependências ou nas specs existentes.
