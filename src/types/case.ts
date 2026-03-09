export type LegalArea =
  | 'civil'
  | 'trabalhista'
  | 'criminal'
  | 'previdenciario'
  | 'tributario'
  | 'familia'
  | 'consumidor'
  | 'administrativo'
  | 'ambiental'
  | 'empresarial';

export type CasePhase = 'conhecimento' | 'recursal' | 'execucao' | 'cumprimento_sentenca';
export type CaseStatus = 'active' | 'archived' | 'suspended' | 'closed';
export type CaseResult = 'won' | 'lost' | 'settled' | 'dismissed';
export type CaseRole = 'author' | 'defendant' | 'third_party' | 'assistant';

export interface LegalCase {
  id: string;
  owner_uid: string;
  caseNumber: string;
  clientId: string;
  clientName: string;
  status: CaseStatus;
  result?: CaseResult;
  area: LegalArea;
  type: string;
  court: string;
  branch: string;
  jurisdiction: string;
  role: CaseRole;
  judge?: string;
  opposingParty: string;
  opposingLawyer?: string;
  caseValue?: number;
  phase: CasePhase;
  description?: string;
  strategy?: string;
  tags?: string[];
  nextDeadline?: Date;
  lastMovement?: string;
  lastMovementDate?: Date;
  expenses: number;
  revenue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseFormData {
  caseNumber: string;
  clientId: string;
  clientName: string;
  area: LegalArea;
  type: string;
  court: string;
  branch: string;
  jurisdiction: string;
  role: CaseRole;
  judge?: string;
  opposingParty: string;
  opposingLawyer?: string;
  caseValue?: number;
  phase: CasePhase;
  description?: string;
  strategy?: string;
  tags?: string[];
}
