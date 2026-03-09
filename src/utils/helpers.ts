// Funcoes utilitarias gerais

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}`;
}

export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  const truncated = text.substring(0, maxLength - suffix.length).trimEnd();
  return `${truncated}${suffix}`;
}

export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return '';
  }

  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  const first = words[0][0] || '';
  const last = words[words.length - 1][0] || '';
  return `${first}${last}`.toUpperCase();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  if (unitIndex === 0) {
    return `${size} ${units[unitIndex]}`;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 0) {
    return '0 min';
  }

  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  // Se ja tem codigo do pais (55), retorna como esta
  if (digits.length === 13 && digits.startsWith('55')) {
    return digits;
  }

  // Adiciona codigo do Brasil
  if (digits.length === 11 || digits.length === 10) {
    return `55${digits}`;
  }

  return digits;
}

export function capitalize(text: string): string {
  if (!text) {
    return '';
  }
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function capitalizeWords(text: string): string {
  if (!text) {
    return '';
  }
  const prepositions = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'a', 'o', 'as', 'os', 'para', 'por', 'com']);

  return text
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && prepositions.has(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return capitalize(word);
    })
    .join(' ');
}

export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function searchMatch(query: string, target: string): boolean {
  const normalizedQuery = removeAccents(query.toLowerCase().trim());
  const normalizedTarget = removeAccents(target.toLowerCase().trim());
  return normalizedTarget.includes(normalizedQuery);
}

export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}

export function uniqueBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
