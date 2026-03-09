import { FinancialEntry } from '../../types/financial';
import {
  getFinancialEntries,
  getFinancialEntriesByDateRange,
} from '../firebase/financialService';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface MonthlyRevenueReport {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface ExpenseByCategoryReport {
  category: string;
  total: number;
  percentage: number;
}

export interface CashFlowReport {
  month: string;
  monthLabel: string;
  inflow: number;
  outflow: number;
  balance: number;
  cumulativeBalance: number;
}

export interface DREReport {
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  custoServicos: number;
  lucroBruto: number;
  despesasOperacionais: number;
  resultadoOperacional: number;
  periodo: string;
}

export interface ProfitabilityReport {
  clientId: string;
  clientName: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

export interface ProjectionReport {
  month: string;
  monthLabel: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedProfit: number;
}

function groupByMonth(entries: FinancialEntry[]): Map<string, FinancialEntry[]> {
  const grouped = new Map<string, FinancialEntry[]>();
  entries.forEach((entry) => {
    const key = format(entry.date, 'yyyy-MM');
    const existing = grouped.get(key) ?? [];
    existing.push(entry);
    grouped.set(key, existing);
  });
  return grouped;
}

export async function getMonthlyRevenue(
  ownerUid: string,
  months: number = 12
): Promise<MonthlyRevenueReport[]> {
  const now = new Date();
  const startDate = startOfMonth(subMonths(now, months - 1));
  const endDate = endOfMonth(now);

  const entries = await getFinancialEntriesByDateRange(ownerUid, startDate, endDate);
  const grouped = groupByMonth(entries);

  const monthRange = eachMonthOfInterval({ start: startDate, end: endDate });

  return monthRange.map((monthDate) => {
    const key = format(monthDate, 'yyyy-MM');
    const monthEntries = grouped.get(key) ?? [];
    const income = monthEntries
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + e.value, 0);
    const expenses = monthEntries
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + e.value, 0);

    return {
      month: key,
      monthLabel: format(monthDate, 'MMM/yy', { locale: ptBR }),
      income,
      expenses,
      profit: income - expenses,
    };
  });
}

export async function getExpensesByCategory(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<ExpenseByCategoryReport[]> {
  const entries = await getFinancialEntriesByDateRange(ownerUid, startDate, endDate);
  const expenseEntries = entries.filter((e) => e.type === 'expense');
  const total = expenseEntries.reduce((sum, e) => sum + e.value, 0);

  const categoryMap = new Map<string, number>();
  expenseEntries.forEach((e) => {
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.value);
  });

  return Array.from(categoryMap.entries())
    .map(([category, catTotal]) => ({
      category,
      total: catTotal,
      percentage: total > 0 ? (catTotal / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export async function getCashFlow(
  ownerUid: string,
  months: number = 12
): Promise<CashFlowReport[]> {
  const now = new Date();
  const startDate = startOfMonth(subMonths(now, months - 1));
  const endDate = endOfMonth(now);

  const entries = await getFinancialEntriesByDateRange(ownerUid, startDate, endDate);
  const grouped = groupByMonth(entries);
  const monthRange = eachMonthOfInterval({ start: startDate, end: endDate });

  let cumulative = 0;
  return monthRange.map((monthDate) => {
    const key = format(monthDate, 'yyyy-MM');
    const monthEntries = grouped.get(key) ?? [];
    const inflow = monthEntries
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + e.value, 0);
    const outflow = monthEntries
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + e.value, 0);
    const balance = inflow - outflow;
    cumulative += balance;

    return {
      month: key,
      monthLabel: format(monthDate, 'MMM/yy', { locale: ptBR }),
      inflow,
      outflow,
      balance,
      cumulativeBalance: cumulative,
    };
  });
}

export async function getDRE(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<DREReport> {
  const entries = await getFinancialEntriesByDateRange(ownerUid, startDate, endDate);

  const receitaBruta = entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.value, 0);

  const allExpenses = entries.filter((e) => e.type === 'expense');
  const custoServicos = allExpenses
    .filter((e) => e.category === 'Custas Processuais' || e.category === 'Pericia')
    .reduce((sum, e) => sum + e.value, 0);

  const despesasOperacionais = allExpenses
    .filter((e) => e.category !== 'Custas Processuais' && e.category !== 'Pericia' && e.category !== 'Impostos')
    .reduce((sum, e) => sum + e.value, 0);

  const deducoes = allExpenses
    .filter((e) => e.category === 'Impostos')
    .reduce((sum, e) => sum + e.value, 0);

  const receitaLiquida = receitaBruta - deducoes;
  const lucroBruto = receitaLiquida - custoServicos;
  const resultadoOperacional = lucroBruto - despesasOperacionais;

  return {
    receitaBruta,
    deducoes,
    receitaLiquida,
    custoServicos,
    lucroBruto,
    despesasOperacionais,
    resultadoOperacional,
    periodo: `${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`,
  };
}

export async function getProfitabilityByClient(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<ProfitabilityReport[]> {
  const entries = await getFinancialEntriesByDateRange(ownerUid, startDate, endDate);
  const clientEntries = entries.filter((e) => e.clientId);

  const clientMap = new Map<string, { name: string; income: number; expense: number }>();
  clientEntries.forEach((e) => {
    const clientId = e.clientId as string;
    const existing = clientMap.get(clientId) ?? {
      name: e.clientName ?? 'Desconhecido',
      income: 0,
      expense: 0,
    };
    if (e.type === 'income') {
      existing.income += e.value;
    } else {
      existing.expense += e.value;
    }
    clientMap.set(clientId, existing);
  });

  return Array.from(clientMap.entries())
    .map(([clientId, data]) => {
      const profit = data.income - data.expense;
      return {
        clientId,
        clientName: data.name,
        revenue: data.income,
        expenses: data.expense,
        profit,
        margin: data.income > 0 ? (profit / data.income) * 100 : 0,
      };
    })
    .sort((a, b) => b.profit - a.profit);
}

export async function getRevenueProjection(
  ownerUid: string,
  futureMonths: number = 6
): Promise<ProjectionReport[]> {
  const pastRevenue = await getMonthlyRevenue(ownerUid, 6);
  const validMonths = pastRevenue.filter((m) => m.income > 0 || m.expenses > 0);

  const avgIncome =
    validMonths.length > 0
      ? validMonths.reduce((s, m) => s + m.income, 0) / validMonths.length
      : 0;
  const avgExpenses =
    validMonths.length > 0
      ? validMonths.reduce((s, m) => s + m.expenses, 0) / validMonths.length
      : 0;

  const now = new Date();
  const results: ProjectionReport[] = [];
  for (let i = 1; i <= futureMonths; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    results.push({
      month: format(futureDate, 'yyyy-MM'),
      monthLabel: format(futureDate, 'MMM/yy', { locale: ptBR }),
      projectedIncome: Math.round(avgIncome * 100) / 100,
      projectedExpenses: Math.round(avgExpenses * 100) / 100,
      projectedProfit: Math.round((avgIncome - avgExpenses) * 100) / 100,
    });
  }

  return results;
}
