import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useAuth } from '../store/AuthContext';
import {
  CASES,
  APPOINTMENTS,
  INSTALLMENTS,
  DEADLINES,
  FINANCIAL_ENTRIES,
} from '../services/firebase/collections';
import { LegalCase } from '../types/case';
import { Appointment } from '../types/appointment';
import { Installment } from '../types/financial';
import { Deadline } from '../types/deadline';

interface MonthlyRevenue {
  month: string;
  value: number;
}

interface ActivityItem {
  id: string;
  type: 'case' | 'appointment' | 'deadline' | 'financial';
  title: string;
  description: string;
  date: Date;
}

interface DashboardData {
  activeCasesCount: number;
  upcomingHearings: Appointment[];
  pendingFees: number;
  urgentDeadlines: Deadline[];
  revenueByMonth: MonthlyRevenue[];
  nextAppointments: Appointment[];
  recentActivities: ActivityItem[];
}

interface UseDashboardDataReturn {
  data: DashboardData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const EMPTY_DASHBOARD: DashboardData = {
  activeCasesCount: 0,
  upcomingHearings: [],
  pendingFees: 0,
  urgentDeadlines: [],
  revenueByMonth: [],
  nextAppointments: [],
  recentActivities: [],
};

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'string') return new Date(value);
  return new Date();
}

