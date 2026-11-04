# Spec Delta

## Purpose

Define como um ataque é resolvido contra um tabuleiro, quais resultados podem ser produzidos e como a destruição de uma embarcação e a derrota de um tabuleiro são reconhecidas.

## ADDED Requirements

### Requirement: Coordenada fora do tabuleiro é recusada

Um ataque a uma coordenada inexistente no tabuleiro SHALL ser recusado sem alterar o estado do tabuleiro.

#### Scenario: Coordenada fora das linhas

- **WHEN** um ataque é feito em uma coordenada com linha posterior a J
- **THEN** o ataque é recusado
- **AND** nenhum ataque é registrado

### Requirement: Coordenada já atacada não pode ser atacada novamente

Cada participante SHALL poder atacar uma coordenada adversária no máximo uma vez por partida. Um ataque a coordenada já atacada SHALL ser recusado e o tabuleiro SHALL permanecer inalterado.

#### Scenario: Ataque repetido

- **WHEN** um ataque é feito a uma coordenada que já havia sido atacada
- **THEN** o ataque é recusado com o resultado de repetição
- **AND** nenhum novo registro de ataque é criado

### Requirement: Resultado de ataque válido

Um ataque válido SHALL produzir exatamente um resultado observável: água, quando não há embarcação na posição; acerto, quando há embarcação e ela ainda possui outras posições intactas; ou embarcação destruída, quando a posição atingida é a última posição intacta daquela embarcação.

#### Scenario: Água

- **WHEN** um ataque atinge uma posição sem embarcação
- **THEN** o resultado é água

#### Scenario: Acerto sem destruição

- **WHEN** um ataque atinge uma posição de uma embarcação que ainda possui outra posição intacta
- **THEN** o resultado é acerto e a embarcação atingida é informada

#### Scenario: Embarcação destruída

- **WHEN** um ataque atinge a última posição intacta de uma embarcação
- **THEN** o resultado é embarcação destruída e o tipo da embarcação é informado

### Requirement: Destruição de embarcação

Uma embarcação SHALL ser considerada destruída somente quando todas as suas posições tiverem sido atingidas.

#### Scenario: Embarcação parcialmente atingida

- **WHEN** apenas parte das posições de uma embarcação foi atingida
- **THEN** a embarcação não é considerada destruída

### Requirement: Acerto não revela posições restantes

Um acerto SHALL NOT revelar as demais posições intactas da embarcação atingida.

#### Scenario: Acerto isolado

- **WHEN** um ataque atinge uma embarcação que ocupa várias posições
- **THEN** apenas a coordenada atingida é revelada
- **AND** as demais posições da embarcação permanecem ocultas

### Requirement: Tabuleiro derrotado

Um tabuleiro SHALL ser considerado derrotado quando todas as embarcações de sua frota estiverem destruídas.

#### Scenario: Frota parcialmente destruída

- **WHEN** ao menos uma embarcação da frota permanecer intacta
- **THEN** o tabuleiro não é considerado derrotado

#### Scenario: Última embarcação destruída

- **WHEN** a última embarcação intacta da frota é destruída
- **THEN** o tabuleiro é considerado derrotado
