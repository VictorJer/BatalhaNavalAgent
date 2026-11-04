import { Coordenada, colunaDe, coordenada, linhaDe } from './coordenada';
import { estaCompleta, posicoesOcupadas } from './frota';
import { gerarFrotaAleatoria } from './frota-aleatoria';

/** PRNG determinístico (mulberry32) para simular a mesma semente. */
function geradorSemeado(semente: number): () => number {
  let estado = semente >>> 0;
  return () => {
    estado += 0x6d2b79f5;
    let primo = estado;
    primo = Math.imul(primo ^ (primo >>> 15), primo | 1);
    primo ^= primo + Math.imul(primo ^ (primo >>> 7), primo | 61);
    return ((primo ^ (primo >>> 14)) >>> 0) / 4294967296;
  };
}

describe('Frota aleatória', () => {
  it('em 500 execuções gera frota completa, dentro do tabuleiro e sem sobreposição', () => {
    for (let execucao = 0; execucao < 500; execucao++) {
      const frota = gerarFrotaAleatoria();

      expect(estaCompleta(frota)).toBe(true);

      const ocupadas = posicoesOcupadas(frota);
      expect(ocupadas).toHaveLength(17);

      ocupadas.forEach((posicao: Coordenada) => {
        const reconstruida = coordenada(linhaDe(posicao), colunaDe(posicao));
        expect(reconstruida).toBe(posicao);
      });

      expect(new Set(ocupadas).size).toBe(17);
    }
  });

  it('duas execuções com a mesma semente produzem a mesma frota', () => {
    const primeira = gerarFrotaAleatoria(geradorSemeado(781));
    const segunda = gerarFrotaAleatoria(geradorSemeado(781));

    expect(posicoesOcupadas(primeira).join()).toBe(posicoesOcupadas(segunda).join());
    expect(primeira['porta-avioes']?.posicoes).toEqual(segunda['porta-avioes']?.posicoes);
  });
});
