# Tasks

## 1. Gerar o scaffold fora do repositório

- [x] 1.1 Executar `npx @angular/cli@22.2.0 new batalha-naval --style tailwind --zoneless --routing=false --ssr=false --ai-config none --skip-git --commit=false --package-manager npm` em um diretório temporário vazio e verificar que os arquivos esperados existem (`package.json`, `angular.json`, `.postcssrc.json`, `src/main.ts`, `src/app/app.config.ts`)
- [x] 1.2 Verificar no `package.json` gerado que `@angular/core` está em `22.2.x`, `tailwindcss` em `^4` e que não há `zone.js` nas dependências de runtime

## 2. Copiar para o repositório preservando o que já existe

- [x] 2.1 Copiar os arquivos do scaffold para a raiz de `D:\Projetos\BatalhaNaval` excluindo `README.md` e `.gitignore`, e verificar com `git status` que `README.md`, `AGENTS.md`, `openspec/` e `.opencode/` continuam sem alteração
- [x] 2.2 Fazer merge do `.gitignore` do Angular no `.gitignore` existente, mantendo as entradas `*.key` e `__screenshots__/`, e verificar com `git diff .gitignore` que nenhuma regra anterior foi perdida

## 3. Instalar dependências e validar a base

- [x] 3.1 Rodar `npm install` e verificar que termina sem erro de engine (Node local 24.22 atende `^24.15.0`) e que `package-lock.json` foi criado
- [x] 3.2 Rodar `npm test` e verificar que o teste gerado de `app.spec.ts` passa no Vitest
- [x] 3.3 Rodar `npm run build` e verificar que o bundle é gerado em `dist/` sem errors de type-check

## 4. Confirmar Tailwind CSS 4 e criar os tokens de tema

- [x] 4.1 Verificar `.postcssrc.json` (`@tailwindcss/postcss`) e que `src/styles.css` contém `@import "tailwindcss"`
- [x] 4.2 Adicionar em `src/styles.css` um bloco `@theme` com os tokens `--color-agua`, `--color-acerto`, `--color-erro`, `--color-navio` e `--color-destruida` e verificar aplicando uma classe utilitária de teste no shell (cor muda na tela)

## 5. Ligar os ícones Lucide

- [x] 5.1 Instalar `@lucide/angular` e verificar que a versão resolvida é `1.66.x` (o pacote `lucide-angular` está deprecado e não deve ser usado)
- [x] 5.2 Registrar dois ícones com `provideLucideIcons()` em `src/app/app.config.ts` e renderizar um deles no shell, verificando visualmente que o SVG aparece em `npm start`

## 6. Qualidade de código (ESLint + Prettier)

- [x] 6.1 Adicionar ESLint com `ng add @angular-eslint/schematics@22` e verificar que `npm run lint` executa e reporta zero erros
- [x] 6.2 Adicionar os scripts `lint`, `format` e `format:check` ao `package.json` e verificar cada um executando o comando correspondente
- [x] 6.3 Criar `.prettierignore` e `.eslintignore` cobrindo `dist/`, `.angular/`, `openspec/`, `node_modules/`, e verificar que `npm run format:check` não lista arquivos dessas pastas

## 7. Substituir o template de boas-vindas pelo shell da aplicação

- [x] 7.1 Remover o conteúdo de exemplo de `src/app/app.html` e `src/app/app.css` e criar um shell mínimo com título "Batalha Naval" e um subtítulo em português, verificando em `npm start` que a página renderiza esse conteúdo
- [x] 7.2 Atualizar `src/index.html` com `lang="pt-BR"` e título "Batalha Naval", verificando o `<title>` na aba do navegador
- [x] 7.3 Ajustar `src/app/app.spec.ts` para cobrir o novo shell (título renderizado) e verificar que `npm test` passa

## 8. Verificação de integração da fundação

- [x] 8.1 Rodar em sequência `npm test`, `npm run build`, `npm run lint` e `npm run format:check` e verificar que os quatro terminam com sucesso
- [x] 8.2 Abrir a aplicação com o MCP do Playwright em `http://localhost:4200` e verificar que não há erros de console, que o Tailwind aplica estilo e que o ícone Lucide aparece

## Workflow follow-up

- Arquivar o change com `openspec archive fundacao-app` após as verificações acima.
- Confirmar que o arquivo de tarefas reflete o estado final antes do arquivamento.
