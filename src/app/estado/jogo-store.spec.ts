import { TestBed } from '@angular/core/testing';
import { InjectionToken } from '@angular/core';
import { Coordenada, coordenada } from '../dominio/coordenada';
import { TipoEmbarcacao } from '../dominio/embarcacao';
import { Aleatorio, ALEATORIO } from './aleatorio';
import { JogoStore } from './jogo-store';

/** PRNG determinístico (mulberry32) para tornar a partida reprodutível. */
function geradorSemeado(semente: number): Aleatorio {
  let estado = semente >>> 0;
  return () => {
    estado += 0x6d2b79f5;
    let primo = estado;
    primo = Math.imul(primo ^ (primo >>> 15), primo | 1);
    primo ^= primo + Math.imul(primo ^ (primo >>> 7), primo | 61);
    return ((primo ^ (primo >>> 14)) >>> 0) / 4294967296;
  };
}

const PROVEDORES = [{ provide: ALEATORIO, useFactory: () => geradorSemeado(7) }];

/** Aleatório com valores golden variados e depois fixos: determinístico por drift. */
function proveDoScript(
  sorteiosVariados: number,
  valorFixado: number,
): { provide: InjectionToken<Aleatorio>; useFactory: () => Aleatorio } {
  return {
    provide: ALEATORIO,
    useFactory: () => {
      let chamadas = 0;
      return () => {
        const indice = chamadas++;
        return indice < sorteiosVariados ? (indice * 0.6180339887498949) % 1 : valorFixado;
      };
    },
  };
}

const TODOS_OS_TIPOS: TipoEmbarcacao[] = [
  'porta-avioes',
  'encouracado',
  'cruzador',
  'submarino',
  'destroyer',
];

/** Posiciona a frota completa do jogador em posições fixas no store. */
function posicionarFrotaCompleta(
  store: JogoStore,
  bases: Readonly<Record<TipoEmbarcacao, Coordenada>> = basesPadrao(),
): void {
  for (const tipo of TODOS_OS_TIPOS) {
    const resultado = store.posicionar(tipo, bases[tipo], 'horizontal');
    expect(resultado.tipo).toBe('ok');
  }
}

function basesPadrao(): Readonly<Record<TipoEmbarcacao, Coordenada>> {
  return {
    'porta-avioes': coordenada(0, 0)!, // A1..A5
    encouracado: coordenada(2, 0)!, // C1..C4
    cruzador: coordenada(4, 0)!, // E1..E3
    submarino: coordenada(6, 0)!, // G1..G3
    destroyer: coordenada(8, 0)!, // I1..I2
  };
}

/** Frota do jogador empacotada nos primeiros índices do tabuleiro (A e B). */
function basesEmpacotadas(): Readonly<Record<TipoEmbarcacao, Coordenada>> {
  return {
    'porta-avioes': coordenada(0, 0)!, // A1..A5
    encouracado: coordenada(0, 5)!, // A6..A9
    cruzador: coordenada(1, 0)!, // B1..B3
    submarino: coordenada(1, 3)!, // B4..B6
    destroyer: coordenada(1, 6)!, // B7..B8
  };
}

describe('ALEATORIO', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('resolve sem provider explícito', () => {
    const aleatorio = TestBed.inject(ALEATORIO);

    const sorteado = aleatorio();
    expect(typeof sorteado).toBe('number');
    expect(sorteado).toBeGreaterThanOrEqual(0);
    expect(sorteado).toBeLessThan(1);
  });
});

