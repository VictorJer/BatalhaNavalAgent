import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { provedoresDaAplicacao } from '../app.config';
import { Coordenada, coordenada } from '../dominio/coordenada';
import { TIPOS_DAS_EMBARCACOES, tamanhoDe } from '../dominio/embarcacao';
import { ALEATORIO, Aleatorio } from '../estado/aleatorio';
import { JogoStore, ResultadoAcao } from '../estado/jogo-store';
import { Tabuleiro } from '../preparacao/tabuleiro';
import { TelaDeBatalha } from './tela-de-batalha';

/** As primeiras quinze chamadas posicionam o computador em A, C, E, G e I. */
function aleatorioControlado(resposta = 0.9999999): Aleatorio {
  const sorteios = [0, 0, 0, 0, 0.2, 0, 0, 0.4, 0, 0, 0.6, 0, 0, 0.8, 0];
  let indice = 0;
  return () => {
    const atual = indice++;
    if (atual < sorteios.length) return sorteios[atual]!;
    if (atual < sorteios.length + 18) return resposta;
    // Sorteios variados permitem gerar novas frotas após o encerramento.
    return (atual * 0.6180339887498949) % 1;
  };
}

function prepararJogador(jogo: JogoStore): void {
  TIPOS_DAS_EMBARCACOES.forEach((tipo, indice) => {
    expect(jogo.posicionar(tipo, coordenada(indice * 2, 0)!, 'horizontal').tipo).toBe('ok');
  });
}

