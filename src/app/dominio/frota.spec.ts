import { Coordenada, coordenada } from './coordenada';
import { Orientacao, TIPOS_DAS_EMBARCACOES, TipoEmbarcacao } from './embarcacao';
import {
  Frota,
  embarcacaoDoTipo,
  estaCompleta,
  frotaVazia,
  posicoesOcupadas,
  posicionar,
  remover,
} from './frota';

/** Posiciona a frota inteira em posições fixas, nas linhas A e C. */
function frotaFixa(): Frota {
  let frota = frotaVazia();
  const bases: Readonly<Record<TipoEmbarcacao, [Coordenada, Orientacao]>> = {
    'porta-avioes': [coordenada(0, 0)!, 'horizontal'],
    encouracado: [coordenada(2, 0)!, 'horizontal'],
    cruzador: [coordenada(4, 0)!, 'horizontal'],
    submarino: [coordenada(6, 0)!, 'horizontal'],
    destroyer: [coordenada(8, 0)!, 'horizontal'],
  };
  for (const tipo of TIPOS_DAS_EMBARCACOES) {
    frota = (posicionar(frota, tipo, bases[tipo][0], bases[tipo][1]) as
      { tipo: 'ok'; frota: Frota } | undefined)!.frota;
  }
  return frota;
}

describe('Frota', () => {
  it('posiciona o cruzador a partir de B2 horizontal', () => {
    const resultado = posicionar(frotaVazia(), 'cruzador', coordenada(1, 1)!, 'horizontal');

    expect(resultado.tipo).toBe('ok');
    const embarcacao = embarcacaoDoTipo((resultado as { frota: Frota }).frota, 'cruzador');
    expect(embarcacao?.posicoes).toEqual(['B2', 'B3', 'B4']);
  });

  it('recusa porta-aviões a partir de A8 horizontal por sair do tabuleiro', () => {
    const resultado = posicionar(frotaVazia(), 'porta-avioes', coordenada(0, 7)!, 'horizontal');

    expect(resultado).toEqual({ tipo: 'fora-do-tabuleiro' });
  });

  it('recusa sobreposição e preserva a frota anterior', () => {
    const comCruzador = (
      posicionar(frotaVazia(), 'cruzador', coordenada(1, 1)!, 'horizontal') as { frota: Frota }
    ).frota;
    const quartaPosicaoDoCruzador = coordenada(1, 3)!;

    const resultado = posicionar(comCruzador, 'destroyer', quartaPosicaoDoCruzador, 'horizontal');

    expect(resultado).toEqual({ tipo: 'sobreposicao', com: 'cruzador' });
    const atual = embarcacaoDoTipo(comCruzador, 'destroyer');
    expect(atual).toBeNull();
    expect(embarcacaoDoTipo(comCruzador, 'cruzador')?.posicoes).toEqual(['B2', 'B3', 'B4']);
  });

  it('aceita embarcações vizinhas, inclusive na diagonal', () => {
    let frota = frotaVazia();
    frota = (posicionar(frota, 'cruzador', coordenada(2, 2)!, 'horizontal') as { frota: Frota })
      .frota;

    // destroyer ocupa B2, B3 bem ao lado do cruzador C3, C4, C5: encostado.
    frota = (posicionar(frota, 'destroyer', coordenada(1, 1)!, 'horizontal') as { frota: Frota })
      .frota;
    const destroyer = embarcacaoDoTipo(frota, 'destroyer');
    expect(destroyer?.posicoes).toEqual(['B2', 'B3']);

    // submarino ocupa D4, diagonal do cruzador: encostado na diagonal.
    frota = (posicionar(frota, 'submarino', coordenada(3, 3)!, 'vertical') as { frota: Frota })
      .frota;
    const submarino = embarcacaoDoTipo(frota, 'submarino');
    expect(submarino?.posicoes).toEqual(['D4', 'E4', 'F4']);
  });

  it('substitui a embarcação do mesmo tipo liberando as posições antigas', () => {
    let frota = frotaVazia();
    frota = (posicionar(frota, 'cruzador', coordenada(1, 1)!, 'horizontal') as { frota: Frota })
      .frota;

    frota = (posicionar(frota, 'cruzador', coordenada(5, 5)!, 'horizontal') as { frota: Frota })
      .frota;

    const cruzador = embarcacaoDoTipo(frota, 'cruzador');
    expect(cruzador?.posicoes).toEqual(['F6', 'F7', 'F8']);
    expect(posicoesOcupadas(frota)).not.toContain('B2');
    expect(posicoesOcupadas(frota)).toHaveLength(3);
  });

  it('remove embarcação, liberando as posições', () => {
    let frota = frotaVazia();
    frota = (posicionar(frota, 'cruzador', coordenada(1, 1)!, 'horizontal') as { frota: Frota })
      .frota;

    const semCruzador = remover(frota, 'cruzador');

    expect(embarcacaoDoTipo(semCruzador, 'cruzador')).toBeNull();
    expect(posicoesOcupadas(semCruzador)).toHaveLength(0);
  });

  it('considera frota incompleta até as cinco embarcações', () => {
    expect(estaCompleta(frotaVazia())).toBe(false);

    const parcial = (
      posicionar(frotaVazia(), 'destroyer', coordenada(0, 0)!, 'horizontal') as { frota: Frota }
    ).frota;
    expect(estaCompleta(parcial)).toBe(false);

    const completa = frotaFixa();
    expect(estaCompleta(completa)).toBe(true);
    expect(posicoesOcupadas(completa)).toHaveLength(17);
  });
});
