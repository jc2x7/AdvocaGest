import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatCurrency } from '../../utils/currency';
import { formatDateLong } from '../../utils/dateUtils';
import { OfficeData, UserProfile } from '../../types/auth';

export interface ReceiptData {
  number: string;
  clientName: string;
  clientCpfCnpj: string;
  value: number;
  description: string;
  paymentMethod: string;
  date: Date;
  caseReference?: string;
}

function numberToWords(value: number): string {
  const units = ['', 'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  if (value === 0) return 'zero';

  function convertGroup(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    const parts: string[] = [];
    if (n >= 100) {
      parts.push(hundreds[Math.floor(n / 100)]);
      n = n % 100;
    }
    if (n >= 20) {
      parts.push(tens[Math.floor(n / 10)]);
      n = n % 10;
    }
    if (n >= 10) {
      parts.push(teens[n - 10]);
      n = 0;
    }
    if (n > 0) {
      parts.push(units[n]);
    }
    return parts.join(' e ');
  }

  const integerPart = Math.floor(value);
  const centsPart = Math.round((value - integerPart) * 100);

  const parts: string[] = [];

  if (integerPart >= 1000) {
    const thousands = Math.floor(integerPart / 1000);
    if (thousands === 1) {
      parts.push('mil');
    } else {
      parts.push(`${convertGroup(thousands)} mil`);
    }
    const remainder = integerPart % 1000;
    if (remainder > 0) {
      parts.push(convertGroup(remainder));
    }
  } else if (integerPart > 0) {
    parts.push(convertGroup(integerPart));
  }

  let result = parts.join(' e ');
  if (integerPart === 1) {
    result += ' real';
  } else if (integerPart > 1) {
    result += ' reais';
  }

  if (centsPart > 0) {
    if (integerPart > 0) {
      result += ' e ';
    }
    result += convertGroup(centsPart);
    result += centsPart === 1 ? ' centavo' : ' centavos';
  }

  if (integerPart === 0 && centsPart === 0) {
    return 'zero reais';
  }

  return result;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildReceiptHtml(
  receipt: ReceiptData,
  office: OfficeData | null,
  user: UserProfile | null
): string {
  const officeName = office?.name ?? 'Escritorio de Advocacia';
  const officeAddress = office?.address
    ? `${office.address.street}, ${office.address.number}${office.address.complement ? ` - ${office.address.complement}` : ''}, ${office.address.neighborhood}, ${office.address.city}/${office.address.state} - CEP: ${office.address.cep}`
    : '';
  const officePhone = office?.phone ?? '';
  const officeEmail = office?.email ?? '';
  const officeCnpj = office?.cnpj ?? '';
  const logoHtml = office?.logo
    ? `<img src="${office.logo}" class="logo" alt="Logo" />`
    : '';

  const lawyerName = user?.name ?? '';
  const oabInfo = user ? `OAB/${user.oabState} ${user.oabNumber}` : '';

  const valueInWords = numberToWords(receipt.value);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; color: #1a1a1a; padding: 40px; }
        .logo { max-height: 60px; margin-bottom: 8px; }
        .header { text-align: center; border-bottom: 3px double #1e3a5f; padding-bottom: 16px; margin-bottom: 24px; }
        .office-name { font-size: 20px; font-weight: 700; color: #1e3a5f; }
        .office-info { font-size: 11px; color: #4a5568; margin-top: 4px; }
        .receipt-title { font-size: 18px; font-weight: 700; text-align: center; margin: 20px 0; text-transform: uppercase; color: #1e3a5f; }
        .receipt-number { text-align: center; font-size: 13px; color: #64748b; margin-bottom: 20px; }
        .content { line-height: 2; font-size: 14px; text-align: justify; margin: 16px 0 32px; }
        .value-highlight { font-weight: 700; font-size: 15px; color: #1e3a5f; }
        .value-words { font-style: italic; }
        .signature-area { margin-top: 60px; text-align: center; }
        .signature-line { border-top: 1px solid #1a1a1a; width: 300px; margin: 0 auto; padding-top: 4px; }
        .signature-name { font-size: 14px; font-weight: 600; }
        .signature-oab { font-size: 12px; color: #4a5568; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoHtml}
        <div class="office-name">${escapeHtml(officeName)}</div>
        ${officeCnpj ? `<div class="office-info">CNPJ: ${escapeHtml(officeCnpj)}</div>` : ''}
        ${officeAddress ? `<div class="office-info">${escapeHtml(officeAddress)}</div>` : ''}
        ${officePhone || officeEmail ? `<div class="office-info">${escapeHtml([officePhone, officeEmail].filter(Boolean).join(' | '))}</div>` : ''}
      </div>

      <div class="receipt-title">Recibo de Honorarios Advocaticios</div>
      <div class="receipt-number">N. ${escapeHtml(receipt.number)}</div>

      <div class="content">
        <p>
          Recebi de <strong>${escapeHtml(receipt.clientName)}</strong>
          ${receipt.clientCpfCnpj ? `, inscrito(a) no CPF/CNPJ sob o n. ${escapeHtml(receipt.clientCpfCnpj)}` : ''}
          , a importancia de <span class="value-highlight">${escapeHtml(formatCurrency(receipt.value))}</span>
          (<span class="value-words">${escapeHtml(valueInWords)}</span>),
          referente a ${escapeHtml(receipt.description)}${receipt.caseReference ? `, processo n. ${escapeHtml(receipt.caseReference)}` : ''}.
        </p>
        <p style="margin-top: 12px;">
          Forma de pagamento: <strong>${escapeHtml(receipt.paymentMethod)}</strong>.
        </p>
        <p style="margin-top: 12px;">
          Para maior clareza, firmo o presente recibo.
        </p>
        <p style="margin-top: 20px; text-align: right;">
          ${officeAddress ? escapeHtml(office?.address?.city ?? '') + ', ' : ''}${escapeHtml(formatDateLong(receipt.date))}.
        </p>
      </div>

      <div class="signature-area">
        <div class="signature-line">
          <div class="signature-name">${escapeHtml(lawyerName)}</div>
          <div class="signature-oab">${escapeHtml(oabInfo)}</div>
        </div>
      </div>

      <div class="footer">Documento gerado por AdvogaPlan</div>
    </body>
    </html>
  `;
}

export async function generateReceiptPDF(
  receipt: ReceiptData,
  office: OfficeData | null,
  user: UserProfile | null
): Promise<string> {
  const html = buildReceiptHtml(receipt, office, user);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function generateAndShareReceipt(
  receipt: ReceiptData,
  office: OfficeData | null,
  user: UserProfile | null
): Promise<void> {
  const uri = await generateReceiptPDF(receipt, office, user);
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Recibo ${receipt.number}`,
      UTI: 'com.adobe.pdf',
    });
  }
}
