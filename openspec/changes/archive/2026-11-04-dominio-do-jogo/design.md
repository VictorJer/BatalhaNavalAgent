# Design

## Context

Ver `proposal.md — Why`. Fatos do repositório que condicionam o desenho:

- `src/app/` contém apenas o shell (`app.ts`, `app.html`, `app.config.ts`, `app.spec.ts`); as pastas `dominio/`, `estado/`, `componentes/` e `telas/` foram planejadas na fundação mas ainda não existem.
- `tsconfig.spec.json` inclui `src/**/*.spec.ts` e o builder `@angular/build:unit-test` executa Vitest, então testes de domínio entram sem configuração nova.
- `eslint.config.js` aplica regras do `angular-eslint` a todo `**/*.ts`, inclusive arquivos de domínio.
- `openspec/specs/` está vazio; `openspec/config.yaml` está no schema `spec-driven` sem `context` ou `rules` customizados.
- `AGENTS.md` exige Angular 22.2 zoneless com Signals e nomes de métodos/variáveis em português.

As regras de comportamento estão em `specs/frota`, `specs/combate` e `specs/partida`; este documento decide **como** implementá-las.

## Goals / Non-Goals

**Goals:**

- Entregar um núcleo de domínio puro, determinístico e sem dependência de framework, consumível pela Fase 2 (store) sem reescrita.
- Fazer cada função devolver um valor novo, para que o store possa guardar `Partida` em um `signal` e reagir por identidade.
- Cobrir os cenários do `README.md` com testes rápidos, sem `TestBed` e sem DOM.

**Non-Goals:**

- Nenhum componente, template, estilo ou ícone.
- Nenhum store, signal ou efeito de UI.
- Nenhum timer do turno do computador (Fase 2).
- Nenhuma formatação de histórico, mensagens de interface ou persistência.

## Decisions

### 1. Frota como fonte da verdade, sem grade mutável

O estado de uma posição é **derivado**: acerto é `ataques ∩ posiçõesOcupadas`. Não existe matriz de células com `agua | navio | acerto | erro`.

- **Por quê**: elimina estado duplicado e a classe de bug em que a célula diz "acerto" mas a frota não confirma. Destruição vira uma conta direta (todas as posições da embarcação estão em `ataques`).
- **Alternativa rejeitada**: grade como fonte da verdade. Facilitaria pintar a tela, mas exigiria reconstruir a frota para saber o que foi destruído e manteria duas verdades sincronizadas.
- **Consequência**: a UI das Fases 3–4 deriva as 100 células do tabuleiro combinando `frota` + `ataques`, sem receber uma grade pronta.

### 2. `Coordenada` como string marcada, não objeto

`Coordenada` é uma string validada no formato `A1`..`J10` (tipo marcado em TypeScript), criada por uma fábrica que rejeita posições fora do tabuleiro.

```
coordenada(linha, coluna): Coordenada | null
linhaDe(c): number
colunaDe(c): number
rotulo(c): string
```

- **Por quê**: `Set<Coordenada>` e `Map<Coordenada, ...>` deduplicam e comparam **por valor**. Com objetos `{linha, coluna}`, `Set.has` falharia por identidade de referência — exatamente o bug que faria o ataque repetido passar.
- **Alternativa rejeitada**: objeto `{linha, coluna}` com uma `chave()` string para Sets. Funciona, mas cria duas representações e exige conversão em todo ponto de comparação.
- **Alternativa rejeitada**: índice numérico `0..99`. Também funciona em `Set`, porém é ilegível em testes e logs.
- **Custo**: conversões de índice para string na geração de posições; mitigado por helpers pequenos e testados.

### 3. `Embarcacao` guarda posições, não origem + orientação

```
type TipoEmbarcacao = 'porta-avioes' | 'encouracado' | 'cruzador' | 'submarino' | 'destroyer'

interface Embarcacao {
  readonly tipo: TipoEmbarcacao
  readonly posicoes: readonly Coordenada[];
}
```

- **Por quê**: depois de posicionada, origem e orientação são irrelevantes para combate. Guardar apenas posições torna `estaDestruida` e a renderização diretas. O tamanho vem da ficha do tipo.
- **Consequência**: rotacionar ou mover na preparação é criar uma `Embarcacao` nova; nada é mutado.

### 4. Frota como registro parcial por tipo

```
type Frota = Readonly<Partial<Record<TipoEmbarcacao, Embarcacao>>>
```

