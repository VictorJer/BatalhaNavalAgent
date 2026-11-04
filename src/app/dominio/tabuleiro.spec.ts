import { Coordenada, coordenada } from './coordenada';
import { Embarcacao, TipoEmbarcacao } from './embarcacao';
import { Frota, embarcacaoDoTipo, posicionar } from './frota';
import {
  Tabuleiro,
  atacar,
  coordenadasNaoAtacadas,
  escolherAtaqueAleatorio,
  estaDerrotado,
  estaDestruida,
  tabuleiroVazio,
} from './tabuleiro';

/** Posiciona as cinco embarcações em posições fixas, nas linhas A, C, E, G e I. */
function frotaDeTeste(): Frota {
  let frota: Frota = {};
  const bases: Readonly<Record<TipoEmbarcacao, [Coordenada, 'horizontal' | 'vertical']>> = {
    'porta-avioes': [coordenada(0, 0)!, 'horizontal'],
    encouracado: [coordenada(2, 0)!, 'horizontal'],
    cruzador: [coordenada(4, 0)!, 'horizontal'],
    submarino: [coordenada(6, 0)!, 'horizontal'],
    destroyer: [coordenada(8, 0)!, 'horizontal'],
  };
  for (const tipo of Object.keys(bases) as TipoEmbarcacao[]) {
    frota = (posicionar(frota, tipo, bases[tipo][0], bases[tipo][1]) as { frota: Frota }).frota;
  }
  return frota;
}

function tabuleiroDeTeste(): Tabuleiro {
  return tabuleiroVazio(frotaDeTeste());
}

function destruir(tabuleiro: Tabuleiro, tipo: TipoEmbarcacao): Tabuleiro {
  const embarcacao = frotaDeTeste()[tipo]!;
  for (const posicao of embarcacao.posicoes) {
    tabuleiro = atacar(tabuleiro, posicao).tabuleiro;
  }
  return tabuleiro;
}

describe('Tabuleiro — ataque', () => {
  it('dá água quando não há embarcação na posição', () => {
    const { resultado } = atacar(tabuleiroDeTeste(), coordenada(1, 5)!);

    expect(resultado).toEqual({ tipo: 'agua' });
  });

  it('dá acerto e informa a embarcação atingida', () => {
    const cruzador = frotaDeTeste().cruzador!;

    const { resultado } = atacar(tabuleiroDeTeste(), cruzador.posicoes[0]!);

    expect(resultado.tipo).toBe('acerto');
    expect((resultado as { embarcacao: Embarcacao }).embarcacao.tipo).toBe('cruzador');
  });

  it('dá destruída quando atinge a última posição intacta', () => {
    let tabuleiro = tabuleiroDeTeste();
    const cruzador = frotaDeTeste().cruzador!.posicoes;
    tabuleiro = atacar(tabuleiro, cruzador[1]!).tabuleiro;
    tabuleiro = atacar(tabuleiro, cruzador[2]!).tabuleiro;

    const { resultado } = atacar(tabuleiro, cruzador[0]!);

    expect(resultado.tipo).toBe('destruida');
    expect((resultado as { embarcacao: Embarcacao }).embarcacao.tipo).toBe('cruzador');
  });

  it('recusa ataque repetido sem novo registro', () => {
    const alvo = coordenada(1, 5)!;
    const primeiro = atacar(tabuleiroDeTeste(), alvo);
    const repetido = atacar(primeiro.tabuleiro, alvo);

    expect(repetido.resultado).toEqual({ tipo: 'repetido' });
    expect(repetido.tabuleiro).toBe(primeiro.tabuleiro);
    expect(repetido.tabuleiro.ataques.size).toBe(1);
  });

  it('recusa coordenada fora do tabuleiro sem registrar ataque', () => {
    const fora: Coordenada = 'K1' as unknown as Coordenada;
    const tabuleiro = tabuleiroDeTeste();

    const { tabuleiro: depois, resultado } = atacar(tabuleiro, fora);

    expect(resultado).toEqual({ tipo: 'fora-do-tabuleiro' });
    expect(depois).toBe(tabuleiro);
    expect(depois.ataques.size).toBe(0);
  });

  it('acerto não revela as demais posições da embarcação', () => {
    const cruzador = frotaDeTeste().cruzador!;

    const { tabuleiro, resultado } = atacar(tabuleiroDeTeste(), cruzador.posicoes[0]!);

    expect(resultado.tipo).toBe('acerto');
    expect([...tabuleiro.ataques]).toEqual([cruzador.posicoes[0]]);
    expect(embarcacaoDoTipo(tabuleiro.frota, 'cruzador')?.posicoes).toHaveLength(3);
  });
});

