# Tasks

## 1. Extensão do store

- [x] 1.1 Adicionar a ação `posicionarFrotaAutomaticamente()` em `src/app/estado/jogo-store.ts` — gera a frota com `gerarFrotaAleatoria(this.aleatorio)`, substitui a frota do jogador, emite os eventos `embarcacao-removida` (tipos antes posicionados) e `embarcacao-posicionada` (cinco tipos, na ordem de `TIPOS_DAS_EMBARCACOES`) e recusa fora da fase de preparação. Verificar: novos casos em `src/app/estado/jogo-store.spec.ts` cobrindo frota completa resultante, substituição de posicionamento parcial, recusa fora da preparação e eventos no histórico, com `ALEATORIO` determinístico — `npm test` verde.

## 2. Componente Tabuleiro

- [x] 2.1 Criar `src/app/preparacao/tabuleiro.ts` com spec `tabuleiro.spec.ts` — grade 10×10 de botões com `aria-label` da coordenada (ex.: "B3"), entradas de estado por célula (embarcação posicionada, preview válido, preview inválido) e saídas de célula clicada e célula apontada. Verificar no spec: renderiza 100 células, emite o clique com a coordenada correta e aplica as classes de estado do preview.

## 3. Tela de Preparação

- [x] 3.1 Criar `src/app/preparacao/tela-de-preparacao.ts` com spec `tela-de-preparacao.spec.ts` — signals `selecionada`, `orientacao` (padrão horizontal), `celulaApontada` e `mensagemDeRecusa`; painel com as cinco embarcações (pendente/posicionada), botão de alternar orientação e indicador de progresso. Verificar no spec: seleção de pendente, orientação inicial horizontal e alternância para vertical.
- [x] 3.2 Implementar preview derivado e posicionamento por clique — preview com `posicoesDe`/`posicoesOcupadas` (excluindo o próprio tipo), clique delegando ao store `posicionar(...)`, sucesso liberando a seleção e limpando a mensagem, recusa exibindo o motivo sem alterar o tabuleiro. Verificar no spec: aceitação, reposição, recusa por fora do tabuleiro, recusa por sobreposição e limpeza da mensagem após ação bem-sucedida.
- [x] 3.3 Implementar remoção e geração automática na tela — clique na embarcação posicionada chama `remover(tipo)` e a ação de gerar frota chama `posicionarFrotaAutomaticamente()`. Verificar no spec: remoção libera as células e devolve a embarcação a pendente; geração resulta em frota completa substituindo o posicionamento anterior.
- [x] 3.4 Implementar o botão "Iniciar batalha" condicionado à frota completa e a exibição da tela somente na fase de preparação — botão desabilitado com frota incompleta, habilitado com as cinco embarcações, e a tela sai ao iniciar. Verificar no spec: estado do botão desabilitado/habilitado nos dois casos e a fase passando a batalha após o clique.

## 4. Integração no shell

- [x] 4.1 Atualizar `src/app/app.ts`/`app.html` para renderizar `TelaDePreparacao` apenas quando `fase() === 'preparacao'` (mantendo o `<h1>Batalha Naval</h1>` e um placeholder nas demais fases) e registrar os ícones Lucide usados em `src/app/app.config.ts`. Verificar: `app.spec.ts` ampliado cobrindo a tela de preparação na fase inicial e o placeholder fora dela — `npm test` verde.

## 5. Verificação final

- [x] 5.1 Rodar `npm test`, `npm run build`, `npm run lint` e `npm run format:check` e confirmar que todos terminam sem erro.

## Workflow follow-up

- Revisar a change e, quando satisfeito, executar o workflow de archive (`/opsx-archive`), sincronizando a delta `interface-de-preparacao` com os main specs.
