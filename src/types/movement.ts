export type MovementType = 'system' | 'manual';

export interface CaseMovement {
  id: string;
  caseId: string;
  owner_uid: string;
  date: Date;
  title: string;
  description: string;
  type: MovementType;
  source?: string;
  isImportant: boolean;
  createdAt: Date;
}

export interface MovementFormData {
  caseId: string;
  date: Date;
  title: string;
  description: string;
  type: MovementType;
  source?: string;
  isImportant: boolean;
}
