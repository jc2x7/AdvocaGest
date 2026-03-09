import { Lead, LeadSource, LeadStage, LEAD_SOURCES, LEAD_STAGES } from '../../types/lead';
import { getLeads } from '../firebase/leadService';
import { differenceInDays } from 'date-fns';

export interface LeadsBySourceReport {
  source: LeadSource;
  label: string;
  count: number;
  percentage: number;
}

export interface ConversionRateReport {
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  activeLeads: number;
  conversionRate: number;
  lossRate: number;
}

export interface FunnelStageReport {
  stage: LeadStage;
  label: string;
  count: number;
  color: string;
  percentage: number;
}

export interface AverageTimePerStageReport {
  stage: LeadStage;
  label: string;
  averageDays: number;
}

export interface LossReasonsReport {
  reason: string;
  count: number;
  percentage: number;
}

export interface LeadROIReport {
  source: LeadSource;
  label: string;
  totalLeads: number;
  wonLeads: number;
  estimatedRevenue: number;
  conversionRate: number;
}

function filterByPeriod(leads: Lead[], startDate: Date, endDate: Date): Lead[] {
  return leads.filter((l) => l.createdAt >= startDate && l.createdAt <= endDate);
}

export async function getLeadsBySource(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<LeadsBySourceReport[]> {
  const allLeads = await getLeads(ownerUid);
  const filtered = filterByPeriod(allLeads, startDate, endDate);
  const total = filtered.length;

  const sourceMap = new Map<LeadSource, number>();
  filtered.forEach((l) => {
    sourceMap.set(l.source, (sourceMap.get(l.source) ?? 0) + 1);
  });

  return Array.from(sourceMap.entries())
    .map(([source, count]) => ({
      source,
      label: LEAD_SOURCES.find((s) => s.value === source)?.label ?? source,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getConversionRate(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<ConversionRateReport> {
  const allLeads = await getLeads(ownerUid);
  const filtered = filterByPeriod(allLeads, startDate, endDate);

  const totalLeads = filtered.length;
  const wonLeads = filtered.filter((l) => l.stage === 'won').length;
  const lostLeads = filtered.filter((l) => l.stage === 'lost').length;
  const activeLeads = filtered.filter(
    (l) => l.stage !== 'won' && l.stage !== 'lost'
  ).length;

  const closedLeads = wonLeads + lostLeads;
  return {
    totalLeads,
    wonLeads,
    lostLeads,
    activeLeads,
    conversionRate: closedLeads > 0 ? (wonLeads / closedLeads) * 100 : 0,
    lossRate: closedLeads > 0 ? (lostLeads / closedLeads) * 100 : 0,
  };
}

export async function getFunnelData(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<FunnelStageReport[]> {
  const allLeads = await getLeads(ownerUid);
  const filtered = filterByPeriod(allLeads, startDate, endDate);
  const total = filtered.length;

  const stageMap = new Map<LeadStage, number>();
  filtered.forEach((l) => {
    stageMap.set(l.stage, (stageMap.get(l.stage) ?? 0) + 1);
  });

  return LEAD_STAGES.map((s) => ({
    stage: s.value,
    label: s.label,
    count: stageMap.get(s.value) ?? 0,
    color: s.color,
    percentage: total > 0 ? ((stageMap.get(s.value) ?? 0) / total) * 100 : 0,
  }));
}

export async function getAverageTimePerStage(
  ownerUid: string
): Promise<AverageTimePerStageReport[]> {
  const allLeads = await getLeads(ownerUid);
  const completedLeads = allLeads.filter((l) => l.stage === 'won' || l.stage === 'lost');

  const stagesInOrder: LeadStage[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation'];
  const stageLabels: Record<LeadStage, string> = {
    new: 'Novo',
    contacted: 'Contatado',
    qualified: 'Qualificado',
    proposal: 'Proposta',
    negotiation: 'Negociacao',
    won: 'Ganho',
    lost: 'Perdido',
  };

  // Estimate average time as total duration divided by number of stages traversed
  return stagesInOrder.map((stage) => {
    const relevantLeads = completedLeads.filter((l) => {
      const stageIndex = stagesInOrder.indexOf(stage);
      const leadFinalStageIndex = l.stage === 'won' ? stagesInOrder.length : stagesInOrder.length;
      return stageIndex < leadFinalStageIndex;
    });

    if (relevantLeads.length === 0) {
      return { stage, label: stageLabels[stage], averageDays: 0 };
    }

    const totalDays = relevantLeads.reduce((sum, l) => {
      const totalDuration = differenceInDays(l.updatedAt, l.createdAt);
      const stages = stagesInOrder.length;
      return sum + Math.max(1, Math.round(totalDuration / stages));
    }, 0);

    return {
      stage,
      label: stageLabels[stage],
      averageDays: Math.round(totalDays / relevantLeads.length),
    };
  });
}

export async function getLossReasons(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<LossReasonsReport[]> {
  const allLeads = await getLeads(ownerUid);
  const filtered = filterByPeriod(allLeads, startDate, endDate);
  const lostLeads = filtered.filter((l) => l.stage === 'lost');
  const total = lostLeads.length;

  const reasonMap = new Map<string, number>();
  lostLeads.forEach((l) => {
    const reason = l.lostReason ?? 'Nao informado';
    reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
  });

  return Array.from(reasonMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getLeadROI(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<LeadROIReport[]> {
  const allLeads = await getLeads(ownerUid);
  const filtered = filterByPeriod(allLeads, startDate, endDate);

  const sourceMap = new Map<
    LeadSource,
    { total: number; won: number; revenue: number }
  >();

  filtered.forEach((l) => {
    const existing = sourceMap.get(l.source) ?? { total: 0, won: 0, revenue: 0 };
    existing.total += 1;
    if (l.stage === 'won') {
      existing.won += 1;
      existing.revenue += l.estimatedValue ?? 0;
    }
    sourceMap.set(l.source, existing);
  });

  return Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      label: LEAD_SOURCES.find((s) => s.value === source)?.label ?? source,
      totalLeads: data.total,
      wonLeads: data.won,
      estimatedRevenue: data.revenue,
      conversionRate: data.total > 0 ? (data.won / data.total) * 100 : 0,
    }))
    .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
}