describe('JogoStore — preparação', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: PROVEDORES });
  });

  function snapShotDoEstado(store: JogoStore): string {
    return JSON.stringify({
      frota: store.frotaDoJogador(),
      historico: store.historico(),
      fase: store.fase(),
      turno: store.turno(),
    });
  }

  it('aceita posicionamento válido durante a preparação', () => {
    const store = TestBed.inject(JogoStore);

    const resultado = store.posicionar('cruzador', coordenada(1, 1)!, 'horizontal');

    expect(resultado.tipo).toBe('ok');
    const cruzador = store.frotaDoJogador()['cruzador'];
    expect(cruzador?.posicoes).toEqual(['B2', 'B3', 'B4']);
    const historicoRegistrado = store.historico();
    const evento = historicoRegistrado[historicoRegistrado.length - 1];
    expect(evento?.tipo).toBe('embarcacao-posicionada');
  });

  it('recusa posicionamento fora do tabuleiro preservando o estado', () => {
    const store = TestBed.inject(JogoStore);
    store.posicionar('cruzador', coordenada(1, 1)!, 'horizontal');
    const antes = snapShotDoEstado(store);

    const resultado = store.posicionar('porta-avioes', coordenada(0, 7)!, 'horizontal');

    expect(resultado.tipo).toBe('posicionamento-recusado');
    expect(snapShotDoEstado(store)).toBe(antes);
  });

  it('recusa posicionamento sobreposto preservando o estado', () => {
    const store = TestBed.inject(JogoStore);
    store.posicionar('cruzador', coordenada(1, 1)!, 'horizontal');
    const antes = snapShotDoEstado(store);

    const resultado = store.posicionar('destroyer', coordenada(1, 2)!, 'horizontal');

    expect(resultado).toMatchObject({
      tipo: 'posicionamento-recusado',
      resultado: { tipo: 'sobreposicao' },
    });
    expect(snapShotDoEstado(store)).toBe(antes);
  });

  it('remove embarcação posicionada, liberando as posições', () => {
    const store = TestBed.inject(JogoStore);
    store.posicionar('cruzador', coordenada(1, 1)!, 'horizontal');

    const resultado = store.remover('cruzador');

    expect(resultado.tipo).toBe('ok');
    expect(store.frotaDoJogador()['cruzador']).toBeUndefined();
    const finais = store.historico();
    expect(finais[finais.length - 1]?.tipo).toBe('embarcacao-removida');
  });

  it('recusa posicionar e remover fora da fase de preparação', () => {
    const store = TestBed.inject(JogoStore);
    posicionarFrotaCompleta(store);
    store.iniciarBatalha();

    const posicionamento = store.posicionar('cruzador', coordenada(9, 9)!, 'horizontal');
    expect(posicionamento).toMatchObject({ tipo: 'fase-invalida', fase: 'batalha' });

    const remocao = store.remover('cruzador');
    expect(remocao).toMatchObject({ tipo: 'fase-invalida', fase: 'batalha' });
  });

  it('recusa iniciar batalha com frota incompleta e mantém a fase', () => {
    const store = TestBed.inject(JogoStore);
    store.posicionar('destroyer', coordenada(0, 0)!, 'horizontal');

    const resultado = store.iniciarBatalha();

    expect(resultado.tipo).toBe('frota-incompleta');
    expect(store.fase()).toBe('preparacao');
    const finais = store.historico();
    expect(finais.some((e) => e.tipo === 'batalha-iniciada')).toBe(false);
  });

  it('inicia batalha com as cinco embarcações, turno do jogador', () => {
    const store = TestBed.inject(JogoStore);
    posicionarFrotaCompleta(store);

    const resultado = store.iniciarBatalha();

    expect(resultado.tipo).toBe('ok');
    expect(store.fase()).toBe('batalha');
    expect(store.turno()).toBe('jogador');
    const finais = store.historico();
    expect(finais[finais.length - 1]?.tipo).toBe('batalha-iniciada');
  });
});

describe('JogoStore — base do estado', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: PROVEDORES });
  });

  it('nasce em preparação, com jogador vazio e sem vencedor', () => {
    const store = TestBed.inject(JogoStore);

    expect(store.fase()).toBe('preparacao');
    expect(store.turno()).toBe('jogador');
    expect(store.vencedor()).toBeNull();
    expect(store.encerrada()).toBe(false);
    expect(Object.keys(store.frotaDoJogador())).toHaveLength(0);
  });

  it('o estado público não expõe a frota do computador', () => {
    const store = TestBed.inject(JogoStore);

    expect(Object.keys(store)).not.toContain('partida');
    expect(Object.keys(store)).not.toContain('computador');

    const projecoesPublicas = [
      store.fase(),
      store.turno(),
      store.vencedor(),
      store.encerrada(),
      store.frotaDoJogador(),
      store.historico(),
    ];
    projecoesPublicas.forEach((projecao) => {
      const texto = JSON.stringify(projecao) ?? '';
      expect(texto.includes('"ataques"')).toBe(false);
      expect(texto.includes('vencedor')).toBe(false);
    });
  });
});

