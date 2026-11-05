import { Component, input, output } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  COLUNAS_DO_TABULEIRO,
  Coordenada,
  LINHAS_DO_TABULEIRO,
  coordenada,
} from '../dominio/coordenada';
import { TipoEmbarcacao } from '../dominio/embarcacao';
import { descricaoDaEmbarcacao, siglaDaEmbarcacao } from './apresentacao-das-embarcacoes';

export type ResultadoDaCelula = 'agua' | 'acerto' | 'destruida';

export const APRESENTACAO_DOS_RESULTADOS: Readonly<
  Record<ResultadoDaCelula, { texto: string; icone: string }>
> = {
  agua: { texto: 'Água', icone: 'waves' },
  acerto: { texto: 'Acerto', icone: 'x' },
  destruida: { texto: 'Embarcação destruída', icone: 'anchor' },
};

export interface EstadoDaCelula {
  readonly embarcacao?: TipoEmbarcacao;
  readonly preview?: 'valido' | 'invalido';
  readonly descricaoPreview?: string;
  readonly resultado?: ResultadoDaCelula;
  readonly bloqueada?: boolean;
}

const COORDENADAS: readonly Coordenada[] = Array.from(
  { length: LINHAS_DO_TABULEIRO * COLUNAS_DO_TABULEIRO },
  (_, indice) =>
    coordenada(Math.floor(indice / COLUNAS_DO_TABULEIRO), indice % COLUNAS_DO_TABULEIRO)!,
);

@Component({
  selector: 'app-tabuleiro',
  imports: [LucideDynamicIcon],
  template: `
    <div
      class="grid w-full gap-1"
      [style.grid-template-columns]="
        mostrarCoordenadas() ? '1.25rem repeat(10, minmax(0, 1fr))' : 'repeat(10, minmax(0, 1fr))'
      "
      role="grid"
      [attr.aria-label]="rotulo()"
      (mouseleave)="apontamentoEncerrado.emit()"
      (focusout)="aoSairDoFoco($event)"
    >
      @if (mostrarCoordenadas()) {
        <span class="col-start-1 row-start-1" aria-hidden="true"></span>
        @for (coluna of colunas; track coluna; let indice = $index) {
          <span
            class="flex items-center justify-center text-xs text-slate-300"
            [style.grid-column]="indice + 2"
            [style.grid-row]="1"
            aria-hidden="true"
          >
            {{ coluna }}
          </span>
        }
        @for (linha of linhas; track linha; let indice = $index) {
          <span
            class="flex items-center justify-center text-xs text-slate-300"
            [style.grid-column]="1"
            [style.grid-row]="indice + 2"
            aria-hidden="true"
          >
            {{ linha }}
          </span>
        }
      }
      @for (celula of coordenadas; track celula) {
        <button
          type="button"
          role="gridcell"
          class="flex aspect-square min-w-0 items-center justify-center rounded border border-slate-600 text-white transition-colors enabled:hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acerto"
          [class.bg-slate-800]="
            !celulas()[celula]?.embarcacao &&
            !celulas()[celula]?.preview &&
            !celulas()[celula]?.resultado
          "
          [class.bg-navio]="celulas()[celula]?.embarcacao && !celulas()[celula]?.resultado"
          [class.border-acerto]="celulas()[celula]?.preview === 'valido'"
          [class.bg-agua]="
            celulas()[celula]?.preview === 'valido' || celulas()[celula]?.resultado === 'agua'
          "
          [class.border-erro]="celulas()[celula]?.preview === 'invalido'"
          [class.bg-erro]="celulas()[celula]?.preview === 'invalido'"
          [class.bg-acerto]="celulas()[celula]?.resultado === 'acerto'"
          [class.bg-destruida]="celulas()[celula]?.resultado === 'destruida'"
          [attr.aria-label]="rotuloDaCelula(celula)"
          [attr.aria-description]="descricaoAdicional(celula)"
          [style.grid-column]="mostrarCoordenadas() ? colunaDaCelula(celula) + 1 : null"
          [style.grid-row]="mostrarCoordenadas() ? linhaDaCelula(celula) + 1 : null"
          [attr.aria-pressed]="!!celulas()[celula]?.embarcacao"
          [disabled]="estaBloqueada(celula)"
          (click)="clicar(celula)"
          (mouseenter)="celulaApontada.emit(celula)"
          (focus)="celulaApontada.emit(celula)"
        >
          @if (celulas()[celula]?.resultado; as resultado) {
            <svg
              [lucideIcon]="apresentacaoDosResultados[resultado].icone"
              class="size-4 sm:size-5"
              aria-hidden="true"
            ></svg>
          } @else if (celulas()[celula]?.preview; as preview) {
            <span aria-hidden="true" class="text-xs font-bold sm:text-sm">
              {{ preview === 'valido' ? '✓' : '×' }}
            </span>
          } @else if (mostrarEmbarcacoes() && celulas()[celula]?.embarcacao; as embarcacao) {
            <span aria-hidden="true" class="text-[0.6rem] font-bold leading-none sm:text-xs">
              {{ siglaDaEmbarcacao(embarcacao) }}
            </span>
          }
        </button>
      }
    </div>
  `,
})
export class Tabuleiro {
  readonly celulas = input<Readonly<Record<string, EstadoDaCelula>>>({});
  readonly rotulo = input('Tabuleiro do jogador');
  readonly bloqueado = input(false);
  readonly mostrarCoordenadas = input(false);
  readonly mostrarEmbarcacoes = input(false);
  readonly celulaClicada = output<Coordenada>();
  readonly celulaApontada = output<Coordenada>();
  readonly apontamentoEncerrado = output<void>();
  protected readonly coordenadas = COORDENADAS;
  protected readonly colunas = Array.from({ length: COLUNAS_DO_TABULEIRO }, (_, indice) =>
    String(indice + 1),
  );
  protected readonly linhas = [...'ABCDEFGHIJ'];
  protected readonly apresentacaoDosResultados = APRESENTACAO_DOS_RESULTADOS;
  protected readonly siglaDaEmbarcacao = siglaDaEmbarcacao;

