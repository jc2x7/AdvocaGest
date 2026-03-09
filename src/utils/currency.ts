// Formatacao e parsing de moeda brasileira (BRL)

export function formatCurrency(value: number): string {
  const absoluteValue = Math.abs(value);
  const formatted = absoluteValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (value < 0) {
    return `-R$ ${formatted}`;
  }
  return `R$ ${formatted}`;
}

export function parseCurrency(text: string): number {
  // Remove o simbolo R$, espacos e pontos de milhar
  const cleaned = text
    .replace(/R\$\s?/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatCurrencyCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    const millions = value / 1_000_000;
    return `R$ ${millions.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}M`;
  }

  if (Math.abs(value) >= 1_000) {
    const thousands = value / 1_000;
    return `R$ ${thousands.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}K`;
  }

  return formatCurrency(value);
}

export function centsToReais(cents: number): number {
  return cents / 100;
}

export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

export function sumCurrency(values: number[]): number {
  // Soma via centavos para evitar erros de ponto flutuante
  const totalCents = values.reduce((acc, val) => acc + Math.round(val * 100), 0);
  return totalCents / 100;
}

export function percentageOf(value: number, percentage: number): number {
  const cents = Math.round(value * 100);
  const result = Math.round((cents * percentage) / 100);
  return result / 100;
}
