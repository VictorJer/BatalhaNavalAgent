import { TestBed } from '@angular/core/testing';
import { TelaInicial } from './tela-inicial';

describe('TelaInicial', () => {
  it('apresenta o objetivo e emite uma intenção ao acionar o botão', async () => {
    await TestBed.configureTestingModule({ imports: [TelaInicial] }).compileComponents();
    const fixture = TestBed.createComponent(TelaInicial);
    const iniciar = vi.fn();
    fixture.componentInstance['iniciar'].subscribe(iniciar);
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;
    const botao = compilado.querySelector<HTMLButtonElement>('button')!;

    expect(compilado.textContent).toContain('Posicione sua frota e enfrente o computador.');
    expect(botao.textContent?.trim()).toBe('Começar a jogar');
    expect(botao.getAttribute('aria-label')).toBeNull();

    botao.click();
    expect(iniciar).toHaveBeenCalledTimes(1);
  });

  it('mantém layout responsivo, foco visível e operação nativa por teclado', async () => {
    await TestBed.configureTestingModule({ imports: [TelaInicial] }).compileComponents();
    const fixture = TestBed.createComponent(TelaInicial);
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;
    const botao = compilado.querySelector<HTMLButtonElement>('button')!;
    const secao = compilado.querySelector('section')!;

    expect(secao.className).toContain('w-full');
    expect(secao.className).toContain('max-w-prose');
    expect(botao.className).toContain('focus-visible:outline-');
    expect(botao.type).toBe('button');
    expect(botao.textContent?.trim()).toBe('Começar a jogar');
  });
});
