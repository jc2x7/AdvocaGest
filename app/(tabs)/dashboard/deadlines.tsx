import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { formatDate, getDaysUntil, getUrgencyLabel } from '../../../src/utils/dateUtils';
import LoadingState from '../../../src/components/ui/LoadingState';
import ErrorState from '../../../src/components/ui/ErrorState';
import EmptyState from '../../../src/components/ui/EmptyState';
import FilterChips from '../../../src/components/ui/FilterChips';
import { Deadline } from '../../../src/types/deadline';
import { getCases } from '../../../src/services/firebase/caseService';
import { LegalCase } from '../../../src/types/case';

type FilterKey = 'all' | 'urgent' | 'upcoming' | 'overdue' | 'completed';

const FILTER_OPTIONS = [
  { key: 'all', label: 'Todos' },
  { key: 'urgent', label: 'Urgentes' },
  { key: 'upcoming', label: 'Proximos' },
  { key: 'overdue', label: 'Vencidos' },
  { key: 'completed', label: 'Concluidos' },
];

interface DeadlineItem {
  id: string;
  title: string;
  caseName: string;
  caseNumber: string;
  dueDate: Date;
  daysUntil: number;
  status: 'pending' | 'completed' | 'overdue';
}

function getDeadlineColor(daysUntil: number, status: string): string {
  if (status === 'completed') return '#22c55e';
  if (daysUntil < 0) return '#ef4444';
  if (daysUntil < 3) return '#f97316';
  if (daysUntil < 7) return '#f59e0b';
  return '#22c55e';
}

function getDeadlineIcon(daysUntil: number, status: string): keyof typeof Ionicons.glyphMap {
  if (status === 'completed') return 'checkmark-circle';
  if (daysUntil < 0) return 'close-circle';
  if (daysUntil < 3) return 'alert-circle';
  if (daysUntil < 7) return 'warning';
  return 'time-outline';
}

function buildDeadlinesFromCases(cases: LegalCase[]): DeadlineItem[] {
  const items: DeadlineItem[] = [];
  for (const c of cases) {
    if (c.nextDeadline) {
      const dueDate = c.nextDeadline instanceof Date ? c.nextDeadline : new Date(c.nextDeadline);
      const daysUntil = getDaysUntil(dueDate);
      const status: DeadlineItem['status'] = daysUntil < 0 ? 'overdue' : 'pending';
      items.push({
        id: `${c.id}-deadline`,
        title: c.lastMovement ?? 'Prazo processual',
        caseName: c.clientName,
        caseNumber: c.caseNumber,
        dueDate,
        daysUntil,
        status,
      });
    }
  }
  return items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export default function DeadlinesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const cases = await getCases(user.uid);
      const items = buildDeadlinesFromCases(cases);
      setDeadlines(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar prazos.';
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

  const filteredDeadlines = useMemo(() => {
    switch (filter) {
      case 'urgent':
        return deadlines.filter((d) => d.status !== 'completed' && d.daysUntil >= 0 && d.daysUntil < 3);
      case 'upcoming':
        return deadlines.filter((d) => d.status !== 'completed' && d.daysUntil >= 3 && d.daysUntil <= 7);
      case 'overdue':
        return deadlines.filter((d) => d.daysUntil < 0);
      case 'completed':
        return deadlines.filter((d) => d.status === 'completed');
      default:
        return deadlines;
    }
  }, [deadlines, filter]);

  const renderDeadlineItem = useCallback(
    ({ item }: { item: DeadlineItem }) => {
      const deadlineColor = getDeadlineColor(item.daysUntil, item.status);
      const deadlineIcon = getDeadlineIcon(item.daysUntil, item.status);
      const urgencyLabel = getUrgencyLabel(item.daysUntil);

      const countdownText =
        item.status === 'completed'
          ? 'Concluido'
          : item.daysUntil < 0
          ? `${Math.abs(item.daysUntil)} dia(s) atrasado`
          : item.daysUntil === 0
          ? 'Vence hoje'
          : item.daysUntil === 1
          ? 'Vence amanha'
          : `${item.daysUntil} dia(s) restantes`;

      return (
        <View
          style={[
            styles.deadlineCard,
            { backgroundColor: colors.card, borderLeftColor: deadlineColor },
            Shadows.sm,
          ]}
        >
          <View style={styles.deadlineHeader}>
            <Ionicons name={deadlineIcon} size={24} color={deadlineColor} />
            <View style={styles.deadlineInfo}>
              <Text style={[styles.deadlineTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.deadlineCase, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.caseNumber} - {item.caseName}
              </Text>
            </View>
          </View>

          <View style={styles.deadlineFooter}>
            <View style={styles.deadlineDateRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.deadlineDateText, { color: colors.textSecondary }]}>
                {formatDate(item.dueDate)}
              </Text>
            </View>

            <View style={[styles.urgencyBadge, { backgroundColor: deadlineColor + '20' }]}>
              <Text style={[styles.urgencyText, { color: deadlineColor }]}>{urgencyLabel}</Text>
            </View>
          </View>

          <Text style={[styles.countdownText, { color: deadlineColor }]}>{countdownText}</Text>
        </View>
      );
    },
    [colors],
  );

  if (loading) {
    return <LoadingState message="Carregando prazos..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FilterChips
        options={FILTER_OPTIONS}
        selectedKey={filter}
        onSelect={(key) => setFilter(key as FilterKey)}
      />

      <FlatList
        data={filteredDeadlines}
        renderItem={renderDeadlineItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="timer-outline"
            title="Sem prazos"
            message="Nenhum prazo encontrado para o filtro selecionado."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  deadlineCard: {
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  deadlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  deadlineInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  deadlineTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  deadlineCase: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  deadlineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  deadlineDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineDateText: {
    fontSize: Typography.xs,
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  urgencyText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  countdownText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
});
