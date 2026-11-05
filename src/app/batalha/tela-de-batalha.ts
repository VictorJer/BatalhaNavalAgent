import { Component, computed, inject } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { Coordenada } from '../dominio/coordenada';
import { TIPOS_DAS_EMBARCACOES } from '../dominio/embarcacao';
import { Lado } from '../dominio/partida';
import { JogoStore } from '../estado/jogo-store';
import { APRESENTACAO_DOS_RESULTADOS, EstadoDaCelula, Tabuleiro } from '../preparacao/tabuleiro';

@Component({
  selector: 'app-tela-de-batalha',
  imports: [Tabuleiro, LucideDynamicIcon],
  templateUrl: './tela-de-batalha.html',
  host: { class: 'block w-full max-w-5xl min-w-0' },
})
export class TelaDeBatalha {
  private readonly jogo = inject(JogoStore);
  private readonly coordenadasAtacaveis = computed(() => new Set(this.jogo.coordenadasAtacaveis()));

  protected readonly resultados = ['agua', 'acerto', 'destruida'] as const;
  protected readonly apresentacaoDosResultados = APRESENTACAO_DOS_RESULTADOS;
  protected readonly encerrada = this.jogo.encerrada;
  protected readonly resultadoFinal = computed(() =>
    this.jogo.vencedor() === 'jogador' ? 'Você venceu!' : 'O computador venceu. Você perdeu.',
  );
  protected readonly indicacaoDoTurno = computed(() =>
    this.jogo.turno() === 'jogador'
      ? 'Sua vez. Selecione uma coordenada no tabuleiro do computador.'
      : 'Vez do computador.',
  );
  protected readonly ultimoAtaqueDoJogador = computed(() => this.resumoDoUltimoAtaque('jogador'));
  protected readonly ultimoAtaqueDoComputador = computed(() =>
    this.resumoDoUltimoAtaque('computador'),
  );

  protected readonly ataquesBloqueados = computed(
    () => this.jogo.fase() !== 'batalha' || this.jogo.turno() !== 'jogador',
  );

  protected readonly celulasDoJogador = computed(() => {
    const celulas: Record<string, EstadoDaCelula> = {};
    const frota = this.jogo.frotaDoJogador();
    for (const tipo of TIPOS_DAS_EMBARCACOES) {
      for (const posicao of frota[tipo]?.posicoes ?? []) {
        celulas[posicao] = { embarcacao: tipo };
      }
    }
    for (const [posicao, resultado] of this.jogo.marcasNoTabuleiroDoJogador()) {
      celulas[posicao] = { ...celulas[posicao], resultado };
    }
    return celulas;
  });

  protected readonly celulasDoComputador = computed(() => {
    const celulas: Record<string, EstadoDaCelula> = {};
    for (const [posicao, resultado] of this.jogo.marcasNoTabuleiroDoComputador()) {
      celulas[posicao] = {
        resultado,
        bloqueada: !this.coordenadasAtacaveis().has(posicao),
      };
    }
    return celulas;
  });

  protected atacarCoordenada(alvo: Coordenada): void {
    if (this.ataquesBloqueados() || !this.coordenadasAtacaveis().has(alvo)) {
      return;
    }

    const resultado = this.jogo.atacar(alvo);
    if (
      resultado.tipo !== 'ok' ||
      (resultado.ataque?.tipo !== 'agua' &&
        resultado.ataque?.tipo !== 'acerto' &&
        resultado.ataque?.tipo !== 'destruida')
    ) {
      return;
    }

    if (this.jogo.fase() === 'batalha' && this.jogo.turno() === 'computador') {
      this.jogo.jogarTurnoDoComputador();
    }
  }

  protected novaPartida(): void {
    if (this.encerrada()) {
      this.jogo.novaPartida();
    }
  }

  private resumoDoUltimoAtaque(autor: Lado): string {
    for (const evento of [...this.jogo.historico()].reverse()) {
      if (evento.tipo === 'ataque' && evento.autor === autor) {
        return `${evento.coordenada}: ${APRESENTACAO_DOS_RESULTADOS[evento.resultado].texto}.`;
      }
    }
    return 'Ainda não atacou.';
  }
}