  protected colunaDaCelula(celula: Coordenada): number {
    return Number(celula.slice(1));
  }

  protected linhaDaCelula(celula: Coordenada): number {
    return celula.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
  }

  protected rotuloDaCelula(celula: Coordenada): string {
    const resultado = this.celulas()[celula]?.resultado;
    return resultado ? `${celula}, ${APRESENTACAO_DOS_RESULTADOS[resultado].texto}` : celula;
  }

  protected descricaoAdicional(celula: Coordenada): string | null {
    const estado = this.celulas()[celula];
    const partes: string[] = [];
    if (estado?.resultado) partes.push(APRESENTACAO_DOS_RESULTADOS[estado.resultado].texto);
    else if (estado?.preview) partes.push(estado.descricaoPreview ?? `Encaixe ${estado.preview}`);
    else if (this.mostrarEmbarcacoes() && estado?.embarcacao) {
      partes.push(descricaoDaEmbarcacao(estado.embarcacao));
    }
    return partes.length ? partes.join('. ') : null;
  }

  protected estaBloqueada(celula: Coordenada): boolean {
    return this.bloqueado() || this.celulas()[celula]?.bloqueada === true;
  }

  protected aoSairDoFoco(evento: FocusEvent): void {
    const proximoAlvo = evento.relatedTarget;
    if (
      proximoAlvo instanceof Element &&
      evento.currentTarget instanceof Element &&
      evento.currentTarget.contains(proximoAlvo) &&
      proximoAlvo.closest('[role="gridcell"]')
    ) {
      return;
    }
    this.apontamentoEncerrado.emit();
  }

  protected clicar(celula: Coordenada): void {
    if (!this.estaBloqueada(celula)) {
      this.celulaClicada.emit(celula);
    }
  }
}
