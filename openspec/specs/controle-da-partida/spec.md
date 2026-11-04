# controle-da-partida Specification

## Purpose

Mantém o estado reativo de uma partida em andamento e traduz intenções da interface em operações válidas de preparação e combate.

## Requirements

### Requirement: Estado único da partida

O sistema SHALL manter uma única fonte de estado da partida, exposta à interface por valores somente leitura, de modo que qualquer alteração aceita seja refletida imediatamente nos dados observados.

#### Scenario: Posicionamento refletido no estado

- **WHEN** uma embarcação é posicionada com sucesso
- **THEN** a frota exposta passa a conter a embarcação na nova posição

#### Scenario: Estado somente leitura

- **WHEN** a interface lê a fase, o turno ou os tabuleiros
- **THEN** ela recebe valores derivados do estado atual
- **AND** não consegue alterá-los sem passar por uma ação do sistema

### Requirement: Nova partida em preparação

Ao iniciar uma nova partida, o sistema SHALL criar tabuleiros vazios de ataques, posicionar automaticamente a frota do computador e entrar na fase de preparação.

#### Scenario: Início de nova partida

- **WHEN** uma nova partida é solicitada
- **THEN** a fase passa a ser preparação
- **AND** o tabuleiro do jogador não possui embarcações nem ataques
- **AND** a frota do computador está completa
- **AND** não há vencedor definido

### Requirement: Posicionamento e remoção na preparação

O sistema SHALL aceitar posicionamento e remoção de embarcações somente durante a fase de preparação, devolvendo o motivo quando a posição for recusada.

#### Scenario: Posicionamento aceito

- **WHEN** o jogador posiciona uma embarcação em uma posição válida durante a preparação
- **THEN** a operação é aceita e o estado da frota é atualizado

#### Scenario: Posicionamento recusado

- **WHEN** o jogador tenta posicionar uma embarcação fora do tabuleiro ou sobre outra
- **THEN** a operação é recusada com o motivo
- **AND** o posicionamento anterior permanece inalterado

#### Scenario: Posicionamento fora da preparação

- **WHEN** o jogador tenta posicionar ou remover uma embarcação durante a batalha
- **THEN** a operação é recusada e o estado não muda

### Requirement: Início da batalha

O sistema SHALL iniciar a batalha somente quando a frota do jogador estiver completa, definindo o jogador humano como primeiro a atacar.

#### Scenario: Frota completa

- **WHEN** o jogador inicia a batalha com as cinco embarcações posicionadas
- **THEN** a fase passa a ser batalha
- **AND** o turno pertence ao jogador

#### Scenario: Frota incompleta

- **WHEN** o jogador inicia a batalha com alguma embarcação não posicionada
- **THEN** a operação é recusada
- **AND** a fase permanece em preparação

### Requirement: Ataque do jogador

O sistema SHALL aceitar um ataque do jogador somente durante a batalha e quando o turno pertencer a ele, expondo o resultado produzido.

#### Scenario: Ataque aceito

- **WHEN** o jogador ataca uma coordenada válida e ainda não atacada em seu turno
- **THEN** o tabuleiro do computador recebe o ataque
- **AND** o resultado é exposto à interface
- **AND** o turno passa ao computador, salvo se a partida terminar

#### Scenario: Ataque fora do turno

- **WHEN** o jogador tenta atacar durante o turno do computador
- **THEN** a operação é recusada e o estado não muda

#### Scenario: Ataque repetido

- **WHEN** o jogador ataca uma coordenada que já havia atacado
- **THEN** a operação é recusada com o resultado de repetição
- **AND** o turno permanece com o jogador

### Requirement: Turno do computador

O sistema SHALL executar o ataque do computador por uma ação dedicada, aceita somente quando a batalha estiver em andamento e o turno pertencer ao computador.

#### Scenario: Computador ataca

- **WHEN** a ação do turno do computador é executada no turno dele
- **THEN** uma coordenada ainda não atacada do tabuleiro do jogador é escolhida
- **AND** o ataque é aplicado
- **AND** o turno volta ao jogador, salvo se a partida terminar

#### Scenario: Turno do computador fora de hora

- **WHEN** a ação do turno do computador é executada no turno do jogador ou fora da batalha
- **THEN** a operação é recusada e o estado não muda

### Requirement: Estado derivado para a interface

O sistema SHALL expor valores derivados para a interface, incluindo se a partida está encerrada, quem venceu, quais embarcações do jogador permanecem e quais coordenadas ainda podem ser atacadas.

#### Scenario: Frota restante

- **WHEN** uma embarcação do jogador é destruída
- **THEN** ela deixa de aparecer como restante na frota exposta

#### Scenario: Coordenadas atacáveis

- **WHEN** uma coordenada do tabuleiro do computador é atacada
- **THEN** ela deixa de estar disponível entre as coordenadas atacáveis

#### Scenario: Partida encerrada

- **WHEN** a última embarcação de um dos lados é destruída
- **THEN** o estado indica que a partida está encerrada
- **AND** o vencedor é exposto

### Requirement: Frota do computador permanece oculta

O sistema SHALL NOT expor à interface as posições ou a composição da frota do computador enquanto a partida não terminar, expondo apenas as coordenadas atacadas e os resultados correspondentes.

#### Scenario: Consulta ao tabuleiro do computador

- **WHEN** a interface consulta o estado do tabuleiro do computador durante a batalha
- **THEN** recebe apenas as coordenadas já atacadas e seus resultados
- **AND** não recebe as posições das embarcações não atingidas

#### Scenario: Acerto em embarcação oculta

- **WHEN** um ataque atinge uma embarcação do computador
- **THEN** apenas a coordenada atingida e o resultado daquele ataque são expostos
