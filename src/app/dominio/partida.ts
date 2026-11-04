import { Coordenada } from './coordenada';
import { Orientacao, TipoEmbarcacao } from './embarcacao';
import { Aleatorio, gerarFrotaAleatoria } from './frota-aleatoria';
import { Frota, ResultadoPosicionamento, estaCompleta, posicionar, remover } from './frota';
import {
  ResultadoAtaque,
  Tabuleiro,
  estaDerrotado,
  tabuleiroVazio,
  atacar as atacarTabuleiro,
} from './tabuleiro';

/** Participante de uma partida. */
export type Lado = 'jogador' | 'computador';

/** Fases do ciclo de vida da partida. */
export type FaseDaPartida = 'preparacao' | 'batalha' | 'encerrada';

/**
 * Partida imutável: dois tabuleiros, turno, fase e vencedor.
 * Toda operação devolve uma partida nova.
 */
export interface Partida {
  readonly jogador: Tabuleiro;
  readonly computador: Tabuleiro;
  readonly turno: Lado;
  readonly fase: FaseDaPartida;
  readonly vencedor: Lado | null;
}

/** Erros da camada de partida que o tabuleiro não conhece. */
export type RecusaDaPartida =
  | { tipo: 'fase-invalida'; fase: FaseDaPartida }
  | { tipo: 'batalha-nao-iniciada' }
  | { tipo: 'partida-encerrada' };

/** Resultado de posicionar/remover embarcação na partida. */
export type ResultadoPosicionamentoDePartida =
  ResultadoPosicionamento | { tipo: 'fase-invalida'; fase: FaseDaPartida };

/** Resultado de `iniciarBatalha`. */
export type ResultadoInicioDaBatalha =
  | { tipo: 'ok'; partida: Partida }
  | { tipo: 'frota-incompleta' }
  | { tipo: 'fase-invalida'; fase: FaseDaPartida };

/** Resultado de `atacar` na partida, incluindo as recusas de turno e fase. */
export type ResultadoAtaqueDaPartida = ResultadoAtaque | RecusaDaPartida;

/**
 * Nova partida em fase de preparação: tabuleiro do jogador vazio e
 * frota do computador já gerada automaticamente.
 */
export function criarPartida(aleatorio: Aleatorio = Math.random): Partida {
  return {
    jogador: tabuleiroVazio(),
    computador: tabuleiroVazio(gerarFrotaAleatoria(aleatorio)),
    turno: 'jogador',
    fase: 'preparacao',
    vencedor: null,
  };
}

/** Frota do jogador da partida. */
export function frotaDoJogador(partida: Partida): Frota {
  return partida.jogador.frota;
}

/** Posiciona embarcação do jogador; aceito somente na preparação. */
export function posicionarEmbarcacao(
  partida: Partida,
  tipo: TipoEmbarcacao,
  origem: Coordenada,
  orientacao: Orientacao,
): { partida: Partida; resultado: ResultadoPosicionamentoDePartida } {
  if (partida.fase !== 'preparacao') {
    return { partida, resultado: { tipo: 'fase-invalida', fase: partida.fase } };
  }

  const posicionamento = posicionar(partida.jogador.frota, tipo, origem, orientacao);
  if (posicionamento.tipo !== 'ok') {
    return { partida, resultado: posicionamento };
  }

  return { partida: comFrotaDoJogador(partida, posicionamento.frota), resultado: posicionamento };
}

/** Remove embarcação do jogador; aceito somente na preparação. */
export function removerEmbarcacao(
  partida: Partida,
  tipo: TipoEmbarcacao,
): { partida: Partida; resultado: ResultadoPosicionamentoDePartida } {
  if (partida.fase !== 'preparacao') {
    return { partida, resultado: { tipo: 'fase-invalida', fase: partida.fase } };
  }

  const removida = remover(partida.jogador.frota, tipo);
  return {
    partida: comFrotaDoJogador(partida, removida),
    resultado: { tipo: 'ok', frota: removida },
  };
}

/** Inicia a batalha; exige a frota do jogador completa. */
export function iniciarBatalha(partida: Partida): ResultadoInicioDaBatalha {
  if (partida.fase !== 'preparacao') {
    return { tipo: 'fase-invalida', fase: partida.fase };
  }
  if (!estaCompleta(partida.jogador.frota)) {
    return { tipo: 'frota-incompleta' };
  }

  return { tipo: 'ok', partida: { ...partida, fase: 'batalha', turno: 'jogador' } };
}

/**
 * Aplica o ataque do lado que tem o turno ao tabuleiro adversário.
 * Recusas não consomem o turno; ataque válido alterna o turno, salvo se
 * a partida terminar na mesma transição.
 */
export function atacar(
  partida: Partida,
  alvo: Coordenada,
): {
  partida: Partida;
  resultado: ResultadoAtaqueDaPartida;
} {
  if (partida.fase === 'encerrada') {
    return { partida, resultado: { tipo: 'partida-encerrada' } };
  }
  if (partida.fase !== 'batalha') {
    return { partida, resultado: { tipo: 'batalha-nao-iniciada' } };
  }

  const atacante = partida.turno;
  const alvoEhComputador = atacante === 'jogador';
  const tabuleiroAlvo = alvoEhComputador ? partida.computador : partida.jogador;

  const resolucao = atacarTabuleiro(tabuleiroAlvo, alvo);
  if (resolucao.resultado.tipo === 'repetido' || resolucao.resultado.tipo === 'fora-do-tabuleiro') {
    return { partida, resultado: resolucao.resultado };
  }

  const jogador = alvoEhComputador ? partida.jogador : resolucao.tabuleiro;
  const computador = alvoEhComputador ? resolucao.tabuleiro : partida.computador;
  let nova: Partida = { ...partida, jogador, computador };

  if (estaDerrotado(resolucao.tabuleiro)) {
    nova = { ...nova, fase: 'encerrada', vencedor: atacante };
    return { partida: nova, resultado: resolucao.resultado };
  }

  nova = { ...nova, turno: atacante === 'jogador' ? 'computador' : 'jogador' };
  return { partida: nova, resultado: resolucao.resultado };
}

function comFrotaDoJogador(partida: Partida, frota: Frota): Partida {
  return { ...partida, jogador: { ...partida.jogador, frota } };
}
