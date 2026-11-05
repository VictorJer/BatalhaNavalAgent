# Design

## Context

Ver `proposal.md` para motivação e escopo. A mudança cruza a composição de preparação e o tabuleiro também usado na batalha; o design explicita como evitar regressão nesse componente compartilhado.

Observações do código atual:

- `Tabuleiro` renderiza 100 botões sem cabeçalhos visíveis. `EstadoDaCelula` já contém tipo de embarcação, preview e resultado de ataque; atualmente só os resultados de ataque possuem símbolos e descrições.
- `TelaDePreparacao` conhece os cinco nomes, mas seu painel mostra apenas nome e estado pendente/posicionada. O domínio já fornece `tamanhoDe`, `TIPOS_DAS_EMBARCACOES` e os utilitários de coordenadas.
- O preview é um mapa derivado sem escrita no store. Quando `posicoesDe` retorna `null`, apenas a origem recebe destaque inválido; `celulaApontada` não é limpa ao sair da grade.
- A batalha reutiliza o mesmo `Tabuleiro`, com marcas de água/acerto/destruição e bloqueios. Seus seletores e testes dependem dos rótulos de coordenada e da prioridade dos resultados sobre a aparência de barco.
- As main specs já cobrem posicionamento por clique, orientação, remoção, geração, recusa e início; o trabalho não muda essas regras nem os contratos do domínio/store.

## Goals / Non-Goals

**Goals:**

- Melhorar identificação e orientação espacial com dados já disponíveis, mantendo o tabuleiro como componente apresentacional.
- Tornar a prévia parcial e sua validade claras sem usar o store como mecanismo de hover.
- Ativar a nova identificação e os cabeçalhos somente na preparação, com defaults compatíveis para a batalha.
- Manter a implementação em incrementos verificáveis: grade, painel, prévia e regressão integrada.

**Non-Goals:**

- Novo gesto de posicionamento, drag-and-drop, rotação direta de barcos colocados ou alteração da remoção existente.
- Overlays de navios, canvas, SVGs proporcionais atravessando células, imagens externas ou redesenho da batalha.
- Resolver toda a semântica/navegação de uma grade ARIA nesta change; manter botões nativos e não acrescentar atalhos que dupliquem sua ativação.

## Decisions

### D1 — Cabeçalhos e identificação como apresentação opcional do Tabuleiro

Adicionar inputs `mostrarCoordenadas` e `mostrarEmbarcacoes`, ambos inicialmente `false`; a preparação habilita os dois e a batalha não precisa ser alterada. Manter os inputs/outputs existentes e o total de 100 botões.

Quando habilitados, renderizar cabeçalhos A–J e 1–10 como elementos informativos não focáveis, com espaço reservado ao canto. O layout usa trilhas de grade compartilhadas entre cabeçalhos e células, sem inserir cabeçalhos na lista de coordenadas nem convertê-los em botões. Se necessário, extrair template e estilos do tabuleiro para arquivos locais, sem mudar seletor ou pasta.

Preservar `aria-label` de coordenada nas células sem ataque. Informações adicionais de barco e preview usam descrição acessível complementar, sem exigir que os testes/localizadores confundam “B3” com uma sigla. Marcas de ataque e seus rótulos continuam prioritários e não recebem siglas sobrepostas.

**Alternativa:** habilitar a nova aparência globalmente — rejeitada para não ampliar o pedido à batalha. Duplicar a grade também é rejeitado, pois cabeçalhos não justificam manter outras 100 células independentes.

### D2 — Catálogo de apresentação local e representação por segmentos

Extrair os nomes atuais para `src/app/preparacao/apresentacao-das-embarcacoes.ts`, com nomes e siglas exclusivas: PA (Porta-aviões), EN (Encouraçado), CR (Cruzador), SU (Submarino) e DE (Destroyer). Usar `tamanhoDe` para o número e para a quantidade de pequenos segmentos no painel; não replicar os tamanhos em outra tabela.

Na preparação, cada célula ocupada exibe a sigla de seu tipo. O painel associa explicitamente nome, sigla, tamanho e segmentos; assim duas embarcações encostadas continuam reconhecíveis mesmo com tamanho ou cor iguais. Manter texto “Pendente”/“Posicionada” e acrescentar indicador textual “Selecionada” sem perder `aria-pressed`.

**Assunção visual registrada:** os barcos continuam ocupando segmentos da própria grade, não ganham desenhos realistas. Uma sigla curta em cada célula evita conteúdo longo ou miniaturas ilegíveis em 360 px. Fontes, bordas e contraste podem ser ajustados sem mudar esse contrato.

**Alternativas:** apenas paleta diferente ou um mesmo ícone de navio em todos os barcos — rejeitadas porque não distinguem por si sós cruzador e submarino, nem barcos encostados. Desenhos contínuos sobrepostos à grade exigiriam orientação/posicionamento de overlays e tratamento extra de clique, sem necessidade para este incremento.

### D3 — Um encaixe derivado alimenta destaque e explicação

Extrair da construção de `estadoDasCelulas` um `computed` de `encaixe` contendo posições visíveis, validade e motivo (`fora-do-tabuleiro`/`sobreposicao` ou ausência de motivo). A validade continua baseada em `posicoesDe(origem, orientacao, tamanhoDe(tipo))` e ocupação dos outros tipos; a regra de exclusão do próprio tipo permanece.

