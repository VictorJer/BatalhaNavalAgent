import { Component, computed, inject, signal } from '@angular/core';
import { Coordenada } from '../dominio/coordenada';
import {
  Embarcacao,
  Orientacao,
  TIPOS_DAS_EMBARCACOES,
  TipoEmbarcacao,
  posicoesDe,
  tamanhoDe,
} from '../dominio/embarcacao';
import { estaCompleta, posicoesOcupadas } from '../dominio/frota';
import { JogoStore } from '../estado/jogo-store';
import { EstadoDaCelula, Tabuleiro } from './tabuleiro';

const NOMES_DAS_EMBARCACOES: Readonly<Record<TipoEmbarcacao, string>> = {
  'porta-avioes': 'Porta-aviões',
  encouracado: 'Encouraçado',
  cruzador: 'Cruzador',
  submarino: 'Submarino',
  destroyer: 'Destroyer',
};

@Component({
  selector: 'app-tela-de-preparacao',
  imports: [Tabuleiro],
  template: `
    <section class="w-full max-w-5xl text-left" aria-labelledby="titulo-preparacao">
      <h2 id="titulo-preparacao" class="mb-4 text-2xl font-semibold">Preparação da frota</h2>
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <app-tabuleiro
          [celulas]="estadoDasCelulas()"
          (celulaClicada)="posicionarNaCelula($event)"
          (celulaApontada)="celulaApontada.set($event)"
        />
        <aside class="space-y-4" aria-label="Controles da frota">
          <div>
            <h3 class="mb-2 font-semibold">Embarcações</h3>
            <ul class="space-y-2">
              @for (tipo of tipos; track tipo) {
                <li>
                  <button
                    type="button"
                    class="flex w-full items-center justify-between rounded border px-3 py-2 text-left"
                    [class.border-acerto]="selecionada() === tipo"
                    [class.bg-navio]="!!frota()[tipo]"
                    [attr.aria-pressed]="selecionada() === tipo"
                    [attr.aria-label]="
                      nomeDaEmbarcacao(tipo) + (frota()[tipo] ? ', posicionada' : ', pendente')
                    "
                    (click)="selecionar(tipo)"
                  >
                    <span>{{ nomeDaEmbarcacao(tipo) }}</span>
                    <span class="text-sm text-slate-300">{{
                      frota()[tipo] ? 'Posicionada' : 'Pendente'
                    }}</span>
                  </button>
                </li>
              }
            </ul>
            <p class="mt-3 text-sm text-slate-300">
              {{ quantidadePosicionada() }} de 5 embarcações posicionadas
            </p>
          </div>

          <p>
            Orientação:
            <strong>{{ orientacao() === 'horizontal' ? 'Horizontal' : 'Vertical' }}</strong>
          </p>
          <button
            type="button"
            class="w-full rounded bg-agua px-3 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50"
            [disabled]="!selecionada()"
            (click)="alternarOrientacao()"
          >
            Alternar orientação
          </button>

          @if (mensagemDeRecusa()) {
            <p role="alert" class="rounded border border-erro p-3 text-rose-200">
              {{ mensagemDeRecusa() }}
            </p>
          }

          <button
            type="button"
            class="w-full rounded border border-slate-500 px-3 py-2"
            (click)="gerarFrota()"
          >
            Gerar frota automaticamente
          </button>
          <button
            type="button"
            class="w-full rounded bg-acerto px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            [disabled]="!frotaCompleta()"
            (click)="iniciarBatalha()"
          >
            Iniciar batalha
          </button>
        </aside>
      </div>
    </section>
  `,
})
export class TelaDePreparacao {
  private readonly jogo = inject(JogoStore);

  readonly selecionada = signal<TipoEmbarcacao | null>(null);
  readonly orientacao = signal<Orientacao>('horizontal');
  readonly celulaApontada = signal<Coordenada | null>(null);
  readonly mensagemDeRecusa = signal<string | null>(null);
  protected readonly tipos = TIPOS_DAS_EMBARCACOES;
  protected readonly frota = this.jogo.frotaDoJogador;
  protected readonly quantidadePosicionada = computed(() => Object.keys(this.frota()).length);
  protected readonly frotaCompleta = computed(() => estaCompleta(this.frota()));

  protected readonly estadoDasCelulas = computed<Readonly<Record<string, EstadoDaCelula>>>(() => {
    const celulas: Record<string, EstadoDaCelula> = {};
    for (const tipo of this.tipos) {
      const embarcacao: Embarcacao | undefined = this.frota()[tipo];
      embarcacao?.posicoes.forEach((posicao) => {
        celulas[posicao] = { ...celulas[posicao], embarcacao: tipo };
      });
    }

    const tipo = this.selecionada();
    const origem = this.celulaApontada();
    if (tipo !== null && origem !== null) {
      const posicoes = posicoesDe(origem, this.orientacao(), tamanhoDe(tipo));
      const ocupadas = new Set(posicoesOcupadas({ ...this.frota(), [tipo]: undefined }));
      const valido = posicoes !== null && posicoes.every((posicao) => !ocupadas.has(posicao));
      const preview = valido ? 'valido' : 'invalido';
      (posicoes ?? [origem]).forEach((posicao) => {
        celulas[posicao] = { ...celulas[posicao], preview };
      });
    }
    return celulas;
  });

  protected nomeDaEmbarcacao(tipo: TipoEmbarcacao): string {
    return NOMES_DAS_EMBARCACOES[tipo];
  }

  protected selecionar(tipo: TipoEmbarcacao): void {
    const posicionada = this.frota()[tipo] !== undefined;
    if (posicionada) {
      this.jogo.remover(tipo);
    }
    this.selecionada.set(tipo);
    this.orientacao.set('horizontal');
    this.mensagemDeRecusa.set(null);
  }

  protected alternarOrientacao(): void {
    if (this.selecionada() !== null) {
      this.orientacao.update((atual) => (atual === 'horizontal' ? 'vertical' : 'horizontal'));
    }
  }

  protected posicionarNaCelula(origem: Coordenada): void {
    const tipo = this.selecionada();
    if (tipo === null) return;

    const resultado = this.jogo.posicionar(tipo, origem, this.orientacao());
    if (resultado.tipo === 'ok') {
      this.selecionada.set(null);
      this.mensagemDeRecusa.set(null);
      return;
    }
    if (resultado.tipo === 'posicionamento-recusado') {
      if (resultado.resultado.tipo === 'fora-do-tabuleiro') {
        this.mensagemDeRecusa.set('A embarcação não cabe nessa posição.');
      } else if (resultado.resultado.tipo === 'sobreposicao') {
        this.mensagemDeRecusa.set(
          `A posição sobrepõe a embarcação ${this.nomeDaEmbarcacao(resultado.resultado.com)}.`,
        );
      }
    }
  }

  protected gerarFrota(): void {
    const resultado = this.jogo.posicionarFrotaAutomaticamente();
    if (resultado.tipo === 'ok') {
      this.selecionada.set(null);
      this.mensagemDeRecusa.set(null);
    }
  }

  protected iniciarBatalha(): void {
    this.jogo.iniciarBatalha();
  }
}
