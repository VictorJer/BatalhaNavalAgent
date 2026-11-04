# Proposal

## Why

A fundação técnica está pronta (`fundacao-app`, arquivada), mas as regras do jogo existem apenas como texto no `README.md`: `openspec/specs/` está vazio porque a change anterior declarou `skip_specs: true`. Sem um domínio puro e testado — posicionamento, ataques, turnos e fim de partida — as telas de preparação e batalha teriam que reinventar essas regras dentro de componentes, onde ficam difíceis de testar e fáceis de divergir do enunciado.

## What Changes

- Criar a camada `src/app/dominio/` com funções puras e tipos imutáveis, **sem nenhum import de `@angular/*`**.
- Modelar `Coordenada` (linha A–J, coluna 1–10, com conversão para rótulo), `Embarcacao`, `Frota` (registro parcial por tipo), `Tabuleiro` (frota + ataques recebidos) e `Partida` (dois tabuleiros, turno, fase, vencedor).
- Implementar as operações de preparação: posicionar, remover, validar limites e sobreposição, verificar frota completa. Embarcações podem ficar encostadas, inclusive na diagonal.
- Implementar a resolução de ataque como união discriminada (`agua`, `acerto`, `destruida`, `repetido`, `fora-do-tabuleiro`, `partida-encerrada`), incluindo detecção de embarcação destruída e de tabuleiro derrotado.
- Implementar o ciclo da partida: jogador ataca primeiro, um ataque por turno (inclusive no acerto), encerramento imediato quando uma frota é destruída, recusa de ataques após o encerramento e transição para nova partida.
- Implementar `gerarFrotaAleatoria` e a escolha aleatória de ataque do computador, ambos com fonte de aleatoriedade injetável, para testes determinísticos.
- Criar testes unitários com Vitest cobrindo as regras e os cenários da seção 8 do `README.md`, além de propriedades da frota aleatória.

## Capabilities

### New Capabilities

- `frota`: composição da frota, posicionamento válido, reposicionamento antes da batalha e geração aleatória de frota.
- `combate`: resolução de um ataque contra um tabuleiro, identificação de acerto, erro, embarcação destruída e recusa de coordenadas repetidas ou inválidas.
- `partida`: ciclo de vida da partida — início condicionado às frotas completas, alternância de turnos, encerramento imediato, vencedor e nova partida.

### Modified Capabilities

Nenhuma — `openspec/specs/` está vazio; esta change cria as primeiras capabilities duráveis do projeto.

## Impact

- **Novos arquivos**: `src/app/dominio/coordenada.ts`, `embarcacao.ts`, `frota.ts`, `frota-aleatoria.ts`, `tabuleiro.ts`, `partida.ts`, `resultados.ts`, cada um com seu `*.spec.ts`.
- **Sem alteração** em `app.ts`, `app.html`, `app.config.ts`, `styles.css`, `package.json` ou configurações de build. Nenhuma dependência nova.
- **Specs**: criam `openspec/specs/frota/spec.md`, `combate/spec.md` e `partida/spec.md` quando a change for arquivada.
- **Fora de escopo**: componentes, telas, store com signals, timers do turno do computador, histórico formatado, persistência e estilo visual.
- **Consumido por**: Fase 2 (store) e Fases 3–4 (preparação e batalha), que passam a depender apenas da API pública de `dominio/`.
