/**
 * Coordenada é uma string marcada no formato `A1`..`J10`.
 *
 * Por ser string, `Set<Coordenada>` e `Map<Coordenada, ...>` comparam por valor:
 * duas coordenadas com a mesma linha e coluna são a mesma chave.
 */
declare const marcaDaCoordenada: unique symbol;

export type Coordenada = string & { readonly [marcaDaCoordenada]: true };

/** Quantidade de linhas do tabuleiro (A até J). */
export const LINHAS_DO_TABULEIRO = 10;

/** Quantidade de colunas do tabuleiro (1 até 10). */
export const COLUNAS_DO_TABULEIRO = 10;

/** Total de coordenadas possíveis (10 x 10). */
export const TOTAL_DE_COORDENADAS = LINHAS_DO_TABULEIRO * COLUNAS_DO_TABULEIRO;

/** Letras das linhas, índice 0 → 'A'. */
export const LETRAS_DAS_LINHAS: readonly string[] = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
];

/** Letra exibida para o índice de linha (0 → 'A'). */
export function letraDaLinha(linha: number): string {
  return LETRAS_DAS_LINHAS[linha] ?? '';
}

/**
 * Cria uma coordenada a partir dos índices de linha (0..9) e coluna (0..9).
 * Devolve `null` quando a posição fica fora do tabuleiro.
 */
export function coordenada(linha: number, coluna: number): Coordenada | null {
  if (!Number.isInteger(linha) || !Number.isInteger(coluna)) {
    return null;
  }
  if (linha < 0 || linha >= LINHAS_DO_TABULEIRO) {
    return null;
  }
  if (coluna < 0 || coluna >= COLUNAS_DO_TABULEIRO) {
    return null;
  }
  return `${letraDaLinha(linha)}${coluna + 1}` as Coordenada;
}

/** Índice de linha da coordenada (0..9); -1 se o rótulo não é uma coordenada. */
export function linhaDe(coordenadaAlvo: Coordenada): number {
  return LETRAS_DAS_LINHAS.indexOf(coordenadaAlvo.charAt(0));
}

/** Índice de coluna da coordenada (0..9); -1 se o número for inválido. */
export function colunaDe(coordenadaAlvo: Coordenada): number {
  const numero = Number(coordenadaAlvo.slice(1));
  if (!Number.isInteger(numero)) {
    return -1;
  }
  return numero - 1;
}

/** Rótulo exibido da coordenada, como `A1` ou `J10`. */
export function rotulo(coordenadaAlvo: Coordenada): string {
  return coordenadaAlvo;
}
