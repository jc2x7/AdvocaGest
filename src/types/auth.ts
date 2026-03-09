import { Address } from './common';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  oabNumber: string;
  oabState: string;
  profilePhoto?: string;
  signatureImage?: string;
  areasOfPractice: string[];
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfficeData {
  name: string;
  cnpj?: string;
  address?: Address;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  pixKey?: string;
}

export interface SignUpData {
  name: string;
  email: string;
  phone: string;
  oabNumber: string;
  oabState: string;
  password: string;
  confirmPassword: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  officeData: OfficeData | null;
  updateOfficeData: (data: Partial<OfficeData>) => Promise<void>;
}
