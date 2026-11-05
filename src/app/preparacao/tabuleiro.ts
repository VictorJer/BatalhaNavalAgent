import { Component, input, output } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  COLUNAS_DO_TABULEIRO,
  Coordenada,
  LINHAS_DO_TABULEIRO,
  coordenada,
} from '../dominio/coordenada';
import { TipoEmbarcacao } from '../dominio/embarcacao';

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
    <div class="grid w-full grid-cols-10 gap-1" role="grid" [attr.aria-label]="rotulo()">
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
  readonly celulaClicada = output<Coordenada>();
  readonly celulaApontada = output<Coordenada>();
  protected readonly coordenadas = COORDENADAS;
  protected readonly apresentacaoDosResultados = APRESENTACAO_DOS_RESULTADOS;

  protected rotuloDaCelula(celula: Coordenada): string {
    const resultado = this.celulas()[celula]?.resultado;
    return resultado ? `${celula}, ${APRESENTACAO_DOS_RESULTADOS[resultado].texto}` : celula;
  }

  protected estaBloqueada(celula: Coordenada): boolean {
    return this.bloqueado() || this.celulas()[celula]?.bloqueada === true;
  }

  protected clicar(celula: Coordenada): void {
    if (!this.estaBloqueada(celula)) {
      this.celulaClicada.emit(celula);
    }
  }
}
