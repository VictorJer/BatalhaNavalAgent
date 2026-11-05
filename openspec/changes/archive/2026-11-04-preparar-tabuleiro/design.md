# Design

## Context

Ver `proposal.md` para motivação e `specs/interface-de-batalha/spec.md` para o contrato visual. A change envolve o tabuleiro reutilizável, a composição de batalha e a seleção de telas, justificando este design.

Estado observado no workspace:

- `JogoStore` já expõe `fase`, `turno`, `vencedor`, `frotaDoJogador`, `coordenadasAtacaveis`, os mapas `marcasNoTabuleiroDoJogador`/`marcasNoTabuleiroDoComputador` e `historico`. As ações `atacar`, `jogarTurnoDoComputador` e `novaPartida` são síncronas.
- Os mapas preservam o resultado de cada tiro. Quando ocorre destruição, somente a coordenada do último tiro recebe `destruida`; os acertos anteriores não são reclassificados. Os eventos de ataque contêm autor, coordenada e resultado, não tipo nem posições completas da embarcação.
- O retorno de `atacar` usa `tipo: 'ok'` também para ataques repetidos ou fora do tabuleiro, discriminados dentro de `ataque`. Logo, testar apenas `tipo === 'ok'` não basta para disparar o computador.
- `Tabuleiro`, em `src/app/preparacao/tabuleiro.ts`, é apresentacional, com 100 botões, estado por coordenada e outputs de clique/apontamento. Seu nome acessível está fixo em “Tabuleiro do jogador”; não oferece marcas de ataque nem bloqueios.
- `App` mantém `TelaDePreparacao` na fase `preparacao` e um placeholder nas demais. Os testes usam TestBed, Vitest e `provedoresDaAplicacao`; o store já possui testes com `ALEATORIO` semeado e sequências controladas para vitória e derrota.
- A preparação já foi implementada, mas sua change ainda não foi arquivada. Planejar sobre esse código existente sem editar seus artefatos nem exigir seu arquivamento.

## Goals / Non-Goals

**Goals:**

- Compor o estado público existente sem duplicar a partida ou mudar o contrato do store.
- Reutilizar a grade para preparação e combate, com extensão retrocompatível e testes de regressão.
- Tornar a rodada síncrona previsível, preservando os dois resultados mesmo sem renderização intermediária do turno do computador.
- Encerrar e reiniciar pela UI usando exclusivamente as ações públicas existentes.

**Non-Goals:**

- Novo serviço de turnos, timers, effects para jogar automaticamente, estado global adicional ou regras de combate na UI.
- Expor a frota do computador, inferir embarcações por adjacência ou reclassificar acertos anteriores quando houver destruição.
- Mover o componente de tabuleiro para outra pasta nesta change: a reutilização direta do caminho atual evita uma refatoração sem benefício comportamental imediato.
- Reescrever preparação, implementar histórico completo visível ou redesenhar as specs existentes de domínio.

## Decisions

### D1 — Ampliar o contrato apresentacional do Tabuleiro com defaults compatíveis

Manter `celulas`, `celulaClicada` e `celulaApontada`. Acrescentar a `EstadoDaCelula` os campos opcionais `resultado` (`agua | acerto | destruida`) e `bloqueada`; adicionar inputs `rotulo` (padrão “Tabuleiro do jogador”) e `bloqueado` (padrão `false`). O componente não injeta o store e não decide turnos.

Uma célula fica nativamente desabilitada quando o bloqueio global ou individual estiver ativo; o caminho de emissão de clique também respeita o bloqueio. Na preparação, nenhum novo input é exigido e células sem resultado mantêm o `aria-label` de coordenada usado pelos testes atuais. No combate, células marcadas acrescentam o resultado ao nome acessível, sem inserir dados de ocupação adversária. A composição escolhe os nomes distintos “Tabuleiro do jogador” e “Tabuleiro do computador”.

**Alternativa:** duplicar a grade em `batalha/` — rejeitada para evitar divergência de comportamento e manutenção de duas implementações das mesmas 100 células. Mover o componente para uma pasta compartilhada pode ocorrer em refatoração posterior, não é necessário para este comportamento.

