import { Coordenada, coordenada, linhaDe, colunaDe } from './coordenada';

/** Tipos de embarcação da frota padrão, do maior para o menor. */
export type TipoEmbarcacao =
  'porta-avioes' | 'encouracado' | 'cruzador' | 'submarino' | 'destroyer';

/** Orientação em linha reta de uma embarcação no tabuleiro. */
export type Orientacao = 'horizontal' | 'vertical';

/** Tamanho em posições de cada tipo, do maior para o menor. */
export const TAMANHOS_DAS_EMBARCACOES: Readonly<Record<TipoEmbarcacao, number>> = {
  'porta-avioes': 5,
  encouracado: 4,
  cruzador: 3,
  submarino: 3,
  destroyer: 2,
};

/** Tipos da frota padrão, do maior para o menor, na ordem de geração aleatória. */
export const TIPOS_DAS_EMBARCACOES: readonly TipoEmbarcacao[] = [
  'porta-avioes',
  'encouracado',
  'cruzador',
  'submarino',
  'destroyer',
];

/** Embarcação posicionada: guarda apenas o tipo e as posições ocupadas. */
export interface Embarcacao {
  readonly tipo: TipoEmbarcacao;
  readonly posicoes: readonly Coordenada[];
}

/** Tamanho em posições do tipo da embarcação. */
export function tamanhoDe(tipo: TipoEmbarcacao): number {
  return TAMANHOS_DAS_EMBARCACOES[tipo];
}

/**
 * Gera as posições consecutivas em linha reta a partir da origem.
 * Devolve `null` quando a embarcação ultrapassa a borda do tabuleiro.
 */
export function posicoesDe(
  origem: Coordenada,
  orientacao: Orientacao,
  tamanho: number,
): Coordenada[] | null {
  const linhaInicial = linhaDe(origem);
  const colunaInicial = colunaDe(origem);
  if (linhaInicial < 0 || colunaInicial < 0 || !Number.isInteger(tamanho) || tamanho < 1) {
    return null;
  }

  const posicoes: Coordenada[] = [];
  for (let avanco = 0; avanco < tamanho; avanco++) {
    const linha = orientacao === 'vertical' ? linhaInicial + avanco : linhaInicial;
    const coluna = orientacao === 'horizontal' ? colunaInicial + avanco : colunaInicial;
    const posicao = coordenada(linha, coluna);
    if (posicao === null) {
      return null;
    }
    posicoes.push(posicao);
  }
  return posicoes;
}
