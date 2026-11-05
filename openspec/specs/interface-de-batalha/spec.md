# interface-de-batalha Specification

## Purpose

Define a interface de combate contra o computador: visualização dos tabuleiros, ataques por coordenada, resultados persistentes, encerramento da batalha e retorno à preparação.

## Requirements

### Requirement: Exibição dos dois tabuleiros

A interface SHALL apresentar dois tabuleiros identificados, cada um com 10 linhas e 10 colunas, durante a batalha e no encerramento. O tabuleiro do jogador SHALL mostrar sua frota e os ataques recebidos; o do computador SHALL mostrar somente os ataques realizados e seus resultados.

#### Scenario: Batalha iniciada

- **WHEN** o jogador inicia a batalha com a frota completa
- **THEN** a tela de preparação é substituída pelos tabuleiros do jogador e do computador
- **AND** as embarcações do jogador estão visíveis
- **AND** nenhum ataque está marcado no início

#### Scenario: Partida em andamento

- **WHEN** ambos os participantes já realizaram ataques
- **THEN** o tabuleiro do jogador mantém sua frota visível e apresenta os ataques recebidos
- **AND** o tabuleiro do computador apresenta as coordenadas atacadas pelo jogador e os resultados correspondentes

### Requirement: Sigilo da frota adversária na interface

A interface SHALL NOT revelar embarcações, tipos ou posições intactas do computador por conteúdo visível, rótulos acessíveis ou atributos das células. Nesta interface, as posições não atacadas SHALL continuar ocultas também após o encerramento.

#### Scenario: Célula adversária não atacada

- **WHEN** uma coordenada do computador ainda não foi atacada
- **THEN** ela é apresentada como uma posição não atacada
- **AND** sua representação não informa se contém embarcação

#### Scenario: Acerto sem revelar células vizinhas

- **WHEN** um ataque atinge parte de uma embarcação do computador
- **THEN** apenas a coordenada atacada recebe uma marca de resultado
- **AND** as posições restantes não são reveladas

#### Scenario: Sigilo preservado ao encerrar

- **WHEN** a partida termina com posições adversárias ainda não atacadas
- **THEN** essas posições continuam sem identificação de ocupação

### Requirement: Ataque por seleção de coordenada

No turno do jogador e durante a batalha, a interface SHALL permitir atacar uma coordenada inédita selecionando sua célula no tabuleiro do computador. Cada seleção aceita SHALL realizar exatamente um ataque do jogador, sem confirmação adicional.

#### Scenario: Primeiro ataque

- **WHEN** o jogador seleciona uma coordenada adversária ainda não atacada em seu turno
- **THEN** um único ataque é realizado naquela coordenada
- **AND** seu resultado aparece no tabuleiro do computador

#### Scenario: Tabuleiro próprio não é alvo

- **WHEN** o jogador tenta ativar uma célula do próprio tabuleiro durante a batalha
- **THEN** nenhum ataque nem alteração de posicionamento ocorre

### Requirement: Bloqueio de ataques indisponíveis

A interface SHALL desabilitar alvos já atacados e todos os alvos fora do turno do jogador ou após o encerramento. Tentar ativar uma célula indisponível SHALL NOT alterar os tabuleiros, acrescentar eventos ou provocar um ataque do computador.

#### Scenario: Ataque repetido impedido

- **WHEN** o jogador tenta selecionar uma coordenada adversária já atacada
- **THEN** nenhum novo ataque é realizado
- **AND** o turno, os tabuleiros e o histórico permanecem inalterados

#### Scenario: Ataque fora do turno impedido

- **WHEN** o turno pertence ao computador e o jogador tenta selecionar uma coordenada adversária
- **THEN** nenhum ataque do jogador é realizado

#### Scenario: Ataque após o fim impedido

- **WHEN** o jogador tenta selecionar uma coordenada após a partida terminar
- **THEN** o estado final permanece inalterado
- **AND** todos os alvos adversários permanecem desabilitados

### Requirement: Resposta automática e imediata do computador

Após um ataque válido do jogador que não encerre a partida, a interface SHALL executar exatamente um ataque do computador imediatamente, sem pausa artificial nem ação adicional. O contra-ataque SHALL ocorrer também após acerto ou destruição não terminal; nenhuma resposta SHALL ocorrer após tentativa inválida ou vitória do jogador.

#### Scenario: Resposta após água

- **WHEN** o ataque do jogador resulta em água e a partida continua
- **THEN** o computador realiza um ataque em coordenada ainda não atacada por ele
- **AND** seu resultado é apresentado no tabuleiro do jogador
- **AND** o turno volta ao jogador se a partida continuar

#### Scenario: Resposta após acerto ou destruição não terminal

- **WHEN** o ataque do jogador resulta em acerto ou embarcação destruída sem encerrar a partida
- **THEN** o computador realiza exatamente um contra-ataque
- **AND** o jogador não recebe um ataque extra pelo acerto

#### Scenario: Vitória sem contra-ataque

