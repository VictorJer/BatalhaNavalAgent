import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { LucideAnchor, LucideShip, provideLucideIcons } from '@lucide/angular';

/**
 * Provedores compartilhados entre o bootstrap da aplicação e os testes,
 * para que ambos usem a mesma configuração (zoneless + ícones Lucide).
 */
export const provedoresDaAplicacao: ApplicationConfig['providers'] = [
  provideBrowserGlobalErrorListeners(),
  provideZonelessChangeDetection(),
  provideLucideIcons(LucideShip, LucideAnchor),
];

export const appConfig: ApplicationConfig = {
  providers: provedoresDaAplicacao,
};
