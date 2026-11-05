# Tasks

## 1. Apresentação opcional do tabuleiro

- [x] 1.1 Adicionar `mostrarCoordenadas` a `src/app/preparacao/tabuleiro.ts`, desativado por padrão, e renderizar A–J/1–10 alinhados às células como rótulos informativos não focáveis; extrair template/CSS locais somente se necessário. Verificar em `tabuleiro.spec.ts`: exatamente 100 botões, dez letras/dez números quando habilitado, ausência de cabeçalhos por padrão e outputs/rótulos corretos para A1, B3 e J10 sem deslocamento de índices.
- [x] 1.2 Criar `src/app/preparacao/apresentacao-das-embarcacoes.ts` com nomes e siglas PA/EN/CR/SU/DE, reutilizar os tamanhos do domínio e adicionar `mostrarEmbarcacoes` ao tabuleiro, desativado por padrão, para identificar células ocupadas sem alterar os alvos. Verificar em `tabuleiro.spec.ts`: siglas associadas aos cinco tipos, descrição acessível com nome completo, barcos encostados distinguíveis, células vazias sem identificação, `aria-label` de coordenada preservado e resultados de ataque prioritários; não exibir siglas quando a opção estiver desativada.

## 2. Painel e orientação da preparação

- [x] 2.1 Habilitar as opções visuais exclusivamente em `tela-de-preparacao.ts`, substituir a tabela local de nomes pelo catálogo de apresentação e exibir nome/sigla, tamanho, segmentos, estado e seleção textual de cada barco. Acrescentar instrução inicial e resumo acessível de nome/tamanho/orientação/coordenada, preservando controles existentes. Verificar em `tela-de-preparacao.spec.ts`: tamanhos/segmentos 5/4/3/3/2, distinção CR/SU, seleção e alternância refletidas no texto, coordenada B3 ao focar/apontar, painel inicialmente pendente e geração identificando as cinco embarcações em 17 células.

## 3. Prévia explicativa e ciclo de apontamento

- [x] 3.1 Derivar um `encaixe` único na preparação, usando a validação atual e calculando apenas o recorte visível quando a tentativa ultrapassar o tabuleiro; alimentar mapa e explicação a partir dele. Acrescentar símbolos distintos de preview válido/inválido no tabuleiro e registrar o ícone Lucide de confirmação em `app.config.ts`, se necessário. Verificar em `tela-de-preparacao.spec.ts` e `tabuleiro.spec.ts`: preview válido horizontal/vertical, sobreposição com explicação, porta-aviões em A8 destacando A8/A9/A10 como inválidas, cruzador vertical em I3 destacando I3/J3, ausência de células extras, símbolos/descrições distintos e frota/histórico inalterados ao apontar ou focar; manter os testes de recusa por clique verdes.
- [x] 3.2 Acrescentar output `apontamentoEncerrado` para saída do ponteiro e saída real de foco da grade, sem emiti-lo ao mover foco entre células; ligá-lo à limpeza de `celulaApontada` e limpar também ao trocar seleção, concluir posicionamento e gerar frota. Verificar nos testes do tabuleiro e da tela: prévia acompanha o foco entre células, desaparece ao sair com mouse ou foco externo, preserva seleção/orientação ao sair e não reaparece numa coordenada antiga após trocar barco ou gerar; limpeza visual não cria eventos nem muda a frota.

## 4. Regressão e verificação integrada

- [x] 4.1 Ampliar a regressão em `src/app/batalha/tela-de-batalha.spec.ts` e `src/app/app.spec.ts` para confirmar que as opções da preparação não afetam a batalha: sem cabeçalhos/siglas novos, marcas água/acerto/destruição e bloqueios preservados, sigilo das células adversárias intacto. Executar também a preparação completa por clique: seleção, orientação, posicionamento, remoção pelo painel, geração e início; verificar que as instruções novas não alteram o fluxo ou o progresso e que a nova partida limpa o estado visual anterior.
- [x] 4.2 Executar `npm test -- --watch=false`, `npm run build`, `npm run lint` e `npm run format:check`; confirmar todos sem erro, incluindo os testes existentes de domínio e store, sem modificar suas regras para acomodar a apresentação.
- [x] 4.3 Conferir em navegador real a preparação em desktop e 360 px: cabeçalhos alinhados, siglas/segmentos/instruções legíveis, nenhum corte ou scroll horizontal, preview válido e parcial nas duas bordas, limpeza ao sair e aparência preservada na batalha. Validar foco visível, posicionamento por Enter/Espaço sem duplicação e seleção seguida de toque sem hover; registrar evidências e eventuais limitações no resumo da implementação, sem tratar testes DOM como prova de layout ou toque.

## Workflow follow-up

- Revisar os resultados e, quando aprovado, arquivar a change com `/opsx-archive`, sincronizando a delta na capability existente `interface-de-preparacao`.
