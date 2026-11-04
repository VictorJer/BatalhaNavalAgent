# Proposal

## Why

O domínio planejado em `dominio-do-jogo` resolve as regras, mas não mantém estado: cada tela teria que guardar a `Partida` em um campo, decidir de quem é o turno e orquestrar o ataque do computador por conta própria. Sem uma camada de estado única, as Fases 3–4 duplicariam essa orquestração em componentes e divergiriam das regras já validadas.

## What Changes

- Criar `src/app/estado/` com um serviço injetável `JogoStore` que guarda a partida em um `signal` e expõe estado derivado por `computed`.
- Expor seletores somente leitura para a UI: fase, turno, vencedor, tabuleiro do jogador, tabuleiro do computador, frota restante, coordenadas atacáveis e situação de encerramento.
- Implementar ações que traduzem intenção da UI em operações de domínio: iniciar nova partida, posicionar embarcação, remover embarcação, iniciar batalha, atacar e executar o turno do computador.
- Centralizar a orquestração do turno do computador: escolher a coordenada com `escolherAtaqueAleatorio` e aplicar o ataque, sem timers e sem componentes.
- Manter um histórico ordenado de eventos da partida (embarcação posicionada/removida, batalha iniciada, ataque com autor/coordenada/resultado, encerramento), descartado ao iniciar nova partida.
- Fornecer um token de injeção `ALEATORIO` para que testes usem uma sequência determinística no lugar de `Math.random`.
- Devolver resultados discriminados das ações, para a UI distinguir sucesso, fase inválida, turno inválido e posicionamento recusado.

## Capabilities

### New Capabilities

- `controle-da-partida`: estado reativo da partida, transições de fase e turno, ações da UI, guardas de fase/turno e execução do ataque do computador.
- `historico-da-partida`: registro ordenado de eventos da partida, com dados de ataque suficientes para exibição e descarte ao iniciar nova partida.

### Modified Capabilities

Nenhuma — `openspec/specs/` está vazio porque a change `dominio-do-jogo` ainda não foi arquivada. As capabilities `frota`, `combate` e `partida` continuam sendo a fonte das regras; esta change apenas as consome.

## Impact

- **Novos arquivos**: `src/app/estado/jogo-store.ts`, `jogo-store.spec.ts` e `aleatorio.ts` (token de injeção), além de testes de estado derivado.
- **Dependência de implementação**: as ações do store chamam a API pública planejada em `dominio-do-jogo`; a change `motor-do-jogo` só pode ser aplicada depois que aquela estiver implementada.
- **Sem alteração** em `app.ts`, `app.html`, `app.config.ts`, `styles.css`, `package.json` ou configurações de build. Nenhuma dependência nova.
- **Fora de escopo**: componentes e telas, atraso visual do turno do computador (`setTimeout`), formatação das mensagens do histórico, persistência e testes de DOM.
- **Consumido por**: Fases 3–4 (preparação e batalha), que passam a ler seletores e chamar ações do store em vez de orquestrar regras.
