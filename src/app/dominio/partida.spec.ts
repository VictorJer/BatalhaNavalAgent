import { Coordenada, coordenada } from './coordenada';
import { TipoEmbarcacao } from './embarcacao';
import {
  Partida,
  atacar,
  criarPartida,
  iniciarBatalha,
  posicionarEmbarcacao,
  removerEmbarcacao,
} from './partida';
import { embarcacaoDoTipo, estaCompleta, posicoesOcupadas } from './frota';
import { escolherAtaqueAleatorio, estaDestruida } from './tabuleiro';

/** Posiciona as cinco embarcações do jogador nas linhas A, C, E, G e I. */
function posicionarFrotaDoJogador(partida: Partida): Partida {
  const bases: Readonly<Record<TipoEmbarcacao, Coordenada>> = {
    'porta-avioes': coordenada(0, 0)!,
    encouracado: coordenada(2, 0)!,
    cruzador: coordenada(4, 0)!,
    submarino: coordenada(6, 0)!,
    destroyer: coordenada(8, 0)!,
  };
  for (const tipo of Object.keys(bases) as TipoEmbarcacao[]) {
    partida = posicionarEmbarcacao(partida, tipo, bases[tipo], 'horizontal').partida;
  }
  return partida;
}

/** Partida em batalha, com as posições da frota do jogador conhecidas. */
function partidaEmBatalha(): Partida {
  const inicio = iniciarBatalha(posicionarFrotaDoJogador(criarPartida()));
  if (inicio.tipo !== 'ok') {
    throw new Error('frota do jogador deveria estar completa nos testes');
  }
  return inicio.partida;
}

/** Um turno do computador, escolhendo coordenada ainda não atacada. */
function turnoDoComputador(partida: Partida): Partida {
  const alvo = escolherAtaqueAleatorio(partida.jogador, () => 0.5);
  if (alvo === null) {
    throw new Error('tabuleiro do jogador esgotado em teste');
  }
  return atacar(partida, alvo).partida;
}

/** Coordenada sem embarcação no tabuleiro do computador. */
function aguaNoTabuleiroDoComputador(partida: Partida): Coordenada {
  const frotas = Object.values(partida.computador.frota);
  for (let indice = 0; indice < 100; indice++) {
    const candidato = coordenada(Math.floor(indice / 10), indice % 10)!;
    if (!frotas.some((embarcacao) => embarcacao.posicoes.includes(candidato))) {
      return candidato;
    }
  }
  throw new Error('tabuleiro sem água em teste');
}

/** Tira de preenchimento do jogador: primeira coordenada ainda não atacada. */
function tiroDePreenchimento(partida: Partida): Coordenada {
  return coordenadasNaoAtacadasDoComputador(partida)[0]!;
}

function coordenadasNaoAtacadasDoComputador(partida: Partida): Coordenada[] {
  const todas: Coordenada[] = [];
  for (let indice = 0; indice < 100; indice++) {
    const posicao = coordenada(Math.floor(indice / 10), indice % 10)!;
    if (!partida.computador.ataques.has(posicao)) {
      todas.push(posicao);
    }
  }
  return todas;
}

/** Destroi frota por frota do computador; cada tiro do jogador recebe resposta. */
function destruirFrotaDoComputador(partida: Partida): Partida {
  for (const tipo of Object.keys(partida.computador.frota) as TipoEmbarcacao[]) {
    for (const posicao of [...(partida.computador.frota[tipo]?.posicoes ?? [])]) {
      const retorno = atacar(partida, posicao);
      partida = retorno.partida;
      if (partida.fase === 'encerrada') {
        return partida;
      }
      partida = turnoDoComputador(partida);
    }
  }
  return partida;
}

/** Destroi a frota do jogador, alternando tiros de preenchimento do jogador. */
function destruirFrotaDoJogador(partida: Partida): Partida {
  for (const tipo of Object.keys(partida.jogador.frota) as TipoEmbarcacao[]) {
    for (const posicao of [...(partida.jogador.frota[tipo]?.posicoes ?? [])]) {
      if (partida.turno === 'jogador') {
        partida = atacar(partida, tiroDePreenchimento(partida)).partida;
        if (partida.fase === 'encerrada') {
          return partida;
        }
      }
      partida = atacar(partida, posicao).partida;
      if (partida.fase === 'encerrada') {
        return partida;
      }
    }
  }
  return partida;
}

