# Design

## Context

Ver `proposal.md` para a motivação e `specs/interface-inicial/spec.md` para o comportamento. Hoje `JogoStore` cria imediatamente uma partida na fase `preparacao`; `App` usa essa fase para renderizar a preparação, ou a batalha nas demais fases. `novaPartida()` já retorna à preparação e descarta os ataques. Os testes de `app.spec.ts` presumem que a preparação aparece assim que o shell é montado, inclusive em cenários que passam pelo reinício.

## Goals / Non-Goals

**Goals:**

- Introduzir uma etapa visual de entrada sem modificar a fase `preparacao` do domínio ou criar eventos adicionais no histórico.
- Manter o ciclo preparação → batalha → encerramento → nova preparação e a possibilidade de montar o shell quando o store já está em batalha.
- Localizar a lógica nova no shell e manter a apresentação acessível e pequena.

**Non-Goals:**

- Criar um fluxo de navegação por URL ou persistir a preferência de já ter visto a apresentação entre carregamentos.
- Alterar as ações ou os seletores do store, as regras de combate ou o comportamento de “Nova partida”.

## Decisions

### 1. A apresentação é estado de interface, não fase da partida

Manter no `App` um signal local que indica se a apresentação inicial ainda não foi dispensada. Renderizá-la somente enquanto esse sinal está ativo **e** a fase do store é `preparacao`; caso contrário, renderizar a tela correspondente à fase. O botão de começar desativa esse sinal, sem chamar `novaPartida()` ou `iniciarBatalha()`.

**Por quê:** a partida e a frota do computador já são inicializadas em preparação; um estado exclusivamente visual evita alterar o contrato de `partida` e `controle-da-partida`. A guarda pela fase preserva testes e cenários que montam `App` com uma batalha já em curso. Alternativa rejeitada: criar uma fase `apresentacao` no domínio, pois exigiria mudar guardas, store, histórico e specs existentes sem necessidade de jogo.

### 2. Componente standalone curto para a apresentação

Criar `src/app/inicial/tela-inicial.ts` com texto breve em português e botão nativo “Começar a jogar”, emitindo uma única intenção ao shell. Manter o título principal já existente no `App` e não duplicá-lo no componente. Usar as classes Tailwind e o estilo de foco das demais telas, sem imagens, dependências ou controle que dependa de hover.

**Por quê:** separa conteúdo de boas-vindas da escolha entre telas sem introduzir roteamento. Alternativa rejeitada: colocar todo o conteúdo no `app.html`, que já cuida do fluxo das fases e teria de concentrar apresentação e preparação.

### 3. Reinício não reativa a apresentação

Depois de acionado “Começar a jogar”, o sinal local permanece desativado durante toda a vida do shell. `JogoStore.novaPartida()` continua reinicializando diretamente a fase `preparacao`, exibida sem a apresentação. Uma nova abertura/recarregamento da aplicação cria um shell novo e volta a mostrar a apresentação; não se usa armazenamento permanente.

**Por quê:** segue o reinício acordado e a spec atual de `partida`. Alternativa rejeitada: reativar a apresentação em toda nova partida, que exigiria mudar a experiência de reinício e seus critérios de aceite.

## Risks / Trade-offs

- Testes existentes encontram controles de preparação logo após montar `App` → Adaptar os testes de integração para acionar a entrada inicial antes das interações com a frota; manter cenários de montagem com store já em batalha.
- Uma camada visual antes da preparação pode ser confundida com o início da batalha → Usar texto do botão e do conteúdo que explicite a etapa de organizar a frota; verificar fase, histórico e frota inalterados na transição.
- DOM unitário não comprova largura real nem ativação nativa por teclado/toque → Verificar o fluxo em navegador real em desktop e 360 px, inclusive Enter/Espaço, foco e toque quando disponível.

## Migration Plan

Alteração aditiva de interface: inserir o componente inicial e a seleção de tela no shell, atualizar os testes de integração e validar o ciclo completo. Não há migração de dados. Se for necessário desfazer, remover a etapa visual e restaurar a seleção direta pela fase, mantendo o store e o domínio intactos.
