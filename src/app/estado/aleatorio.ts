import { InjectionToken } from '@angular/core';

/** Fonte de aleatoriedade injetável; o padrão é `Math.random`. */
export type Aleatorio = () => number;

/** Token de injeção para testes trocarem por uma sequência determinística. */
export const ALEATORIO = new InjectionToken<Aleatorio>('ALEATORIO', {
  providedIn: 'root',
  factory: () => Math.random,
});
