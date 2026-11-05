# Proposal

## Why

A preparação da frota já é utilizável, mas iniciar a batalha ainda leva a um placeholder: não é possível atacar pela interface nem acompanhar o combate. A próxima fase deve conectar os tabuleiros às ações já existentes do store, permitindo concluir uma partida e voltar à preparação.

## What Changes

- Substituir o placeholder por uma tela com os dois tabuleiros 10×10: frota e ataques recebidos do jogador à esquerda, ataques contra o computador à direita; layout empilhado em telas pequenas.
- Permitir atacar uma coordenada inédita do computador no turno do jogador, com resposta automática e imediata do computador quando a partida continuar, sem temporizador ou confirmação adicional.
- Mostrar água, acerto e embarcação destruída com marcas persistentes e identificação que não dependa apenas de cores; manter separados os resumos do último ataque de cada participante.
- Identificar de quem é o turno e bloquear alvos repetidos, o tabuleiro próprio e qualquer ataque fora do turno ou após o encerramento.
- Manter os tabuleiros ao encerrar, informar vitória ou derrota e oferecer “Nova partida”, retornando à preparação com o estado reiniciado.
- Reutilizar o componente de tabuleiro da preparação, ampliando seu contrato apresentacional sem alterar seu comportamento atual.
- Fora do escopo: histórico completo visível, placar, animações, atraso artificial, IA estratégica, persistência, revelação da frota oculta ao encerrar e melhorias nas interações de preparação.

## Capabilities

### New Capabilities

- `interface-de-batalha`: apresentação dos dois tabuleiros, seleção de alvos, resposta automática do computador, feedback dos ataques, encerramento e retorno à preparação pela interface.

### Modified Capabilities

Nenhuma. `combate`, `partida`, `controle-da-partida` e `historico-da-partida` já definem resolução, alternância, sigilo, encerramento e reinício. Esta change adiciona sua superfície visual sem alterar esses contratos nem a capability de preparação da change anterior.

## Impact

- `src/app/preparacao/tabuleiro.ts` e sua spec: componente reutilizado e ampliado com marcas de ataque, rótulo por tabuleiro e bloqueios; preservação dos inputs e outputs de preparação.
- Novos arquivos em `src/app/batalha/` para composição da batalha e testes de componente.
- `src/app/app.ts`, `app.html` e `app.spec.ts`: seleção de tela por fase, incluindo encerramento sem perder os tabuleiros.
- `src/app/app.config.ts`: registro dos ícones Lucide adicionais utilizados na identificação das marcas.
- Consumo de `JogoStore` sem novas ações, acesso ao estado privado ou alteração do domínio. Sem dependências novas.
- Dependência de implementação: trabalho existente de `preparacao-da-partida`, já presente no workspace; seu arquivamento é independente e não integra este escopo.
- Verificação com testes determinísticos e os comandos de teste, build, lint e formatação do projeto.
