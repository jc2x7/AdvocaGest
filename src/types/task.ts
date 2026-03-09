export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  owner_uid: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  caseId?: string;
  caseName?: string;
  clientId?: string;
  clientName?: string;
  dueDate?: Date;
  completedAt?: Date;
  checklist?: ChecklistItem[];
  estimatedHours?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority: TaskPriority;
  caseId?: string;
  caseName?: string;
  clientId?: string;
  clientName?: string;
  dueDate?: Date;
  checklist?: ChecklistItem[];
  estimatedHours?: number;
  tags?: string[];
}

export const TASK_PRIORITIES: { label: string; value: TaskPriority; color: string }[] = [
  { label: 'Baixa', value: 'low', color: '#22c55e' },
  { label: 'Media', value: 'medium', color: '#f59e0b' },
  { label: 'Alta', value: 'high', color: '#f97316' },
  { label: 'Urgente', value: 'urgent', color: '#ef4444' },
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'A Fazer',
  in_progress: 'Em Andamento',
  done: 'Concluido',
};
