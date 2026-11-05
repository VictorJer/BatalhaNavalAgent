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
    expect(fixture.nativeElement.querySelectorAll('[role="gridcell"]')).toHaveLength(100);
    expect(fixture.nativeElement.textContent).toContain(
      'Selecione uma embarcação e depois uma célula do tabuleiro.',
    );
  });

  it('mostra nome, sigla, tamanho e segmentos proporcionais no painel', () => {
    const fixture = TestBed.createComponent(TelaDePreparacao);
    fixture.detectChanges();
    const esperado = [
      ['Porta-aviões', 'PA', 5],
      ['Encouraçado', 'EN', 4],
      ['Cruzador', 'CR', 3],
      ['Submarino', 'SU', 3],
      ['Destroyer', 'DE', 2],
    ] as const;

    for (const [nome, sigla, tamanho] of esperado) {
      const item = [...fixture.nativeElement.querySelectorAll('aside li button')].find((botao) =>
        botao.textContent?.includes(nome),
      ) as HTMLButtonElement;
      expect(item.textContent).toContain(sigla);
      expect(item.textContent).toContain(`${tamanho} posições`);
      expect(item.querySelectorAll('span.h-2')).toHaveLength(tamanho);
    }
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
    expect(fixture.nativeElement.textContent).toContain(
      'Cruzador, 3 posições, orientação horizontal.',
    );
    expect(fixture.nativeElement.textContent).toContain('Selecionada');
    botao(fixture, 'Alternar orientação').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.orientacao()).toBe('vertical');
    expect(fixture.nativeElement.textContent).toContain('orientação vertical');
    const celula = fixture.nativeElement.querySelector('[aria-label="B3"]') as HTMLButtonElement;
    celula.focus();
    celula.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Coordenada B3.');
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
    expect(fixture.componentInstance.celulaApontada()).toBeNull();
  });

  it('explica encaixes válidos e inválidos e recorta a prévia nas bordas', () => {
    const fixture = TestBed.createComponent(TelaDePreparacao);
    const store = TestBed.inject(JogoStore);
    fixture.detectChanges();
    const historicoAntes = store.historico();

    (
      fixture.nativeElement.querySelector('[aria-label="Cruzador, pendente"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    const c3 = fixture.nativeElement.querySelector('[aria-label="C3"]') as HTMLButtonElement;
    c3.focus();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Encaixe válido.');
    expect(
      ['C3', 'C4', 'C5'].every(
        (coordenada) =>
          fixture.nativeElement
            .querySelector(`[aria-label="${coordenada}"]`)
            ?.textContent?.trim() === '✓',
      ),
    ).toBe(true);
    expect(store.historico()).toBe(historicoAntes);
    botao(fixture, 'Alternar orientação').click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="B3"]') as HTMLButtonElement).focus();
    fixture.detectChanges();
    expect(
      ['B3', 'C3', 'D3'].every(
        (coordenada) =>
          fixture.nativeElement
            .querySelector(`[aria-label="${coordenada}"]`)
            ?.textContent?.trim() === '✓',
      ),
    ).toBe(true);

    (
      fixture.nativeElement.querySelector(
        '[aria-label="Porta-aviões, pendente"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="A8"]') as HTMLButtonElement).dispatchEvent(
      new MouseEvent('mouseenter'),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('A embarcação não cabe nessa posição.');
    for (const coordenada of ['A8', 'A9', 'A10']) {
      const celula = fixture.nativeElement.querySelector(`[aria-label="${coordenada}"]`)!;
      expect(celula.textContent?.trim()).toBe('×');
      expect(celula.getAttribute('aria-description')).toContain('não cabe');
    }
    expect(fixture.nativeElement.querySelectorAll('[role="gridcell"]')).toHaveLength(100);

    (
      fixture.nativeElement.querySelector('[aria-label="Cruzador, pendente"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    botao(fixture, 'Alternar orientação').click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="I3"]') as HTMLButtonElement).dispatchEvent(
      new MouseEvent('mouseenter'),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('A embarcação não cabe nessa posição.');
    for (const coordenada of ['I3', 'J3']) {
      expect(
        fixture.nativeElement.querySelector(`[aria-label="${coordenada}"]`)?.textContent?.trim(),
      ).toBe('×');
    }
    expect(fixture.nativeElement.querySelectorAll('[role="gridcell"]')).toHaveLength(100);
    expect(store.historico()).toBe(historicoAntes);
    expect(Object.keys(store.frotaDoJogador())).toHaveLength(0);
  });

  it('explica uma prévia sobreposta sem modificar a frota', () => {
    const fixture = TestBed.createComponent(TelaDePreparacao);
    const store = TestBed.inject(JogoStore);
    store.posicionar('cruzador', coordenada(1, 1)!, 'horizontal');
    fixture.detectChanges();
    const historicoAntes = store.historico();
    (
      fixture.nativeElement.querySelector('[aria-label="Destroyer, pendente"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="B2"]') as HTMLButtonElement).dispatchEvent(
      new MouseEvent('mouseenter'),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'A posição sobrepõe a embarcação Cruzador.',
    );
    expect(fixture.nativeElement.querySelector('[aria-label="B2"]')?.textContent?.trim()).toBe('×');
    expect(store.frotaDoJogador()['cruzador']?.posicoes).toEqual(['B2', 'B3', 'B4']);
    expect(store.historico()).toBe(historicoAntes);
  });

  it('limpa a coordenada apontada ao trocar seleção e gerar uma nova frota', () => {
    const fixture = TestBed.createComponent(TelaDePreparacao);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('[aria-label="Cruzador, pendente"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="B3"]') as HTMLButtonElement).dispatchEvent(
      new MouseEvent('mouseenter'),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.celulaApontada()).toBe('B3');

    (
      fixture.nativeElement.querySelector('[aria-label="Destroyer, pendente"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.celulaApontada()).toBeNull();

    (fixture.nativeElement.querySelector('[aria-label="B3"]') as HTMLButtonElement).dispatchEvent(
      new MouseEvent('mouseenter'),
    );
    fixture.detectChanges();
    botao(fixture, 'Gerar frota automaticamente').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.celulaApontada()).toBeNull();
    const b3 = fixture.nativeElement.querySelector('[aria-label="B3"]') as HTMLElement;
    expect(b3.classList.contains('border-acerto')).toBe(false);
    expect(b3.classList.contains('border-erro')).toBe(false);
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
    const siglas = [...fixture.nativeElement.querySelectorAll('[role="gridcell"]')]
      .map((celula) => celula.textContent?.trim())
      .filter(Boolean);
    expect(siglas).toHaveLength(17);
    expect(new Set(siglas)).toEqual(new Set(['PA', 'EN', 'CR', 'SU', 'DE']));
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
