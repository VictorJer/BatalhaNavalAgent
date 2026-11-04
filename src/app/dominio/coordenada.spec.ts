import {
  Coordenada,
  LINHAS_DO_TABULEIRO,
  TOTAL_DE_COORDENADAS,
  LETRAS_DAS_LINHAS,
  letraDaLinha,
  linhaDe,
  coordenada,
  colunaDe,
  rotulo,
} from './coordenada';

describe('Coordenada', () => {
  it('cria coordenada válida a partir dos índices', () => {
    expect(coordenada(0, 0)).toBe('A1');
    expect(coordenada(0, 9)).toBe('A10');
    expect(coordenada(9, 0)).toBe('J1');
    expect(coordenada(9, 9)).toBe('J10');
    expect(coordenada(0, 1)).toBe('A2');
  });

  it('rejeita coordenada fora do tabuleiro', () => {
    expect(coordenada(10, 0)).toBeNull();
    expect(coordenada(-1, 0)).toBeNull();
    expect(coordenada(0, 10)).toBeNull();
    expect(coordenada(0, -1)).toBeNull();
  });

  it('faz ida e volta entre `A1`/`J10` e índices', () => {
    const a1: Coordenada = 'A1' as unknown as Coordenada;
    const j10: Coordenada = 'J10' as unknown as Coordenada;

    expect(rotulo(a1)).toBe('A1');
    expect(linhaDe(a1)).toBe(0);
    expect(colunaDe(a1)).toBe(0);
    expect(coordenada(linhaDe(a1), colunaDe(a1))).toBe('A1');

    expect(rotulo(j10)).toBe('J10');
    expect(linhaDe(j10)).toBe(9);
    expect(colunaDe(j10)).toBe(9);
    expect(coordenada(linhaDe(j10), colunaDe(j10))).toBe('J10');
  });

  it('converte ambos os sentidos entre índices e rótulos', () => {
    const b2 = coordenada(1, 1);
    expect(rotulo(b2!)).toBe('B2');
    expect(linhaDe(b2!)).toBe(1);
    expect(colunaDe(b2!)).toBe(1);
    expect(letraDaLinha(1)).toBe('B');

    LETRAS_DAS_LINHAS.forEach((letra, indice) => {
      expect(letraDaLinha(indice)).toBe(letra);
    });
  });

  it('tem dez linhas e cem coordenadas', () => {
    expect(LINHAS_DO_TABULEIRO).toBe(10);
    expect(LETRAS_DAS_LINHAS).toHaveLength(10);
    expect(TOTAL_DE_COORDENADAS).toBe(100);
  });

  it('coordenadas com a mesma linha e coluna são iguais em um Set', () => {
    const primeira = coordenada(4, 5);
    const segunda = coordenada(4, 5);

    expect(primeira).toBe('E6');
    const conjunto = new Set<Coordenada>([primeira!]);
    expect(conjunto.has(segunda!)).toBe(true);
    expect(conjunto.has(coordenada(5, 4)!)).toBe(false);
  });
});
