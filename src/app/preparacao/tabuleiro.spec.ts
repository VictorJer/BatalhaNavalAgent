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
    (celulaClicada)="clique = $event"
  />`,
})
class HospedeiroDoTabuleiro {
  celulas: Readonly<Record<string, EstadoDaCelula>> = {};
  rotulo = 'Tabuleiro do jogador';
  bloqueado = false;
  clique = '';
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
