# Tasks

## 1. Tela de apresentação

- [ ] 1.1 Criar `src/app/inicial/tela-inicial.ts` como componente standalone com objetivo resumido em português e botão nativo “Começar a jogar”, emitindo uma intenção de entrada; adicionar `tela-inicial.spec.ts` verificando texto, nome acessível e emissão única após um clique.
- [ ] 1.2 Aplicar layout simples com Tailwind e foco visível ao controle, sem conteúdo que dependa de hover; verificar em `tela-inicial.spec.ts` a presença das classes/atributos essenciais e em navegador real a legibilidade em 360 px sem rolagem horizontal, além da ativação por Enter, Espaço e toque quando disponível.

## 2. Integração com o ciclo da aplicação

- [ ] 2.1 Atualizar `src/app/app.ts` e `app.html` para apresentar `TelaInicial` somente na primeira abertura em preparação, usando um signal local dispensado pela ação de começar; manter o `h1` existente e selecionar batalha por fase. Ampliar `app.spec.ts` verificando abertura sem controles de preparação/batalha e montagem direta em batalha quando o store já está nessa fase.
- [ ] 2.2 Ajustar os testes existentes de `app.spec.ts` que interagem com a preparação para acionarem primeiro “Começar a jogar”; verificar que a entrada não altera fase, histórico, frota ou ataques, que a preparação aparece com progresso zero e que uma ativação não causa dupla transição.
- [ ] 2.3 Preservar o percurso preparação → batalha → encerramento → “Nova partida” → preparação sem reexibir a apresentação; ampliar o teste de integração de `app.spec.ts` para conferir o reinício direto e os tabuleiros limpos na nova batalha.

## 3. Verificação integrada

- [ ] 3.1 Executar `npm test -- --watch=false`, `npm run build`, `npm run lint` e `npm run format:check`, confirmando que a mudança não quebra as suites de domínio, store, preparação e batalha.
- [ ] 3.2 Percorrer em navegador real, em desktop e 360 px, apresentação → preparação → batalha → encerramento → nova partida; confirmar ausência de rolagem horizontal, foco visível, entrada por teclado e toque quando disponível e retorno direto à preparação. Registrar qualquer limitação da verificação no resumo da implementação.

## Workflow follow-up

- Revisar e arquivar a change separadamente após a implementação, sincronizando `interface-inicial` com os main specs.