describe('Tabuleiro — derrota', () => {
  it('não é derrotado enquanto restam embarcações intactas', () => {
    let tabuleiro = tabuleiroDeTeste();
    for (const tipo of ['cruzador', 'submarino', 'destroyer'] as const) {
      tabuleiro = destruir(tabuleiro, tipo);
    }

    expect(estaDerrotado(tabuleiro)).toBe(false);
  });

  it('é derrotado somente após destruir toda a frota', () => {
    let tabuleiro = tabuleiroDeTeste();
    expect(estaDerrotado(tabuleiro)).toBe(false);

    for (const tipo of [
      'porta-avioes',
      'encouracado',
      'cruzador',
      'submarino',
      'destroyer',
    ] as const) {
      tabuleiro = destruir(tabuleiro, tipo);
    }

    expect(estaDerrotado(tabuleiro)).toBe(true);
  });

  it('distingue embarcação destruída da que resta atingir', () => {
    const frota = frotaDeTeste();
    const tabuleiro = destruir(tabuleiroDeTeste(), 'destroyer');

    expect(estaDestruida(tabuleiro, frota.destroyer!)).toBe(true);
    expect(estaDestruida(tabuleiro, frota.cruzador!)).toBe(false);
  });
});

describe('Tabuleiro — coordenadas não atacadas e sorteio', () => {
  it('lista apenas as coordenadas ainda não atacadas', () => {
    const tabuleiro = tabuleiroDeTeste();
    expect(coordenadasNaoAtacadas(tabuleiro)).toHaveLength(100);

    const alvo = coordenada(0, 0)!;
    const depoisDeUmAtaque = atacar(tabuleiro, alvo).tabuleiro;
    const restantes = coordenadasNaoAtacadas(depoisDeUmAtaque);
    expect(restantes).toHaveLength(99);
    expect(restantes).not.toContain(alvo);
  });

  it('sorteia coordenada sempre entre as não atacadas', () => {
    let tabuleiro = tabuleiroDeTeste();
    const escolhidas = new Set<Coordenada>();

    for (let rodada = 0; rodada < 40; rodada++) {
      const escolhida = escolherAtaqueAleatorio(tabuleiro, () => 0.5);
      expect(escolhida).not.toBeNull();
      expect(escolhidas.has(escolhida!)).toBe(false);

      escolhidas.add(escolhida!);
      tabuleiro = atacar(tabuleiro, escolhida!).tabuleiro;
    }
    expect(tabuleiro.ataques.size).toBe(40);
  });

  it('com uma única coordenada disponível escolhe exatamente ela', () => {
    let tabuleiro = tabuleiroDeTeste();
    const todas = coordenadasNaoAtacadas(tabuleiro);
    const ultima = todas[todas.length - 1]!;
    tabuleiro = atacar(tabuleiro, coordenada(0, 0)!).tabuleiro;
    for (const posicao of todas) {
      if (posicao !== ultima && posicao !== coordenada(0, 0)) {
        tabuleiro = atacar(tabuleiro, posicao).tabuleiro;
      }
    }

    expect(coordenadasNaoAtacadas(tabuleiro)).toEqual([ultima]);
    expect(escolherAtaqueAleatorio(tabuleiro, () => 0.9)).toBe(ultima);
  });

  it('com o tabuleiro esgotado devolve null', () => {
    let tabuleiro = tabuleiroDeTeste();
    for (const posicao of coordenadasNaoAtacadas(tabuleiro)) {
      tabuleiro = atacar(tabuleiro, posicao).tabuleiro;
    }

    expect(coordenadasNaoAtacadas(tabuleiro)).toHaveLength(0);
    expect(escolherAtaqueAleatorio(tabuleiro)).toBeNull();
  });
});
