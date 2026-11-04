import {
  Coordenada,
  LINHAS_DO_TABULEIRO,
  COLUNAS_DO_TABULEIRO,
  coordenada,
  colunaDe,
  linhaDe,
} from './coordenada';
import { Embarcacao, TIPOS_DAS_EMBARCACOES } from './embarcacao';
import { Aleatorio } from './frota-aleatoria';
import { Frota, frotaVazia } from './frota';

/** Tabuleiro de um participante: frota própria e ataques recebidos. */
export interface Tabuleiro {
  readonly frota: Frota;
  readonly ataques: ReadonlySet<Coordenada>;
}

/** Resultado da resolução de um ataque contra um tabuleiro. */
export type ResultadoAtaque =
  | { tipo: 'agua' }
  | { tipo: 'acerto'; embarcacao: Embarcacao }
  | { tipo: 'destruida'; embarcacao: Embarcacao }
  | { tipo: 'repetido' }
  | { tipo: 'fora-do-tabuleiro' };

/** Tabuleiro com a frota dada e nenhum ataque recebido. */
export function tabuleiroVazio(frota: Frota = frotaVazia()): Tabuleiro {
  return { frota, ataques: new Set() };
}

/** Embarcação que ocupa a coordenada na frota do tabuleiro, quando existir. */
function embarcacaoEm(tabuleiro: Tabuleiro, alvo: Coordenada): Embarcacao | null {
  for (const tipo of TIPOS_DAS_EMBARCACOES) {
    const embarcacao = tabuleiro.frota[tipo];
    if (embarcacao === undefined) {
      continue;
    }
    if (embarcacao.posicoes.includes(alvo)) {
      return embarcacao;
    }
  }
  return null;
}

/** Coordenada dentro do tabuleiro: linha A..J e coluna 1..10 válidos. */
function estaNoTabuleiro(alvo: Coordenada): boolean {
  return (
    linhaDe(alvo) >= 0 &&
    linhaDe(alvo) < LINHAS_DO_TABULEIRO &&
    colunaDe(alvo) >= 0 &&
    colunaDe(alvo) < COLUNAS_DO_TABULEIRO
  );
}

/**
 * Aplica um ataque e devolve o novo tabuleiro com o resultado.
 * Ataque repetido ou fora do tabuleiro não alteram o tabuleiro.
 */
export function atacar(
  tabuleiro: Tabuleiro,
  alvo: Coordenada,
): { tabuleiro: Tabuleiro; resultado: ResultadoAtaque } {
  if (!estaNoTabuleiro(alvo)) {
    return { tabuleiro, resultado: { tipo: 'fora-do-tabuleiro' } };
  }
  if (tabuleiro.ataques.has(alvo)) {
    return { tabuleiro, resultado: { tipo: 'repetido' } };
  }

  const ataques = new Set(tabuleiro.ataques);
  ataques.add(alvo);
  const novo: Tabuleiro = { frota: tabuleiro.frota, ataques };

  const embarcacao = embarcacaoEm(tabuleiro, alvo);
  if (embarcacao === null) {
    return { tabuleiro: novo, resultado: { tipo: 'agua' } };
  }

  const destruida = embarcacao.posicoes.every((posicao) => ataques.has(posicao));
  return {
    tabuleiro: novo,
    resultado: destruida ? { tipo: 'destruida', embarcacao } : { tipo: 'acerto', embarcacao },
  };
}

/** Embarcação destruída: todas as suas posições já foram atacadas. */
export function estaDestruida(tabuleiro: Tabuleiro, embarcacao: Embarcacao): boolean {
  return embarcacao.posicoes.every((posicao) => tabuleiro.ataques.has(posicao));
}

/** Tabuleiro derrotado somente quando toda a frota está destruída. */
export function estaDerrotado(tabuleiro: Tabuleiro): boolean {
  return TIPOS_DAS_EMBARCACOES.every((tipo) => {
    const embarcacao = tabuleiro.frota[tipo];
    return embarcacao !== undefined && estaDestruida(tabuleiro, embarcacao);
  });
}

/** Todas as coordenadas do tabuleiro que ainda não foram atacadas. */
export function coordenadasNaoAtacadas(tabuleiro: Tabuleiro): Coordenada[] {
  const naoAtacadas: Coordenada[] = [];
  for (let linha = 0; linha < LINHAS_DO_TABULEIRO; linha++) {
    for (let coluna = 0; coluna < COLUNAS_DO_TABULEIRO; coluna++) {
      const posicao = coordenada(linha, coluna);
      if (posicao !== null && !tabuleiro.ataques.has(posicao)) {
        naoAtacadas.push(posicao);
      }
    }
  }
  return naoAtacadas;
}

/**
 * Sorteia uma coordenada das ainda não atacadas; devolve `null` quando o
 * tabuleiro está esgotado. Sortear entre os restantes garante escolha inédita.
 */
export function escolherAtaqueAleatorio(
  tabuleiro: Tabuleiro,
  aleatorio: Aleatorio = Math.random,
): Coordenada | null {
  const disponiveis = coordenadasNaoAtacadas(tabuleiro);
  if (disponiveis.length === 0) {
    return null;
  }
  const indice = Math.floor(aleatorio() * disponiveis.length) % disponiveis.length;
  return disponiveis[indice] ?? null;
}
