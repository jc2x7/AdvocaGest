export interface CourtInfo {
  name: string;
  acronym: string;
  branches?: string[];
}

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
  'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const;

export type BrazilianState = typeof BRAZILIAN_STATES[number];

export const STATE_NAMES: Record<BrazilianState, string> = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapa',
  BA: 'Bahia', CE: 'Ceara', DF: 'Distrito Federal', ES: 'Espirito Santo',
  GO: 'Goias', MA: 'Maranhao', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso', PA: 'Para', PB: 'Paraiba', PE: 'Pernambuco',
  PI: 'Piaui', PR: 'Parana', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RO: 'Rondonia', RR: 'Roraima', RS: 'Rio Grande do Sul', SC: 'Santa Catarina',
  SE: 'Sergipe', SP: 'Sao Paulo', TO: 'Tocantins',
};

export const SUPERIOR_COURTS: CourtInfo[] = [
  { name: 'Supremo Tribunal Federal', acronym: 'STF' },
  { name: 'Superior Tribunal de Justica', acronym: 'STJ' },
  { name: 'Tribunal Superior do Trabalho', acronym: 'TST' },
  { name: 'Superior Tribunal Militar', acronym: 'STM' },
  { name: 'Tribunal Superior Eleitoral', acronym: 'TSE' },
];

export const COURT_TYPES = [
  'Justica Estadual',
  'Justica Federal',
  'Justica do Trabalho',
  'Justica Militar',
  'Justica Eleitoral',
  'Juizado Especial Civel',
  'Juizado Especial Criminal',
  'Juizado Especial da Fazenda Publica',
] as const;

export const JURISDICTIONS = [
  '1a Instancia',
  '2a Instancia',
  'Tribunal Superior',
  'Juizado Especial',
  'Turma Recursal',
] as const;

export function getCourtsByState(state: BrazilianState): CourtInfo[] {
  return [
    { name: `Tribunal de Justica do Estado - ${state}`, acronym: `TJ${state}` },
    { name: `Tribunal Regional Federal`, acronym: 'TRF' },
    { name: `Tribunal Regional do Trabalho`, acronym: 'TRT' },
    { name: `Tribunal Regional Eleitoral - ${state}`, acronym: `TRE-${state}` },
    ...SUPERIOR_COURTS,
  ];
}
