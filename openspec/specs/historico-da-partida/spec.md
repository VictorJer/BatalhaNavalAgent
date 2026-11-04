# historico-da-partida Specification

## Purpose

Mantém um registro ordenado dos acontecimentos relevantes de uma partida, com dados suficientes para a interface exibir a evolução do jogo.

## Requirements

### Requirement: Registro ordenado de eventos

O sistema SHALL registrar os eventos relevantes da partida em ordem cronológica: nova partida, embarcação posicionada, embarcação removida, batalha iniciada, ataque realizado e partida encerrada.

#### Scenario: Ordem dos eventos

- **WHEN** uma sequência de ações é executada com sucesso
- **THEN** o histórico apresenta os eventos na mesma ordem em que ocorreram

#### Scenario: Evento de ataque

- **WHEN** um ataque válido é realizado pelo jogador ou pelo computador
- **THEN** o histórico recebe um evento com o autor, a coordenada e o resultado do ataque

### Requirement: Ações recusadas não geram evento

Uma ação recusada SHALL NOT acrescentar evento ao histórico.

#### Scenario: Posicionamento inválido

- **WHEN** um posicionamento é recusado
- **THEN** o histórico permanece inalterado

#### Scenario: Ataque repetido

- **WHEN** um ataque repetido é recusado
- **THEN** o histórico permanece inalterado

### Requirement: Histórico preservado durante a partida

O histórico SHALL permanecer disponível até que uma nova partida seja iniciada.

#### Scenario: Eventos de turnos anteriores

- **WHEN** o computador conclui seu ataque e o turno volta ao jogador
- **THEN** os eventos anteriores continuam no histórico

### Requirement: Descarte ao iniciar nova partida

Ao iniciar uma nova partida, o sistema SHALL descartar todo o histórico anterior.

#### Scenario: Novo jogo

- **WHEN** uma nova partida é iniciada
- **THEN** o histórico é esvaziado
- **AND** passa a conter apenas os eventos ocorridos a partir desse início
