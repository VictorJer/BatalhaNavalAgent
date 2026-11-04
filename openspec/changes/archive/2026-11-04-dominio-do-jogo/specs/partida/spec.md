# Spec Delta

## Purpose

Define o ciclo de vida de uma partida: quando ela pode começar, como os turnos se alternam, quando termina, quem vence e como uma nova partida é iniciada.

## ADDED Requirements

### Requirement: Início condicionado às frotas completas

Uma partida SHALL ser iniciada somente quando as frotas do jogador e do computador estiverem completas e válidas.

#### Scenario: Frota incompleta

- **WHEN** a partida é iniciada com alguma embarcação ainda não posicionada
- **THEN** o início é recusado
- **AND** a partida permanece na fase de preparação

#### Scenario: Ambas as frotas completas

- **WHEN** as duas frotas estiverem completas e válidas
- **THEN** a partida é iniciada na fase de batalha

### Requirement: Jogador humano ataca primeiro

O jogador humano SHALL realizar o primeiro ataque da partida.

#### Scenario: Primeiro turno

- **WHEN** a batalha começa
- **THEN** o turno pertence ao jogador humano

### Requirement: Um ataque por turno

Cada participante SHALL realizar no máximo um ataque por turno. Após um ataque válido, o turno SHALL passar ao adversário, inclusive quando o ataque resultar em acerto ou em embarcação destruída.

#### Scenario: Turno passa após acerto

- **WHEN** o jogador acerta uma embarcação adversária
- **THEN** o turno passa para o computador

#### Scenario: Turno passa após água

- **WHEN** o jogador ataca uma posição sem embarcação
- **THEN** o turno passa para o computador

#### Scenario: Computador ataca após o jogador

- **WHEN** o jogador conclui um ataque válido e a partida não terminou
- **THEN** o computador realiza um ataque contra o tabuleiro do jogador
- **AND** o turno volta ao jogador

### Requirement: Ataque inválido não consome o turno

Um ataque recusado SHALL NOT consumir o turno do participante.

#### Scenario: Ataque repetido mantém o turno

- **WHEN** o jogador ataca uma coordenada já atacada por ele
- **THEN** o ataque é recusado
- **AND** o turno permanece com o jogador

### Requirement: Encerramento imediato da partida

A partida SHALL terminar imediatamente quando todas as embarcações de um dos participantes forem destruídas, sem conceder novo ataque ao adversário.

#### Scenario: Última embarcação do computador destruída

- **WHEN** o jogador destrói a última embarcação da frota do computador
- **THEN** a partida termina imediatamente
- **AND** o computador não realiza outro ataque

#### Scenario: Última embarcação do jogador destruída

- **WHEN** o computador destrói a última embarcação da frota do jogador
- **THEN** a partida termina imediatamente

### Requirement: Definição do vencedor

O participante que destruir primeiro toda a frota adversária SHALL ser declarado vencedor.

#### Scenario: Vitória do jogador

- **WHEN** a frota do computador é destruída primeiro
- **THEN** o jogador é declarado vencedor

#### Scenario: Derrota do jogador

- **WHEN** a frota do jogador é destruída primeiro
- **THEN** o computador é declarado vencedor

### Requirement: Ataques após o encerramento

Nenhum ataque SHALL ser aceito depois que a partida terminar.

#### Scenario: Ataque após o fim

- **WHEN** um ataque é feito após a partida ter terminado
- **THEN** o ataque é recusado
- **AND** o estado final da partida é preservado

### Requirement: Escolha aleatória de ataque do computador

O computador SHALL escolher seu ataque aleatoriamente entre as coordenadas do tabuleiro adversário que ainda não atacou.

#### Scenario: Ataque sempre inédito

- **WHEN** o computador realiza um ataque e ainda existem coordenadas não atacadas
- **THEN** a coordenada escolhida está entre as ainda não atacadas por ele

#### Scenario: Última coordenada disponível

- **WHEN** resta apenas uma coordenada não atacada no tabuleiro do jogador
- **THEN** o computador escolhe essa coordenada

### Requirement: Nova partida

O jogador SHALL poder iniciar uma nova partida após o encerramento, com os tabuleiros reiniciados e novas frotas.

#### Scenario: Reinício

- **WHEN** o jogador inicia uma nova partida
- **THEN** os ataques anteriores são descartados
- **AND** a partida retorna à fase de preparação
- **AND** uma nova frota é gerada para o computador
