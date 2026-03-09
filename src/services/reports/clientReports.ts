import { Client } from '../../types/client';
import { LegalArea } from '../../types/case';
import { getClients } from '../firebase/clientService';
import { getFinancialEntriesByDateRange } from '../firebase/financialService';
import { format, eachMonthOfInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ActiveInactiveReport {
  active: number;
  inactive: number;
  prospect: number;
  total: number;
}

export interface NewClientsPerMonthReport {
  month: string;
  monthLabel: string;
  count: number;
}

export interface ClientsByAreaReport {
  area: string;
  count: number;
  percentage: number;
}

export interface ClientBillingRankingReport {
  clientId: string;
  clientName: string;
  totalBilled: number;
  casesCount: number;
}

function filterByPeriod(clients: Client[], startDate: Date, endDate: Date): Client[] {
  return clients.filter((c) => c.createdAt >= startDate && c.createdAt <= endDate);
}

export async function getActiveInactiveCount(
  ownerUid: string
): Promise<ActiveInactiveReport> {
  const clients = await getClients(ownerUid);

  const active = clients.filter((c) => c.status === 'active').length;
  const inactive = clients.filter((c) => c.status === 'inactive').length;
  const prospect = clients.filter((c) => c.status === 'prospect').length;

  return {
    active,
    inactive,
    prospect,
    total: clients.length,
  };
}

export async function getNewClientsPerMonth(
  ownerUid: string,
  months: number = 12
): Promise<NewClientsPerMonthReport[]> {
  const now = new Date();
  const startDate = startOfMonth(subMonths(now, months - 1));
  const endDate = endOfMonth(now);

  const clients = await getClients(ownerUid);
  const filtered = filterByPeriod(clients, startDate, endDate);

  const monthMap = new Map<string, number>();
  filtered.forEach((c) => {
    const key = format(c.createdAt, 'yyyy-MM');
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  });

  const monthRange = eachMonthOfInterval({ start: startDate, end: endDate });
  return monthRange.map((monthDate) => {
    const key = format(monthDate, 'yyyy-MM');
    return {
      month: key,
      monthLabel: format(monthDate, 'MMM/yy', { locale: ptBR }),
      count: monthMap.get(key) ?? 0,
    };
  });
}

export async function getClientsByArea(
  ownerUid: string
): Promise<ClientsByAreaReport[]> {
  const clients = await getClients(ownerUid);
  const total = clients.length;

  const areaMap = new Map<string, number>();
  clients.forEach((c) => {
    const areas = c.areasOfInterest ?? [];
    areas.forEach((area) => {
      areaMap.set(area, (areaMap.get(area) ?? 0) + 1);
    });
    if (areas.length === 0) {
      areaMap.set('Nao especificado', (areaMap.get('Nao especificado') ?? 0) + 1);
    }
  });

  return Array.from(areaMap.entries())
    .map(([area, count]) => ({
      area,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getClientBillingRanking(
  ownerUid: string,
  startDate: Date,
  endDate: Date,
  topN: number = 10
): Promise<ClientBillingRankingReport[]> {
  const entries = await getFinancialEntriesByDateRange(ownerUid, startDate, endDate);
  const incomeEntries = entries.filter((e) => e.type === 'income' && e.clientId);

  const clientMap = new Map<string, { name: string; total: number; cases: Set<string> }>();
  incomeEntries.forEach((e) => {
    const clientId = e.clientId as string;
    const existing = clientMap.get(clientId) ?? {
      name: e.clientName ?? 'Desconhecido',
      total: 0,
      cases: new Set<string>(),
    };
    existing.total += e.value;
    if (e.caseId) {
      existing.cases.add(e.caseId);
    }
    clientMap.set(clientId, existing);
  });

  return Array.from(clientMap.entries())
    .map(([clientId, data]) => ({
      clientId,
      clientName: data.name,
      totalBilled: data.total,
      casesCount: data.cases.size,
    }))
    .sort((a, b) => b.totalBilled - a.totalBilled)
    .slice(0, topN);
}
