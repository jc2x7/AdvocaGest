import { FirebaseFirestoreTypes } from 'firebase/firestore';

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export type FirestoreTimestamp = FirebaseFirestoreTypes.Timestamp | Date | string;

export interface PaginationParams {
  limit: number;
  lastDoc?: FirebaseFirestoreTypes.DocumentSnapshot;
}

export interface FilterOption {
  label: string;
  value: string;
  active: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: string;
  direction: SortDirection;
  label: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId: string;
  data?: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'deadline' | 'hearing' | 'payment' | 'movement' | 'lead' | 'general';
  data?: Record<string, string>;
  read: boolean;
  createdAt: Date;
}

// Namespace for Firebase Firestore types used across the app
export namespace FirebaseFirestoreTypes {
  export type Timestamp = {
    seconds: number;
    nanoseconds: number;
    toDate: () => Date;
  };
  export type DocumentSnapshot = {
    id: string;
    exists: boolean;
    data: () => Record<string, unknown> | undefined;
  };
}
