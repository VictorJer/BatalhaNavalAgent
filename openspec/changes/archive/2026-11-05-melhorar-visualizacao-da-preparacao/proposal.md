# Proposal

## Why

O posicionamento já funciona, mas a preparação exibe barcos como quadrados da mesma cor, sem coordenadas visíveis ou indicação de tamanho na lista. Melhorar essa leitura permitirá reconhecer cada embarcação e antecipar seu encaixe antes de clicar, inclusive quando a tentativa ultrapassa uma borda.

## What Changes

- Exibir letras A–J à esquerda e números 1–10 acima do tabuleiro de preparação, alinhados às 100 células existentes.
- Identificar os barcos posicionados por uma sigla textual vinculada ao nome no painel, distinguindo também barcos encostados sem depender apenas de cor.
- Exibir o tamanho de cada embarcação, uma representação segmentada proporcional e seleção explicitamente identificada no painel.
- Mostrar instruções contextuais com embarcação selecionada, tamanho, orientação e coordenada apontada quando houver.
- Tornar o preview válido/inválido reconhecível por símbolo e texto; quando ultrapassar uma borda, destacar como inválidas todas as células da tentativa que ainda estão dentro do tabuleiro.
- Limpar a prévia ao encerrar o apontamento, sem alterar frota ou histórico; preservar seleção por clique, orientação, remoção pelo painel, geração e início da batalha.
- Manter a preparação legível em 360 px e por teclado, sem tornar o hover obrigatório para posicionar em telas de toque.
- Fora do escopo: arrastar e soltar, nova forma de reposicionar ou girar barcos já colocados, desenhos realistas/3D, mudanças nas regras e alterações visuais na batalha.

## Capabilities

### New Capabilities

Nenhuma: os comportamentos pertencem à interface de preparação existente.

### Modified Capabilities

- `interface-de-preparacao`: acrescentar coordenadas visíveis, identificação de barcos e orientação contextual; ampliar o preview para leitura sem depender só de cor, encaixe parcial na borda e limpeza do apontamento.

## Impact

- `src/app/preparacao/tabuleiro.ts` e spec: apresentação opcional de coordenadas e identificação dos barcos, símbolos de preview e evento de término do apontamento, mantendo defaults compatíveis com a batalha.
- `src/app/preparacao/tela-de-preparacao.ts` e spec: painel, instruções e preview derivado; possível extração de template/CSS locais para legibilidade.
- Apresentação dos nomes/siglas em um pequeno módulo local de preparação; reutilização dos tamanhos definidos pelo domínio, sem nova fonte de verdade.
- Ícones Lucide e Tailwind existentes; registro de ícones adicionais em `src/app/app.config.ts` somente se necessário. Sem novas dependências.
- Testes de regressão da batalha, do shell e da preparação, verificação real em navegador e comandos de qualidade existentes.
- Sem alteração em `src/app/dominio/`, `JogoStore` ou main specs durante a implementação. A delta será sincronizada em revisão/arquivamento posterior.
