export type LeadSource =
  | 'referral'
  | 'website'
  | 'instagram'
  | 'facebook'
  | 'google'
  | 'linkedin'
  | 'phone'
  | 'walk_in'
  | 'other';

export type LeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface Lead {
  id: string;
  owner_uid: string;
  name: string;
  email?: string;
  phone: string;
  source: LeadSource;
  sourceDetail?: string;
  area: string;
  description?: string;
  stage: LeadStage;
  score: number;
  estimatedValue?: number;
  proposalSent: boolean;
  proposalDate?: Date;
  lostReason?: string;
  convertedClientId?: string;
  notes?: string;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadFormData {
  name: string;
  email?: string;
  phone: string;
  source: LeadSource;
  sourceDetail?: string;
  area: string;
  description?: string;
  estimatedValue?: number;
}

export const LEAD_SOURCES: { label: string; value: LeadSource }[] = [
  { label: 'Indicacao', value: 'referral' },
  { label: 'Site', value: 'website' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Google', value: 'google' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Telefone', value: 'phone' },
  { label: 'Presencial', value: 'walk_in' },
  { label: 'Outro', value: 'other' },
];

export const LEAD_STAGES: { label: string; value: LeadStage; color: string }[] = [
  { label: 'Novo', value: 'new', color: '#3b82f6' },
  { label: 'Contatado', value: 'contacted', color: '#8b5cf6' },
  { label: 'Qualificado', value: 'qualified', color: '#f59e0b' },
  { label: 'Proposta', value: 'proposal', color: '#f97316' },
  { label: 'Negociacao', value: 'negotiation', color: '#ec4899' },
  { label: 'Ganho', value: 'won', color: '#22c55e' },
  { label: 'Perdido', value: 'lost', color: '#ef4444' },
];
