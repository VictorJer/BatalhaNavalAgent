# Design

## Context

Ver `proposal.md — Why`. Fatos verificados no ambiente que condicionam o desenho:

- `ng new --help` (CLI `22.2.0`) oferece `--style tailwind`, `--test-runner vitest` (default), `--zoneless`, `--file-name-style-guide 2025` (default) e `--standalone` (default `true`).
- Um `--dry-run` com `--directory .` neste repositório falha com `A merge conflicted on path "/README.md"`, porque o gerador quer criar `README.md` e `.gitignore`.
- `@angular/core@22.2.0` declara `engines.node: ^22.22.3 || ^24.15.0 || >=26.0.0`; o Node local é `24.22.0` (compatível). O "Node 26+" do README é recomendação, não pré-requisito.
- `lucide-angular@1.0.0` está **deprecado** ("Please use @lucide/angular instead"); `@lucide/angular` está em `1.66.0` e expõe `provideLucideIcons()`.
- `ng new` gera `.prettierrc` e `.postcssrc.json`, mas **não** gera ESLint.
- `openspec/` está inicializado (`schema: spec-driven`), sem specs e sem changes; `openspec/specs/` vazio.

## Goals / Non-Goals

**Goals:**

- Deixar o repositório em estado "app roda, testa, builda e passa lint" com um único comando por verificação.
- Fixar as versões e a estrutura de pastas que as fases seguintes vão usar, sem antecipar regras de jogo.
- Preservar integralmente o conteúdo já versionado (enunciado, diretrizes, OpenSpec, config do OpenCode, `.git`).

**Non-Goals:**

- Nenhuma regra de Batalha Naval, tela de jogo, modelo de tabuleiro ou componente de célula.
- Nenhum design visual definitivo; apenas tokens semânticos e um shell mínimo.
- Nenhum setup de CI, deploy, PWA ou SSR.

## Decisions

### 1. Scaffold em diretório temporário + cópia seletiva

Rodar `ng new batalha-naval` em `%TEMP%` e copiar para o repositório, ignorando `README.md` e fazendo merge do `.gitignore`.

- **Por quê**: `--directory .` falha (conflito comprovado) e `--force` sobrescreveria o enunciado. Subpasta (`ng new app`) criaria um workspace aninhado, contrariando "evitar layouts complexos".
- **Alternativas**: (a) `--force` — perde `README.md`; (b) mover arquivos para `docs/`, gerar e devolver — mais passos e risco de perder histórico de caminhos; (c) monorepo com `projects/` — overhead desnecessário para um app.
- **Critério de sucesso**: `git status` mostra apenas arquivos novos esperados; `README.md`, `AGENTS.md`, `openspec/`, `.opencode/` com diff vazio.

### 2. Comando canônico do scaffold

```bash
npx @angular/cli@22.2.0 new batalha-naval \
  --style tailwind --zoneless --routing=false --ssr=false \
  --ai-config none --skip-git --commit=false --package-manager npm
```

- **Por quê**: `--style tailwind` já instala Tailwind 4 + `@tailwindcss/postcss` e gera `.postcssrc.json`, evitando o `npm install ... --force` que a documentação do Tailwind sugere por conflito de peer dependency.
- **`--routing=false`**: sem router neste app (ver decisão 5).
- **`--skip-git/--commit=false`**: o repositório já existe.
- **`--ai-config none`**: as instruções do projeto já vivem em `AGENTS.md`; evita duplicata de config de IA.

### 3. Zoneless explícito

Manter `provideZonelessChangeDetection()` no `app.config.ts` (o CLI cria o app sem `zone.js` via `--zoneless`) e garantir que nenhum `polyfills` de zone seja reintroduzido depois.

- **Por quê**: exigência do `AGENTS.md`; zoneless + signals é o caminho nativo do Angular 22.
- **Consequência para fases futuras**: toda atualização de estado deve passar por signals; `setTimeout` do turno do computador (fase 3) precisará atualizar signals e cuidar de timers obsoletos.

### 4. `@lucide/angular` com `provideLucideIcons`

Registrar um conjunto inicial pequeno de ícones no `app.config.ts` e usá-los em um componente para provar o wiring.

- **Por quê**: `lucide-angular` está deprecado; `provideLucideIcons` é tree-shakable e é a API documentada atual.
- **Alternativa**: importar ícone a ícone nos componentes standalone — válido, porém repetitivo; dá para adotar se o provider não funcionar como esperado.
- **Risco**: a API 1.66 é recente; a tarefa inclui um spike de 1 ícone renderizado antes de seguir.