describe('Partida — nova partida e preparação', () => {
  it('nasce em preparação com jogador vazio e computador completo', () => {
    const partida = criarPartida();

    expect(partida.fase).toBe('preparacao');
    expect(partida.turno).toBe('jogador');
    expect(partida.vencedor).toBeNull();
    expect(partida.jogador.ataques.size).toBe(0);
    expect(partida.jogador.frota).toEqual({});
    expect(estaCompleta(partida.computador.frota)).toBe(true);
    expect(partida.computador.ataques.size).toBe(0);
  });

  it('posiciona e remove embarcações durante a preparação', () => {
    let partida = criarPartida();

    partida = posicionarEmbarcacao(partida, 'cruzador', coordenada(1, 1)!, 'horizontal').partida;
    expect(embarcacaoDoTipo(partida.jogador.frota, 'cruzador')?.posicoes).toEqual([
      'B2',
      'B3',
      'B4',
    ]);

    partida = removerEmbarcacao(partida, 'cruzador').partida;
    expect(embarcacaoDoTipo(partida.jogador.frota, 'cruzador')).toBeNull();
  });

  it('recusa posicionar fora do tabuleiro preservando o estado', () => {
    let partida = criarPartida();
    partida = posicionarEmbarcacao(partida, 'cruzador', coordenada(1, 1)!, 'horizontal').partida;

    const { partida: depois, resultado } = posicionarEmbarcacao(
      partida,
      'porta-avioes',
      coordenada(0, 7)!,
      'horizontal',
    );

    expect(resultado.tipo).toBe('fora-do-tabuleiro');
    expect(depois).toEqual(partida);
  });

  it('recusa iniciar batalha com frota incompleta e mantém a fase', () => {
    let partida = criarPartida();
    partida = posicionarEmbarcacao(partida, 'destroyer', coordenada(0, 0)!, 'horizontal').partida;

    const resultado = iniciarBatalha(partida);

    expect(resultado.tipo).toBe('frota-incompleta');
    expect(partida.fase).toBe('preparacao');
  });

  it('inicia batalha com as cinco embarcações e turno do jogador', () => {
    const preparada = posicionarFrotaDoJogador(criarPartida());

    const resultado = iniciarBatalha(preparada);

    expect(resultado.tipo).toBe('ok');
    if (resultado.tipo !== 'ok') {
      return;
    }
    expect(resultado.partida.fase).toBe('batalha');
    expect(resultado.partida.turno).toBe('jogador');
    expect(posicoesOcupadas(resultado.partida.jogador.frota)).toHaveLength(17);
  });
});

describe('Partida — ataques e turnos', () => {
  it('alterna o turno após água e após acerto', () => {
    let partida = partidaEmBatalha();
    const posicoesDoPrimeiroTipo = [...Object.values(partida.computador.frota)[0]!.posicoes];

    const agua = atacar(partida, aguaNoTabuleiroDoComputador(partida));
    expect(agua.resultado.tipo).toBe('agua');
    expect(agua.partida.turno).toBe('computador');

    partida = turnoDoComputador(agua.partida);
    expect(partida.turno).toBe('jogador');
    expect(partida.jogador.ataques.size).toBe(1);

    const acerto = atacar(partida, posicoesDoPrimeiroTipo[0]!);
    expect(acerto.resultado.tipo).toBe('acerto');
    expect(acerto.partida.turno).toBe('computador');
  });

  it('o computador ataca o tabuleiro do jogador ao receber o turno', () => {
    let partida = partidaEmBatalha();

    partida = atacar(partida, aguaNoTabuleiroDoComputador(partida)).partida;
    expect(partida.turno).toBe('computador');

    partida = turnoDoComputador(partida);
    expect(partida.turno).toBe('jogador');
    expect(partida.jogador.ataques.size).toBe(1);
  });

  it('ataque repetido e ataque em fase inválida não consomem o turno', () => {
    let partida = partidaEmBatalha();
    const primeiraPosicaoDoComputador = [
      ...Object.values(partida.computador.frota)[0]!.posicoes,
    ][0]!;

    partida = atacar(partida, primeiraPosicaoDoComputador).partida;
    partida = turnoDoComputador(partida);

    const repetido = atacar(partida, primeiraPosicaoDoComputador);
    expect(repetido.resultado.tipo).toBe('repetido');
    expect(repetido.partida.turno).toBe('jogador');
    expect(repetido.partida).toEqual(partida);

    const emPreparacao = criarPartida();
    const foraDaFase = atacar(emPreparacao, coordenada(0, 0)!);
    expect(foraDaFase.resultado.tipo).toBe('batalha-nao-iniciada');
    expect(foraDaFase.partida).toEqual(emPreparacao);
  });
});

describe('Partida — encerramento e nova partida', () => {
  it('destruir a última embarcação do computador encerra sem conceder turno', () => {
    let partida = partidaEmBatalha();

    partida = destruirFrotaDoComputador(partida);

    expect(partida.fase).toBe('encerrada');
    expect(partida.vencedor).toBe('jogador');
    expect(partida.turno).toBe('jogador');
  });

  it('destruir a frota do jogador declara o computador vencedor', () => {
    let partida = partidaEmBatalha();

    partida = destruirFrotaDoJogador(partida);

    expect(partida.fase).toBe('encerrada');
    expect(partida.vencedor).toBe('computador');
  });

  it('ataque após o encerramento é recusado preservando o estado final', () => {
    let partida = partidaEmBatalha();
    partida = destruirFrotaDoComputador(partida);
    const estadoFinal = partida;

    const retorno = atacar(partida, coordenada(9, 9)!);

    expect(retorno.resultado).toEqual({ tipo: 'partida-encerrada' });
    expect(retorno.partida).toEqual(estadoFinal);
  });

  it('destruição comprovada embarcação a embarcação antes do fim', () => {
    let partida = partidaEmBatalha();
    partida = destruirFrotaDoComputador(partida);

    for (const tipo of Object.keys(partida.computador.frota) as TipoEmbarcacao[]) {
      expect(
        estaDestruida(partida.computador, embarcacaoDoTipo(partida.computador.frota, tipo)!),
      ).toBe(true);
    }
  });

  it('criarPartida após o fim devolve tabuleiros sem ataques e frota nova', () => {
    let partida = partidaEmBatalha();
    partida = destruirFrotaDoComputador(partida);

    const nova = criarPartida();

    expect(partida.fase).toBe('encerrada');
    expect(nova.fase).toBe('preparacao');
    expect(nova.jogador.ataques.size).toBe(0);
    expect(nova.computador.ataques.size).toBe(0);
    expect(estaCompleta(nova.computador.frota)).toBe(true);
    expect(new Set(posicoesOcupadas(nova.computador.frota)).size).toBe(17);
  });
});
