import { Address } from './common';

export type ClientType = 'PF' | 'PJ';
export type ClientStatus = 'active' | 'inactive' | 'prospect';

export interface Client {
  id: string;
  owner_uid: string;
  type: ClientType;
  status: ClientStatus;
  fullName: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  profession?: string;
  companyName?: string;
  cnpj?: string;
  tradeName?: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  phone2?: string;
  address?: Address;
  notes?: string;
  tags?: string[];
  areasOfInterest?: string[];
  activeCasesCount: number;
  totalRevenue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientFormData {
  type: ClientType;
  status: ClientStatus;
  fullName: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  profession?: string;
  companyName?: string;
  cnpj?: string;
  tradeName?: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  phone2?: string;
  address?: Address;
  notes?: string;
  tags?: string[];
  areasOfInterest?: string[];
}
