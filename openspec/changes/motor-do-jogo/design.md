# Design

## Context

Ver `proposal.md — Why`. Fatos e restrições que moldam o desenho:

- O domínio planejado em `dominio-do-jogo` expõe funções **imutáveis** (`criarPartida`, `posicionarEmbarcacao`, `iniciarBatalha`, `atacar`, `escolherAtaqueAleatorio`) e tipos como `Partida`, `Tabuleiro`, `Frota` e `ResultadoAtaque`. Nada disso está implementado ainda (0/13 tasks), então esta change depende daquela.
- O app é Angular 22.2 **zoneless** e já usa `signal` em `src/app/app.ts`; não há store, serviço injetável ou pasta `estado/` ainda.
- `tsconfig.spec.json` inclui `src/**/*.spec.ts` e o builder `@angular/build:unit-test` roda Vitest. Serviços podem ser testados com `TestBed` sem DOM.
- O `README.md` exige que a frota do computador permaneça oculta até ser atingida e que os resultados dos ataques permaneçam visíveis.
- `AGENTS.md` exige Signals, componentes standalone e nomes em português.

As regras de comportamento estão em `specs/controle-da-partida` e `specs/historico-da-partida`; este documento decide **como** implementá-las.

## Goals / Non-Goals

**Goals:**

- Uma única fonte de estado reativo, consumível pelas Fases 3–4 sem lógica de jogo nos componentes.
- Ações com resultado explícito, para a UI distinguir sucesso de recusa e exibir feedback.
- Estado exposto que nunca revele a frota oculta do computador.
- Testes determinísticos, sem timers e sem DOM.

**Non-Goals:**

- Nenhum atraso artificial do turno do computador; o agendamento fica na camada de UI.
- Nenhum componente, template, ícone ou estilo.
- Nenhuma formatação de texto para o histórico.
- Nenhuma persistência, rota ou deep-link.

## Decisions

### 1. Um único `signal` com o estado completo, e `computed` para as projeções

```
interface EstadoDoJogo {
  partida: Partida;                       // estado de domínio
  historico: readonly EventoDaPartida[];  // eventos da partida
}

private readonly estado = signal<EstadoDoJogo>(criarEstadoInicial());
```

Toda ação monta o próximo `EstadoDoJogo` e o escreve **de uma vez** com `estado.set(...)`.

- **Por quê**: evita estado "rasgado" entre vários signals (ex.: `partida` atualizada e `historico` ainda antigo). A UI que lê `computed` nunca observa um meio-termo.
- **Alternativa rejeitada**: um `signal` por campo (`fase`, `turno`, `historico`...). Simplifica leituras isoladas, mas cada ação precisaria de N escritas e não haveria atomicidade.
- **Alternativa rejeitada**: campos mutáveis na classe. Não notificaria consumers de signals e quebraria a detecção zoneless.

### 2. `JogoStore` como serviço `providedIn: 'root'`

```
@Injectable({ providedIn: 'root' })
export class JogoStore { ... }
```

- **Por quê**: a partida é única e vive enquanto o app estiver aberto. Um serviço root é o menor mecanismo que dá singleton, DI para o token de aleatoriedade e `TestBed.inject`.
- **Alternativa rejeitada**: prover o store no componente raiz. O estado morreria se o componente fosse recriado e os testes precisariam montar componentes.
- **Alternativa rejeitada**: biblioteca de estado externa (NgRx/Signals store). Overhead grande para um estado linear de 5 ações.

### 3. Ações retornam união discriminada e só alteram estado em caso de sucesso

```
type ResultadoAcao =
  | { tipo: 'ok'; ataque?: ResultadoAtaqueDaPartida }
  | { tipo: 'fase-invalida'; fase: Fase }
  | { tipo: 'turno-invalido' }
  | { tipo: 'frota-incompleta' }
  | { tipo: 'posicionamento-recusado'; resultado: ResultadoPosicionamento };
```

