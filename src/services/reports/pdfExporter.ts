import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface PDFTableColumn {
  header: string;
  accessor: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  period?: string;
  columns: PDFTableColumn[];
  rows: Record<string, string | number>[];
  summaryCards?: { label: string; value: string }[];
  footerNote?: string;
}

function escapeHtml(text: string | number): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildHtml(options: PDFExportOptions): string {
  const summaryHtml = options.summaryCards
    ? `<div class="summary-row">
        ${options.summaryCards
          .map(
            (card) => `
          <div class="summary-card">
            <div class="summary-label">${escapeHtml(card.label)}</div>
            <div class="summary-value">${escapeHtml(card.value)}</div>
          </div>`
          )
          .join('')}
      </div>`
    : '';

  const tableHeaders = options.columns
    .map(
      (col) =>
        `<th style="width:${col.width ?? 'auto'}; text-align:${col.align ?? 'left'}">${escapeHtml(col.header)}</th>`
    )
    .join('');

  const tableRows = options.rows
    .map(
      (row) =>
        `<tr>${options.columns
          .map(
            (col) =>
              `<td style="text-align:${col.align ?? 'left'}">${escapeHtml(row[col.accessor] ?? '')}</td>`
          )
          .join('')}</tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 32px; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1e3a5f; padding-bottom: 16px; }
        .title { font-size: 22px; font-weight: 700; color: #1e3a5f; }
        .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
        .period { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .summary-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .summary-card { flex: 1; min-width: 120px; background: #f1f5f9; border-radius: 8px; padding: 12px; text-align: center; }
        .summary-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
        .summary-value { font-size: 18px; font-weight: 700; color: #1e3a5f; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #1e3a5f; color: #ffffff; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${escapeHtml(options.title)}</div>
        ${options.subtitle ? `<div class="subtitle">${escapeHtml(options.subtitle)}</div>` : ''}
        ${options.period ? `<div class="period">Periodo: ${escapeHtml(options.period)}</div>` : ''}
      </div>
      ${summaryHtml}
      <table>
        <thead><tr>${tableHeaders}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      ${options.footerNote ? `<div class="footer">${escapeHtml(options.footerNote)}</div>` : ''}
      <div class="footer">Gerado por AdvogaPlan em ${new Date().toLocaleDateString('pt-BR')}</div>
    </body>
    </html>
  `;
}

export async function exportReportToPDF(options: PDFExportOptions): Promise<string> {
  const html = buildHtml(options);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function exportAndSharePDF(options: PDFExportOptions): Promise<void> {
  const uri = await exportReportToPDF(options);
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: options.title,
      UTI: 'com.adobe.pdf',
    });
  }
}

export async function printReport(options: PDFExportOptions): Promise<void> {
  const html = buildHtml(options);
  await Print.printAsync({ html });
}
