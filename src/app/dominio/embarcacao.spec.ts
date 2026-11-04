import { coordenada } from './coordenada';
import {
  Embarcacao,
  TAMANHOS_DAS_EMBARCACOES,
  TIPOS_DAS_EMBARCACOES,
  posicoesDe,
  tamanhoDe,
} from './embarcacao';

describe('Embarcacao', () => {
  it('define os tamanhos 5/4/3/3/2 da frota padrão', () => {
    expect(TAMANHOS_DAS_EMBARCACOES['porta-avioes']).toBe(5);
    expect(TAMANHOS_DAS_EMBARCACOES.encouracado).toBe(4);
    expect(TAMANHOS_DAS_EMBARCACOES.cruzador).toBe(3);
    expect(TAMANHOS_DAS_EMBARCACOES.submarino).toBe(3);
    expect(TAMANHOS_DAS_EMBARCACOES.destroyer).toBe(2);
    expect(TIPOS_DAS_EMBARCACOES).toHaveLength(5);
  });

  it('gera posições horizontais consecutivas', () => {
    const b2 = coordenada(1, 1);
    const posicoes = posicoesDe(b2!, 'horizontal', 3);

    expect(posicoes).toEqual(['B2', 'B3', 'B4']);
  });

  it('gera posições verticais consecutivas', () => {
    const b2 = coordenada(1, 1);
    const posicoes = posicoesDe(b2!, 'vertical', 2);

    expect(posicoes).toEqual(['B2', 'C2']);
  });

  it('recusa embarcação que ultrapassa a borda direita', () => {
    const a8 = coordenada(0, 7);
    expect(posicoesDe(a8!, 'horizontal', 5)).toBeNull();
  });

  it('recusa embarcação que ultrapassa a borda inferior', () => {
    const i8 = coordenada(8, 7);
    expect(posicoesDe(i8!, 'vertical', 3)).toBeNull();
  });

  it('aceita embarcação que termina exatamente na borda', () => {
    const a6 = coordenada(0, 5);
    expect(posicoesDe(a6!, 'horizontal', 5)).toEqual(['A6', 'A7', 'A8', 'A9', 'A10']);

    const g6 = coordenada(6, 5);
    expect(posicoesDe(g6!, 'vertical', 4)).toEqual(['G6', 'H6', 'I6', 'J6']);
  });

  it('cria embarcação com tipo e posições', () => {
    const b2 = coordenada(1, 1);
    const posicoes = posicoesDe(b2!, 'horizontal', 3) ?? [];
    const embarcacao: Embarcacao = { tipo: 'cruzador', posicoes };

    expect(embarcacao.tipo).toBe('cruzador');
    expect(tamanhoDe('cruzador')).toBe(3);
    expect(tamanhoDe('destroyer')).toBe(2);
  });
});
