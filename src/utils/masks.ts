// Mascaras de entrada em tempo real para campos de formulario

type MaskFunction = (value: string) => string;

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskCPF(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function maskCNPJ(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function maskCPFOrCNPJ(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length <= 11) {
    return maskCPF(value);
  }
  return maskCNPJ(value);
}

export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

export function maskCEP(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

export function maskOAB(value: string): string {
  const digits = onlyDigits(value).slice(0, 6);
  return digits.replace(/(\d{3})(\d{1,3})$/, '$1.$2');
}

export function maskCurrency(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length === 0) {
    return '';
  }

  const numericValue = parseInt(digits, 10);
  const formatted = (numericValue / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `R$ ${formatted}`;
}

export function maskCNJ(value: string): string {
  const digits = onlyDigits(value).slice(0, 20);
  return digits
    .replace(/(\d{7})(\d)/, '$1-$2')
    .replace(/(-\d{2})(\d)/, '$1.$2')
    .replace(/(\.\d{4})(\d)/, '$1.$2')
    .replace(/(\.\d{4}\.\d)(\d)/, '$1.$2')
    .replace(/(\.\d{4}\.\d\.\d{2})(\d)/, '$1.$2');
}

export function unmask(value: string): string {
  return onlyDigits(value);
}

export function unmaskCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const masks: Record<string, MaskFunction> = {
  cpf: maskCPF,
  cnpj: maskCNPJ,
  cpfOrCnpj: maskCPFOrCNPJ,
  phone: maskPhone,
  cep: maskCEP,
  oab: maskOAB,
  currency: maskCurrency,
  cnj: maskCNJ,
};

export function applyMask(maskName: string, value: string): string {
  const maskFn = masks[maskName];
  if (!maskFn) {
    return value;
  }
  return maskFn(value);
}