- **Por quê**: o mesmo tipo serve à preparação (parcial) e à batalha (completa), sem duas estruturas. `estaCompleta` verifica as cinco chaves. O tipo, e não o tamanho, identifica a embarcação — obrigatório porque cruzador e submarino têm 3 posições.
- **Alternativa rejeitada**: `Embarcacao[]` com busca por tipo a cada operação; mais código e risco de duplicata.

### 5. `posicionar` substitui atomicamente a embarcação do mesmo tipo

`posicionar(frota, tipo, origem, orientacao)` valida a nova posição contra **todas as outras** embarcações e, se válida, troca a do mesmo tipo.

- **Por quê**: atende "substituir" da spec e preserva a regra "rejeitar sem alterar o posicionamento válido existente". Se a validação falhar, a frota antiga é devolvida intacta.
- **Alternativa rejeitada**: `remover` + `posicionar` em duas chamadas. Entre as duas a frota fica inválida e o chamador precisa saber reverter.
- **Motivos de rejeição**: `fora-do-tabuleiro` e `sobreposicao` (com o tipo ocupante), para a UI explicar o erro sem inferir.

### 6. Resultados como união discriminada, sem exceções

```
type ResultadoPosicionamento =
  | { tipo: 'ok'; frota: Frota }
  | { tipo: 'fora-do-tabuleiro' }
  | { tipo: 'sobreposicao'; com: TipoEmbarcacao }

type ResultadoAtaque =
  | { tipo: 'agua' }
  | { tipo: 'acerto'; embarcacao: Embarcacao }
  | { tipo: 'destruida'; embarcacao: Embarcacao }
  | { tipo: 'repetido' }
  | { tipo: 'fora-do-tabuleiro' }
```

- **Por quê**: o chamador é forçado pelo compilador a tratar todos os casos; o `tipo` vira a chave de ícone/texto na UI (requisito de não depender de cor). Nada de `throw` para fluxo esperado.
- **Alternativa rejeitada**: exceções para ataque repetido/inválido. Mistura fluxo normal com erro e dificulta o store.
- **`partida-encerrada`** não pertence à resolução de tabuleiro: é adicionado pela camada de partida, que é quem conhece a fase.

### 7. `Tabuleiro` e `Partida` como entidades separadas

```
interface Tabuleiro {
  readonly frota: Frota;
  readonly ataques: ReadonlySet<Coordenada>;
}

atacar(tabuleiro, coordenada): { tabuleiro: Tabuleiro; resultado: ResultadoAtaque }
estaDerrotado(tabuleiro): boolean
coordenadasNaoAtacadas(tabuleiro): Coordenada[]
escolherAtaqueAleatorio(tabuleiro, aleatorio?): Coordenada | null

interface Partida {
  readonly jogador: Tabuleiro;
  readonly computador: Tabuleiro;
  readonly turno: 'jogador' | 'computador';
  readonly fase: 'preparacao' | 'batalha' | 'encerrada';
  readonly vencedor: 'jogador' | 'computador' | null;
}

criarPartida(aleatorio?): Partida
posicionarEmbarcacao(partida, tipo, origem, orientacao): { partida; resultado }
removerEmbarcacao(partida, tipo): Partida
iniciarBatalha(partida): { tipo: 'ok'; partida } | { tipo: 'frota-incompleta' }
atacar(partida, coordenada): { partida: Partida; resultado: ResultadoAtaqueDaPartida }
```

- **Por quê**: `Tabuleiro` isola "ataque contra uma frota"; `Partida` isola turno, fase e encerramento. A separação evita que a resolução de ataque precise saber de quem é a vez.
- **Ciclo de vida**: `criarPartida` produz a fase `preparacao` com o tabuleiro do jogador vazio e a frota do computador já gerada. `posicionarEmbarcacao`/`removerEmbarcacao` só são aceitos nessa fase. `iniciarBatalha` exige as duas frotas completas e define o turno inicial do jogador. `atacar` só é aceito em `batalha`.
- **Nova partida**: é a própria `criarPartida`, que devolve tabuleiros novos e uma frota recém-gerada para o computador; nenhum ataque anterior sobrevive. Não existe operação de "reset" mutando a partida antiga.
- **Regra de turno**: `atacar` escolhe o alvo pelo `turno`, delega a `atacar` do `Tabuleiro`, e só alterna quando o resultado é válido. Partida encerrada retorna `partida-encerrada`; fase de preparação retorna `batalha-nao-iniciada`.
- **Encerramento**: após um ataque válido, verifica-se o tabuleiro alvo; se derrotado, `fase = 'encerrada'` e `vencedor` é definido **na mesma transição**, impedindo o ataque de resposta do computador.

