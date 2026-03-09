import { Task, TaskStatus } from '../../types/task';
import { TimeEntry } from '../../types/timesheet';
import { getTasks } from '../firebase/taskService';
import { getTimeEntriesByDateRange } from '../firebase/timesheetService';
import { format, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface HoursWorkedReport {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  billablePercentage: number;
  totalEntries: number;
}

export interface HoursByCaseReport {
  caseId: string;
  caseName: string;
  totalHours: number;
  billableHours: number;
  percentage: number;
}

export interface HoursByClientReport {
  clientId: string;
  clientName: string;
  totalHours: number;
  billableHours: number;
  percentage: number;
}

export interface TasksCompletedReport {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionRate: number;
}

export interface DeadlineComplianceReport {
  totalWithDeadline: number;
  onTime: number;
  late: number;
  complianceRate: number;
}

export interface HoursByDayOfWeekReport {
  dayIndex: number;
  dayLabel: string;
  totalHours: number;
  averageHours: number;
}

const DAY_LABELS = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

function filterTasksByPeriod(tasks: Task[], startDate: Date, endDate: Date): Task[] {
  return tasks.filter((t) => t.createdAt >= startDate && t.createdAt <= endDate);
}

export async function getHoursWorked(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<HoursWorkedReport> {
  const entries = await getTimeEntriesByDateRange(ownerUid, startDate, endDate);

  const totalSeconds = entries.reduce((sum, e) => sum + e.duration, 0);
  const billableSeconds = entries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + e.duration, 0);
  const nonBillableSeconds = totalSeconds - billableSeconds;

  const totalHours = totalSeconds / 3600;
  const billableHours = billableSeconds / 3600;
  const nonBillableHours = nonBillableSeconds / 3600;

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    billableHours: Math.round(billableHours * 100) / 100,
    nonBillableHours: Math.round(nonBillableHours * 100) / 100,
    billablePercentage: totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
    totalEntries: entries.length,
  };
}

export async function getHoursByCase(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<HoursByCaseReport[]> {
  const entries = await getTimeEntriesByDateRange(ownerUid, startDate, endDate);
  const entriesWithCase = entries.filter((e) => e.caseId);
  const totalSeconds = entriesWithCase.reduce((sum, e) => sum + e.duration, 0);

  const caseMap = new Map<string, { name: string; total: number; billable: number }>();
  entriesWithCase.forEach((e) => {
    const caseId = e.caseId as string;
    const existing = caseMap.get(caseId) ?? {
      name: e.caseName ?? 'Sem nome',
      total: 0,
      billable: 0,
    };
    existing.total += e.duration;
    if (e.billable) {
      existing.billable += e.duration;
    }
    caseMap.set(caseId, existing);
  });

  return Array.from(caseMap.entries())
    .map(([caseId, data]) => ({
      caseId,
      caseName: data.name,
      totalHours: Math.round((data.total / 3600) * 100) / 100,
      billableHours: Math.round((data.billable / 3600) * 100) / 100,
      percentage: totalSeconds > 0 ? (data.total / totalSeconds) * 100 : 0,
    }))
    .sort((a, b) => b.totalHours - a.totalHours);
}

export async function getHoursByClient(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<HoursByClientReport[]> {
  const entries = await getTimeEntriesByDateRange(ownerUid, startDate, endDate);
  const entriesWithClient = entries.filter((e) => e.clientId);
  const totalSeconds = entriesWithClient.reduce((sum, e) => sum + e.duration, 0);

  const clientMap = new Map<string, { name: string; total: number; billable: number }>();
  entriesWithClient.forEach((e) => {
    const clientId = e.clientId as string;
    const existing = clientMap.get(clientId) ?? {
      name: e.clientName ?? 'Sem nome',
      total: 0,
      billable: 0,
    };
    existing.total += e.duration;
    if (e.billable) {
      existing.billable += e.duration;
    }
    clientMap.set(clientId, existing);
  });

  return Array.from(clientMap.entries())
    .map(([clientId, data]) => ({
      clientId,
      clientName: data.name,
      totalHours: Math.round((data.total / 3600) * 100) / 100,
      billableHours: Math.round((data.billable / 3600) * 100) / 100,
      percentage: totalSeconds > 0 ? (data.total / totalSeconds) * 100 : 0,
    }))
    .sort((a, b) => b.totalHours - a.totalHours);
}

export async function getTasksCompleted(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<TasksCompletedReport> {
  const allTasks = await getTasks(ownerUid);
  const filtered = filterTasksByPeriod(allTasks, startDate, endDate);

  const completedTasks = filtered.filter((t) => t.status === 'done').length;
  const pendingTasks = filtered.filter((t) => t.status === 'todo').length;
  const inProgressTasks = filtered.filter((t) => t.status === 'in_progress').length;
  const totalTasks = filtered.length;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
  };
}

export async function getDeadlineCompliance(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<DeadlineComplianceReport> {
  const allTasks = await getTasks(ownerUid);
  const filtered = filterTasksByPeriod(allTasks, startDate, endDate);
  const tasksWithDeadline = filtered.filter((t) => t.dueDate && t.status === 'done');

  const totalWithDeadline = tasksWithDeadline.length;
  const onTime = tasksWithDeadline.filter((t) => {
    if (!t.completedAt || !t.dueDate) return false;
    return t.completedAt <= t.dueDate;
  }).length;
  const late = totalWithDeadline - onTime;

  return {
    totalWithDeadline,
    onTime,
    late,
    complianceRate: totalWithDeadline > 0 ? (onTime / totalWithDeadline) * 100 : 0,
  };
}

export async function getHoursByDayOfWeek(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<HoursByDayOfWeekReport[]> {
  const entries = await getTimeEntriesByDateRange(ownerUid, startDate, endDate);

  const dayMap = new Map<number, { totalSeconds: number; daysCount: Set<string> }>();
  for (let i = 0; i < 7; i++) {
    dayMap.set(i, { totalSeconds: 0, daysCount: new Set() });
  }

  entries.forEach((e) => {
    const dayIndex = getDay(e.startTime);
    const dayKey = format(e.startTime, 'yyyy-MM-dd');
    const existing = dayMap.get(dayIndex);
    if (existing) {
      existing.totalSeconds += e.duration;
      existing.daysCount.add(dayKey);
    }
  });

  // Count unique days in the range per weekday
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekdayCounts = new Map<number, number>();
  allDays.forEach((d) => {
    const idx = getDay(d);
    weekdayCounts.set(idx, (weekdayCounts.get(idx) ?? 0) + 1);
  });

  return Array.from(dayMap.entries())
    .map(([dayIndex, data]) => {
      const totalHours = data.totalSeconds / 3600;
      const weeksCount = weekdayCounts.get(dayIndex) ?? 1;
      return {
        dayIndex,
        dayLabel: DAY_LABELS[dayIndex],
        totalHours: Math.round(totalHours * 100) / 100,
        averageHours: Math.round((totalHours / weeksCount) * 100) / 100,
      };
    })
    .sort((a, b) => {
      // Start with Monday (1) through Sunday (0)
      const aIdx = a.dayIndex === 0 ? 7 : a.dayIndex;
      const bIdx = b.dayIndex === 0 ? 7 : b.dayIndex;
      return aIdx - bIdx;
    });
}
