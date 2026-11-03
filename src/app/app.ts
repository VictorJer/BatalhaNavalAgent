import { Component, signal } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  imports: [LucideDynamicIcon],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly titulo = signal('Batalha Naval');
}
