# interface-de-preparacao Specification

## Purpose

Define o comportamento observável da tela de preparação: como o jogador visualiza o tabuleiro, seleciona, posiciona, remove e gera sua frota, e inicia a batalha.

## Requirements

### Requirement: Exibição do tabuleiro e do progresso da frota

A tela de preparação SHALL exibir o tabuleiro do jogador de 10 por 10, as cinco embarcações com seu estado de posicionamento e um indicador de progresso da frota.

#### Scenario: Preparação iniciada com frota vazia

- **WHEN** a tela de preparação é exibida com a frota do jogador vazia
- **THEN** as cinco embarcações aparecem como pendentes
- **AND** o tabuleiro aparece sem nenhuma embarcação
- **AND** o progresso indica nenhuma embarcação posicionada

#### Scenario: Frota parcialmente posicionada

- **WHEN** duas das cinco embarcações já estão posicionadas
- **THEN** essas duas aparecem como posicionadas e as outras três como pendentes
- **AND** o progresso reflete a quantidade posicionada

### Requirement: Seleção de embarcação pendente

O jogador SHALL poder selecionar qualquer embarcação pendente para posicioná-la, e a seleção SHALL definir qual embarcação o próximo clique no tabuleiro irá posicionar.

#### Scenario: Selecionar embarcação pendente

- **WHEN** o jogador seleciona uma embarcação pendente
- **THEN** ela passa a ser a seleção ativa para posicionamento

#### Scenario: Nenhuma seleção ativa

- **WHEN** nenhuma embarcação está selecionada e o jogador clica no tabuleiro
- **THEN** nenhum posicionamento é tentado

### Requirement: Alternância de orientação

Durante a seleção, o jogador SHALL poder alternar a orientação entre horizontal e vertical, começando sempre em horizontal.

#### Scenario: Orientação inicial

- **WHEN** uma embarcação é selecionada
- **THEN** a orientação ativa é horizontal

#### Scenario: Alternar para vertical

- **WHEN** o jogador alterna a orientação com uma embarcação selecionada
- **THEN** a orientação ativa passa a ser vertical

### Requirement: Pré-visualização do encaixe

Com uma embarcação selecionada, a interface SHALL pré-visualizar as células que a embarcação ocuparia na célula apontada, distinguindo quando o encaixe é válido de quando ultrapassa o tabuleiro ou sobrepõe outra embarcação. A validade SHALL ser indicada também por símbolo e texto explicativo. Se ultrapassar a borda, todas as células da tentativa que estiverem dentro do tabuleiro SHALL ser destacadas como inválidas, sem alterar a frota.

#### Scenario: Encaixe válido

- **WHEN** o jogador aponta uma célula em que a embarcação cabe inteiramente sem sobreposição
- **THEN** todas as células do encaixe são destacadas como válidas

#### Scenario: Encaixe inválido

- **WHEN** o jogador aponta uma célula em que a embarcação ultrapassaria o tabuleiro ou sobreporia outra embarcação
- **THEN** o encaixe é destacado como inválido

#### Scenario: Tentativa ultrapassa a borda direita

- **WHEN** o jogador aponta A8 com um porta-aviões horizontal selecionado
- **THEN** A8, A9 e A10 recebem destaque de encaixe inválido
- **AND** uma explicação informa que a embarcação não cabe nessa posição
- **AND** não são desenhadas células fora das dez colunas

#### Scenario: Tentativa ultrapassa a borda inferior

- **WHEN** o jogador aponta I3 com um cruzador vertical selecionado
- **THEN** I3 e J3 recebem destaque de encaixe inválido
- **AND** nenhuma célula é desenhada abaixo da linha J

#### Scenario: Validade sem depender apenas de cor

- **WHEN** o jogador compara uma prévia válida com uma sobreposta a outra embarcação
- **THEN** os símbolos e as explicações distinguem encaixe permitido de sobreposição
- **AND** as informações de prévia são disponíveis também ao focar a célula com teclado
- **AND** apontar ou focar não altera a frota nem acrescenta eventos ao histórico

### Requirement: Posicionamento por clique

Com uma embarcação selecionada, um clique em uma célula do tabuleiro SHALL posicionar a embarcação usando a célula como origem e a orientação ativa; em caso de sucesso, a embarcação passa a ocupar suas células e a seleção é liberada.

#### Scenario: Posicionamento aceito

