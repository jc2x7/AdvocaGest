import { LegalArea } from '../types/case';

export interface LegalAreaInfo {
  value: LegalArea;
  label: string;
  icon: string;
  color: string;
}

export const LEGAL_AREAS: LegalAreaInfo[] = [
  { value: 'civil', label: 'Direito Civil', icon: 'scale-balance', color: '#3b82f6' },
  { value: 'trabalhista', label: 'Direito Trabalhista', icon: 'briefcase', color: '#f59e0b' },
  { value: 'criminal', label: 'Direito Criminal', icon: 'shield-alert', color: '#ef4444' },
  {
    value: 'previdenciario',
    label: 'Direito Previdenciario',
    icon: 'heart-pulse',
    color: '#22c55e',
  },
  { value: 'tributario', label: 'Direito Tributario', icon: 'receipt', color: '#8b5cf6' },
  { value: 'familia', label: 'Direito de Familia', icon: 'home-heart', color: '#ec4899' },
  { value: 'consumidor', label: 'Direito do Consumidor', icon: 'shopping-cart', color: '#06b6d4' },
  {
    value: 'administrativo',
    label: 'Direito Administrativo',
    icon: 'building',
    color: '#64748b',
  },
  { value: 'ambiental', label: 'Direito Ambiental', icon: 'tree', color: '#16a34a' },
  { value: 'empresarial', label: 'Direito Empresarial', icon: 'domain', color: '#0ea5e9' },
];

export const LEGAL_AREA_MAP: Record<LegalArea, string> = {
  civil: 'Direito Civil',
  trabalhista: 'Direito Trabalhista',
  criminal: 'Direito Criminal',
  previdenciario: 'Direito Previdenciario',
  tributario: 'Direito Tributario',
  familia: 'Direito de Familia',
  consumidor: 'Direito do Consumidor',
  administrativo: 'Direito Administrativo',
  ambiental: 'Direito Ambiental',
  empresarial: 'Direito Empresarial',
};

export const CASE_TYPES: Record<LegalArea, string[]> = {
  civil: [
    'Acao de Cobranca',
    'Acao de Indenizacao',
    'Acao de Despejo',
    'Acao Possessoria',
    'Acao de Obrigacao de Fazer',
    'Acao Monitoria',
    'Execucao de Titulo Extrajudicial',
    'Outro',
  ],
  trabalhista: [
    'Reclamacao Trabalhista',
    'Acao de Consignacao',
    'Mandado de Seguranca',
    'Inquerito Judicial',
    'Outro',
  ],
  criminal: [
    'Defesa Criminal',
    'Habeas Corpus',
    'Queixa-Crime',
    'Revisao Criminal',
    'Outro',
  ],
  previdenciario: [
    'Aposentadoria',
    'Auxilio-Doenca',
    'BPC/LOAS',
    'Pensao por Morte',
    'Revisao de Beneficio',
    'Outro',
  ],
  tributario: [
    'Acao Anulatoria',
    'Mandado de Seguranca',
    'Execucao Fiscal',
    'Acao Declaratoria',
    'Outro',
  ],
  familia: [
    'Divorcio',
    'Guarda',
    'Alimentos',
    'Inventario',
    'Adocao',
    'Uniao Estavel',
    'Outro',
  ],
  consumidor: [
    'Acao de Indenizacao',
    'Acao de Obrigacao de Fazer',
    'Acao Revisional',
    'Outro',
  ],
  administrativo: [
    'Mandado de Seguranca',
    'Acao Popular',
    'Acao Civil Publica',
    'Improbidade',
    'Outro',
  ],
  ambiental: [
    'Acao Civil Publica',
    'Defesa Ambiental',
    'Licenciamento',
    'Outro',
  ],
  empresarial: [
    'Recuperacao Judicial',
    'Falencia',
    'Dissolucao Societaria',
    'Acao entre Socios',
    'Outro',
  ],
};