### 8. Aleatoriedade injetada em frota e ataques

```
type Aleatorio = () => number; // default: Math.random
gerarFrotaAleatoria(aleatorio?: Aleatorio): Frota
escolherAtaqueAleatorio(tabuleiro, aleatorio?: Aleatorio): Coordenada | null
```

- **Por quê**: testes determinísticos sem mock global; permite reproduzir uma frota ou sequência de ataques problemática com uma semente fixa.
- **Frota**: ordenar as embarcações do maior para o menor; para cada uma, sortear origem e orientação e validar contra as já colocadas; se esgotar as tentativas, recomeçar a frota inteira. Maior-primeiro reduz a fragmentação que causa reinícios.
- **Ataque do computador**: sortear um índice entre as coordenadas ainda não atacadas do tabuleiro alvo; devolver `null` quando não houver nenhuma (tabuleiro esgotado). Isso garante, por construção, que o computador nunca repete uma coordenada.
- **Alternativa rejeitada (frota)**: escolher entre todas as posições válidas pré-computadas. Mais robusto, porém mais código e mais lento para 5 embarcações em 10×10.
- **Alternativa rejeitada (ataque)**: sortear coordenadas e repetir até achar uma inédita. Pode entrar em laço quando restam poucas posições.
- **Limite**: um teto de reinícios evita laço infinito; se estourar, o erro é de invariante de implementação, não um resultado de jogo.

### 9. Funções livres e tipos `readonly`, não classes

- **Por quê**: casa com o modelo de Signals da Fase 2 (trocar referência basta para notificar), facilita *tree-shaking* e dispensa `this` nos testes.
- **Alternativa rejeitada**: classes com métodos mutadores. Convidaria a mutação in-place, que quebra a reatividade por identidade.

### 10. Fronteira `dominio/` sem Angular, garantida por revisão nesta change

Nenhum arquivo em `src/app/dominio/` importa `@angular/*`.

- **Por quê**: mantém testes em milissegundos e impede que decisões de UI contaminem regras.
- **Alternativa adiada**: bloquear via `no-restricted-imports` no ESLint. Útil, mas é mudança de configuração e fica para uma change de tooling.

## Risks / Trade-offs

| Risco | Mitigação |
| --- | --- |
| `Set<Coordenada>` com tipo errado (objeto) passaria a compilar mas falharia em runtime | Tipo marcado como string + teste explícito de ataque repetido usando coordenadas construídas separadamente |
| Cruzador e submarino têm o mesmo tamanho e podem ser confundidos | Frota indexada por `TipoEmbarcacao`; teste que destrói um e confirma que o outro permanece intacto |
| Geração aleatória travar em configurações desfavoráveis | Ordem maior-primeiro + teto de tentativas com reinício e teste de 500 execuções |
| Imutabilidade gerar alocações excessivas | Irrelevante na escala do jogo (100 posições, 5 embarcações); prioriza-se correção |
| Regra de turno vazar para o tabuleiro e duplicar lógica | `Tabuleiro` só resolve ataque; `Partida` é o único dono de `turno`/`fase` |
| Specs descrevem comportamento, mas a API pode evoluir | Testes de domínio são o contrato executável; mudanças de assinatura não exigem mudar spec se o comportamento for preservado |

## Migration Plan

1. Criar `src/app/dominio/coordenada.ts` + spec.
2. Criar `embarcacao.ts` e `frota.ts` (+ `frota-aleatoria.ts`) com specs.
3. Criar `tabuleiro.ts` com spec.
4. Criar `partida.ts` com spec.
5. Rodar `npm test`, `npm run build`, `npm run lint` e `npm run format:check`.

**Rollback**: a change é puramente aditiva. Basta remover `src/app/dominio/`; nenhum arquivo existente é alterado.

## Open Questions

- Textos exatos de feedback (ex.: "Água!", "Embarcação destruída") e formato do histórico ficam para as Fases 3–4; não alteram as specs nem a API de domínio.
- A regra de ESLint que bloqueia `@angular/*` em `dominio/` fica para uma change de tooling posterior.