- **WHEN** o jogador clica numa célula em que a embarcação selecionada cabe sem sobreposição
- **THEN** a embarcação é posicionada nas células do encaixe
- **AND** ela deixa de aparecer como pendente
- **AND** a seleção é liberada

#### Scenario: Reposição de embarcação

- **WHEN** o jogador posiciona uma embarcação já posicionada em uma nova posição válida
- **THEN** as células anteriores são liberadas e a embarcação passa a ocupar as novas

### Requirement: Exibição do motivo de recusa

Quando um posicionamento é recusado, a interface SHALL exibir o motivo da recusa — fora do tabuleiro ou sobreposição com outra embarcação — sem alterar o tabuleiro, e a mensagem SHALL ser descartada diante da próxima ação bem-sucedida.

#### Scenario: Recusa por fora do tabuleiro

- **WHEN** o jogador clica numa célula em que a embarcação ultrapassaria o tabuleiro
- **THEN** é exibida uma mensagem indicando que o posicionamento está fora do tabuleiro
- **AND** o tabuleiro permanece inalterado

#### Scenario: Recusa por sobreposição

- **WHEN** o jogador clica numa célula cujo encaixe sobrepõe outra embarcação
- **THEN** é exibida uma mensagem indicando a sobreposição
- **AND** o tabuleiro permanece inalterado

#### Scenario: Nova ação bem-sucedida limpa a mensagem

- **WHEN** o jogador conclui um posicionamento válido após uma recusa
- **THEN** a mensagem de recusa deixa de ser exibida

### Requirement: Remoção de embarcação posicionada

O jogador SHALL poder remover uma embarcação já posicionada durante a preparação, liberando as células que ela ocupava.

#### Scenario: Remover embarcação

- **WHEN** o jogador remove uma embarcação posicionada
- **THEN** as células que ela ocupava ficam livres no tabuleiro
- **AND** a embarcação volta a aparecer como pendente

### Requirement: Geração automática da frota do jogador

A interface SHALL oferecer uma ação que gera automaticamente uma frota completa e válida para o jogador, substituindo qualquer posicionamento atual.

#### Scenario: Gerar frota do zero

- **WHEN** o jogador aciona a geração automática com a frota vazia
- **THEN** as cinco embarcações são posicionadas em um arranjo válido
- **AND** o progresso indica frota completa

#### Scenario: Gerar frota sobre posicionamento parcial

- **WHEN** o jogador aciona a geração automática com parte da frota posicionada
- **THEN** o posicionamento anterior é substituído por um arranjo completo e válido

### Requirement: Início da batalha condicionado à frota completa

O botão de iniciar a batalha SHALL estar habilitado somente quando as cinco embarcações estiverem posicionadas; ao acioná-lo, a preparação termina e a batalha começa.

#### Scenario: Frota incompleta

- **WHEN** o jogador tem menos de cinco embarcações posicionadas
- **THEN** o botão de iniciar a batalha está desabilitado

#### Scenario: Frota completa inicia a batalha

- **WHEN** o jogador tem as cinco embarcações posicionadas e aciona o início da batalha
- **THEN** a fase da partida passa a ser batalha
- **AND** a tela de preparação deixa de ser exibida

### Requirement: Exibição somente na fase de preparação

A tela de preparação SHALL ser exibida apenas enquanto a partida estiver na fase de preparação.

#### Scenario: Fora da preparação

- **WHEN** a partida está em batalha ou encerrada
- **THEN** a tela de preparação não é exibida

### Requirement: Coordenadas visíveis na preparação

A tela de preparação SHALL exibir as letras A a J à esquerda das linhas e os números 1 a 10 acima das colunas, alinhados às células. Os rótulos SHALL ser informativos, não alvos adicionais de posicionamento; o tabuleiro SHALL continuar contendo exatamente 100 células selecionáveis.

#### Scenario: Correspondência entre cabeçalhos e célula

- **WHEN** a tela de preparação é exibida
- **THEN** as dez letras e os dez números estão visíveis nas respectivas bordas
- **AND** a interseção da linha B com a coluna 3 corresponde à célula B3
- **AND** clicar ou focar B3 continua referindo-se à mesma coordenada

### Requirement: Tamanhos reconhecíveis no painel de embarcações

Cada embarcação no painel SHALL apresentar nome em português, identificador textual próprio, tamanho numérico e representação com a mesma quantidade de segmentos que suas posições. Os tamanhos SHALL permanecer 5, 4, 3, 3 e 2 para porta-aviões, encouraçado, cruzador, submarino e destroyer, respectivamente.