### D2 — TelaDeBatalha deriva as duas projeções a partir do store

Criar `src/app/batalha/tela-de-batalha.ts`, com template próprio em `tela-de-batalha.html` para manter a composição legível, e testes em `tela-de-batalha.spec.ts`. Usar componente standalone e `computed` para os mapas de células, disponibilidade de ataque, indicação do turno e resultados finais.

- Mapa do jogador: posições de `frotaDoJogador()` combinadas com `marcasNoTabuleiroDoJogador()`; tabuleiro inteiro bloqueado, sem ligação de clique para posicionar ou atacar.
- Mapa do computador: apenas `marcasNoTabuleiroDoComputador()` e disponibilidade de `coordenadasAtacaveis()`. Células atacadas têm bloqueio individual; bloqueio global enquanto `fase() !== 'batalha'` ou `turno() !== 'jogador'`.
- Não preencher o campo `embarcacao` no mapa adversário. Não usar o conteúdo completo de embarcação eventualmente presente no retorno de um ataque para construir a UI.

**Alternativa:** montar um novo estado de combate local — rejeitada porque os seletores já oferecem a fonte única e são suficientes para restaurar a apresentação ao montar o componente sobre uma partida em andamento.

### D3 — Orquestração explícita, síncrona e sem efeitos de turno

O método `atacarCoordenada(alvo)` primeiro verifica fase, turno e se o alvo pertence ao conjunto de coordenadas atacáveis. Em seguida chama `jogo.atacar(alvo)`. Só considera ataque aplicado quando `resultado.tipo === 'ok'` e `resultado.ataque?.tipo` é `agua`, `acerto` ou `destruida`.

Após ataque aplicado, consultar novamente fase e turno: chamar `jogo.jogarTurnoDoComputador()` exatamente uma vez somente se a fase ainda for `batalha` e o turno for `computador`. O encerramento causado pelo jogador impede a resposta. As recusas nunca disparam resposta automática. O evento nativo de clique serve tanto ao mouse quanto à ativação por Enter/Espaço; não adicionar outro handler que duplique o ataque.

**Alternativas:** timer de 600 ms, botão “Turno do computador” ou effect observando o turno — rejeitadas pela escolha do usuário de resposta imediata e por introduzirem agendamento, cancelamento e risco de execução duplicada desnecessários.

Como os dois ataques ocorrem no mesmo handler, não há garantia de uma pintura visível do estado intermediário “Vez do computador”. A indicação reflete sempre o estado atual; não se cria uma pausa apenas para exibi-la. Um teste pode montar o componente com o store no turno do computador para verificar a indicação e os bloqueios sem exigir timer.

### D4 — Resultados persistentes e resumos derivados do histórico

Usar os mapas públicos para as marcas e dois `computed` sobre `historico()` para localizar o último evento `ataque` de cada autor. Mostrar autor, coordenada e tradução do resultado (“Água”, “Acerto”, “Embarcação destruída”), com ausência explícita antes do primeiro tiro. Os resumos ficam lado a lado ou empilhados dentro de uma região `role="status"` com anúncio da atualização; o contra-ataque não sobrescreve o resultado do jogador.

Não usar apenas um signal de “última mensagem” nem expor todos os eventos. A destruição identifica o tiro final com marca própria; acertos anteriores continuam acertos, refletindo o modelo público sem inferência de frota. A legenda explica essa convenção.

**Alternativa:** guardar o último retorno de cada ação em signals locais — rejeitada pois perderia o resumo ao recriar a tela e seria uma segunda representação de dados já registrados.

### D5 — Marcas legíveis sem depender somente de cor

Usar Tailwind e o tema atual para distinguir os resultados, dando prioridade visual ao resultado do tiro sobre a cor de embarcação. Usar símbolos Lucide distintos para água, acerto e destruição, registrados em `app.config.ts`, junto de legenda textual e nome acessível com coordenada/resultado; ícones decorativos ficam com `aria-hidden`. Não acrescentar nome ou tipo de embarcação ao alvo adversário.

