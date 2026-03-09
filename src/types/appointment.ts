export type AppointmentType =
  | 'hearing'
  | 'deadline'
  | 'meeting'
  | 'diligence'
  | 'reminder'
  | 'personal';

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Appointment {
  id: string;
  owner_uid: string;
  title: string;
  description?: string;
  type: AppointmentType;
  date: Date;
  endDate?: Date;
  allDay: boolean;
  location?: string;
  caseId?: string;
  caseName?: string;
  clientId?: string;
  clientName?: string;
  reminderMinutes: number[];
  recurrence: RecurrenceType;
  status: AppointmentStatus;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentFormData {
  title: string;
  description?: string;
  type: AppointmentType;
  date: Date;
  endDate?: Date;
  allDay: boolean;
  location?: string;
  caseId?: string;
  caseName?: string;
  clientId?: string;
  clientName?: string;
  reminderMinutes: number[];
  recurrence: RecurrenceType;
  color?: string;
}
