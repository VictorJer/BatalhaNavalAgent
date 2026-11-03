# Proposal

## Why

O repositório contém apenas o enunciado (`README.md`), as diretrizes (`AGENTS.md`) e as configurações de ferramentas — não existe aplicação Angular. Sem uma base executável, nenhuma fase do jogo (domínio, preparação, batalha, resultado) pode ser implementada nem validada com build, testes e lint.

## What Changes

- Criar o scaffold Angular **22.2.0**, zoneless, com componentes standalone e Signals, e Vitest como runner de testes.
- Preservar os arquivos já versionados (`README.md`, `AGENTS.md`, `openspec/`, `.opencode/`, `.git`): o scaffold é gerado em diretório temporário e copiado de forma seletiva, com merge manual do `.gitignore` (mantendo `*.key`).
- Configurar **Tailwind CSS 4** como sistema de estilos (via opção `--style tailwind` do CLI, que gera `.postcssrc.json` e `src/styles.css`).
- Adicionar **`@lucide/angular`** (o pacote `lucide-angular` está deprecado) com registro de ícones via `provideLucideIcons()`.
- Adicionar **ESLint** (`@angular-eslint`) e manter **Prettier**, expondo os scripts `lint`, `format` e `format:check` citados no README.
- Substituir o template de boas-vindas por um shell mínimo da aplicação, com textos em português e tokens de tema do Tailwind; a troca de telas será feita por estado (Signals), **sem router**.
- Definir a estrutura de pastas inicial (`dominio/`, `estado/`, `componentes/`, `telas/`) apenas com o necessário para as próximas fases.

## Capabilities

### New Capabilities

Nenhuma. Este change é exclusivamente de fundação técnica (tooling/scaffold): não altera comportamento observável do jogo. Por isso o change declara `skip_specs: true` em `.openspec.yaml`, conforme a orientação do schema `spec-driven`.

### Modified Capabilities

Nenhuma — não existe capability no projeto ainda (`openspec/specs/` vazio).

## Impact

- **Novos arquivos**: `package.json`, `angular.json`, `tsconfig*.json`, `.postcssrc.json`, `.prettierrc`, `.editorconfig`, `src/` (main, index, styles, app shell), configuração de ESLint e scripts npm.
- **Arquivos preservados**: `README.md`, `AGENTS.md`, `openspec/`, `.opencode/`, `.git/`.
- **Dependências**: `@angular/*` 22.2.x, `tailwindcss` 4 + `@tailwindcss/postcss`, `@lucide/angular`, `@angular-eslint/*`, `prettier`, `vitest` (via builder do Angular).
- **Fora de escopo**: qualquer regra de jogo, tela de partida, lógica de turnos ou estilo visual definitivo.
