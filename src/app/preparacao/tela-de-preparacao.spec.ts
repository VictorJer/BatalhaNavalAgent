import { TestBed } from '@angular/core/testing';
import { coordenada } from '../dominio/coordenada';
import { JogoStore } from '../estado/jogo-store';
import { provedoresDaAplicacao } from '../app.config';
import { TelaDePreparacao } from './tela-de-preparacao';

describe('TelaDePreparacao', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelaDePreparacao],
      providers: provedoresDaAplicacao,
    }).compileComponents();
  });

  function botao(
    fixture: ReturnType<typeof TestBed.createComponent<TelaDePreparacao>>,
    texto: string,
  ): HTMLButtonElement {
    return [...fixture.nativeElement.querySelectorAll('button')].find((item) =>
      item.textContent?.includes(texto),
    ) as HTMLButtonElement;
  }

  it('exibe as cinco embarcações pendentes e inicia com orientação horizontal', () => {
    const fixture = TestBed.createComponent(TelaDePreparacao);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('aside li')).toHaveLength(5);
    expect(fixture.nativeElement.textContent).toContain('0 de 5 embarcações posicionadas');
    expect(fixture.componentInstance.orientacao()).toBe('horizontal');
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Porta-aviões, pendente"]'),
    ).toBeTruthy();
  });

  it('seleciona uma pendente e alterna a orientação para vertical', () => {
    const fixture = TestBed.createComponent(TelaDePreparacao);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        'button[aria-label="Cruzador, pendente"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selecionada()).toBe('cruzador');
    expect(fixture.componentInstance.orientacao()).toBe('horizontal');
    botao(fixture, 'Alternar orientação').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.orientacao()).toBe('vertical');
  });

  it('mostra preview, aceita posicionamento e limpa seleção', () => {
    const fixture = TestBed.createComponent(TelaDePreparacao);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        'button[aria-label="Cruzador, pendente"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    const celula = fixture.nativeElement.querySelector('[aria-label="C3"]') as HTMLButtonElement;
    celula.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(celula.classList.contains('bg-agua')).toBe(true);

    celula.click();
    fixture.detectChanges();

    expect(TestBed.inject(JogoStore).frotaDoJogador()['cruzador']?.posicoes).toEqual([
      'C3',
      'C4',
      'C5',
    ]);
    expect(fixture.componentInstance.selecionada()).toBeNull();
  });

  it('recusa posição fora do tabuleiro e sobreposição sem alterar a frota', () => {
    const fixture = TestBed.createComponent(TelaDePreparacao);
    const store = TestBed.inject(JogoStore);
    store.posicionar('cruzador', coordenada(1, 1)!, 'horizontal');
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector(
        'button[aria-label="Porta-aviões, pendente"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="J8"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.mensagemDeRecusa()).toContain('não cabe');
    expect(store.frotaDoJogador()['porta-avioes']).toBeUndefined();

    (
      fixture.nativeElement.querySelector(
        'button[aria-label="Destroyer, pendente"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="B2"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.mensagemDeRecusa()).toContain('sobrepõe');
    expect(store.frotaDoJogador()['cruzador']?.posicoes).toEqual(['B2', 'B3', 'B4']);
  });

  it('reposiciona uma embarcação posicionada e limpa a mensagem após sucesso', () => {
    const fixture = TestBed.createComponent(TelaDePreparacao);
    const store = TestBed.inject(JogoStore);
    store.posicionar('cruzador', coordenada(1, 1)!, 'horizontal');
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        'button[aria-label="Cruzador, posicionada"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(store.frotaDoJogador()['cruzador']).toBeUndefined();
    (fixture.nativeElement.querySelector('[aria-label="C3"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(store.frotaDoJogador()['cruzador']?.posicoes).toEqual(['C3', 'C4', 'C5']);
    expect(fixture.componentInstance.mensagemDeRecusa()).toBeNull();
  });

  it('remove embarcação pelo painel e substitui frota automaticamente', () => {
    const fixture = TestBed.createComponent(TelaDePreparacao);
    const store = TestBed.inject(JogoStore);
    store.posicionar('cruzador', coordenada(1, 1)!, 'horizontal');
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        'button[aria-label="Cruzador, posicionada"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(store.frotaDoJogador()['cruzador']).toBeUndefined();
    expect(fixture.nativeElement.textContent).toContain('0 de 5 embarcações posicionadas');

    botao(fixture, 'Gerar frota automaticamente').click();
    fixture.detectChanges();

    expect(Object.keys(store.frotaDoJogador())).toHaveLength(5);
    expect(fixture.nativeElement.textContent).toContain('5 de 5 embarcações posicionadas');
  });

  it('habilita iniciar apenas com frota completa e inicia a batalha', () => {
    const fixture = TestBed.createComponent(TelaDePreparacao);
    const store = TestBed.inject(JogoStore);
    fixture.detectChanges();
    const iniciar = botao(fixture, 'Iniciar batalha');
    expect(iniciar.disabled).toBe(true);

    store.posicionarFrotaAutomaticamente();
    fixture.detectChanges();
    expect(iniciar.disabled).toBe(false);
    iniciar.click();
    fixture.detectChanges();
    expect(store.fase()).toBe('batalha');
  });
});
