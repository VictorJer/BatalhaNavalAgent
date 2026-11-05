import { Injectable, computed, inject, signal } from '@angular/core';
import { Coordenada } from '../dominio/coordenada';
import { Orientacao, TIPOS_DAS_EMBARCACOES, TipoEmbarcacao } from '../dominio/embarcacao';
import {
  FaseDaPartida,
  Lado,
  Partida,
  ResultadoAtaqueDaPartida,
  atacar as atacarNaPartida,
  criarPartida,
  iniciarBatalha,
  posicionarEmbarcacao,
  removerEmbarcacao,
} from '../dominio/partida';
import { ResultadoPosicionamento, embarcacaoDoTipo } from '../dominio/frota';
import { gerarFrotaAleatoria } from '../dominio/frota-aleatoria';
import { coordenadasNaoAtacadas, escolherAtaqueAleatorio } from '../dominio/tabuleiro';
import { Aleatorio, ALEATORIO } from './aleatorio';

/** Resumo do resultado de um ataque para o histórico. */
export type ResultadoResumido = 'agua' | 'acerto' | 'destruida';

/** Resultado discriminado das ações do store, consumido pela UI. */
export type ResultadoAcao =
  | { tipo: 'ok'; ataque?: ResultadoAtaqueDaPartida }
  | { tipo: 'fase-invalida'; fase: FaseDaPartida }
  | { tipo: 'turno-invalido' }
  | { tipo: 'frota-incompleta' }
  | { tipo: 'posicionamento-recusado'; resultado: ResultadoPosicionamento };

/** Estado completo do jogo: partida de domínio e histórico de eventos. */
export interface EstadoDoJogo {
  readonly partida: Partida;
  readonly historico: readonly EventoDaPartida[];
}

/**
 * Eventos em ordem cronológica, com dados (não textos). A sequência é
 * monotônica e reinicia a cada nova partida.
 */
export type EventoDaPartida =
  | { sequencia: number; tipo: 'partida-iniciada' }
  | {
      sequencia: number;
      tipo: 'embarcacao-posicionada';
      tipoEmbarcacao: TipoEmbarcacao;
      posicoes: readonly Coordenada[];
    }
  | { sequencia: number; tipo: 'embarcacao-removida'; tipoEmbarcacao: TipoEmbarcacao }
  | { sequencia: number; tipo: 'batalha-iniciada' }
  | {
      sequencia: number;
      tipo: 'ataque';
      autor: Lado;
      coordenada: Coordenada;
      resultado: ResultadoResumido;
    }
  | { sequencia: number; tipo: 'partida-encerrada'; vencedor: Lado };

/** Evento antes de receber a sequência, na ordem em que ocorre. */
type SemSequencia<T> = T extends unknown ? Omit<T, 'sequencia'> : never;
export type EventoNovo = SemSequencia<EventoDaPartida>;

@Injectable({ providedIn: 'root' })
export class JogoStore {
  private readonly aleatorio: Aleatorio = inject(ALEATORIO);

  /** Única fonte de estado: a partida e o histórico, escritos de uma vez. */
  private readonly estado = signal<EstadoDoJogo>(criarEstadoInicial(this.aleatorio));

  /** Fase atual da partida. */
  readonly fase = computed<FaseDaPartida>(() => this.estado().partida.fase);

  /** De quem é o turno. */
  readonly turno = computed<Lado>(() => this.estado().partida.turno);

  /** Vencedor da partida, quando encerrada. */
  readonly vencedor = computed<Lado | null>(() => this.estado().partida.vencedor);

  /** Indica se a partida já terminou. */
  readonly encerrada = computed<boolean>(() => this.estado().partida.fase === 'encerrada');

  /** Frota do jogador, usada na preparação e na batalha. */
  readonly frotaDoJogador = computed(() => this.estado().partida.jogador.frota);

  /** Eventos da partida, em ordem cronológica. */
  readonly historico = computed<readonly EventoDaPartida[]>(() => this.estado().historico);

  /** Coordenadas do jogador já atacadas pelo computador. */
  readonly ataquesNoJogador = computed<ReadonlySet<Coordenada>>(
    () => this.estado().partida.jogador.ataques,
  );