describe('TelaDeBatalha', () => {
  let jogo: JogoStore;

  beforeEach(async () => {
    await configurarBatalha();
  });

  async function configurarBatalha(resposta = 0.9999999, empacotada = false): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TelaDeBatalha],
      providers: [
        ...provedoresDaAplicacao,
        { provide: ALEATORIO, useFactory: () => aleatorioControlado(resposta) },
      ],
    }).compileComponents();
    jogo = TestBed.inject(JogoStore);
    if (empacotada) {
      const bases = [
        [0, 0],
        [0, 5],
        [1, 0],
        [1, 3],
        [1, 6],
      ];
      TIPOS_DAS_EMBARCACOES.forEach((tipo, indice) => {
        const [linha, coluna] = bases[indice]!;
        expect(jogo.posicionar(tipo, coordenada(linha!, coluna!)!, 'horizontal').tipo).toBe('ok');
      });
    } else {
      prepararJogador(jogo);
    }
    expect(jogo.iniciarBatalha().tipo).toBe('ok');
  }

  function tabuleiro(
    fixture: ComponentFixture<TelaDeBatalha>,
    lado: 'jogador' | 'computador',
  ): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      `[aria-label="Tabuleiro do ${lado}"]`,
    )!;
  }

  function celula(
    fixture: ComponentFixture<TelaDeBatalha>,
    lado: 'jogador' | 'computador',
    posicao: string,
  ): HTMLButtonElement {
    return tabuleiro(fixture, lado).querySelector(
      `button[aria-label="${posicao}"], button[aria-label^="${posicao},"]`,
    )!;
  }

  function emitirAlvo(fixture: ComponentFixture<TelaDeBatalha>, alvo: Coordenada): void {
    const tabuleiroAdversario = fixture.debugElement.queryAll(By.directive(Tabuleiro))[1]!
      .componentInstance as Tabuleiro;
    tabuleiroAdversario.celulaClicada.emit(alvo);
  }

  it('exibe duas grades, mostra somente a frota própria e bloqueia o tabuleiro próprio', async () => {
    const fixture = TestBed.createComponent(TelaDeBatalha);
    await fixture.whenStable();

    expect(tabuleiro(fixture, 'jogador').querySelectorAll('button')).toHaveLength(100);
    expect(tabuleiro(fixture, 'computador').querySelectorAll('button')).toHaveLength(100);
    expect(tabuleiro(fixture, 'jogador').querySelectorAll('.bg-navio')).toHaveLength(17);
    expect(tabuleiro(fixture, 'computador').querySelector('.bg-navio')).toBeNull();
    expect(tabuleiro(fixture, 'computador').querySelector('svg')).toBeNull();
    const adversarias = [
      ...tabuleiro(fixture, 'computador').querySelectorAll<HTMLButtonElement>('button'),
    ];
    expect(
      adversarias.every((alvo) => !alvo.disabled && alvo.getAttribute('aria-pressed') === 'false'),
    ).toBe(true);
    expect(
      adversarias.every((alvo) => /^[A-J](?:10|[1-9])$/.test(alvo.getAttribute('aria-label')!)),
    ).toBe(true);
    expect(adversarias.every((alvo) => !alvo.textContent?.trim())).toBe(true);

    const antes = jogo.historico();
    celula(fixture, 'jogador', 'A1').click();
    celula(fixture, 'jogador', 'A1').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(celula(fixture, 'jogador', 'A1').disabled).toBe(true);
    expect(jogo.historico()).toBe(antes);
  });

  it('projeta as marcas públicas sem revelar células adversárias intactas', async () => {
    jogo.atacar(coordenada(0, 0)!);
    jogo.jogarTurnoDoComputador();
    const fixture = TestBed.createComponent(TelaDeBatalha);
    await fixture.whenStable();

    expect(celula(fixture, 'computador', 'A1').getAttribute('aria-label')).toBe('A1, Acerto');
    expect(celula(fixture, 'computador', 'A1').disabled).toBe(true);
    expect(celula(fixture, 'jogador', 'J10').getAttribute('aria-label')).toBe('J10, Água');
    expect(celula(fixture, 'computador', 'A2').getAttribute('aria-label')).toBe('A2');
    expect(celula(fixture, 'computador', 'A2').classList.contains('bg-navio')).toBe(false);
    expect(celula(fixture, 'computador', 'A2').querySelector('svg')).toBeNull();
    expect(jogo.marcasNoTabuleiroDoComputador().get(coordenada(0, 0)!)).toBe('acerto');
  });

  it('indica o turno inicial e a ausência de ataques, com legenda textual e status acessível', async () => {
    const fixture = TestBed.createComponent(TelaDeBatalha);
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.querySelector('[role="status"]')?.textContent).toContain('Sua vez.');
    expect(
      compilado.querySelector('[aria-label="Último ataque do jogador"]')?.textContent,
    ).toContain('Ainda não atacou.');
    expect(
      compilado.querySelector('[aria-label="Último ataque do computador"]')?.textContent,
    ).toContain('Ainda não atacou.');
    const legenda = compilado.querySelector('[aria-label="Legenda dos ataques"]')!;
    expect(legenda.textContent).toContain('Água');
    expect(legenda.textContent).toContain('Acerto');
    expect(legenda.textContent).toContain('Embarcação destruída');
    expect(legenda.textContent).toContain('tiro final');
  });

  it('reconstrói os dois resumos do histórico ao recriar a tela', async () => {
    const fixture = TestBed.createComponent(TelaDeBatalha);
    await fixture.whenStable();
    jogo.atacar(coordenada(0, 0)!);
    jogo.jogarTurnoDoComputador();
    await fixture.whenStable();
    const status = (fixture.nativeElement as HTMLElement).querySelector(
      '[role="status"]',
    )!.textContent;

    expect(status).toContain('A1: Acerto.');
    expect(status).toContain('J10: Água.');
    fixture.destroy();
    const recriada = TestBed.createComponent(TelaDeBatalha);
    await recriada.whenStable();
    expect(
      (recriada.nativeElement as HTMLElement).querySelector('[role="status"]')!.textContent,
    ).toBe(status);
  });

  it('identifica o turno do computador e bloqueia o adversário nesse estado', async () => {
    jogo.atacar(coordenada(0, 0)!);
    const fixture = TestBed.createComponent(TelaDeBatalha);
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent,
    ).toContain('Vez do computador.');
    expect(
      [...tabuleiro(fixture, 'computador').querySelectorAll<HTMLButtonElement>('button')].every(
        (alvo) => alvo.disabled,
      ),
    ).toBe(true);
    expect(jogo.ataquesNoJogador().size).toBe(0);
  });

  it.each([
    { alvo: 'J1', resultado: 'agua', texto: 'Água' },
    { alvo: 'A1', resultado: 'acerto', texto: 'Acerto' },
    { alvo: 'A5', resultado: 'destruida', texto: 'Embarcação destruída' },
  ])(
    'executa uma rodada imediata após $resultado e mantém os dois resultados',
    async ({ alvo, resultado, texto }) => {
      if (resultado === 'destruida') {
        for (let coluna = 0; coluna < 4; coluna++) {
          jogo.atacar(coordenada(0, coluna)!);
          jogo.jogarTurnoDoComputador();
        }
      }
      const fixture = TestBed.createComponent(TelaDeBatalha);
      await fixture.whenStable();
      const quantidadeAnterior = jogo.historico().length;

      celula(fixture, 'computador', alvo).click();

      // A resposta já deve estar registrada antes de aguardar qualquer renderização.
      const novos = jogo.historico().slice(quantidadeAnterior);
      expect(novos).toHaveLength(2);
      expect(novos[0]).toMatchObject({
        tipo: 'ataque',
        autor: 'jogador',
        coordenada: alvo,
        resultado,
      });
      expect(novos[1]).toMatchObject({ tipo: 'ataque', autor: 'computador', resultado: 'agua' });
      expect(jogo.turno()).toBe('jogador');
      await fixture.whenStable();

      expect(celula(fixture, 'computador', alvo).getAttribute('aria-label')).toBe(
        `${alvo}, ${texto}`,
      );
      expect(celula(fixture, 'computador', alvo).disabled).toBe(true);
      const resposta = novos[1]!;
      if (resposta.tipo !== 'ataque') throw new Error('Esperado contra-ataque.');
      expect(celula(fixture, 'jogador', resposta.coordenada).getAttribute('aria-label')).toContain(
        'Água',
      );
      const compilado = fixture.nativeElement as HTMLElement;
      expect(
        compilado.querySelector('[aria-label="Último ataque do jogador"]')?.textContent,
      ).toContain(`${alvo}: ${texto}.`);
      expect(
        compilado.querySelector('[aria-label="Último ataque do computador"]')?.textContent,
      ).toContain(`${resposta.coordenada}: Água.`);
    },
  );

  it('impede repetição inclusive por output direto e mantém marcas de rodadas anteriores', async () => {
    const fixture = TestBed.createComponent(TelaDeBatalha);
    await fixture.whenStable();
    celula(fixture, 'computador', 'A1').click();
    await fixture.whenStable();
    const antes = jogo.historico();
    const resposta = vi.spyOn(jogo, 'jogarTurnoDoComputador');

    celula(fixture, 'computador', 'A1').click();
    celula(fixture, 'computador', 'A1').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    emitirAlvo(fixture, coordenada(0, 0)!);

    expect(jogo.historico()).toBe(antes);
    expect(jogo.turno()).toBe('jogador');
    expect(resposta).not.toHaveBeenCalled();
    celula(fixture, 'computador', 'J1').click();
    await fixture.whenStable();
    expect(celula(fixture, 'computador', 'A1').getAttribute('aria-label')).toBe('A1, Acerto');
    expect(celula(fixture, 'jogador', 'J10').getAttribute('aria-label')).toBe('J10, Água');
    expect(celula(fixture, 'computador', 'J1').getAttribute('aria-label')).toBe('J1, Água');
    const vizinha = celula(fixture, 'computador', 'A2');
    expect(vizinha.getAttribute('aria-label')).toBe('A2');
    expect(vizinha.getAttribute('aria-pressed')).toBe('false');
    expect(vizinha.querySelector('svg')).toBeNull();
    expect(vizinha.classList.contains('bg-navio')).toBe(false);
    expect(tabuleiro(fixture, 'computador').outerHTML).not.toMatch(
      /porta-avioes|encouracado|cruzador|submarino|destroyer/,
    );
  });

  it('ignora alvos inexistentes, fora do turno e fora da batalha mesmo via output', async () => {
    const fixture = TestBed.createComponent(TelaDeBatalha);
    await fixture.whenStable();
    const atacar = vi.spyOn(jogo, 'atacar');
    const responder = vi.spyOn(jogo, 'jogarTurnoDoComputador');
    const antes = jogo.historico();

    emitirAlvo(fixture, 'K1' as Coordenada);
    expect(jogo.historico()).toBe(antes);
    expect(atacar).not.toHaveBeenCalled();
    jogo.atacar(coordenada(0, 0)!);
    atacar.mockClear();
    const aposAtaque = jogo.historico();
    emitirAlvo(fixture, coordenada(0, 1)!);
    expect(jogo.historico()).toBe(aposAtaque);
    expect(atacar).not.toHaveBeenCalled();
    expect(jogo.turno()).toBe('computador');

    jogo.novaPartida();
    const reiniciado = jogo.historico();
    emitirAlvo(fixture, coordenada(0, 1)!);
    expect(jogo.historico()).toBe(reiniciado);
    expect(atacar).not.toHaveBeenCalled();
    expect(responder).not.toHaveBeenCalled();
  });

  const recusas: ResultadoAcao[] = [
    { tipo: 'ok', ataque: { tipo: 'repetido' } },
    { tipo: 'ok', ataque: { tipo: 'fora-do-tabuleiro' } },
    { tipo: 'fase-invalida', fase: 'preparacao' },
    { tipo: 'turno-invalido' },
  ];

  it.each(recusas)('não provoca resposta ao receber recusa $tipo do store', async (recusa) => {
    const fixture = TestBed.createComponent(TelaDeBatalha);
    await fixture.whenStable();
    const antes = jogo.historico();
    vi.spyOn(jogo, 'atacar').mockReturnValue(recusa);
    const responder = vi.spyOn(jogo, 'jogarTurnoDoComputador');

    celula(fixture, 'computador', 'A1').click();

    expect(responder).not.toHaveBeenCalled();
    expect(jogo.historico()).toBe(antes);
    expect(jogo.ataquesNoJogador().size).toBe(0);
    expect(jogo.ataquesNoComputador().size).toBe(0);
    expect(jogo.turno()).toBe('jogador');
  });

  it('encerra com vitória sem contra-ataque final, preserva os tabuleiros e permite reiniciar', async () => {
    const fixture = TestBed.createComponent(TelaDeBatalha);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Nova partida');

    for (const [indice, tipo] of TIPOS_DAS_EMBARCACOES.entries()) {
      for (let coluna = 0; coluna < tamanhoDe(tipo); coluna++) {
        celula(fixture, 'computador', coordenada(indice * 2, coluna)!).click();
        await fixture.whenStable();
      }
    }

    const compilado = fixture.nativeElement as HTMLElement;
    expect(jogo.vencedor()).toBe('jogador');
    expect(jogo.fase()).toBe('encerrada');
    expect(jogo.ataquesNoComputador().size).toBe(17);
    expect(jogo.ataquesNoJogador().size).toBe(16);
    expect(compilado.querySelector('[role="status"]')?.textContent).toContain('Você venceu!');
    expect(compilado.querySelector('[role="status"]')?.textContent).not.toContain('Sua vez.');
    expect(tabuleiro(fixture, 'jogador').querySelectorAll('button')).toHaveLength(100);
    expect(tabuleiro(fixture, 'computador').querySelectorAll('button')).toHaveLength(100);
    expect(celula(fixture, 'computador', 'I2').getAttribute('aria-label')).toContain(
      'Embarcação destruída',
    );
    expect(celula(fixture, 'computador', 'A1').getAttribute('aria-label')).toBe('A1, Acerto');
    expect(
      [...tabuleiro(fixture, 'computador').querySelectorAll<HTMLButtonElement>('button')].every(
        (alvo) => alvo.disabled,
      ),
    ).toBe(true);
    expect(celula(fixture, 'computador', 'J1').querySelector('svg')).toBeNull();
    expect(celula(fixture, 'computador', 'J1').getAttribute('aria-label')).toBe('J1');

    const antes = jogo.historico();
    celula(fixture, 'computador', 'J1').click();
    emitirAlvo(fixture, coordenada(9, 0)!);
    expect(jogo.historico()).toBe(antes);

    const reiniciar = [...compilado.querySelectorAll<HTMLButtonElement>('button')].find((botao) =>
      botao.textContent?.includes('Nova partida'),
    )!;
    reiniciar.click();
    await fixture.whenStable();
    expect(jogo.fase()).toBe('preparacao');
    expect(jogo.vencedor()).toBeNull();
    expect(jogo.frotaDoJogador()).toEqual({});
    expect(jogo.ataquesNoJogador().size).toBe(0);
    expect(jogo.ataquesNoComputador().size).toBe(0);
    expect(jogo.historico()).toEqual([{ sequencia: 1, tipo: 'partida-iniciada' }]);
    expect(compilado.querySelector('[role="status"]')?.textContent).not.toContain('I2:');
  });

  it('mostra derrota causada pelo computador e preserva o sigilo dos alvos não atacados', async () => {
    TestBed.resetTestingModule();
    await configurarBatalha(0.0000001, true);
    const fixture = TestBed.createComponent(TelaDeBatalha);
    await fixture.whenStable();

    // O computador percorre A1..B8, enquanto o jogador ataca apenas água em J e H.
    const alvosDeAgua = [
      ...Array.from({ length: 10 }, (_, coluna) => coordenada(9, coluna)!),
      ...Array.from({ length: 8 }, (_, coluna) => coordenada(7, coluna)!),
    ];
    for (const alvo of alvosDeAgua) {
      celula(fixture, 'computador', alvo).click();
      await fixture.whenStable();
    }

    expect(jogo.vencedor()).toBe('computador');
    expect(jogo.fase()).toBe('encerrada');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent,
    ).toContain('O computador venceu. Você perdeu.');
    expect(celula(fixture, 'jogador', 'B8').getAttribute('aria-label')).toContain(
      'Embarcação destruída',
    );
    expect(celula(fixture, 'computador', 'A1').getAttribute('aria-label')).toBe('A1');
    expect(celula(fixture, 'computador', 'A1').querySelector('svg')).toBeNull();
    expect(celula(fixture, 'computador', 'A1').classList.contains('bg-navio')).toBe(false);
    expect(
      [...tabuleiro(fixture, 'computador').querySelectorAll<HTMLButtonElement>('button')].every(
        (alvo) => alvo.disabled,
      ),
    ).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nova partida');
  });
});