- **Por quê**: a UI decide o feedback (toast, borda vermelha, mensagem) sem inspecionar o estado interno nem comparar strings soltas. Recusas não geram evento de histórico por construção: o estado nem é escrito.
- **Regra**: as guardas do store (`fase`, `turno`) existem para dar à UI um motivo específico. O domínio continua sendo a autoridade final; quando ele recusa, o store apenas mapeia o resultado.
- **Alternativa rejeitada**: `throw` para recusas. Obrigaria a UI a usar `try/catch` para fluxo normal e poluiria o console.

### 4. O estado exposto nunca inclui a frota do computador

O store mantém `Partida` privada e expõe apenas projeções:

```
fase, turno, vencedor, encerrada,
frotaDoJogador, ataquesNoJogador, marcasNoTabuleiroDoJogador,
ataquesNoComputador, marcasNoTabuleiroDoComputador,
coordenadasAtacaveis, historico, ultimoEvento
```

- **Por quê**: `Partida.computador.frota` contém as posições ocultas. Se qualquer seletor devolvesse o `Tabuleiro` do computador, a UI poderia revelar os navios. A fronteira é o tipo público: o store nunca retorna `Tabuleiro` do computador.
- **Alternativa rejeitada**: expor `Partida` inteira e confiar na convenção da UI. Uma distração no template vazaria a frota.
- **Consequência**: para desenhar o tabuleiro do computador, a UI usa `marcasNoTabuleiroDoComputador`, que contém somente coordenadas **já atacadas** e o resultado correspondente.

### 5. O histórico é também a fonte das marcas de ataque

```
type ResultadoMarcado = 'agua' | 'acerto' | 'destruida';

marcasNoTabuleiroDoJogador: ReadonlyMap<Coordenada, ResultadoMarcado>
marcasNoTabuleiroDoComputador: ReadonlyMap<Coordenada, ResultadoMarcado>
```

- **Por quê**: o domínio guarda apenas o conjunto de coordenadas atacadas, não o resultado de cada uma. Derivar do histórico evita estender o domínio só para renderização e mantém a informação exata de "destruída".
- **Alternativa rejeitada**: recalcular acerto/erro consultando a frota a cada render. Funcionaria para o jogador, mas exigiria consultar a frota oculta do computador e ainda não distinguiria "acerto" de "destruída" sem lógica extra.
- **Consistência**: o evento de ataque e a atualização do tabuleiro entram no mesmo `estado.set`, então marca e histórico nunca divergem.

### 6. Eventos com sequência monotônica e dados, não texto

```
type EventoDaPartida =
  | { sequencia: number; tipo: 'partida-iniciada' }
  | { sequencia: number; tipo: 'embarcacao-posicionada'; tipoEmbarcacao; posicoes }
  | { sequencia: number; tipo: 'embarcacao-removida'; tipoEmbarcacao }
  | { sequencia: number; tipo: 'batalha-iniciada' }
  | { sequencia: number; tipo: 'ataque'; autor; coordenada; resultado: ResultadoAtaque }
  | { sequencia: number; tipo: 'partida-encerrada'; vencedor };
```

- **Por quê**: `sequencia` dá chave estável para `@for (evento of historico(); track evento.sequencia)`. Eventos carregam dados, não frases prontas, para que a Fase 4 escolha ícone e texto sem alterar o motor. A sequência reinicia em cada nova partida, acompanhando o descarte do histórico.
- **Alternativa rejeitada**: guardar `string` já formatada. Engessa idioma, acessibilidade e estilo no estado.

### 7. Aleatoriedade por `InjectionToken`, não por parâmetro de método

```
export type Aleatorio = () => number;
export const ALEATORIO = new InjectionToken<Aleatorio>('ALEATORIO', {
  providedIn: 'root',
  factory: () => Math.random,
});
```

