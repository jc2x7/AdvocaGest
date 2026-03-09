export type ContractType = 'fixed' | 'success' | 'mixed' | 'hourly';
export type ContractStatus = 'active' | 'completed' | 'cancelled';
export type InstallmentStatus = 'pending' | 'paid' | 'overdue' | 'partial';
export type PaymentMethod = 'pix' | 'transfer' | 'cash' | 'check' | 'card' | 'boleto';
export type EntryType = 'income' | 'expense';
export type RecurrenceFrequency = 'monthly' | 'annual';

export interface FeeContract {
  id: string;
  owner_uid: string;
  clientId: string;
  clientName: string;
  caseId?: string;
  caseName?: string;
  type: ContractType;
  totalValue: number;
  successPercentage?: number;
  hourlyRate?: number;
  installmentsCount: number;
  paidCount: number;
  paidTotal: number;
  status: ContractStatus;
  description?: string;
  signedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Installment {
  id: string;
  contractId: string;
  owner_uid: string;
  number: number;
  value: number;
  dueDate: Date;
  paidDate?: Date;
  paidValue?: number;
  status: InstallmentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface FinancialEntry {
  id: string;
  owner_uid: string;
  type: EntryType;
  category: string;
  description: string;
  value: number;
  date: Date;
  clientId?: string;
  clientName?: string;
  caseId?: string;
  caseName?: string;
  paymentMethod?: string;
  installmentId?: string;
  contractId?: string;
  isRecurring: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  createdAt: Date;
}

export interface ContractFormData {
  clientId: string;
  clientName: string;
  caseId?: string;
  caseName?: string;
  type: ContractType;
  totalValue: number;
  successPercentage?: number;
  hourlyRate?: number;
  installmentsCount: number;
  description?: string;
  signedDate?: Date;
}

export const EXPENSE_CATEGORIES = [
  'Aluguel',
  'Software/Sistemas',
  'Impostos',
  'Custas Processuais',
  'Pericia',
  'Transporte',
  'Material de Escritorio',
  'Telefone/Internet',
  'Marketing',
  'Contabilidade',
  'Seguro',
  'Manutencao',
  'Alimentacao',
  'Outros',
] as const;

export const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: 'PIX', value: 'pix' },
  { label: 'Transferencia', value: 'transfer' },
  { label: 'Dinheiro', value: 'cash' },
  { label: 'Cheque', value: 'check' },
  { label: 'Cartao', value: 'card' },
  { label: 'Boleto', value: 'boleto' },
];