#### Scenario: Tamanho antes de posicionar

- **WHEN** a frota ainda está vazia
- **THEN** o jogador pode reconhecer o tamanho das cinco embarcações sem selecioná-las
- **AND** cada representação segmentada corresponde ao tamanho informado

#### Scenario: Mesmo tamanho sem perder identidade

- **WHEN** o painel apresenta cruzador e submarino
- **THEN** ambos têm três segmentos
- **AND** seus nomes e identificadores permitem distingui-los

### Requirement: Identificação dos barcos no tabuleiro de preparação

As células ocupadas na preparação SHALL apresentar um identificador textual que permita associá-las à embarcação correspondente no painel, sem depender somente de cor. Barcos encostados SHALL continuar distinguíveis, e todas as células de cada barco SHALL permanecer selecionáveis segundo a interação existente.

#### Scenario: Barcos encostados

- **WHEN** duas embarcações diferentes ocupam células adjacentes sem sobreposição
- **THEN** o jogador consegue identificar quais células pertencem a cada embarcação pelo identificador textual
- **AND** nenhuma célula é adicionada ou deslocada pela representação visual

#### Scenario: Identificação após geração automática

- **WHEN** o jogador gera automaticamente a frota
- **THEN** cada uma das cinco embarcações pode ser associada ao painel pelos identificadores de suas células
- **AND** o total continua sendo 17 células ocupadas

### Requirement: Instruções visíveis da seleção ativa

A preparação SHALL indicar textualmente como começar quando não houver seleção e, havendo seleção, SHALL mostrar nome, tamanho e orientação da embarcação e coordenada apontada quando disponível. A seleção no painel SHALL ser reconhecível também por texto, sem depender apenas de borda ou cor.

#### Scenario: Nenhuma embarcação selecionada

- **WHEN** a preparação é exibida sem seleção ativa
- **THEN** uma instrução orienta a selecionar um barco no painel e depois uma célula do tabuleiro

#### Scenario: Seleção e orientação reconhecíveis

- **WHEN** o jogador seleciona o cruzador e alterna sua orientação para vertical
- **THEN** o painel identifica textualmente que o cruzador está selecionado
- **AND** as instruções indicam cruzador, três posições e orientação vertical
- **AND** ao apontar B3 a coordenada B3 também é informada

### Requirement: Limpeza da pré-visualização ao encerrar apontamento

A pré-visualização SHALL ser descartada quando o ponteiro sair do tabuleiro ou o foco for transferido de uma célula para fora dele. A seleção e a orientação SHALL ser preservadas nesses casos. Trocar de seleção, posicionar com sucesso ou gerar a frota SHALL NOT deixar uma prévia de uma ação anterior.

#### Scenario: Ponteiro deixa o tabuleiro

- **WHEN** o jogador retira o ponteiro do tabuleiro após pré-visualizar uma embarcação
- **THEN** os destaques e a indicação de encaixe daquela prévia desaparecem
- **AND** a embarcação selecionada e a orientação permanecem disponíveis para uma nova tentativa

#### Scenario: Navegação por teclado

- **WHEN** o jogador move o foco de uma célula para outra célula
- **THEN** a prévia acompanha a nova coordenada sem ser descartada por completo
- **AND** ao transferir o foco para um controle fora do tabuleiro a prévia deixa de ser exibida

#### Scenario: Nova ação sem prévia antiga

- **WHEN** o jogador troca de embarcação, conclui o posicionamento ou gera a frota automaticamente
- **THEN** nenhuma prévia da seleção anterior permanece no tabuleiro

### Requirement: Legibilidade e acesso na preparação

Coordenadas, identificadores, tamanhos, instruções e prévia SHALL permanecer legíveis numa viewport de 360 pixels sem rolagem horizontal da página. A seleção, a orientação e o posicionamento SHALL continuar operáveis por teclado com foco visível, e o posicionamento por toque SHALL NOT depender de hover.

#### Scenario: Preparação em tela estreita

- **WHEN** a preparação é apresentada em uma viewport de 360 pixels
- **THEN** as 100 células e seus cabeçalhos permanecem visíveis e alinhados
- **AND** o painel e as instruções não são cortados nem exigem rolagem horizontal

#### Scenario: Posicionamento por teclado ou toque

- **WHEN** o jogador seleciona uma embarcação e ativa uma célula por teclado ou toque
- **THEN** a mesma ação de posicionamento por clique é executada uma única vez
- **AND** não é necessário apontar previamente com mouse
