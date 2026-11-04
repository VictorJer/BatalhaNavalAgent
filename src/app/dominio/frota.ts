import { Coordenada } from './coordenada';
import {
  Embarcacao,
  Orientacao,
  TIPOS_DAS_EMBARCACOES,
  TipoEmbarcacao,
  posicoesDe,
  tamanhoDe,
} from './embarcacao';

/**
 * Frota como registro parcial por tipo: serve à preparação (parcial) e à
 * batalha (completa). O tipo — não o tamanho — identifica a embarcação.
 */
export type Frota = Readonly<Partial<Record<TipoEmbarcacao, Embarcacao>>>;

/** Resultado de um posicionamento, sempre sem exceções. */
export type ResultadoPosicionamento =
  | { tipo: 'ok'; frota: Frota }
  | { tipo: 'fora-do-tabuleiro' }
  | { tipo: 'sobreposicao'; com: TipoEmbarcacao };

/** Frota inicial, sem nenhuma embarcação posicionada. */
export function frotaVazia(): Frota {
  return {};
}

/** Embarcação do tipo na frota, quando posicionada. */
export function embarcacaoDoTipo(frota: Frota, tipo: TipoEmbarcacao): Embarcacao | null {
  return frota[tipo] ?? null;
}

/** Posições ocupadas por todas as embarcações da frota. */
export function posicoesOcupadas(frota: Frota): Coordenada[] {
  return TIPOS_DAS_EMBARCACOES.flatMap((tipo) => [...(frota[tipo]?.posicoes ?? [])]);
}

/** Frota completa somente quando as cinco embarcações estão posicionadas. */
export function estaCompleta(frota: Frota): boolean {
  return TIPOS_DAS_EMBARCACOES.every((tipo) => frota[tipo] !== undefined);
}

/**
 * Posiciona (ou substitui, em uma única transição) a embarcação do tipo.
 * Valida a nova posição contra todas as outras; em caso de recusa,
 * devolve a frota original intacta.
 */
export function posicionar(
  frota: Frota,
  tipo: TipoEmbarcacao,
  origem: Coordenada,
  orientacao: Orientacao,
): ResultadoPosicionamento {
  const posicaoNova = posicoesDe(origem, orientacao, tamanhoDe(tipo));
  if (posicaoNova === null) {
    return { tipo: 'fora-do-tabuleiro' };
  }

  const escolhidas = new Set<Coordenada>(posicaoNova);
  for (const tipoOcupante of TIPOS_DAS_EMBARCACOES) {
    const outra = frota[tipoOcupante];
    if (outra === undefined || tipoOcupante === tipo) {
      continue;
    }
    if (outra.posicoes.some((posicao) => escolhidas.has(posicao))) {
      return { tipo: 'sobreposicao', com: tipoOcupante };
    }
  }

  const nova: Frota = { ...frota, [tipo]: { tipo, posicoes: posicaoNova } };
  return { tipo: 'ok', frota: nova };
}

/** Remove a embarcação do tipo da frota, liberando as posições que ocupava. */
export function remover(frota: Frota, tipo: TipoEmbarcacao): Frota {
  if (!(tipo in frota)) {
    return frota;
  }
  const nova = { ...frota } as Record<TipoEmbarcacao, Embarcacao>;
  delete nova[tipo];
  return nova;
}
