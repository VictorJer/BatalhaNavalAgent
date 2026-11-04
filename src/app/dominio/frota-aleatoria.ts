import { coordenada } from './coordenada';
import { TIPOS_DAS_EMBARCACOES, TipoEmbarcacao, tamanhoDe } from './embarcacao';
import { Frota, posicionar } from './frota';

/** Fonte de aleatoriedade injetável; o padrão é `Math.random`. */
export type Aleatorio = () => number;

const TETO_DE_REINICIOS = 100;
const TETO_DE_TENTATIVAS_POR_EMBARCACAO = 200;

/** Índice inteiro entre 0 e `exclusive - 1`, estável mesmo se `aleatorio()` devolver 1. */
function indiceSorteado(aleatorio: Aleatorio, exclusive: number): number {
  return Math.floor(aleatorio() * exclusive) % exclusive;
}

function ordenarPorTamanhoDecrescente(tipos: readonly TipoEmbarcacao[]): TipoEmbarcacao[] {
  return [...tipos].sort((um, outro) => tamanhoDe(outro) - tamanhoDe(um));
}

/**
 * Gera uma frota completa e válida com sorteios: cada embarcação recebe
 * origem e orientação sorteadas, e a frota recomeça se as tentativas de
 * alguma delas se esgotarem. As embarcações são tentadas do maior para o
 * menor para reduzir a fragmentação.
 */
export function gerarFrotaAleatoria(aleatorio: Aleatorio = Math.random): Frota {
  const ordenados = ordenarPorTamanhoDecrescente(TIPOS_DAS_EMBARCACOES);

  for (let reinicio = 0; reinicio < TETO_DE_REINICIOS; reinicio++) {
    let frota: Frota = {};
    let desistiu = false;

    for (const tipo of ordenados) {
      let posicionou = false;
      for (let tentativa = 0; tentativa < TETO_DE_TENTATIVAS_POR_EMBARCACAO; tentativa++) {
        const orientacao = indiceSorteado(aleatorio, 2) === 0 ? 'horizontal' : 'vertical';
        const origem = coordenada(indiceSorteado(aleatorio, 10), indiceSorteado(aleatorio, 10));
        if (origem === null) {
          continue;
        }
        const sorteio = posicionar(frota, tipo, origem, orientacao);
        if (sorteio.tipo === 'ok') {
          frota = sorteio.frota;
          posicionou = true;
          break;
        }
      }
      if (!posicionou) {
        desistiu = true;
        break;
      }
    }

    if (!desistiu) {
      return frota;
    }
  }

  // Invariante de implementação: 10×10 sempre acomoda a frota de 5 embarcações.
  throw new Error('Não foi possível gerar uma frota válida');
}
