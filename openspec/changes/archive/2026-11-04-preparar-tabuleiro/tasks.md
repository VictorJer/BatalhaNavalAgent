# Tasks

## 1. Tabuleiro reutilizável e marcas de combate

- [x] 1.1 Ampliar `EstadoDaCelula` em `src/app/preparacao/tabuleiro.ts` com resultado de ataque e bloqueio individual, adicionar inputs `rotulo` e `bloqueado` com defaults compatíveis, aplicar `disabled` nativo e impedir emissão de clique bloqueado. Verificar em `tabuleiro.spec.ts`: 100 células, nome acessível por tabuleiro, bloqueio global/individual sem output, clique disponível com coordenada correta e preservação dos rótulos e preview da preparação; executar os testes de tabuleiro e preparação.
- [x] 1.2 Apresentar água, acerto e destruição com símbolos Lucide distintos e descrições acessíveis de coordenada/resultado, dando prioridade à marca do ataque sobre a aparência de embarcação; registrar os ícones usados em `src/app/app.config.ts`. Verificar em `tabuleiro.spec.ts`, com provedores compartilhados: cada resultado tem símbolo e descrição próprios, células sem resultado não ganham dados de ocupação e células de frota atingida preservam a marca de ataque; testes verdes sem erro de ícone não registrado.

## 2. Composição e projeções da batalha

- [x] 2.1 Criar `src/app/batalha/tela-de-batalha.ts`, `tela-de-batalha.html` e `tela-de-batalha.spec.ts`, consumindo os seletores públicos do store para compor os dois tabuleiros identificados, o próprio bloqueado e o adversário sem dados de frota. Usar duas colunas em telas largas e empilhamento em telas pequenas. Verificar com TestBed e `ALEATORIO` determinístico: 100 células por tabuleiro, frota própria visível, marcas derivadas dos mapas públicos, estado inicial sem ataques, células adversárias não atacadas sem indício de embarcação em texto/atributos/rótulos e tentativa no tabuleiro próprio sem mudança de estado.
- [x] 2.2 Derivar do histórico os resumos separados do último ataque de cada autor, apresentar mensagens iniciais sem ataque, região de status acessível, indicação textual do turno e legenda de água/acerto/destruição explicando a marca do tiro final. Verificar em `tela-de-batalha.spec.ts`: resumos com autor/coordenada/resultado após ações públicas do store, persistência dos dois resumos após a rodada, reconstrução ao recriar a tela e indicação/bloqueio corretos quando montada no turno do computador.

## 3. Ataques e resposta automática

- [x] 3.1 Ligar a seleção do alvo a `atacarCoordenada`, validar fase/turno/alvo disponível e delegar a `JogoStore.atacar`; após resultado interno `agua`, `acerto` ou `destruida`, executar exatamente uma resposta síncrona via `jogarTurnoDoComputador` somente se a fase e o turno ainda permitirem. Sem timer, effect de turno ou confirmação adicional. Verificar em `tela-de-batalha.spec.ts`, com sequências determinísticas: clique válido registra um ataque de cada lado na ordem correta, inclusive após acerto e destruição não terminal, atualiza as duas grades/resumos e devolve o turno ao jogador quando a partida continua.
- [x] 3.2 Cobrir as proteções da UI e da orquestração para repetição, fase inválida, turno inválido e resultados internos recusados, incluindo `tipo: 'ok'` com `ataque.tipo: 'repetido'` ou `fora-do-tabuleiro`. Verificar em `tela-de-batalha.spec.ts`: células já atacadas desabilitadas, tentativas indisponíveis sem mudança em histórico/ataques/turno e sem resposta automática; manter marcas de rodadas anteriores e confirmar que acerto adversário não revela células vizinhas nem tipos de embarcação.

## 4. Encerramento, reinício e integração

- [x] 4.1 Implementar o estado encerrado na mesma `TelaDeBatalha`: mostrar vitória ou derrota, manter tabuleiros e resumos finais, bloquear todos os alvos, ocultar a instrução de ataque e oferecer “Nova partida” somente após o fim, delegando a `JogoStore.novaPartida()`. Verificar em `tela-de-batalha.spec.ts`, com partidas determinísticas via ações públicas: vitória sem contra-ataque adicional, derrota pelo computador, sigilo de posições adversárias não atacadas preservado, tentativa pós-fim sem eventos novos e reinício zerando ataques/histórico anterior/vencedor/frota do jogador; não acessar estado privado.
- [x] 4.2 Atualizar `src/app/app.ts`/`app.html` para manter `TelaDePreparacao` exclusivamente em preparação e usar `TelaDeBatalha` nas fases batalha e encerrada, substituindo o placeholder e mantendo o título do jogo. Ampliar `app.spec.ts`: preparação inicial preservada, clique real em “Iniciar batalha” abre os dois tabuleiros, encerramento mantém a batalha sem controles de preparação, clique em “Nova partida” retorna à preparação com progresso zero e nova batalha começa sem marcas/resumos antigos. Executar também as specs existentes de preparação para comprovar compatibilidade.

## 5. Verificação integrada

- [x] 5.1 Executar `npm test -- --watch=false`, `npm run build`, `npm run lint` e `npm run format:check`; confirmar todos sem erro, incluindo testes anteriores de domínio, store e preparação, sem alterar suas regras para acomodar a UI.
- [x] 5.2 Verificar a aplicação no navegador em viewport de 360 px e em desktop: preparação → início → ataques alternados → encerramento → nova partida; confirmar ausência de rolagem horizontal/células cortadas, legendas legíveis, foco visível, ataques por Enter/Espaço sem duplicação e acesso por teclado a “Nova partida”. Registrar os resultados da verificação e eventuais limitações no resumo da implementação; não considerar teste DOM como prova de layout ou de ativação nativa por teclado.

## Workflow follow-up

- Revisar a change e seus resultados de verificação antes de arquivar com `/opsx-archive`, sincronizando `interface-de-batalha` com as main specs.
- A change anterior `preparacao-da-partida` pode ser revisada e arquivada separadamente; não alterar ou arquivar seu planejamento como efeito colateral desta implementação.
