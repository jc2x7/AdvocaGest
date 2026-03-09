// Utilitarios de data usando date-fns com locale pt-BR

import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isTomorrow,
  isSameDay,
  isSameMonth,
  isSameYear,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm', { locale: ptBR });
}

export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM', { locale: ptBR });
}

export function formatWeekday(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEEE', { locale: ptBR });
}

export type GreetingPeriod = 'morning' | 'afternoon' | 'evening';

export function getGreetingPeriod(date?: Date): GreetingPeriod {
  const hour = (date || new Date()).getHours();
  if (hour >= 5 && hour < 12) {
    return 'morning';
  }
  if (hour >= 12 && hour < 18) {
    return 'afternoon';
  }
  return 'evening';
}

export function getGreeting(date?: Date): string {
  const period = getGreetingPeriod(date);
  const greetings: Record<GreetingPeriod, string> = {
    morning: 'Bom dia',
    afternoon: 'Boa tarde',
    evening: 'Boa noite',
  };
  return greetings[period];
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  if (isToday(d)) {
    const minutesDiff = differenceInMinutes(now, d);
    if (minutesDiff < 1) {
      return 'agora mesmo';
    }
    if (minutesDiff < 60) {
      return `ha ${minutesDiff} min`;
    }
    const hoursDiff = differenceInHours(now, d);
    return `ha ${hoursDiff}h`;
  }

  if (isYesterday(d)) {
    return `ontem as ${format(d, 'HH:mm')}`;
  }

  if (isTomorrow(d)) {
    return `amanha as ${format(d, 'HH:mm')}`;
  }

  const daysDiff = differenceInDays(now, d);

  if (daysDiff > 0 && daysDiff <= 7) {
    return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
  }

  if (isSameYear(d, now)) {
    return format(d, "dd 'de' MMM", { locale: ptBR });
  }

  return formatDate(d);
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;

  if (isSameDay(s, e)) {
    return `${formatDate(s)}, ${formatTime(s)} - ${formatTime(e)}`;
  }

  if (isSameMonth(s, e)) {
    return `${format(s, 'dd', { locale: ptBR })} a ${format(e, 'dd', { locale: ptBR })} de ${format(e, "MMMM 'de' yyyy", { locale: ptBR })}`;
  }

  if (isSameYear(s, e)) {
    return `${format(s, "dd 'de' MMM", { locale: ptBR })} a ${format(e, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`;
  }

  return `${formatDate(s)} a ${formatDate(e)}`;
}

export function getDaysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return differenceInDays(target, now);
}

export function getUrgencyLabel(daysUntil: number): string {
  if (daysUntil < 0) {
    return 'Vencido';
  }
  if (daysUntil === 0) {
    return 'Hoje';
  }
  if (daysUntil === 1) {
    return 'Amanha';
  }
  if (daysUntil <= 3) {
    return 'Urgente';
  }
  if (daysUntil <= 7) {
    return 'Esta semana';
  }
  if (daysUntil <= 30) {
    return 'Este mes';
  }
  return 'Futuro';
}