/** Coloca o store em batalha com a frota posicionada. */
function entrarEmBatalha(store: JogoStore): void {
  posicionarFrotaCompleta(store);
  expect(store.iniciarBatalha().tipo).toBe('ok');
}

describe('JogoStore — ataques e históricos', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: PROVEDORES });
  });

  it('ataque válido altera o turno e registra o evento', () => {
    const store = TestBed.inject(JogoStore);
    entrarEmBatalha(store);
    const alvo = store.coordenadasAtacaveis()[1]!;

    const resultado = store.atacar(alvo);

    expect(resultado.tipo).toBe('ok');
    expect(store.turno()).toBe('computador');
    const finais = store.historico();
    expect(finais[finais.length - 1]).toMatchObject({
      tipo: 'ataque',
      autor: 'jogador',
      coordenada: alvo,
    });
  });

  it('ataque repetido é recusado sem novo evento', () => {
    const store = TestBed.inject(JogoStore);
    entrarEmBatalha(store);
    const alvo = store.coordenadasAtacaveis()[2]!;
    store.atacar(alvo);
    store.jogarTurnoDoComputador();
    const antes = JSON.stringify(store.historico());

    const repetido = store.atacar(alvo);

    expect(repetido).toEqual({ tipo: 'ok', ataque: { tipo: 'repetido' } });
    expect(JSON.stringify(store.historico())).toBe(antes);
    expect(store.turno()).toBe('jogador');
  });

  it('coordenada atacada deixa de estar entre as atacáveis', () => {
    const store = TestBed.inject(JogoStore);
    entrarEmBatalha(store);
    const alvo = store.coordenadasAtacaveis()[3]!;

    expect(store.coordenadasAtacaveis()).toContain(alvo);
    store.atacar(alvo);
    expect(store.coordenadasAtacaveis()).not.toContain(alvo);
    expect(store.coordenadasAtacaveis()).toHaveLength(99);
  });

  it('marcas existem apenas para coordenadas atacadas', () => {
    const store = TestBed.inject(JogoStore);
    entrarEmBatalha(store);
    const alvo = store.coordenadasAtacaveis()[0]!;
    const intocado = store.coordenadasAtacaveis()[70]!;

    const resposta = store.atacar(alvo);
    expect(resposta).toMatchObject({ tipo: 'ok' });

    const marcas = store.marcasNoTabuleiroDoComputador();
    expect(marcas.has(intocado)).toBe(false);
    expect(marcas.get(alvo)).toBe((resposta as { ataque?: { tipo: string } }).ataque?.tipo);
    expect([...marcas.keys()]).toEqual([...store.ataquesNoComputador()]);
  });
});

describe('JogoStore — turno do computador', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: PROVEDORES });
  });

  it('computador ataca coordenada não atacada e devolve o turno', () => {
    const store = TestBed.inject(JogoStore);
    entrarEmBatalha(store);
    store.atacar(store.coordenadasAtacaveis()[0]!);
    expect(store.turno()).toBe('computador');

    const resultado = store.jogarTurnoDoComputador();

    expect(resultado.tipo).toBe('ok');
    expect(store.turno()).toBe('jogador');
    expect(store.marcasNoTabuleiroDoJogador().size).toBe(1);
    const finais = store.historico();
    expect(finais[finais.length - 1]).toMatchObject({ tipo: 'ataque', autor: 'computador' });
  });

  it('recusa o turno do computador fora de hora ou fora da batalha', () => {
    const store = TestBed.inject(JogoStore);
    entrarEmBatalha(store);

    expect(store.jogarTurnoDoComputador()).toEqual({ tipo: 'turno-invalido' });

    store.novaPartida();
    expect(store.jogarTurnoDoComputador()).toEqual({
      tipo: 'fase-invalida',
      fase: 'preparacao',
    });
  });
});

describe('JogoStore — escolha do tiro do computador', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [proveDoScript(15, 0.9999999)] });
  });

  it('escolhe a última coordenada disponível com o aleatório fixado no máximo', () => {
    const store = TestBed.inject(JogoStore);
    entrarEmBatalha(store);

    // Seis turnos do computador: cada tiro tira a última coordenada disponível.
    for (let rodada = 0; rodada < 6; rodada++) {
      store.atacar(store.coordenadasAtacaveis()[0]!);
      store.jogarTurnoDoComputador();
    }

    const marcas = [...store.marcasNoTabuleiroDoJogador().keys()];
    expect(marcas).toEqual(['J10', 'J9', 'J8', 'J7', 'J6', 'J5']);
    marcas.forEach((coordenadaDoTiro) => {
      expect(store.marcasNoTabuleiroDoJogador().get(coordenadaDoTiro)).toBe('agua');
    });
  });
});