**Alternativa:** apenas fundos coloridos — rejeitada pelo requisito de distinguir resultados sem depender de cores do README e da nova spec.

### D6 — Encerramento no mesmo componente e reinício pelo shell

`App` renderiza preparação exclusivamente em `preparacao`; renderiza `TelaDeBatalha` em `batalha` e `encerrada`, mantendo o título “Batalha Naval”. A tela encerrada mantém os dois tabuleiros, substitui a instrução de turno por “Você venceu!” ou “O computador venceu. Você perdeu.” e mostra “Nova partida” somente nessa fase.

O botão delega a `jogo.novaPartida()`. A alteração da fase desmonta a batalha e volta à preparação; os resumos derivados do histórico reiniciado não sobrevivem à próxima batalha. Sem revelação extra da frota adversária ao final.

**Alternativa:** terceira tela exclusiva de resultado — rejeitada por duplicar ou perder a visualização dos tabuleiros finais e ampliar desnecessariamente esta fase do projeto.

### D7 — Testes determinísticos e verificação de compatibilidade

Expandir `tabuleiro.spec.ts` para marcas, rótulos, bloqueio global/individual e preservação do preview. A spec da tela usa `provedoresDaAplicacao` e sobrescreve `ALEATORIO` com gerador semeado ou sequência controlada, seguindo `jogo-store.spec.ts`. Preparar estados via ações públicas; não escrever em signals privados nem extrair frota oculta do store.

Separar testes de projeção/markup de testes de rodada real. Para água, acerto, destruição e desfechos, fixar a sequência aleatória e as coordenadas esperadas em helpers locais de teste, usando os padrões existentes de vitória/derrota. Comparar eventos antes/depois, inclusive exatamente um contra-ataque ou nenhum após vitória/recusa. Testar os resumos após uma rodada completa e a preservação de marcas após vários turnos.

Ampliar `app.spec.ts` para o fluxo preparação → batalha → encerramento → preparação → nova batalha. Manter specs de preparação verdes. Testes DOM não comprovam layout nem ativação nativa por teclado: complementar com verificação no navegador em 360 px e desktop, Enter/Espaço e foco visível, sem adicionar nova dependência de testes.

## Risks / Trade-offs

- [Uma rodada síncrona não mostra visualmente o turno intermediário] → aceito por decisão do usuário; manter os dois resumos de ataque evita perder o feedback do primeiro tiro.
- [Tratar todo retorno `ok` como tiro válido produz contra-ataques indevidos] → discriminar também o resultado interno de ataque e verificar novamente fase/turno antes da resposta.
- [Dados completos de uma embarcação no retorno do domínio podem revelar a frota adversária] → construir a apresentação adversária somente com mapas resumidos e verificar conteúdo, atributos e rótulos das células não atacadas.
- [Inputs novos ou ícones podem quebrar testes da preparação] → manter defaults e contratos anteriores, compartilhar provedores de aplicação nos testes e executar regressão completa.
- [Botões pequenos ou duas grades causam overflow no mobile] → duas colunas somente em telas largas, empilhamento no mobile, largura fluida com `min-w-0`, teste no navegador em 360 px.
- [Foco pode ficar na célula recém-desabilitada] → verificar navegação por Tab para o próximo alvo disponível e para “Nova partida”; não criar handlers de teclado paralelos que dupliquem a ação nativa.
- [Destruição marcada apenas no tiro final pode parecer inconsistente] → legenda e resumo textual explícitos; não prometer realce de toda a embarcação que o modelo de marcas não oferece.

## Migration Plan

Sem migração de dados ou dependências. Implementar em pequenas etapas: contrato do tabuleiro e regressão, projeções da batalha, orquestração, encerramento/integração e verificação. A preparação existente é a base; seus arquivos de planejamento e as main specs não são alterados por esta implementação.

Para rollback, retirar a integração de `TelaDeBatalha` do shell e restaurar o placeholder anterior, revertendo apenas as alterações desta change. Não descartar trabalho da preparação ou outras mudanças do workspace.
