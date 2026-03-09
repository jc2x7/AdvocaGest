export type DeadlineType = 'judicial' | 'administrative' | 'personal';
export type DeadlineStatus = 'pending' | 'completed' | 'overdue';
export type DayType = 'business' | 'calendar';

export interface Deadline {
  id: string;
  caseId: string;
  caseName?: string;
  owner_uid: string;
  title: string;
  description?: string;
  type: DeadlineType;
  dueDate: Date;
  reminderDays: number[];
  status: DeadlineStatus;
  completedAt?: Date;
  dayType: DayType;
  createdAt: Date;
}

export interface DeadlineFormData {
  caseId: string;
  caseName?: string;
  title: string;
  description?: string;
  type: DeadlineType;
  dueDate: Date;
  reminderDays: number[];
  dayType: DayType;
}
