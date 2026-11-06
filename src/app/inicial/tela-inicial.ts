import { Component, output } from '@angular/core';

@Component({
  selector: 'app-tela-inicial',
  template: `
    <section
      class="w-full max-w-prose space-y-6 rounded-lg border border-slate-700 bg-slate-900 p-6 text-center sm:p-8"
      aria-labelledby="titulo-inicial"
    >
      <h2 id="titulo-inicial" class="text-2xl font-bold text-white sm:text-3xl">
        Prepare-se para a batalha
      </h2>
      <p class="text-base leading-relaxed text-slate-300">
        Posicione sua frota e enfrente o computador. Afunde todas as embarcações inimigas antes que
        ele afunde as suas.
      </p>
      <button
        type="button"
        class="rounded bg-acerto px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        (click)="iniciar.emit()"
      >
        Começar a jogar
      </button>
    </section>
  `,
})
export class TelaInicial {
  protected readonly iniciar = output<void>();
}
