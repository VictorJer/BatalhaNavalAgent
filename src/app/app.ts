import { Component, computed, inject, signal } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { TelaDeBatalha } from './batalha/tela-de-batalha';
import { JogoStore } from './estado/jogo-store';
import { TelaDePreparacao } from './preparacao/tela-de-preparacao';

@Component({
  imports: [LucideDynamicIcon, TelaDePreparacao, TelaDeBatalha],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly jogo = inject(JogoStore);
  protected readonly titulo = signal('Batalha Naval');
  protected readonly fase = computed(() => this.jogo.fase());
}