  /** Coordenadas do computador já atacadas pelo jogador. */
  readonly ataquesNoComputador = computed<ReadonlySet<Coordenada>>(
    () => this.estado().partida.computador.ataques,
  );

  /** Coordenadas do tabuleiro do computador que ainda podem ser atacadas. */
  readonly coordenadasAtacaveis = computed<readonly Coordenada[]>(() =>
    coordenadasNaoAtacadas(this.estado().partida.computador),
  );

  /** Resultado por coordenada já atacada no tabuleiro do jogador. */
  readonly marcasNoTabuleiroDoJogador = computed<ReadonlyMap<Coordenada, ResultadoResumido>>(() =>
    marcasDeAtaques(this.historico(), 'computador'),
  );

  /** Resultado por coordenada já atacada no tabuleiro do computador. */
  readonly marcasNoTabuleiroDoComputador = computed<ReadonlyMap<Coordenada, ResultadoResumido>>(
    () => marcasDeAtaques(this.historico(), 'jogador'),
  );

  /** Inicia uma nova partida: descarta o histórico e volta à preparação. */
  novaPartida(): void {
    this.estado.set(criarEstadoInicial(this.aleatorio));
  }

  /** Posiciona embarcação do jogador; aceito somente na preparação. */
  posicionar(tipo: TipoEmbarcacao, origem: Coordenada, orientacao: Orientacao): ResultadoAcao {
    if (this.fase() !== 'preparacao') {
      return { tipo: 'fase-invalida', fase: this.fase() };
    }

    const { partida, resultado } = posicionarEmbarcacao(
      this.estado().partida,
      tipo,
      origem,
      orientacao,
    );
    if (resultado.tipo !== 'ok') {
      if (resultado.tipo === 'fase-invalida') {
        return { tipo: 'fase-invalida', fase: this.fase() };
      }
      return { tipo: 'posicionamento-recusado', resultado };
    }

    this.escrever(partida, [
      {
        tipo: 'embarcacao-posicionada',
        tipoEmbarcacao: tipo,
        posicoes: posicoesDaEmbarcacao(partida, tipo),
      },
    ]);
    return { tipo: 'ok' };
  }

  /** Remove embarcação do jogador; aceito somente na preparação. */
  remover(tipo: TipoEmbarcacao): ResultadoAcao {
    if (this.fase() !== 'preparacao') {
      return { tipo: 'fase-invalida', fase: this.fase() };
    }

    if (embarcacaoDoTipo(this.estado().partida.jogador.frota, tipo) === null) {
      return { tipo: 'ok' };
    }

    const { partida, resultado } = removerEmbarcacao(this.estado().partida, tipo);
    if (resultado.tipo !== 'ok') {
      return { tipo: 'fase-invalida', fase: this.fase() };
    }

    this.escrever(partida, [{ tipo: 'embarcacao-removida', tipoEmbarcacao: tipo }]);
    return { tipo: 'ok' };
  }

  /** Substitui a frota do jogador por uma frota completa gerada aleatoriamente. */
  posicionarFrotaAutomaticamente(): ResultadoAcao {
    if (this.fase() !== 'preparacao') {
      return { tipo: 'fase-invalida', fase: this.fase() };
    }

    const partidaAtual = this.estado().partida;
    const frotaAtual = partidaAtual.jogador.frota;
    const frotaGerada = gerarFrotaAleatoria(this.aleatorio);
    const partida = {
      ...partidaAtual,
      jogador: { ...partidaAtual.jogador, frota: frotaGerada },
    };
    const eventos: EventoNovo[] = [];

    for (const tipo of TIPOS_DAS_EMBARCACOES) {
      if (embarcacaoDoTipo(frotaAtual, tipo) !== null) {
        eventos.push({ tipo: 'embarcacao-removida', tipoEmbarcacao: tipo });
      }
    }
    for (const tipo of TIPOS_DAS_EMBARCACOES) {
      eventos.push({
        tipo: 'embarcacao-posicionada',
        tipoEmbarcacao: tipo,
        posicoes: posicoesDaEmbarcacao(partida, tipo),
      });
    }

    this.escrever(partida, eventos);
    return { tipo: 'ok' };
  }

