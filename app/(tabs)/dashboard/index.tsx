import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { getGreeting } from '../../../src/utils/dateUtils';
import KPICards from '../../../src/components/dashboard/KPICards';
import RevenueChart from '../../../src/components/dashboard/RevenueChart';
import UpcomingEvents from '../../../src/components/dashboard/UpcomingEvents';
import ActivityTimeline from '../../../src/components/dashboard/ActivityTimeline';
import LoadingState from '../../../src/components/ui/LoadingState';
import ErrorState from '../../../src/components/ui/ErrorState';
import EmptyState from '../../../src/components/ui/EmptyState';
import { getCases } from '../../../src/services/firebase/caseService';
import { getUpcomingAppointments } from '../../../src/services/firebase/appointmentService';
import { Appointment } from '../../../src/types/appointment';
import { LegalCase } from '../../../src/types/case';

interface KPIData {
  activeCases: number;
  weekHearings: number;
  pendingFees: number;
  urgentDeadlines: number;
}

interface MonthRevenue {
  month: string;
  value: number;
}

interface Activity {
  id: string;
  type:
    | 'case_created'
    | 'case_updated'
    | 'client_added'
    | 'document_uploaded'
    | 'payment_received'
    | 'deadline_completed'
    | 'hearing_scheduled'
    | 'movement_added'
    | 'communication'
    | 'task_completed';
  title: string;
  description: string;
  date: Date | string;
}

interface QuickAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { key: 'new-case', label: 'Novo Processo', icon: 'briefcase-outline', route: '/(tabs)/cases/new' },
  { key: 'new-appointment', label: 'Compromisso', icon: 'calendar-outline', route: '/(tabs)/dashboard/new-appointment' },
  { key: 'calendar', label: 'Agenda', icon: 'today-outline', route: '/(tabs)/dashboard/calendar' },
  { key: 'deadlines', label: 'Prazos', icon: 'alert-circle-outline', route: '/(tabs)/dashboard/deadlines' },
  { key: 'notifications', label: 'Notificacoes', icon: 'notifications-outline', route: '/(tabs)/dashboard/notifications' },
];

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function buildRevenueData(cases: LegalCase[]): MonthRevenue[] {
  const now = new Date();
  const result: MonthRevenue[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = MONTH_LABELS[d.getMonth()] ?? '';
    const monthCases = cases.filter((c) => {
      const created = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
      return (
        created.getMonth() === d.getMonth() &&
        created.getFullYear() === d.getFullYear()
      );
    });
    const total = monthCases.reduce((sum, c) => sum + (c.revenue || 0), 0);
    result.push({ month: label, value: total });
  }
  return result;
}

function buildActivities(cases: LegalCase[]): Activity[] {
  return cases
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      type: 'case_updated' as const,
      title: c.caseNumber,
      description: c.clientName + (c.lastMovement ? ` - ${c.lastMovement}` : ''),
      date: c.updatedAt,
    }));
}

function computeKPIs(cases: LegalCase[], appointments: Appointment[]): KPIData {
  const activeCases = cases.filter((c) => c.status === 'active').length;

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekHearings = appointments.filter((a) => {
    const d = a.date instanceof Date ? a.date : new Date(a.date);
    return a.type === 'hearing' && d >= now && d <= weekEnd;
  }).length;

  const pendingFees = cases.reduce((sum, c) => {
    const diff = (c.caseValue ?? 0) - c.revenue;
    return sum + (diff > 0 ? diff : 0);
  }, 0);

  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const urgentDeadlines = cases.filter((c) => {
    if (!c.nextDeadline) return false;
    const dl = c.nextDeadline instanceof Date ? c.nextDeadline : new Date(c.nextDeadline);
    return dl >= now && dl <= threeDaysFromNow;
  }).length;

  return { activeCases, weekHearings, pendingFees, urgentDeadlines };
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const [fetchedCases, fetchedAppointments] = await Promise.all([
        getCases(user.uid),
        getUpcomingAppointments(user.uid, 5),
      ]);
      setCases(fetchedCases);
      setAppointments(fetchedAppointments);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados do painel.';
      setError(message);
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    void load();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const greeting = getGreeting();
  const displayName = user?.name?.split(' ')[0] ?? '';
  const kpiData = computeKPIs(cases, appointments);
  const revenueData = buildRevenueData(cases);
  const activities = buildActivities(cases);
  const hasData = cases.length > 0 || appointments.length > 0;

  if (loading) {
    return <LoadingState message="Carregando painel..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  if (!hasData && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.emptyScroll}
        >
          <EmptyState
            icon="grid-outline"
            title="Painel vazio"
            message="Adicione processos e compromissos para visualizar seus indicadores."
            actionLabel="Novo Processo"
            onAction={() => router.push('/(tabs)/cases/new')}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {greeting}, Dr(a).
            </Text>
            <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/dashboard/notifications')}
            style={[styles.notifButton, { backgroundColor: colors.surfaceVariant }]}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* KPI Cards */}
        <KPICards
          data={kpiData}
          onPressCard={(type) => {
            if (type === 'activeCases') router.push('/(tabs)/cases');
            if (type === 'urgentDeadlines') router.push('/(tabs)/dashboard/deadlines');
            if (type === 'weekHearings') router.push('/(tabs)/dashboard/calendar');
          }}
        />

        {/* Quick Actions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActions}
          style={styles.quickActionsContainer}
        >
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={[styles.quickAction, { backgroundColor: colors.card }, Shadows.sm]}
              onPress={() => router.push(action.route as `/${string}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name={action.icon} size={20} color="#ffffff" />
              </View>
              <Text
                style={[styles.quickActionLabel, { color: colors.text }]}
                numberOfLines={1}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Revenue Chart */}
        <View style={styles.section}>
          <RevenueChart data={revenueData} />
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <UpcomingEvents
            appointments={appointments}
            onPressViewAll={() => router.push('/(tabs)/dashboard/calendar')}
          />
        </View>

        {/* Activity Timeline */}
        <View style={styles.section}>
          <ActivityTimeline activities={activities} />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.xxl + Spacing.lg,
  },
  emptyScroll: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.regular,
  },
  name: {
    fontSize: Typography.xxl,
    fontWeight: Typography.fontWeight.bold,
    marginTop: 2,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsContainer: {
    marginTop: Spacing.lg,
  },
  quickActions: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  quickAction: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    width: 90,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  section: {
    marginTop: Spacing.lg,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
