export type DocumentCategory =
  | 'petition'
  | 'decision'
  | 'evidence'
  | 'proxy'
  | 'contract'
  | 'receipt'
  | 'report'
  | 'id_document'
  | 'correspondence'
  | 'other';

export type DocumentFileType = 'pdf' | 'image' | 'doc' | 'other';

export interface LegalDocument {
  id: string;
  owner_uid: string;
  name: string;
  description?: string;
  category: DocumentCategory;
  type: DocumentFileType;
  fileUrl: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  caseId?: string;
  clientId?: string;
  tags?: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentTemplate {
  id: string;
  owner_uid: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  isDefault: boolean;
  createdAt: Date;
}

export interface MessageTemplate {
  id: string;
  owner_uid: string;
  name: string;
  category: 'greeting' | 'update' | 'reminder' | 'deadline' | 'payment' | 'meeting' | 'other';
  content: string;
  channel: 'whatsapp' | 'email' | 'any';
  createdAt: Date;
}

export const DOCUMENT_CATEGORIES: { label: string; value: DocumentCategory }[] = [
  { label: 'Peticoes', value: 'petition' },
  { label: 'Decisoes', value: 'decision' },
  { label: 'Provas', value: 'evidence' },
  { label: 'Procuracoes', value: 'proxy' },
  { label: 'Contratos', value: 'contract' },
  { label: 'Recibos', value: 'receipt' },
  { label: 'Laudos', value: 'report' },
  { label: 'Documentos Pessoais', value: 'id_document' },
  { label: 'Correspondencias', value: 'correspondence' },
  { label: 'Outros', value: 'other' },
];