export function useDashboardData(): UseDashboardDataReturn {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!user) {
      setData(EMPTY_DASHBOARD);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    try {
      const [
        casesSnap,
        hearingsSnap,
        installmentsSnap,
        deadlinesSnap,
        revenueSnap,
        appointmentsSnap,
      ] = await Promise.all([
        // Active cases count
        getDocs(
          query(
            collection(db, CASES),
            where('owner_uid', '==', user.uid),
            where('status', '==', 'active'),
          ),
        ),

        // Upcoming hearings (next 7 days)
        getDocs(
          query(
            collection(db, APPOINTMENTS),
            where('owner_uid', '==', user.uid),
            where('type', '==', 'hearing'),
            where('status', '==', 'scheduled'),
            where('date', '>=', Timestamp.fromDate(now)),
            where('date', '<=', Timestamp.fromDate(sevenDaysLater)),
            orderBy('date', 'asc'),
            limit(10),
          ),
        ),

        // Pending installments
        getDocs(
          query(
            collection(db, INSTALLMENTS),
            where('owner_uid', '==', user.uid),
            where('status', 'in', ['pending', 'overdue']),
          ),
        ),

        // Urgent deadlines (next 7 days, pending)
        getDocs(
          query(
            collection(db, DEADLINES),
            where('owner_uid', '==', user.uid),
            where('status', '==', 'pending'),
            where('dueDate', '>=', Timestamp.fromDate(now)),
            where('dueDate', '<=', Timestamp.fromDate(sevenDaysLater)),
            orderBy('dueDate', 'asc'),
            limit(10),
          ),
        ),

        // Revenue for last 6 months
        getDocs(
          query(
            collection(db, FINANCIAL_ENTRIES),
            where('owner_uid', '==', user.uid),
            where('type', '==', 'income'),
            where('date', '>=', Timestamp.fromDate(sixMonthsAgo)),
            orderBy('date', 'asc'),
          ),
        ),

        // Next 5 appointments
        getDocs(
          query(
            collection(db, APPOINTMENTS),
            where('owner_uid', '==', user.uid),
            where('status', '==', 'scheduled'),
            where('date', '>=', Timestamp.fromDate(now)),
            orderBy('date', 'asc'),
            limit(5),
          ),
        ),
      ]);

      // Parse active cases
      const activeCasesCount = casesSnap.size;

      // Parse upcoming hearings
      const upcomingHearings: Appointment[] = hearingsSnap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          owner_uid: d.owner_uid as string,
          title: d.title as string,
          description: d.description as string | undefined,
          type: d.type as Appointment['type'],
          date: toDate(d.date),
          endDate: d.endDate ? toDate(d.endDate) : undefined,
          allDay: d.allDay as boolean,
          location: d.location as string | undefined,
          caseId: d.caseId as string | undefined,
          caseName: d.caseName as string | undefined,
          clientId: d.clientId as string | undefined,
          clientName: d.clientName as string | undefined,
          reminderMinutes: d.reminderMinutes as number[],
          recurrence: d.recurrence as Appointment['recurrence'],
          status: d.status as Appointment['status'],
          color: d.color as string | undefined,
          createdAt: toDate(d.createdAt),
          updatedAt: toDate(d.updatedAt),
        };
      });

      // Parse pending fees
      let pendingFees = 0;
      installmentsSnap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        pendingFees += (d.value as number) - ((d.paidValue as number) || 0);
      });

      // Parse urgent deadlines
      const urgentDeadlines: Deadline[] = deadlinesSnap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          caseId: d.caseId as string,
          caseName: d.caseName as string | undefined,
          owner_uid: d.owner_uid as string,
          title: d.title as string,
          description: d.description as string | undefined,
          type: d.type as Deadline['type'],
          dueDate: toDate(d.dueDate),
          reminderDays: d.reminderDays as number[],
          status: d.status as Deadline['status'],
          completedAt: d.completedAt ? toDate(d.completedAt) : undefined,
          dayType: d.dayType as Deadline['dayType'],
          createdAt: toDate(d.createdAt),
        };
      });

      // Revenue by month
      const revenueMap = new Map<string, number>();
      const monthNames = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
      ];

      // Initialize last 6 months with 0
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        const key = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
        revenueMap.set(key, 0);
      }

      revenueSnap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        const entryDate = toDate(d.date);
        const key = `${monthNames[entryDate.getMonth()]}/${String(entryDate.getFullYear()).slice(2)}`;
        if (revenueMap.has(key)) {
          revenueMap.set(key, (revenueMap.get(key) || 0) + (d.value as number));
        }
      });

      const revenueByMonth: MonthlyRevenue[] = Array.from(
        revenueMap.entries(),
      ).map(([month, value]) => ({ month, value }));

      // Parse next appointments
      const nextAppointments: Appointment[] = appointmentsSnap.docs.map(
        (docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            owner_uid: d.owner_uid as string,
            title: d.title as string,
            description: d.description as string | undefined,
            type: d.type as Appointment['type'],
            date: toDate(d.date),
            endDate: d.endDate ? toDate(d.endDate) : undefined,
            allDay: d.allDay as boolean,
            location: d.location as string | undefined,
            caseId: d.caseId as string | undefined,
            caseName: d.caseName as string | undefined,
            clientId: d.clientId as string | undefined,
            clientName: d.clientName as string | undefined,
            reminderMinutes: d.reminderMinutes as number[],
            recurrence: d.recurrence as Appointment['recurrence'],
            status: d.status as Appointment['status'],
            color: d.color as string | undefined,
            createdAt: toDate(d.createdAt),
            updatedAt: toDate(d.updatedAt),
          };
        },
      );

      // Build recent activities from cases, deadlines, and appointments
      const recentActivities: ActivityItem[] = [];

      casesSnap.docs.slice(0, 10).forEach((docSnap) => {
        const d = docSnap.data();
        recentActivities.push({
          id: docSnap.id,
          type: 'case',
          title: (d.caseNumber as string) || 'Processo',
          description: `Cliente: ${d.clientName as string}`,
          date: toDate(d.updatedAt || d.createdAt),
        });
      });

      deadlinesSnap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        recentActivities.push({
          id: docSnap.id,
          type: 'deadline',
          title: d.title as string,
          description: `Prazo: ${toDate(d.dueDate).toLocaleDateString('pt-BR')}`,
          date: toDate(d.createdAt),
        });
      });

      appointmentsSnap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        recentActivities.push({
          id: docSnap.id,
          type: 'appointment',
          title: d.title as string,
          description: `Agendamento: ${toDate(d.date).toLocaleDateString('pt-BR')}`,
          date: toDate(d.createdAt),
        });
      });

      // Sort by date descending, take 10
      recentActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
      const last10Activities = recentActivities.slice(0, 10);

      setData({
        activeCasesCount,
        upcomingHearings,
        pendingFees,
        urgentDeadlines,
        revenueByMonth,
        nextAppointments,
        recentActivities: last10Activities,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar dados do painel.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refresh: fetchDashboard };
}