- **WHEN** o jogador destrói a última embarcação do computador
- **THEN** a partida termina sem novo ataque do computador

### Requirement: Indicação do turno

Durante a batalha, a interface SHALL identificar textualmente de quem é o turno, refletindo o estado atual da partida. Após o encerramento, SHALL substituir a instrução de ataque pela indicação do resultado final.

#### Scenario: Turno inicial do jogador

- **WHEN** a batalha começa
- **THEN** a interface indica que é a vez do jogador e orienta a selecionar uma coordenada adversária

#### Scenario: Turno do computador

- **WHEN** a interface apresenta um estado em que o turno pertence ao computador
- **THEN** a indicação textual identifica o computador
- **AND** os alvos do jogador estão indisponíveis

### Requirement: Marcas persistentes e distintas de ataque

A interface SHALL distinguir água, acerto e embarcação destruída com símbolos visíveis e descrições acessíveis, sem depender apenas de cores. Cada coordenada atacada SHALL preservar o resultado daquele ataque até uma nova partida; a destruição SHALL identificar a célula do ataque que a concluiu, sem exigir recolorir os acertos anteriores.

#### Scenario: Água e acerto identificáveis

- **WHEN** há ataques com resultados de água e acerto
- **THEN** as células apresentam símbolos e descrições de resultado diferentes
- **AND** cada descrição identifica a coordenada e o resultado

#### Scenario: Destruição identificável

- **WHEN** um ataque destrói uma embarcação de qualquer participante
- **THEN** a célula daquele ataque apresenta uma marca de embarcação destruída distinta de acerto
- **AND** as marcas de ataques anteriores permanecem visíveis

### Requirement: Resumos separados dos últimos ataques

A interface SHALL exibir separadamente o último ataque do jogador e o último ataque do computador, identificando autor, coordenada e resultado em português. A resposta imediata do computador SHALL NOT substituir o resumo do ataque do jogador; antes do primeiro ataque de cada lado, SHALL informar sua ausência.

#### Scenario: Rodada concluída

- **WHEN** o jogador ataca e o computador responde
- **THEN** ambos os resumos permanecem visíveis com suas coordenadas e resultados
- **AND** a atualização dos resultados é anunciada em uma região acessível de status

#### Scenario: Nenhum ataque realizado

- **WHEN** a batalha acabou de começar
- **THEN** os dois resumos indicam que ainda não houve ataque daquele participante

### Requirement: Encerramento básico visível

Ao encerrar a partida, a interface SHALL manter ambos os tabuleiros e os resultados finais, informar vitória do jogador ou vitória do computador e oferecer a ação “Nova partida”. Os ataques SHALL permanecer bloqueados e os controles de preparação SHALL permanecer ausentes.

#### Scenario: Vitória do jogador

- **WHEN** o jogador destrói toda a frota do computador
- **THEN** a interface informa a vitória do jogador
- **AND** mantém os tabuleiros com as marcas finais e a ação “Nova partida”

#### Scenario: Derrota do jogador

- **WHEN** o contra-ataque do computador destrói a última embarcação do jogador
- **THEN** a interface informa a vitória do computador e a derrota do jogador
- **AND** mantém os tabuleiros com as marcas finais e a ação “Nova partida”

### Requirement: Retorno à preparação ao jogar novamente

A ação “Nova partida” SHALL estar disponível após o encerramento e SHALL retornar à preparação com frota do jogador vazia, ataques e resumos anteriores descartados e nenhum vencedor. O computador SHALL receber uma nova frota válida sem revelar suas posições.

#### Scenario: Jogar novamente após encerrar

- **WHEN** o jogador aciona “Nova partida” após vitória ou derrota
- **THEN** a tela de preparação substitui a interface de batalha
- **AND** o progresso da frota do jogador volta a zero
- **AND** os ataques, resumos e vencedor anteriores são descartados

#### Scenario: Nova batalha sem resultados anteriores

- **WHEN** o jogador completa novamente sua frota e inicia outra batalha
- **THEN** ambos os tabuleiros estão sem marcas de ataques
- **AND** os resumos indicam que ainda não houve ataques

### Requirement: Uso responsivo e por teclado

A interface SHALL permitir reconhecer os tabuleiros e seus estados em uma viewport de 360 pixels sem rolagem horizontal da página. Os alvos disponíveis e a ação de nova partida SHALL ser operáveis por teclado, com foco visível; cada tabuleiro SHALL ter um nome acessível próprio.

#### Scenario: Tela estreita

- **WHEN** a interface é apresentada em uma viewport de 360 pixels
- **THEN** os tabuleiros são empilhados sem perder células, legendas ou resultados
- **AND** a página não exige rolagem horizontal

#### Scenario: Ataque pelo teclado

- **WHEN** o jogador foca um alvo disponível e o ativa com Enter ou Espaço
- **THEN** ocorre o mesmo ataque e a mesma resposta automática de uma seleção por clique
- **AND** o nome do tabuleiro e a coordenada do alvo podem ser identificados por tecnologia assistiva
