# Tasks

## 1. Coordenada

- [x] 1.1 Criar `src/app/dominio/coordenada.ts` com o tipo marcado `Coordenada`, a fábrica `coordenada(linha, coluna)` (que rejeita fora do tabuleiro), `linhaDe`, `colunaDe`, `rotulo` e as constantes de tabuleiro, e cobrir em `coordenada.spec.ts` criação válida, criação inválida, ida e volta `A1`/`J10` e conversão de índices; verificar com `npm test` que os testes de coordenada passam
- [x] 1.2 Confirmar em `coordenada.spec.ts` que duas coordenadas com a mesma linha e coluna criadas separadamente são iguais em um `Set`; verificar com `npm test` que o teste de igualdade por valor passa

## 2. Embarcações e frota

- [x] 2.1 Criar `src/app/dominio/embarcacao.ts` com `TipoEmbarcacao`, a ficha dos cinco tipos e `posicoesDe(origem, orientacao, tamanho)`, e cobrir em `embarcacao.spec.ts` os tamanhos 5/4/3/3/2, a geração horizontal e vertical e a recusa quando a embarcação ultrapassa a borda; verificar com `npm test`
- [x] 2.2 Criar `src/app/dominio/frota.ts` com `Frota`, `posicionar`, `remover`, `posicoesOcupadas`, `estaCompleta` e o tipo `ResultadoPosicionamento`, tratando substituição atômica da embarcação do mesmo tipo; cobrir em `frota.spec.ts` porta-aviões a partir de A8 recusado, sobreposição recusada com frota preservada, embarcações vizinhas aceitas (inclusive na diagonal), substituição, remoção e frota incompleta; verificar com `npm test`
- [x] 2.3 Criar `src/app/dominio/frota-aleatoria.ts` com `gerarFrotaAleatoria(aleatorio?)` seguindo o algoritmo maior-primeiro do `design.md`, e cobrir em `frota-aleatoria.spec.ts` 500 execuções verificando 5 embarcações, 17 posições, nenhuma fora do tabuleiro e nenhuma sobreposição, além de duas execuções com a mesma semente produzirem a mesma frota; verificar com `npm test`

## 3. Tabuleiro e combate

- [x] 3.1 Criar `src/app/dominio/tabuleiro.ts` com `Tabuleiro`, `atacar`, `estaDerrotado`, `coordenadasNaoAtacadas` e o tipo `ResultadoAtaque`; cobrir em `tabuleiro.spec.ts` água, acerto, destruição na última posição intacta, ataque repetido sem novo registro, coordenada fora do tabuleiro, acerto que não revela as demais posições e derrota somente após destruir toda a frota; verificar com `npm test`
- [x] 3.2 Adicionar `escolherAtaqueAleatorio(tabuleiro, aleatorio?)` em `tabuleiro.ts` e cobrir em `tabuleiro.spec.ts` que a coordenada escolhida nunca está entre as já atacadas, que a última coordenada disponível é escolhida e que o resultado é `null` com o tabuleiro esgotado; verificar com `npm test`

## 4. Partida

- [x] 4.1 Criar `src/app/dominio/partida.ts` com `criarPartida(aleatorio?)`, `posicionarEmbarcacao`, `removerEmbarcacao` e `iniciarBatalha`; cobrir em `partida.spec.ts` que a partida nasce em `preparacao` com jogador vazio e computador completo, que posicionar/remover funcionam nessa fase e que `iniciarBatalha` recusa frota incompleta e define o turno inicial do jogador; verificar com `npm test`
- [x] 4.2 Implementar `atacar(partida, coordenada)` com o tipo `ResultadoAtaqueDaPartida`; cobrir em `partida.spec.ts` que o turno alterna após água, após acerto e após destruição, que ataque repetido e ataque em fase inválida não consomem o turno, e que o computador ataca o tabuleiro do jogador ao receber o turno; verificar com `npm test`
- [x] 4.3 Cobrir em `partida.spec.ts` o encerramento: destruir a última embarcação do computador encerra a partida sem conceder ataque de resposta, destruir a frota do jogador declara o computador vencedor, ataque após o encerramento é recusado e `criarPartida` após o fim produz tabuleiros sem ataques e frota nova para o computador; verificar com `npm test`

## 5. Verificação de integração do domínio

- [x] 5.1 Verificar que nenhum arquivo em `src/app/dominio/` importa `@angular/*` (busca por `from '@angular`) e que `npm test` executa toda a suíte sem `TestBed`
- [x] 5.2 Rodar em sequência `npm run build`, `npm run lint` e `npm run format:check` e verificar que os três terminam com sucesso
- [x] 5.3 Rodar `openspec validate "dominio-do-jogo" --strict` e verificar que a change não reporta erros nem avisos

## Workflow follow-up

- Arquivar a change com `openspec archive "dominio-do-jogo"` após a revisão, confirmando que `openspec/specs/frota`, `combate` e `partida` foram criados.
- Registrar no `README.md` ou no `config.yaml` apenas se alguma decisão desta fase alterar o contrato documentado.
