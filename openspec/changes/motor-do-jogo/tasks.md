# Tasks

## 1. Base do store

- [ ] 1.1 Confirmar que `src/app/dominio/` existe e exporta a API descrita em `dominio-do-jogo` (`coordenada`, `posicionar`, `remover`, `criarPartida`, `posicionarEmbarcacao`, `removerEmbarcacao`, `iniciarBatalha`, `atacar`, `escolherAtaqueAleatorio`, `coordenadasNaoAtacadas`); se faltar, interromper e aplicar `dominio-do-jogo` antes, verificando com `npm run build` que os imports compilam
- [ ] 1.2 Criar `src/app/estado/aleatorio.ts` com o tipo `Aleatorio` e o `InjectionToken` `ALEATORIO` com fábrica padrão `Math.random`; verificar com `npm run build` e com um teste em `jogo-store.spec.ts` que o token resolve sem provider explícito
- [ ] 1.3 Criar `src/app/estado/jogo-store.ts` com `EstadoDoJogo`, `signal` privado inicializado por `criarPartida`, a ação `novaPartida()` e os seletores `fase`, `turno`, `vencedor`, `encerrada` e `frotaDoJogador`; cobrir em `jogo-store.spec.ts` com `TestBed` e `ALEATORIO` fixo que o estado nasce em preparação, com jogador vazio e sem vencedor, e que o estado público não expõe a frota do computador; verificar com `npm test`

## 2. Preparação

- [ ] 2.1 Adicionar `posicionar(tipo, origem, orientacao)` e `remover(tipo)` devolvendo `ResultadoAcao`, escrevendo o estado somente em caso de sucesso; cobrir em `jogo-store.spec.ts` posicionamento aceito, posicionamento fora do tabuleiro e sobreposto recusados com estado preservado, remoção aceita e recusa fora da fase de preparação; verificar com `npm test`
- [ ] 2.2 Adicionar `iniciarBatalha()`; cobrir em `jogo-store.spec.ts` recusa com frota incompleta mantendo a fase, e início com as cinco embarcações mudando para batalha e turno do jogador; verificar com `npm test`

## 3. Batalha, turno do computador e histórico

- [ ] 3.1 Adicionar `atacar(coordenada)`, o histórico de eventos de ataque e os seletores derivados `ataquesNoJogador`, `ataquesNoComputador`, `coordenadasAtacaveis` e `marcasNoTabuleiro*`; cobrir em `jogo-store.spec.ts` ataque válido com alternância de turno, ataque repetido recusado sem novo evento, coordenada atacada removida de `coordenadasAtacaveis` e marcas presentes apenas para coordenadas atacadas; verificar com `npm test`
- [ ] 3.2 Adicionar `jogarTurnoDoComputador()` usando `escolherAtaqueAleatorio` sobre o tabuleiro do jogador; cobrir em `jogo-store.spec.ts` ataque do computador em coordenada não atacada, devolução do turno ao jogador, recusa quando o turno é do jogador ou a fase não é batalha e escolha da última coordenada disponível; verificar com `npm test`
- [ ] 3.3 Cobrir o encerramento e o reinício em `jogo-store.spec.ts`: destruir a última embarcação do computador encerra a partida sem conceder turno ao computador, `vencedor` é exposto corretamente nos dois lados, ataque após o encerramento é recusado e `novaPartida()` descarta histórico e reseta a fase para preparação; verificar com `npm test`

## 4. Verificação de integração

- [ ] 4.1 Rodar em sequência `npm test`, `npm run build`, `npm run lint` e `npm run format:check` e verificar que os quatro terminam com sucesso
- [ ] 4.2 Verificar com busca por `JogoStore` em `src/` que o serviço não é importado por componentes ou telas nesta change, confirmando o recorte de motor
- [ ] 4.3 Rodar `openspec validate "motor-do-jogo" --strict` e verificar que a change não reporta erros nem avisos

## Workflow follow-up

- Aplicar `dominio-do-jogo` antes de `motor-do-jogo`.
- Arquivar a change com `openspec archive "motor-do-jogo"` após a revisão, confirmando que `openspec/specs/controle-da-partida` e `historico-da-partida` foram criados.
