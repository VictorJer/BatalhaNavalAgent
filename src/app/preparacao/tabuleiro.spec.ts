import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provedoresDaAplicacao } from '../app.config';
import { coordenada } from '../dominio/coordenada';
import { EstadoDaCelula, Tabuleiro } from './tabuleiro';

@Component({
  imports: [Tabuleiro],
  template: `<app-tabuleiro
    [celulas]="celulas"
    [rotulo]="rotulo"
    [bloqueado]="bloqueado"
    [mostrarCoordenadas]="mostrarCoordenadas"
    [mostrarEmbarcacoes]="mostrarEmbarcacoes"
    (celulaClicada)="clique = $event"
    (apontamentoEncerrado)="encerrarApontamento()"
  />`,
})
class HospedeiroDoTabuleiro {
  celulas: Readonly<Record<string, EstadoDaCelula>> = {};
  rotulo = 'Tabuleiro do jogador';
  bloqueado = false;
  mostrarCoordenadas = false;
  mostrarEmbarcacoes = false;
  clique = '';
  apontamentosEncerrados = 0;

  encerrarApontamento(): void {
    this.apontamentosEncerrados += 1;
  }
}

describe('Tabuleiro', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HospedeiroDoTabuleiro],
      providers: provedoresDaAplicacao,
    }).compileComponents();
  });

  it('renderiza 100 células com coordenadas acessíveis', async () => {
    const fixture = TestBed.createComponent(HospedeiroDoTabuleiro);
    await fixture.whenStable();
    const celulas = fixture.nativeElement.querySelectorAll('[role="gridcell"]');

    expect(celulas).toHaveLength(100);
    expect(celulas[11].getAttribute('aria-label')).toBe('B2');
  });

  it('mostra cabeçalhos informativos sem adicionar alvos ou deslocar coordenadas', async () => {
    const fixture = TestBed.createComponent(HospedeiroDoTabuleiro);
    fixture.componentInstance.mostrarCoordenadas = true;
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;
    const rotulos = [...compilado.querySelectorAll('[aria-hidden="true"]')].map((el) =>
      el.textContent?.trim(),
    );
    const celulas = compilado.querySelectorAll<HTMLButtonElement>('[role="gridcell"]');

    expect(celulas).toHaveLength(100);
    expect(rotulos.filter((rotulo) => /^[A-J]$/.test(rotulo ?? ''))).toEqual([...'ABCDEFGHIJ']);
    expect(rotulos.filter((rotulo) => /^(10|[1-9])$/.test(rotulo ?? ''))).toEqual(
      Array.from({ length: 10 }, (_, indice) => String(indice + 1)),
    );
    expect(compilado.querySelector('[aria-label="A1"]')).toBe(celulas[0]);
    expect(compilado.querySelector('[aria-label="B3"]')).toBe(celulas[12]);
    expect(compilado.querySelector('[aria-label="J10"]')).toBe(celulas[99]);
    expect(compilado.querySelectorAll('span[tabindex]')).toHaveLength(0);
  });

  it('não mostra cabeçalhos por padrão', async () => {
    const fixture = TestBed.createComponent(HospedeiroDoTabuleiro);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
    expect(fixture.nativeElement.querySelectorAll('[role="gridcell"]')).toHaveLength(100);
  });

  it('identifica barcos por sigla e descrição sem alterar coordenadas nem alvos', async () => {
    const fixture = TestBed.createComponent(HospedeiroDoTabuleiro);
    fixture.componentInstance.mostrarEmbarcacoes = true;
    fixture.componentInstance.celulas = {
      A1: { embarcacao: 'porta-avioes' },
      A2: { embarcacao: 'encouracado' },
      A3: { embarcacao: 'cruzador' },
      A4: { embarcacao: 'submarino' },
      A5: { embarcacao: 'destroyer' },
      A6: { resultado: 'acerto', embarcacao: 'destroyer' },
    };
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;
    const esperados = [
      ['A1', 'PA', 'Porta-aviões, 5 posições'],
      ['A2', 'EN', 'Encouraçado, 4 posições'],
      ['A3', 'CR', 'Cruzador, 3 posições'],
      ['A4', 'SU', 'Submarino, 3 posições'],
      ['A5', 'DE', 'Destroyer, 2 posições'],
    ];

    for (const [coordenada, sigla, descricao] of esperados) {
      const celula = compilado.querySelector<HTMLButtonElement>(`[aria-label="${coordenada}"]`)!;
      expect(celula.textContent?.trim()).toBe(sigla);
      expect(celula.getAttribute('aria-description')).toBe(descricao);
    }
    expect(compilado.querySelectorAll('[role="gridcell"]')).toHaveLength(100);
    expect(compilado.querySelector('[aria-label="A6, Acerto"]')?.textContent?.trim()).toBe('');
    expect(compilado.querySelector('[aria-label="A7"]')?.hasAttribute('aria-description')).toBe(
      false,
    );
  });

  it('não mostra siglas quando a identificação está desativada', async () => {
    const fixture = TestBed.createComponent(HospedeiroDoTabuleiro);
    fixture.componentInstance.celulas = { A1: { embarcacao: 'porta-avioes' } };
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[aria-label="A1"]')?.textContent?.trim()).toBe('');
    expect(
      fixture.nativeElement.querySelector('[aria-label="A1"]')?.hasAttribute('aria-description'),
    ).toBe(false);
  });

  it('encerra apontamento ao sair do ponteiro ou do foco, mas não entre células', async () => {
    const fixture = TestBed.createComponent(HospedeiroDoTabuleiro);
    await fixture.whenStable();
    const grade = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
    const primeira = fixture.nativeElement.querySelector('[aria-label="A1"]') as HTMLButtonElement;
    const segunda = fixture.nativeElement.querySelector('[aria-label="A2"]') as HTMLButtonElement;
    const externa = document.createElement('button');

    segunda.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: primeira }));
    expect(fixture.componentInstance.apontamentosEncerrados).toBe(0);
    segunda.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: externa }));
    expect(fixture.componentInstance.apontamentosEncerrados).toBe(1);
    grade.dispatchEvent(new MouseEvent('mouseleave'));
    expect(fixture.componentInstance.apontamentosEncerrados).toBe(2);
  });

  it('emite o clique e apresenta o estado de preview da coordenada', async () => {
    const fixture = TestBed.createComponent(HospedeiroDoTabuleiro);
    const coordenadaAlvo = coordenada(2, 2)!;
    fixture.componentInstance.celulas = { [coordenadaAlvo]: { preview: 'invalido' } };
    fixture.detectChanges();
    const celula = fixture.nativeElement.querySelector('[aria-label="C3"]') as HTMLButtonElement;

    celula.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.clique).toBe(coordenadaAlvo);
    expect(celula.classList.contains('bg-erro')).toBe(true);
  });

  it('identifica o tabuleiro e bloqueia todas as células sem emitir clique', async () => {
    const fixture = TestBed.createComponent(HospedeiroDoTabuleiro);
    fixture.componentInstance.rotulo = 'Tabuleiro do computador';
    fixture.componentInstance.bloqueado = true;
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;
    const celulas = [...compilado.querySelectorAll<HTMLButtonElement>('button')];

    expect(compilado.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe(
      'Tabuleiro do computador',
    );
    expect(celulas.every((celula) => celula.disabled)).toBe(true);
    celulas[0]!.click();
    celulas[0]!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.componentInstance.clique).toBe('');
  });

  it('bloqueia somente a célula indicada e preserva as demais disponíveis', async () => {
    const fixture = TestBed.createComponent(HospedeiroDoTabuleiro);
    fixture.componentInstance.celulas = { A1: { bloqueada: true }, A2: { preview: 'valido' } };
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;
    const bloqueada = compilado.querySelector<HTMLButtonElement>('[aria-label="A1"]')!;
    const disponivel = compilado.querySelector<HTMLButtonElement>('[aria-label="A2"]')!;

    expect(bloqueada.disabled).toBe(true);
    expect(disponivel.disabled).toBe(false);
    expect(disponivel.classList.contains('bg-agua')).toBe(true);
    bloqueada.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.componentInstance.clique).toBe('');
    disponivel.click();
    expect(fixture.componentInstance.clique).toBe('A2');
  });

  it('distingue os três resultados por símbolo e descrição e prioriza a marca de ataque', async () => {
    const fixture = TestBed.createComponent(HospedeiroDoTabuleiro);
    fixture.componentInstance.celulas = {
      A1: { resultado: 'agua' },
      A2: { resultado: 'acerto', embarcacao: 'destroyer' },
      A3: { resultado: 'destruida', embarcacao: 'destroyer' },
    };
    fixture.componentInstance.mostrarEmbarcacoes = true;
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;
    const agua = compilado.querySelector('[aria-label="A1, Água"]')!;
    const acerto = compilado.querySelector('[aria-label="A2, Acerto"]')!;
    const destruida = compilado.querySelector('[aria-label="A3, Embarcação destruída"]')!;
    const simbolos = [agua, acerto, destruida].map(
      (celula) => celula.querySelector('svg')?.innerHTML,
    );

    expect(simbolos.every(Boolean)).toBe(true);
    expect(new Set(simbolos).size).toBe(3);
    expect(agua.classList.contains('bg-agua')).toBe(true);
    expect(acerto.classList.contains('bg-acerto')).toBe(true);
    expect(destruida.classList.contains('bg-destruida')).toBe(true);
    expect(acerto.classList.contains('bg-navio')).toBe(false);
    expect(destruida.classList.contains('bg-navio')).toBe(false);
    const intocada = compilado.querySelector('[aria-label="A4"]')!;
    expect(intocada.querySelector('svg')).toBeNull();
    expect(intocada.getAttribute('aria-pressed')).toBe('false');
    expect(intocada.classList.contains('bg-navio')).toBe(false);
  });
});