Para uma tentativa fora do tabuleiro, percorrer no máximo o tamanho da embarcação a partir dos índices da origem, usando `coordenada`, `linhaDe` e `colunaDe`. Descartar apenas coordenadas que retornem `null`; marcar todas as restantes como inválidas. Isso é projeção visual do recorte, não aceitação parcial. Não alterar `posicoesDe` nem construir uma frota parcial.

O mapa de células e a mensagem de prévia são derivados do mesmo `encaixe`, evitando que o texto informe validade diferente das classes. Em `Tabuleiro`, resultado de ataque tem prioridade, seguido de preview e identificação da embarcação; quando há preview, usar símbolo distinto de permitido/recusado, além das cores. Reutilizar X para inválido e registrar um ícone Lucide de confirmação para válido em `app.config.ts` se ainda não estiver disponível.

**Alternativa:** validar chamando `jogo.posicionar` ao apontar — rejeitada porque modificaria a frota e o histórico. Manter apenas a origem inválida é insuficiente para mostrar a extensão que ainda cabe na borda.

### D4 — Resumo contextual e ciclo de apontamento sem alterar a partida

Adicionar instruções visíveis, com uma região de status para seleção, tamanho, orientação, coordenada e validade. Quando não houver seleção, orientar “Selecione uma embarcação e depois uma célula do tabuleiro”. Distinguir a explicação da prévia, que muda ao apontar, da `mensagemDeRecusa` existente, que resulta de um clique recusado e continua sendo limpa nas ações bem-sucedidas já previstas.

Manter `celulaApontada` como signal local da composição. Acrescentar output `apontamentoEncerrado` no tabuleiro para saída do ponteiro e para saída de foco da grade. Ao tratar `focusout`, verificar se `relatedTarget` está em outra célula interna: nesse caso não emitir encerramento; o próximo foco atualiza a coordenada. Saída real da grade limpa apenas o apontamento, preservando seleção/orientação.

Trocar de seleção, concluir posicionamento e gerar a frota também limpam `celulaApontada`, para não reaproveitar uma coordenada antiga. Essas operações visuais não geram eventos; posicionamento, remoção e geração continuam delegando às ações existentes do store.

**Alternativas:** tornar `celulaApontada` um output anulável — dispensável, pois alteraria um contrato existente quando um evento adicional resolve a limpeza. Limpar em todo blur é rejeitado por causar desaparecimento indevido entre células.

### D5 — Responsividade e compatibilidade como limites do desenho

Usar Tailwind e, somente se necessário para alinhamento/contraste, CSS local. Reservar uma coluna curta para letras e manter as outras dez fluidas, com largura mínima de conteúdo zerada, sem largura fixa de desktop. O painel permanece abaixo da grade em telas pequenas e ao lado nas maiores. Textos longos do painel/instruções podem quebrar linha, mas siglas e números permanecem legíveis.

Na preparação, o teclado mantém a ativação nativa dos botões: foco atualiza preview e Enter/Espaço posicionam uma vez. Em toque, seleção seguida de toque na coordenada continua suficiente; hover é aprimoramento, não etapa obrigatória.

Manter as projeções da batalha intactas: os novos inputs ficam desativados, as células não atacadas do computador continuam sem dados de embarcação e as marcas de ataque não mudam. A regressão verifica isso explicitamente, não pressupõe que opt-in seja suficiente.

**Alternativa:** adicionar uma grade expandida com scroll horizontal no celular — rejeitada pelo objetivo de reconhecimento em 360 px sem navegação lateral.

## Risks / Trade-offs

- [Cabeçalhos deslocam a correspondência entre posição e coordenada] → labels não entram no array de células; testar A1, B3 e J10, além de alinhamento real em desktop/mobile.
- [Siglas parecem códigos sem significado] → nome, sigla e tamanho ficam juntos no painel; descrições acessíveis relacionam as células aos nomes completos.
- [Preview oculta a identificação de um barco sobreposto] → manter os dados de embarcação na célula e a explicação de sobreposição; o overlay é transitório e não modifica a frota.
- [CSS de preview ou siglas interfere nas marcas da batalha] → precedência explícita de ataque e defaults desativados, com regressão de água/acerto/destruição e de sigilo adversário.
- [Mensagem de prévia substitui indevidamente a recusa de clique] → usar projeções distintas e preservar a política atual de limpar a recusa somente diante das ações previstas.
- [Estados de apontamento obsoletos após sair ou trocar de barco] → evento de término e limpeza nas transições de seleção/sucesso/geração; testar também foco entre células.
- [Testes DOM não detectam corte ou desalinhamento] → complementar os testes de componente com verificação no navegador em 360 px e desktop, mouse, teclado e toque.

## Migration Plan

Sem migração de dados, novas dependências ou alterações no domínio/store. Ativar a nova apresentação exclusivamente na preparação e implementar em etapas com testes junto de cada entrega. Extrair template/CSS apenas quando ajudar a manter os componentes legíveis, sem refatoração de outras áreas.

Se for necessário voltar à aparência anterior, desabilitar os novos inputs na preparação e reverter somente as alterações desta change. As regras e ações atuais continuam sendo a base funcional; preservar o trabalho já existente e os arquivos arquivados.
