import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provedoresDaAplicacao } from './app.config';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: provedoresDaAplicacao,
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
});
