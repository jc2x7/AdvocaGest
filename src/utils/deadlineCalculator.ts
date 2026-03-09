// Calculadora de prazos processuais

import { isNationalHoliday, isCourtRecess } from '../constants/holidays';

export type DeadlineType = 'business' | 'calendar';

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isHoliday(date: Date): boolean {
  return isNationalHoliday(date);
}

export function isBusinessDay(date: Date): boolean {
  if (isWeekend(date)) {
    return false;
  }
  if (isHoliday(date)) {
    return false;
  }
  if (isCourtRecess(date)) {
    return false;
  }
  return true;
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

function addDays(date: Date, days: number): Date {
  const result = cloneDate(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getNextBusinessDay(date: Date): Date {
  let current = cloneDate(date);
  current = addDays(current, 1);
  while (!isBusinessDay(current)) {
    current = addDays(current, 1);
  }
  return current;
}

export function getPreviousBusinessDay(date: Date): Date {
  let current = cloneDate(date);
  current = addDays(current, -1);
  while (!isBusinessDay(current)) {
    current = addDays(current, -1);
  }
  return current;
}

export interface DeadlineResult {
  startDate: Date;
  endDate: Date;
  days: number;
  type: DeadlineType;
  businessDaysCount: number;
  calendarDaysCount: number;
}

export function calculateDeadline(
  startDate: Date,
  days: number,
  type: DeadlineType
): DeadlineResult {
  const start = cloneDate(startDate);
  start.setHours(0, 0, 0, 0);

  let endDate: Date;
  let businessDaysCount = 0;
  let calendarDaysCount = 0;

  if (type === 'calendar') {
    endDate = addDays(start, days);
    // Se cair em dia nao util, prorroga para o proximo dia util
    if (!isBusinessDay(endDate)) {
      endDate = getNextBusinessDay(endDate);
    }
    calendarDaysCount = days;
    // Conta dias uteis dentro do periodo
    let cursor = cloneDate(start);
    while (cursor <= endDate) {
      if (isBusinessDay(cursor)) {
        businessDaysCount++;
      }
      cursor = addDays(cursor, 1);
    }
  } else {
    // Prazo em dias uteis
    endDate = cloneDate(start);
    let remaining = days;
    while (remaining > 0) {
      endDate = addDays(endDate, 1);
      if (isBusinessDay(endDate)) {
        remaining--;
        businessDaysCount++;
      }
      calendarDaysCount++;
    }
  }

  return {
    startDate: start,
    endDate,
    days,
    type,
    businessDaysCount,
    calendarDaysCount,
  };
}

export function countBusinessDaysBetween(start: Date, end: Date): number {
  const s = cloneDate(start);
  s.setHours(0, 0, 0, 0);
  const e = cloneDate(end);
  e.setHours(0, 0, 0, 0);

  let count = 0;
  let current = addDays(s, 1);

  while (current <= e) {
    if (isBusinessDay(current)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
}

export function isDeadlineExpired(deadline: Date): boolean {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return deadline < now;
}

export function daysUntilDeadline(deadline: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = cloneDate(deadline);
  d.setHours(0, 0, 0, 0);
  const diffMs = d.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function businessDaysUntilDeadline(deadline: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = cloneDate(deadline);
  d.setHours(0, 0, 0, 0);

  if (d <= now) {
    return 0;
  }

  return countBusinessDaysBetween(now, d);
}