describe('JogoStore — encerramento e reinício', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: PROVEDORES });
  });

  it('destruir a última embarcação do computador encerra sem conceder turno', () => {
    const store = TestBed.inject(JogoStore);
    entrarEmBatalha(store);

    let rodadas = 0;
    while (!store.encerrada() && rodadas < 200) {
      rodadas++;
      const alvo = store.coordenadasAtacaveis()[0]!;
      store.atacar(alvo);
      if (!store.encerrada()) {
        store.jogarTurnoDoComputador();
      }
    }

    expect(store.encerrada()).toBe(true);
    expect(store.vencedor()).toBe('jogador');
    expect(store.marcasNoTabuleiroDoJogador().size).toBeGreaterThan(16);
    // O encerramento precedente é registrado no histórico.
    const finais = store.historico();
    expect(finais[finais.length - 2]?.tipo).toBe('ataque');
    expect(finais[finais.length - 1]).toMatchObject({
      tipo: 'partida-encerrada',
      vencedor: 'jogador',
    });
  });

  it('ataque após o encerramento é recusado preservando o estado', () => {
    const store = TestBed.inject(JogoStore);
    entrarEmBatalha(store);
    let rodadas = 0;
    while (!store.encerrada() && rodadas < 200) {
      rodadas++;
      store.atacar(store.coordenadasAtacaveis()[0]!);
      if (!store.encerrada()) {
        store.jogarTurnoDoComputador();
      }
    }
    const ataquesNoJogador = store.marcasNoTabuleiroDoJogador().size;
    const ataquesNoComputador = store.marcasNoTabuleiroDoComputador().size;

    const após = store.atacar(store.coordenadasAtacaveis()[0]!);

    expect(após).toEqual({ tipo: 'fase-invalida', fase: 'encerrada' });
    expect(store.marcasNoTabuleiroDoJogador().size).toBe(ataquesNoJogador);
    expect(store.marcasNoTabuleiroDoComputador().size).toBe(ataquesNoComputador);
  });

  it('novaPartida descarta o histórico e reseta a fase para preparação', () => {
    const store = TestBed.inject(JogoStore);
    entrarEmBatalha(store);
    let rodadas = 0;
    while (!store.encerrada() && rodadas < 200) {
      rodadas++;
      store.atacar(store.coordenadasAtacaveis()[0]!);
      if (!store.encerrada()) {
        store.jogarTurnoDoComputador();
      }
    }
    expect(store.encerrada()).toBe(true);

    store.novaPartida();

    expect(store.fase()).toBe('preparacao');
    expect(store.encerrada()).toBe(false);
    expect(store.vencedor()).toBeNull();
    expect(store.marcasNoTabuleiroDoJogador().size).toBe(0);
    expect(store.marcasNoTabuleiroDoComputador().size).toBe(0);
    expect(store.historico()).toEqual([{ sequencia: 1, tipo: 'partida-iniciada' }]);
    expect(store.frotaDoJogador()).toEqual({});
  });
});

describe('JogoStore — derrota do jogador', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [proveDoScript(15, 0.0000001)] });
  });

  it('destruir a frota do jogador declara o computador vencedor', () => {
    const store = TestBed.inject(JogoStore);
    posicionarFrotaCompleta(store, basesEmpacotadas());
    expect(store.iniciarBatalha().tipo).toBe('ok');

    let rodadas = 0;
    while (!store.encerrada() && rodadas < 200) {
      rodadas++;
      store.atacar(store.coordenadasAtacaveis()[0]!);
      if (!store.encerrada()) {
        store.jogarTurnoDoComputador();
      }
    }

    expect(store.encerrada()).toBe(true);
    expect(store.vencedor()).toBe('computador');
    const finais = store.historico();
    expect(finais[finais.length - 1]).toMatchObject({
      tipo: 'partida-encerrada',
      vencedor: 'computador',
    });
  });
});
