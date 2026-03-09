export interface TimeEntry {
  id: string;
  owner_uid: string;
  taskId?: string;
  caseId?: string;
  caseName?: string;
  clientId?: string;
  clientName?: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  billable: boolean;
  hourlyRate?: number;
  createdAt: Date;
}

export interface TimeEntryFormData {
  taskId?: string;
  caseId?: string;
  caseName?: string;
  clientId?: string;
  clientName?: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  billable: boolean;
  hourlyRate?: number;
}

export interface TimerState {
  isRunning: boolean;
  startTime: Date | null;
  elapsed: number;
  description: string;
  caseId?: string;
  caseName?: string;
  clientId?: string;
  clientName?: string;
  billable: boolean;
}
