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

Com uma embarcação selecionada, a interface SHALL pré-visualizar as células que a embarcação ocuparia na célula apontada, distinguindo quando o encaixe é válido de quando ultrapassa o tabuleiro ou sobrepõe outra embarcação.

#### Scenario: Encaixe válido

- **WHEN** o jogador aponta uma célula em que a embarcação cabe inteiramente sem sobreposição
- **THEN** todas as células do encaixe são destacadas como válidas

#### Scenario: Encaixe inválido

- **WHEN** o jogador aponta uma célula em que a embarcação ultrapassaria o tabuleiro ou sobreporia outra embarcação
- **THEN** o encaixe é destacado como inválido

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
