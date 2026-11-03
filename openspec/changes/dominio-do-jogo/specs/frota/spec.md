# Spec Delta

## Purpose

Define a composição da frota de cada participante, as regras de posicionamento das embarcações no tabuleiro e a geração automática da frota do computador.

## ADDED Requirements

### Requirement: Composição fixa da frota

Cada participante SHALL possuir exatamente uma frota com cinco embarcações: um porta-aviões de 5 posições, um encouraçado de 4, um cruzador de 3, um submarino de 3 e um destroyer de 2, totalizando 17 posições ocupadas.

#### Scenario: Frota padrão

- **WHEN** uma frota é criada
- **THEN** ela contém os cinco tipos de embarcação, cada um com o tamanho definido
- **AND** o total de posições ocupadas é 17

### Requirement: Posicionamento restrito ao tabuleiro

Toda embarcação posicionada SHALL ocupar posições consecutivas, em linha reta, na orientação horizontal ou vertical, e integralmente dentro das 10 linhas e 10 colunas do tabuleiro.

#### Scenario: Embarcação ultrapassa a borda direita

- **WHEN** o porta-aviões de 5 posições é posicionado horizontalmente a partir de A8
- **THEN** o posicionamento é rejeitado
- **AND** a frota permanece inalterada

#### Scenario: Embarcação ultrapassa a borda inferior

- **WHEN** uma embarcação é posicionada verticalmente de forma que alguma de suas posições fique abaixo da linha J
- **THEN** o posicionamento é rejeitado

#### Scenario: Posicionamento válido

- **WHEN** o cruzador de 3 posições é posicionado horizontalmente a partir de B2
- **THEN** o posicionamento é aceito e as posições B2, B3 e B4 ficam ocupadas

### Requirement: Proibição de sobreposição

Duas embarcações SHALL NOT ocupar a mesma posição. Uma tentativa de posicionamento sobre posição já ocupada SHALL ser rejeitada sem alterar o posicionamento válido existente.

#### Scenario: Posicionamento sobre posição ocupada

- **WHEN** uma embarcação é posicionada de modo que alguma de suas posições já esteja ocupada
- **THEN** o posicionamento é rejeitado
- **AND** a frota anterior é preservada
- **AND** o motivo da rejeição é informado

### Requirement: Embarcações encostadas são permitidas

Embarcações SHALL poder ocupar posições adjacentes, inclusive nas diagonais, desde que não haja sobreposição de posições.

#### Scenario: Embarcações lado a lado

- **WHEN** duas embarcações são posicionadas em posições vizinhas sem sobreposição
- **THEN** ambos os posicionamentos são aceitos

#### Scenario: Embarcações encostadas na diagonal

- **WHEN** uma embarcação ocupa a posição C3 e outra ocupa a posição D4
- **THEN** ambos os posicionamentos são aceitos

### Requirement: Reposicionamento durante a preparação

Enquanto a batalha não tiver começado, o jogador SHALL poder remover ou substituir embarcações já posicionadas.

#### Scenario: Substituir embarcação

- **WHEN** o jogador posiciona uma embarcação do mesmo tipo em um local válido diferente
- **THEN** as posições anteriores são liberadas
- **AND** as novas posições passam a ser ocupadas

#### Scenario: Remover embarcação

- **WHEN** o jogador remove uma embarcação posicionada
- **THEN** as posições que ela ocupava ficam livres para novos posicionamentos

### Requirement: Frota completa

Uma frota SHALL ser considerada completa somente quando as cinco embarcações estiverem posicionadas.

#### Scenario: Frota incompleta

- **WHEN** apenas quatro das cinco embarcações estiverem posicionadas
- **THEN** a frota é considerada incompleta

### Requirement: Geração automática de frota

O sistema SHALL ser capaz de gerar uma frota completa automaticamente, respeitando as mesmas regras de limites e sobreposição aplicadas ao posicionamento manual.

#### Scenario: Frota gerada é válida

- **WHEN** uma frota é gerada automaticamente
- **THEN** as cinco embarcações estão posicionadas
- **AND** nenhuma posição fica fora do tabuleiro
- **AND** nenhuma posição é ocupada por duas embarcações
- **AND** o total de posições ocupadas é 17
