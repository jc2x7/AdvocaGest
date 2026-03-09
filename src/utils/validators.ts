// Funcoes de validacao com algoritmos reais

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function allSameDigit(digits: string): boolean {
  return digits.split('').every((d) => d === digits[0]);
}

export function validateCPF(cpf: string): boolean {
  const digits = onlyDigits(cpf);

  if (digits.length !== 11) {
    return false;
  }

  if (allSameDigit(digits)) {
    return false;
  }

  // Calculo do primeiro digito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }
  if (remainder !== parseInt(digits[9], 10)) {
    return false;
  }

  // Calculo do segundo digito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }
  if (remainder !== parseInt(digits[10], 10)) {
    return false;
  }

  return true;
}

export function validateCNPJ(cnpj: string): boolean {
  const digits = onlyDigits(cnpj);

  if (digits.length !== 14) {
    return false;
  }

  if (allSameDigit(digits)) {
    return false;
  }

  // Pesos para o primeiro digito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i], 10) * weights1[i];
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  if (firstDigit !== parseInt(digits[12], 10)) {
    return false;
  }

  // Pesos para o segundo digito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i], 10) * weights2[i];
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  if (secondDigit !== parseInt(digits[13], 10)) {
    return false;
  }

  return true;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  const digits = onlyDigits(phone);

  // Telefone brasileiro: 10 digitos (fixo) ou 11 digitos (celular)
  if (digits.length !== 10 && digits.length !== 11) {
    return false;
  }

  // DDD valido: 11 a 99
  const ddd = parseInt(digits.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return false;
  }

  // Celular deve comecar com 9
  if (digits.length === 11 && digits[2] !== '9') {
    return false;
  }

  return true;
}

export function validateCNJ(cnj: string): boolean {
  const digits = onlyDigits(cnj);

  // Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO (20 digitos)
  if (digits.length !== 20) {
    return false;
  }

  const nnnnnnn = digits.substring(0, 7);
  const dd = digits.substring(7, 9);
  const aaaa = digits.substring(9, 13);
  const j = digits.substring(13, 14);
  const tr = digits.substring(14, 16);
  const oooo = digits.substring(16, 20);

  // Validacao do digito verificador conforme Resolucao 65 do CNJ
  // Resto = (NNNNNNN * 10^13 + AAAA * 10^9 + J * 10^8 + TR * 10^6 + OOOO * 10^2 + DD) mod 97
  // O resultado deve ser 1

  const remainder = calculateCNJRemainder(nnnnnnn, aaaa, j, tr, oooo, dd);
  return remainder === 1;
}

function calculateCNJRemainder(
  nnnnnnn: string,
  aaaa: string,
  j: string,
  tr: string,
  oooo: string,
  dd: string
): number {
  // Calculo modular segmentado para evitar overflow
  let remainder = parseInt(nnnnnnn, 10) % 97;
  remainder = (remainder * 10000 + parseInt(aaaa, 10)) % 97;
  remainder = (remainder * 10 + parseInt(j, 10)) % 97;
  remainder = (remainder * 100 + parseInt(tr, 10)) % 97;
  remainder = (remainder * 10000 + parseInt(oooo, 10)) % 97;
  remainder = (remainder * 100 + parseInt(dd, 10)) % 97;
  return remainder;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
}

export function validateRequired(value: string, fieldName: string): ValidationResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: `${fieldName} e obrigatorio` };
  }
  return { valid: true, message: '' };
}

export function validateMinLength(value: string, min: number, fieldName: string): ValidationResult {
  if (value.trim().length < min) {
    return { valid: false, message: `${fieldName} deve ter no minimo ${min} caracteres` };
  }
  return { valid: true, message: '' };
}

export function validateMaxLength(value: string, max: number, fieldName: string): ValidationResult {
  if (value.trim().length > max) {
    return { valid: false, message: `${fieldName} deve ter no maximo ${max} caracteres` };
  }
  return { valid: true, message: '' };
}
