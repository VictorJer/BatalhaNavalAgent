# Spec Delta

## Purpose

Define como a aplicação apresenta o objetivo do jogo na primeira abertura e permite entrar na preparação, sem interferir no ciclo de vida da partida.

## ADDED Requirements

### Requirement: Apresentação antes da preparação inicial

Ao abrir a aplicação, a interface SHALL mostrar uma apresentação separada com o nome do jogo, uma explicação breve do objetivo de enfrentar o computador e uma ação textual para começar a preparação. Os controles da frota e os tabuleiros de batalha SHALL permanecer ausentes da apresentação.

#### Scenario: Primeira abertura

- **WHEN** a aplicação é aberta para jogar
- **THEN** a apresentação do jogo e a ação de começar são exibidas
- **AND** a tela de preparação e os tabuleiros de batalha não são exibidos

### Requirement: Entrada explícita na preparação

Ao acionar o início na apresentação, a interface SHALL exibir a preparação com a frota do jogador vazia, sem iniciar a batalha ou alterar o estado inicial da partida. Uma ativação SHALL realizar somente uma transição.

#### Scenario: Começar a jogar

- **WHEN** o jogador aciona o início na apresentação
- **THEN** a apresentação deixa de ser exibida e a preparação é mostrada
- **AND** as cinco embarcações do jogador estão pendentes
- **AND** nenhum ataque foi realizado nem a batalha foi iniciada

### Requirement: Reinício sem repetir a apresentação

Depois de encerrada uma partida, a ação “Nova partida” SHALL retornar diretamente à preparação, mantendo a apresentação ausente durante o reinício.

#### Scenario: Jogar novamente após o encerramento

- **WHEN** o jogador aciona “Nova partida” após a vitória ou a derrota
- **THEN** a preparação é exibida com o progresso da frota do jogador zerado
- **AND** a apresentação inicial não é exibida novamente nesse fluxo

### Requirement: Acesso responsivo à apresentação

A apresentação SHALL permanecer legível em uma viewport de 360 pixels sem rolagem horizontal, e a ação de começar SHALL ser operável por teclado e toque, com foco visível e identificação acessível em português.

#### Scenario: Tela estreita

- **WHEN** a apresentação é exibida em uma viewport de 360 pixels
- **THEN** o objetivo e a ação de começar permanecem legíveis sem rolagem horizontal da página

#### Scenario: Ativação por teclado ou toque

- **WHEN** o jogador ativa a ação de começar por Enter, Espaço ou toque
- **THEN** a preparação é exibida uma única vez, sem exigir interação com hover
