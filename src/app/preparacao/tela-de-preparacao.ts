import { Component, computed, inject, signal } from '@angular/core';
import { Coordenada, colunaDe, coordenada, linhaDe } from '../dominio/coordenada';
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
import { APRESENTACAO_DAS_EMBARCACOES, nomeDaEmbarcacao } from './apresentacao-das-embarcacoes';

@Component({
  selector: 'app-tela-de-preparacao',
  imports: [Tabuleiro],
  host: { class: 'block w-full max-w-5xl min-w-0' },
  template: `
    <section class="w-full max-w-5xl text-left" aria-labelledby="titulo-preparacao">
      <h2 id="titulo-preparacao" class="mb-4 text-2xl font-semibold">Preparação da frota</h2>
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <app-tabuleiro
          [celulas]="estadoDasCelulas()"
          [mostrarCoordenadas]="true"
          [mostrarEmbarcacoes]="true"
          (celulaClicada)="posicionarNaCelula($event)"
          (celulaApontada)="celulaApontada.set($event)"
          (apontamentoEncerrado)="celulaApontada.set(null)"
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
                    <span class="min-w-0">
                      <span class="block font-medium"
                        >{{ nomeDaEmbarcacao(tipo) }} ({{ siglaDaEmbarcacao(tipo) }})</span
                      >
                      <span class="block text-sm text-slate-300"
                        >{{ tamanhoDe(tipo) }} posições</span
                      >
                      <span class="flex gap-1 pt-1" aria-hidden="true">
                        @for (segmento of segmentos(tipo); track $index) {
                          <span class="h-2 w-3 rounded-sm border border-slate-300"></span>
                        }
                      </span>
                    </span>
                    <span class="shrink-0 text-right text-sm text-slate-300">
                      <span class="block">{{ frota()[tipo] ? 'Posicionada' : 'Pendente' }}</span>
                      @if (selecionada() === tipo) {
                        <span class="block font-semibold text-white">Selecionada</span>
                      }
                    </span>
                  </button>
                </li>
              }
            </ul>
            <p class="mt-3 text-sm text-slate-300">
              {{ quantidadePosicionada() }} de 5 embarcações posicionadas
            </p>
          </div>

          <p role="status" aria-live="polite" class="rounded border border-slate-600 p-3">
            @if (selecionada(); as tipo) {
              {{ nomeDaEmbarcacao(tipo) }}, {{ tamanhoDe(tipo) }} posições, orientação
              {{ orientacao() }}.
              @if (celulaApontada(); as coordenada) {
                Coordenada {{ coordenada }}.
              }
              @if (explicacaoDaPrevia(); as explicacao) {
                {{ explicacao }}
              }
            } @else {
              Selecione uma embarcação e depois uma célula do tabuleiro.
            }
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

  protected readonly encaixe = computed(() => {
    const tipo = this.selecionada();
    const origem = this.celulaApontada();
    if (tipo === null || origem === null) return null;

    const posicoes = posicoesDe(origem, this.orientacao(), tamanhoDe(tipo));
    const ocupadas = new Set(posicoesOcupadas({ ...this.frota(), [tipo]: undefined }));
    const motivo =
      posicoes === null
        ? 'fora-do-tabuleiro'
        : posicoes.some((posicao) => ocupadas.has(posicao))
          ? 'sobreposicao'
          : null;
    const posicoesVisiveis = posicoes ?? this.recortarPosicoesDaTentativa(origem, tamanhoDe(tipo));
    const explicacao =
      motivo === 'fora-do-tabuleiro'
        ? 'A embarcação não cabe nessa posição.'
        : motivo === 'sobreposicao'
          ? this.explicacaoDaSobreposicao(posicoes ?? [], tipo)
          : 'Encaixe válido.';

    return { tipo, posicoes: posicoesVisiveis, valido: motivo === null, motivo, explicacao };
  });

  protected readonly estadoDasCelulas = computed<Readonly<Record<string, EstadoDaCelula>>>(() => {
    const celulas: Record<string, EstadoDaCelula> = {};
    for (const tipo of this.tipos) {
      const embarcacao: Embarcacao | undefined = this.frota()[tipo];
      embarcacao?.posicoes.forEach((posicao) => {
        celulas[posicao] = { ...celulas[posicao], embarcacao: tipo };
      });
    }

    const encaixe = this.encaixe();
    encaixe?.posicoes.forEach((posicao) => {
      celulas[posicao] = {
        ...celulas[posicao],
        preview: encaixe.valido ? 'valido' : 'invalido',
        descricaoPreview: encaixe.explicacao,
      };
    });
    return celulas;
  });

  protected explicacaoDaPrevia(): string | null {
    return this.encaixe()?.explicacao ?? null;
  }

  private recortarPosicoesDaTentativa(origem: Coordenada, tamanho: number): Coordenada[] {
    const linhaInicial = linhaDe(origem);
    const colunaInicial = colunaDe(origem);
    return Array.from({ length: tamanho }, (_, avancar) =>
      coordenada(
        this.orientacao() === 'vertical' ? linhaInicial + avancar : linhaInicial,
        this.orientacao() === 'horizontal' ? colunaInicial + avancar : colunaInicial,
      ),
    ).filter((posicao): posicao is Coordenada => posicao !== null);
  }

  private explicacaoDaSobreposicao(
    posicoes: readonly Coordenada[],
    selecionada: TipoEmbarcacao,
  ): string {
    for (const tipo of this.tipos) {
      if (
        tipo !== selecionada &&
        this.frota()[tipo]?.posicoes.some((posicao) => posicoes.includes(posicao))
      ) {
        return `A posição sobrepõe a embarcação ${this.nomeDaEmbarcacao(tipo)}.`;
      }
    }
    return 'A posição sobrepõe outra embarcação.';
  }

  protected nomeDaEmbarcacao(tipo: TipoEmbarcacao): string {
    return nomeDaEmbarcacao(tipo);
  }

  protected siglaDaEmbarcacao(tipo: TipoEmbarcacao): string {
    return APRESENTACAO_DAS_EMBARCACOES[tipo].sigla;
  }

  protected segmentos(tipo: TipoEmbarcacao): number[] {
    return Array.from({ length: tamanhoDe(tipo) }, (_, indice) => indice);
  }

  protected tamanhoDe(tipo: TipoEmbarcacao): number {
    return tamanhoDe(tipo);
  }

  protected selecionar(tipo: TipoEmbarcacao): void {
    const posicionada = this.frota()[tipo] !== undefined;
    if (posicionada) {
      this.jogo.remover(tipo);
    }
    this.selecionada.set(tipo);
    this.orientacao.set('horizontal');
    this.celulaApontada.set(null);
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
      this.celulaApontada.set(null);
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
      this.celulaApontada.set(null);
      this.mensagemDeRecusa.set(null);
    }
  }

  protected iniciarBatalha(): void {
    this.jogo.iniciarBatalha();
  }
}