### 5. Sem router — telas por estado

O shell usa `@switch (jogo.fase())` para alternar entre `apresentacao | preparacao | batalha | fimDeJogo`.

- **Por quê**: o jogo tem um fluxo linear e único; router adicionaria guards, params e deep-linking que ninguém pediu (e o README exclui retomada de partida).
- **Alternativa**: rotas `/inicio`, `/preparacao`, `/batalha` — facilita deep-link e testes de URL, mas permite estados inválidos (entrar em `/batalha` sem frota) e não traz ganho funcional aqui.

### 6. Estrutura de pastas fixada já na fundação

```
src/app/
  dominio/       regras puras (fase 1) — sem imports de @angular
  estado/        stores com signals (fase 3)
  componentes/   tabuleiro, celula, painel-frota, historico (fases 2-3)
  telas/         inicio, preparacao, batalha, resultado (fases 2-4)
  app.ts, app.config.ts, app.html, app.css
```

- **Por quê**: separa domínio puro de UI desde o início, o que mantém os testes da fase 1 rápidos e sem TestBed.
- **Não fazer agora**: criar arquivos vazios "para depois"; só diretórios quando houver primeiro arquivo real.

### 7. ESLint + Prettier como scripts npm

`ng add @angular-eslint/schematics@22` e scripts:

| Script | Comando |
| --- | --- |
| `start` | `ng serve` |
| `build` | `ng build` |
| `test` | `ng test` |
| `lint` | `ng lint` |
| `format` | `prettier --write .` |
| `format:check` | `prettier --check .` |

- **Por quê**: o README já documenta exatamente esses comandos; sem eles a fase 0 não cumpre o contrato.
- **Atenção**: excluir de `format`/`lint` os artefatos do OpenSpec e `.opencode/` se gerarem ruído (configurar `.prettierignore`).

### 8. Tema por tokens semânticos, não por cores soltas

Definir em `src/styles.css` (`@theme`) tokens como `--color-agua`, `--color-acerto`, `--color-erro`, `--color-navio`, `--color-destruida`.

- **Por quê**: o README exige que acerto/erro/destruída sejam reconhecíveis **sem depender apenas de cor** (ícone + texto virão junto), mas a base de cor precisa ser consistente e trocável.
- **Não fazer agora**: paleta final, dark mode, animações.

## Risks / Trade-offs

| Risco | Mitigação |
| --- | --- |
| Cópia do scaffold sobrescrever ou duplicar arquivos versionados | Copiar com lista explícita de exclusões e revisar `git status` antes de instalar dependências |
| `--style tailwind` gerar Tailwind 3 em vez de 4 (opção depende da versão do schematic) | Verificar `package.json` (`tailwindcss: ^4`), `.postcssrc.json` com `@tailwindcss/postcss` e `@import "tailwindcss"` em `styles.css`; se vier 3, migrar seguindo a doc oficial de upgrade |
| `@lucide/angular` 1.66 com comportamento diferente do esperado | Spike de 1 ícone; se falhar, importar ícones direto nos componentes (sem trocar de pacote) |
| Node local 24.22 vs "Node 26+" do README | Engines do `@angular/core` aceitam `^24.15.0`; registrar no README/AGENTS apenas se gerar confusão real (fora deste change) |
| ESLint/Prettier reformatando artefatos do OpenSpec e poluindo diffs | `.prettierignore`/`.eslintignore` com `openspec/`, `dist/`, `.angular/` |
| `npm install` trazer `zone.js` de volta por dependência transitiva | Conferir `angular.json` sem polyfill de zone e bootstrap com `provideZonelessChangeDetection()` |

## Migration Plan

1. Gerar o scaffold em diretório temporário e validar que os arquivos esperados existem.
2. Copiar seletivamente para o repositório (sem `README.md`, com merge do `.gitignore`).
3. Instalar dependências e validar `npm start`, `npm test`, `npm run build`.
4. Adicionar ESLint e scripts; validar `npm run lint` e `npm run format:check`.
5. Substituir o template de boas-vindas pelo shell em português e validar visualmente.

**Rollback**: o change inteiro é aditivo (nenhum arquivo versionado é alterado além de `.gitignore`). Basta `git clean` dos arquivos novos e `git checkout -- .gitignore`.

## Open Questions

Nenhuma pendente que altere escopo ou quebra de tarefas. Nome do projeto (`batalha-naval`), prefixo de componente (`app`) e idioma dos textos de UI (português, conforme `AGENTS.md`) já estão definidos.
