import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatCurrency } from '../../utils/currency';
import { formatDateLong } from '../../utils/dateUtils';
import { OfficeData, UserProfile } from '../../types/auth';

export interface ProposalService {
  description: string;
  value: number;
}

export interface ProposalData {
  clientName: string;
  clientEmail?: string;
  area: string;
  description: string;
  services: ProposalService[];
  totalValue: number;
  paymentTerms: string;
  validityDays: number;
  observations?: string;
  date: Date;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildProposalHtml(
  proposal: ProposalData,
  office: OfficeData | null,
  user: UserProfile | null
): string {
  const officeName = office?.name ?? 'Escritorio de Advocacia';
  const officeAddress = office?.address
    ? `${office.address.street}, ${office.address.number}${office.address.complement ? ` - ${office.address.complement}` : ''}, ${office.address.neighborhood}, ${office.address.city}/${office.address.state} - CEP: ${office.address.cep}`
    : '';
  const officePhone = office?.phone ?? '';
  const officeEmail = office?.email ?? '';
  const logoHtml = office?.logo
    ? `<img src="${office.logo}" class="logo" alt="Logo" />`
    : '';

  const lawyerName = user?.name ?? '';
  const oabInfo = user ? `OAB/${user.oabState} ${user.oabNumber}` : '';

  const servicesRows = proposal.services
    .map(
      (s, i) => `
      <tr>
        <td style="text-align: center">${i + 1}</td>
        <td>${escapeHtml(s.description)}</td>
        <td style="text-align: right">${escapeHtml(formatCurrency(s.value))}</td>
      </tr>`
    )
    .join('');

  const validityDate = new Date(proposal.date);
  validityDate.setDate(validityDate.getDate() + proposal.validityDays);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; padding: 40px; line-height: 1.6; }
        .logo { max-height: 60px; margin-bottom: 8px; }
        .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 32px; }
        .office-name { font-size: 22px; font-weight: 700; color: #1e3a5f; }
        .office-info { font-size: 11px; color: #4a5568; margin-top: 2px; }
        .proposal-badge { display: inline-block; background: #1e3a5f; color: #ffffff; padding: 6px 24px; border-radius: 4px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 14px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 12px; letter-spacing: 0.5px; }
        .info-row { display: flex; margin-bottom: 6px; font-size: 13px; }
        .info-label { font-weight: 600; min-width: 140px; color: #4a5568; }
        .info-value { color: #1a1a1a; }
        .description { font-size: 13px; text-align: justify; color: #374151; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #1e3a5f; color: #ffffff; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        tr:nth-child(even) { background: #f8fafc; }
        .total-row { font-weight: 700; font-size: 15px; background: #f1f5f9 !important; }
        .total-value { color: #1e3a5f; }
        .terms { font-size: 12px; color: #4a5568; background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 3px solid #c5a55a; }
        .signature-area { margin-top: 48px; display: flex; justify-content: space-between; }
        .signature-block { text-align: center; width: 45%; }
        .signature-line { border-top: 1px solid #1a1a1a; padding-top: 4px; margin-top: 40px; }
        .signature-name { font-size: 13px; font-weight: 600; }
        .signature-role { font-size: 11px; color: #4a5568; }
        .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        .validity { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 16px; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoHtml}
        <div class="office-name">${escapeHtml(officeName)}</div>
        ${officeAddress ? `<div class="office-info">${escapeHtml(officeAddress)}</div>` : ''}
        ${officePhone || officeEmail ? `<div class="office-info">${escapeHtml([officePhone, officeEmail].filter(Boolean).join(' | '))}</div>` : ''}
      </div>

      <div style="text-align: center">
        <span class="proposal-badge">Proposta Comercial</span>
      </div>

      <div class="section">
        <div class="section-title">Dados do Cliente</div>
        <div class="info-row">
          <span class="info-label">Nome:</span>
          <span class="info-value">${escapeHtml(proposal.clientName)}</span>
        </div>
        ${proposal.clientEmail ? `
        <div class="info-row">
          <span class="info-label">E-mail:</span>
          <span class="info-value">${escapeHtml(proposal.clientEmail)}</span>
        </div>` : ''}
        <div class="info-row">
          <span class="info-label">Area:</span>
          <span class="info-value">${escapeHtml(proposal.area)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data:</span>
          <span class="info-value">${escapeHtml(formatDateLong(proposal.date))}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Descricao do Caso</div>
        <p class="description">${escapeHtml(proposal.description)}</p>
      </div>

      <div class="section">
        <div class="section-title">Servicos e Honorarios</div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px; text-align: center">#</th>
              <th>Descricao do Servico</th>
              <th style="width: 140px; text-align: right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${servicesRows}
            <tr class="total-row">
              <td colspan="2" style="text-align: right">Total:</td>
              <td style="text-align: right" class="total-value">${escapeHtml(formatCurrency(proposal.totalValue))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Condicoes de Pagamento</div>
        <div class="terms">${escapeHtml(proposal.paymentTerms)}</div>
      </div>

      ${proposal.observations ? `
      <div class="section">
        <div class="section-title">Observacoes</div>
        <p class="description">${escapeHtml(proposal.observations)}</p>
      </div>` : ''}

      <div class="validity">
        Esta proposta e valida por ${proposal.validityDays} dias, ate ${escapeHtml(formatDateLong(validityDate))}.
      </div>

      <div class="signature-area">
        <div class="signature-block">
          <div class="signature-line">
            <div class="signature-name">${escapeHtml(lawyerName)}</div>
            <div class="signature-role">${escapeHtml(oabInfo)}</div>
          </div>
        </div>
        <div class="signature-block">
          <div class="signature-line">
            <div class="signature-name">${escapeHtml(proposal.clientName)}</div>
            <div class="signature-role">Contratante</div>
          </div>
        </div>
      </div>

      <div class="footer">Documento gerado por AdvogaPlan</div>
    </body>
    </html>
  `;
}

export async function generateProposalPDF(
  proposal: ProposalData,
  office: OfficeData | null,
  user: UserProfile | null
): Promise<string> {
  const html = buildProposalHtml(proposal, office, user);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function generateAndShareProposal(
  proposal: ProposalData,
  office: OfficeData | null,
  user: UserProfile | null
): Promise<void> {
  const uri = await generateProposalPDF(proposal, office, user);
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Proposta - ${proposal.clientName}`,
      UTI: 'com.adobe.pdf',
    });
  }
}
