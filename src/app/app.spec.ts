import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provedoresDaAplicacao } from './app.config';
import { coordenada } from './dominio/coordenada';
import { TIPOS_DAS_EMBARCACOES, tamanhoDe } from './dominio/embarcacao';
import { ALEATORIO } from './estado/aleatorio';
import { JogoStore } from './estado/jogo-store';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        ...provedoresDaAplicacao,
        {
          provide: ALEATORIO,
          useFactory: () => {
            const sorteios = [0, 0, 0, 0, 0.2, 0, 0, 0.4, 0, 0, 0.6, 0, 0, 0.8, 0];
            let indice = 0;
            return () => sorteios[indice++] ?? (indice * 0.6180339887498949) % 1;
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('deve renderizar o título do jogo', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.querySelector('h1')?.textContent).toContain('Batalha Naval');
  });

  it('exibe a tela de preparação na fase inicial', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.querySelector('app-tela-de-preparacao')).toBeTruthy();
    expect(compilado.querySelector('[aria-label="Tabuleiro do jogador"]')).toBeTruthy();
  });

  it('exibe a batalha e oculta a preparação fora da fase inicial', async () => {
    const store = TestBed.inject(JogoStore);
    store.posicionarFrotaAutomaticamente();
    store.iniciarBatalha();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.querySelector('app-tela-de-preparacao')).toBeNull();
    expect(compilado.querySelector('app-tela-de-batalha')).toBeTruthy();
    expect(compilado.querySelector('[aria-label="Tabuleiro do computador"]')).toBeTruthy();
    expect(compilado.querySelector('[role="status"]')?.textContent).toContain('Sua vez.');
  });

  it('percorre preparação, batalha, encerramento, reinício e nova batalha sem marcas antigas', async () => {
    const fixture = TestBed.createComponent(App);
    const jogo = TestBed.inject(JogoStore);
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;
    const botaoComTexto = (texto: string) =>
      [...compilado.querySelectorAll<HTMLButtonElement>('button')].find((botao) =>
        botao.textContent?.includes(texto),
      )!;

    TIPOS_DAS_EMBARCACOES.forEach((tipo, indice) => {
      expect(jogo.posicionar(tipo, coordenada(indice * 2, 0)!, 'horizontal').tipo).toBe('ok');
    });
    await fixture.whenStable();
    botaoComTexto('Iniciar batalha').click();
    await fixture.whenStable();
    expect(compilado.querySelector('app-tela-de-preparacao')).toBeNull();
    expect(compilado.querySelectorAll('[role="grid"]')).toHaveLength(2);

    for (const [indice, tipo] of TIPOS_DAS_EMBARCACOES.entries()) {
      for (let coluna = 0; coluna < tamanhoDe(tipo); coluna++) {
        const alvo = coordenada(indice * 2, coluna)!;
        compilado
          .querySelector<HTMLButtonElement>(
            `[aria-label="Tabuleiro do computador"] button[aria-label="${alvo}"]`,
          )!
          .click();
        await fixture.whenStable();
      }
    }
    expect(jogo.fase()).toBe('encerrada');
    expect(compilado.querySelector('[role="status"]')?.textContent).toContain('Você venceu!');
    expect(compilado.querySelector('app-tela-de-batalha')).toBeTruthy();
    expect(compilado.querySelector('app-tela-de-preparacao')).toBeNull();
    expect(compilado.querySelector('[aria-label="Controles da frota"]')).toBeNull();

    botaoComTexto('Nova partida').click();
    await fixture.whenStable();
    expect(jogo.fase()).toBe('preparacao');
    expect(compilado.querySelector('app-tela-de-batalha')).toBeNull();
    expect(compilado.querySelector('app-tela-de-preparacao')?.textContent).toContain(
      '0 de 5 embarcações posicionadas',
    );
    expect(jogo.historico()).toEqual([{ sequencia: 1, tipo: 'partida-iniciada' }]);

    botaoComTexto('Gerar frota automaticamente').click();
    await fixture.whenStable();
    botaoComTexto('Iniciar batalha').click();
    await fixture.whenStable();
    expect(jogo.fase()).toBe('batalha');
    expect(compilado.querySelectorAll('[role="grid"] svg')).toHaveLength(0);
    expect(
      compilado.querySelector('[aria-label="Último ataque do jogador"]')?.textContent,
    ).toContain('Ainda não atacou.');
    expect(
      compilado.querySelector('[aria-label="Último ataque do computador"]')?.textContent,
    ).toContain('Ainda não atacou.');
    expect(compilado.querySelector('h1')?.textContent).toContain('Batalha Naval');
  });
});
