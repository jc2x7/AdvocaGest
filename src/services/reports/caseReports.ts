import { LegalCase, LegalArea, CasePhase, CaseResult } from '../../types/case';
import { getCases } from '../firebase/caseService';
import { differenceInDays } from 'date-fns';

export interface CasesByAreaReport {
  area: LegalArea;
  label: string;
  count: number;
  percentage: number;
}

export interface CasesByPhaseReport {
  phase: CasePhase;
  label: string;
  count: number;
  percentage: number;
}

export interface CasesByCourtReport {
  court: string;
  count: number;
  percentage: number;
}

export interface CasesByResultReport {
  result: CaseResult | 'pending';
  label: string;
  count: number;
  percentage: number;
}

export interface AverageDurationReport {
  area: LegalArea;
  label: string;
  averageDays: number;
  caseCount: number;
}

export interface StalledCaseReport {
  caseId: string;
  caseNumber: string;
  clientName: string;
  area: LegalArea;
  daysSinceLastMovement: number;
  lastMovementDate: Date | undefined;
}

const PHASE_LABELS: Record<CasePhase, string> = {
  conhecimento: 'Conhecimento',
  recursal: 'Recursal',
  execucao: 'Execucao',
  cumprimento_sentenca: 'Cumprimento de Sentenca',
};

const AREA_LABELS: Record<LegalArea, string> = {
  civil: 'Civil',
  trabalhista: 'Trabalhista',
  criminal: 'Criminal',
  previdenciario: 'Previdenciario',
  tributario: 'Tributario',
  familia: 'Familia',
  consumidor: 'Consumidor',
  administrativo: 'Administrativo',
  ambiental: 'Ambiental',
  empresarial: 'Empresarial',
};

const RESULT_LABELS: Record<CaseResult | 'pending', string> = {
  won: 'Ganho',
  lost: 'Perdido',
  settled: 'Acordo',
  dismissed: 'Arquivado',
  pending: 'Em andamento',
};

function filterByPeriod(cases: LegalCase[], startDate: Date, endDate: Date): LegalCase[] {
  return cases.filter((c) => c.createdAt >= startDate && c.createdAt <= endDate);
}

export async function getCasesByArea(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<CasesByAreaReport[]> {
  const allCases = await getCases(ownerUid);
  const filtered = filterByPeriod(allCases, startDate, endDate);
  const total = filtered.length;

  const areaMap = new Map<LegalArea, number>();
  filtered.forEach((c) => {
    areaMap.set(c.area, (areaMap.get(c.area) ?? 0) + 1);
  });

  return Array.from(areaMap.entries())
    .map(([area, count]) => ({
      area,
      label: AREA_LABELS[area],
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getCasesByPhase(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<CasesByPhaseReport[]> {
  const allCases = await getCases(ownerUid);
  const filtered = filterByPeriod(allCases, startDate, endDate);
  const total = filtered.length;

  const phaseMap = new Map<CasePhase, number>();
  filtered.forEach((c) => {
    phaseMap.set(c.phase, (phaseMap.get(c.phase) ?? 0) + 1);
  });

  return Array.from(phaseMap.entries())
    .map(([phase, count]) => ({
      phase,
      label: PHASE_LABELS[phase],
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getCasesByCourt(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<CasesByCourtReport[]> {
  const allCases = await getCases(ownerUid);
  const filtered = filterByPeriod(allCases, startDate, endDate);
  const total = filtered.length;

  const courtMap = new Map<string, number>();
  filtered.forEach((c) => {
    courtMap.set(c.court, (courtMap.get(c.court) ?? 0) + 1);
  });

  return Array.from(courtMap.entries())
    .map(([court, count]) => ({
      court,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getCasesByResult(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<CasesByResultReport[]> {
  const allCases = await getCases(ownerUid);
  const filtered = filterByPeriod(allCases, startDate, endDate);
  const total = filtered.length;

  const resultMap = new Map<CaseResult | 'pending', number>();
  filtered.forEach((c) => {
    const key = c.result ?? 'pending';
    resultMap.set(key, (resultMap.get(key) ?? 0) + 1);
  });

  return Array.from(resultMap.entries())
    .map(([result, count]) => ({
      result,
      label: RESULT_LABELS[result],
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getAverageDuration(
  ownerUid: string
): Promise<AverageDurationReport[]> {
  const allCases = await getCases(ownerUid);
  const closedCases = allCases.filter((c) => c.status === 'closed' && c.result);

  const areaGroups = new Map<LegalArea, number[]>();
  closedCases.forEach((c) => {
    const days = differenceInDays(c.updatedAt, c.createdAt);
    const existing = areaGroups.get(c.area) ?? [];
    existing.push(days);
    areaGroups.set(c.area, existing);
  });

  return Array.from(areaGroups.entries())
    .map(([area, durations]) => ({
      area,
      label: AREA_LABELS[area],
      averageDays: Math.round(durations.reduce((s, d) => s + d, 0) / durations.length),
      caseCount: durations.length,
    }))
    .sort((a, b) => b.averageDays - a.averageDays);
}

export async function getStalledCases(
  ownerUid: string,
  stalledThresholdDays: number = 30
): Promise<StalledCaseReport[]> {
  const allCases = await getCases(ownerUid);
  const activeCases = allCases.filter((c) => c.status === 'active');
  const now = new Date();

  return activeCases
    .map((c) => {
      const referenceDate = c.lastMovementDate ?? c.updatedAt;
      const daysSince = differenceInDays(now, referenceDate);
      return {
        caseId: c.id,
        caseNumber: c.caseNumber,
        clientName: c.clientName,
        area: c.area,
        daysSinceLastMovement: daysSince,
        lastMovementDate: c.lastMovementDate,
      };
    })
    .filter((r) => r.daysSinceLastMovement >= stalledThresholdDays)
    .sort((a, b) => b.daysSinceLastMovement - a.daysSinceLastMovement);
}
