import { tamanhoDe, TipoEmbarcacao } from '../dominio/embarcacao';

export const APRESENTACAO_DAS_EMBARCACOES: Readonly<
  Record<TipoEmbarcacao, { nome: string; sigla: string }>
> = {
  'porta-avioes': { nome: 'Porta-aviões', sigla: 'PA' },
  encouracado: { nome: 'Encouraçado', sigla: 'EN' },
  cruzador: { nome: 'Cruzador', sigla: 'CR' },
  submarino: { nome: 'Submarino', sigla: 'SU' },
  destroyer: { nome: 'Destroyer', sigla: 'DE' },
};

export function nomeDaEmbarcacao(tipo: TipoEmbarcacao): string {
  return APRESENTACAO_DAS_EMBARCACOES[tipo].nome;
}

export function siglaDaEmbarcacao(tipo: TipoEmbarcacao): string {
  return APRESENTACAO_DAS_EMBARCACOES[tipo].sigla;
}

export function descricaoDaEmbarcacao(tipo: TipoEmbarcacao): string {
  return `${nomeDaEmbarcacao(tipo)}, ${tamanhoDe(tipo)} posições`;
}