- **Por quê**: o store injeta o token uma vez; os testes trocam por uma sequência fixa sem tocar em `Math.random` global (que quebraria testes paralelos) e sem mudar a assinatura das ações.
- **Alternativa rejeitada**: receber `aleatorio` em cada ação. Polui a API da UI, que não tem motivo para fornecer aleatoriedade.
- **Alternativa rejeitada**: `vi.spyOn(Math, 'random')`. Acopla o teste a um global e pode vazar entre arquivos.

### 8. Store timer-agnóstico; o atraso pertence à UI

```
jogarTurnoDoComputador(): ResultadoAcao
```

A ação escolhe a coordenada com `escolherAtaqueAleatorio(partida.jogador)` e aplica o ataque, mas **não** usa `setTimeout`.

- **Por quê**: manter o motor determinístico e trivial de testar. O "computador pensando" é percepção visual, não regra de jogo. A Fase 4 agenda a chamada e cuida do cancelamento ao reiniciar.
- **Alternativa rejeitada**: `setTimeout` no store. Exigiria timers falsos nos testes, tratamento de corrida e cancelamento no `novaPartida()`; colocaria uma preocupação de apresentação dentro do estado.
- **Consequência**: a UI precisa chamar a ação quando `turno() === 'computador'`. O store expõe esse estado; o agendamento vira responsabilidade explícita da tela.

### 9. Estrutura de arquivos mínima

```
src/app/estado/
  aleatorio.ts        tipo Aleatorio + InjectionToken ALEATORIO
  jogo-store.ts       JogoStore, EstadoDoJogo, EventoDaPartida, ResultadoAcao
  jogo-store.spec.ts  testes com TestBed e ALEATORIO determinístico
```

- **Por quê**: um arquivo por responsabilidade; nada de barrel ou pasta de tipos vazia. `jogo-store.ts` exporta seus tipos porque são a API pública consumida pelas telas.
- **Alternativa rejeitada**: espalhar `evento.ts`, `resultado-acao.ts`, `seletores.ts`. Para o tamanho atual, fragmentaria a leitura sem ganho.

## Risks / Trade-offs

| Risco | Mitigação |
| --- | --- |
| A frota do computador vazar por um seletor | `EstadoDoJogo` privado; nenhum seletor devolve `Tabuleiro` do computador; teste que verifica que as marcas só existem para coordenadas atacadas |
| `dominio-do-jogo` ainda não implementado | Tasks desta change começam com uma verificação de que a API existe; aplicar depois daquela change |
| Ação chamada duas vezes (duplo clique) | Guardas de fase/turno; o segundo ataque retorna `repetido` ou `turno-invalido` sem escrever estado |
| Histórico e tabuleiro divergirem | Ambos são montados no mesmo objeto e escritos em um único `estado.set` |
| `computed` sobre `Set`/`Map` mutados in-place | Domínio devolve novas instâncias; o store nunca muta coleções recebidas |
| UI esquecer de chamar `jogarTurnoDoComputador` e a partida travar | Estado `turno` é exposto; a Fase 4 terá um efeito dedicado, coberto por teste de integração |
| Testes usando `Math.random` por engano | Todo teste injeta `ALEATORIO` com sequência fixa; o valor padrão só existe em produção |

## Migration Plan

1. Confirmar que `src/app/dominio/` existe com a API descrita em `dominio-do-jogo`.
2. Criar `src/app/estado/aleatorio.ts`.
3. Criar `src/app/estado/jogo-store.ts` com estado, seletores e ações.
4. Criar `jogo-store.spec.ts` cobrindo preparação, batalha, turno do computador, encerramento, histórico e ocultação da frota.
5. Rodar `npm test`, `npm run build`, `npm run lint` e `npm run format:check`.

**Rollback**: change aditiva. Remover `src/app/estado/` restaura o estado anterior; nenhum arquivo existente é alterado.

## Open Questions

- Limite máximo do histórico: a partida tem no máximo 100 ataques, então não há necessidade de poda; reavaliar apenas se eventos de preparação crescerem.
- Expor um `ultimoAtaque` separado do histórico: pode ser derivado de `ultimoEvento`; decidir na Fase 4 se a UI precisar de um seletor dedicado.