  /** Inicia a batalha; exige a frota do jogador completa. */
  iniciarBatalha(): ResultadoAcao {
    if (this.fase() !== 'preparacao') {
      return { tipo: 'fase-invalida', fase: this.fase() };
    }

    const resultado = iniciarBatalha(this.estado().partida);
    if (resultado.tipo === 'frota-incompleta') {
      return { tipo: 'frota-incompleta' };
    }
    if (resultado.tipo !== 'ok') {
      return { tipo: 'fase-invalida', fase: this.fase() };
    }

    this.escrever(resultado.partida, [{ tipo: 'batalha-iniciada' }]);
    return { tipo: 'ok' };
  }

  /** Aplica um ataque do jogador ao tabuleiro do computador. */
  atacar(alvo: Coordenada): ResultadoAcao {
    if (this.encerrada() || this.fase() !== 'batalha') {
      return { tipo: 'fase-invalida', fase: this.fase() };
    }
    if (this.turno() !== 'jogador') {
      return { tipo: 'turno-invalido' };
    }
    return this.aplicarAtaque(alvo);
  }

  /** Executa o turno do computador, escolhendo coordenada não atacada. */
  jogarTurnoDoComputador(): ResultadoAcao {
    if (this.fase() !== 'batalha') {
      return { tipo: 'fase-invalida', fase: this.fase() };
    }
    if (this.turno() !== 'computador') {
      return { tipo: 'turno-invalido' };
    }

    const alvo = escolherAtaqueAleatorio(this.estado().partida.jogador, this.aleatorio);
    if (alvo === null) {
      // Tabuleiro esgotado: com a batalha em aberto isso é invariante violada.
      return { tipo: 'fase-invalida', fase: this.fase() };
    }
    return this.aplicarAtaque(alvo);
  }

  /** Escreve o próximo estado integralmente: partida nova e eventos novos. */
  private escrever(proxima: Partida, eventos: EventoNovo[]): void {
    const atual = this.estado();
    let sequencia = atual.historico.length;
    const registrados = eventos.map((evento) => ({
      sequencia: ++sequencia,
      ...evento,
    }));
    this.estado.set({ partida: proxima, historico: [...atual.historico, ...registrados] });
  }

  /** Delega ao domínio e registra o evento de ataque e, se houver, o fim. */
  private aplicarAtaque(alvo: Coordenada): ResultadoAcao {
    const autor = this.turno();
    const { partida, resultado } = atacarNaPartida(this.estado().partida, alvo);
    if (resultado.tipo === 'repetido' || resultado.tipo === 'fora-do-tabuleiro') {
      return { tipo: 'ok', ataque: resultado };
    }
    if (
      resultado.tipo !== 'agua' &&
      resultado.tipo !== 'acerto' &&
      resultado.tipo !== 'destruida'
    ) {
      // Recusas de partida (fase/encerramento) são barradas pelas guardas acima.
      return { tipo: 'ok', ataque: resultado };
    }

    const eventos: EventoNovo[] = [
      { tipo: 'ataque', autor, coordenada: alvo, resultado: resultado.tipo },
    ];
    if (partida.fase === 'encerrada') {
      eventos.push({ tipo: 'partida-encerrada', vencedor: partida.vencedor ?? 'jogador' });
    }
    this.escrever(partida, eventos);
    return { tipo: 'ok', ataque: resultado };
  }
}

function criarEstadoInicial(aleatorio: Aleatorio): EstadoDoJogo {
  return {
    partida: criarPartida(aleatorio),
    historico: [{ sequencia: 1, tipo: 'partida-iniciada' }],
  };
}

function posicoesDaEmbarcacao(partida: Partida, tipo: TipoEmbarcacao): Coordenada[] {
  const embarcacao = embarcacaoDoTipo(partida.jogador.frota, tipo);
  return [...(embarcacao?.posicoes ?? [])];
}

/** Mapa das coordenadas atacadas do lado informado, com o resultado de cada tiro. */
function marcasDeAtaques(
  eventos: readonly EventoDaPartida[],
  autor: Lado,
): Map<Coordenada, ResultadoResumido> {
  const marcas = new Map<Coordenada, ResultadoResumido>();
  for (const evento of eventos) {
    if (evento.tipo === 'ataque' && evento.autor === autor) {
      marcas.set(evento.coordenada, evento.resultado);
    }
  }
  return marcas;
}
