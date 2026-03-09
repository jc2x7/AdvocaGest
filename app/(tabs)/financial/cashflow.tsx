import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { formatCurrency } from '../../../src/utils/currency';
import { getFinancialEntriesByDateRange } from '../../../src/services/firebase/financialService';
import LoadingState from '../../../src/components/ui/LoadingState';
import ErrorState from '../../../src/components/ui/ErrorState';
import EmptyState from '../../../src/components/ui/EmptyState';
import type { FinancialEntry } from '../../../src/types/financial';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatDate(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function CashFlowScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const monthRange = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }, [selectedYear, selectedMonth]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await getFinancialEntriesByDateRange(
        user.uid,
        monthRange.start,
        monthRange.end,
      );
      setEntries(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar fluxo de caixa';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, monthRange]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const goToPrevMonth = useCallback(() => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  }, [selectedMonth]);

  const goToNextMonth = useCallback(() => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  }, [selectedMonth]);

  const totalIncome = useMemo(
    () => entries.filter((e) => e.type === 'income').reduce((sum, e) => sum + e.value, 0),
    [entries],
  );

  const totalExpense = useMemo(
    () => entries.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.value, 0),
    [entries],
  );

  const balance = totalIncome - totalExpense;

  const chartMaxValue = useMemo(() => {
    const dailyTotals: Record<number, { income: number; expense: number }> = {};
    entries.forEach((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      const day = d.getDate();
      if (!dailyTotals[day]) dailyTotals[day] = { income: 0, expense: 0 };
      if (e.type === 'income') {
        dailyTotals[day].income += e.value;
      } else {
        dailyTotals[day].expense += e.value;
      }
    });
    let max = 1;
    Object.values(dailyTotals).forEach((v) => {
      if (v.income > max) max = v.income;
      if (v.expense > max) max = v.expense;
    });
    return max;
  }, [entries]);

  const cumulativeData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dailyMap: Record<number, { income: number; expense: number }> = {};

    entries.forEach((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      const day = d.getDate();
      if (!dailyMap[day]) dailyMap[day] = { income: 0, expense: 0 };
      if (e.type === 'income') {
        dailyMap[day].income += e.value;
      } else {
        dailyMap[day].expense += e.value;
      }
    });

    let cumulativeIncome = 0;
    let cumulativeExpense = 0;
    const points: { day: number; income: number; expense: number }[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const daily = dailyMap[i];
      if (daily) {
        cumulativeIncome += daily.income;
        cumulativeExpense += daily.expense;
      }
      points.push({ day: i, income: cumulativeIncome, expense: cumulativeExpense });
    }
    return points;
  }, [entries, selectedYear, selectedMonth]);

  const cumulativeMax = useMemo(
    () => Math.max(...cumulativeData.map((p) => Math.max(p.income, p.expense)), 1),
    [cumulativeData],
  );

  const renderEntry = useCallback(
    ({ item }: { item: FinancialEntry }) => {
      const isIncome = item.type === 'income';
      const iconName: keyof typeof Ionicons.glyphMap = isIncome
        ? 'trending-up-outline'
        : 'trending-down-outline';
      const valueColor = isIncome ? colors.success : colors.error;

      return (
        <View style={[styles.entryCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <View
            style={[
              styles.entryIcon,
              { backgroundColor: isIncome ? colors.successLight : colors.errorLight },
            ]}
          >
            <Ionicons name={iconName} size={18} color={valueColor} />
          </View>
          <View style={styles.entryContent}>
            <Text style={[styles.entryDescription, { color: colors.text }]} numberOfLines={1}>
              {item.description}
            </Text>
            <Text style={[styles.entryCategory, { color: colors.textSecondary }]}>
              {item.category} - {formatDate(item.date)}
            </Text>
          </View>
          <Text style={[styles.entryValue, { color: valueColor }]}>
            {isIncome ? '+' : '-'}{formatCurrency(item.value)}
          </Text>
        </View>
      );
    },
    [colors],
  );

  if (loading && !refreshing) {
    return <LoadingState message="Carregando fluxo de caixa..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        contentContainerStyle={entries.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <View>
            {/* Month Selector */}
            <View style={[styles.monthSelector, { backgroundColor: colors.card }, Shadows.sm]}>
              <TouchableOpacity onPress={goToPrevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.monthText, { color: colors.text }]}>
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </Text>
              <TouchableOpacity onPress={goToNextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-forward" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.card }, Shadows.sm]}>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Receitas</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Despesas</Text>
                </View>
              </View>

              <View style={styles.lineChartContainer}>
                {cumulativeData
                  .filter((_, i) => i % 5 === 0 || i === cumulativeData.length - 1)
                  .map((point) => (
                    <View key={point.day} style={styles.lineChartColumn}>
                      <View style={styles.lineBarsContainer}>
                        <View
                          style={[
                            styles.lineBar,
                            {
                              height: (point.income / cumulativeMax) * 80,
                              backgroundColor: colors.success,
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.lineBar,
                            {
                              height: (point.expense / cumulativeMax) * 80,
                              backgroundColor: colors.error,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.lineChartLabel, { color: colors.textTertiary }]}>
                        {point.day}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>

            {/* Monthly Summary */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: colors.card }, Shadows.sm]}>
                <Ionicons name="trending-up-outline" size={20} color={colors.success} />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Receitas</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {formatCurrency(totalIncome)}
                </Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: colors.card }, Shadows.sm]}>
                <Ionicons name="trending-down-outline" size={20} color={colors.error} />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Despesas</Text>
                <Text style={[styles.summaryValue, { color: colors.error }]}>
                  {formatCurrency(totalExpense)}
                </Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: colors.card }, Shadows.sm]}>
                <Ionicons
                  name="swap-horizontal-outline"
                  size={20}
                  color={balance >= 0 ? colors.success : colors.error}
                />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Saldo</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: balance >= 0 ? colors.success : colors.error },
                  ]}
                >
                  {formatCurrency(balance)}
                </Text>
              </View>
            </View>

            <Text style={[styles.transactionsTitle, { color: colors.text }]}>
              Transacoes do Mes
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="swap-horizontal-outline"
            title="Nenhuma transacao neste mes"
            message="As transacoes registradas aparecerão aqui."
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  monthText: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: Typography.xs,
  },
  lineChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 110,
    paddingTop: Spacing.sm,
  },
  lineChartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  lineBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 90,
  },
  lineBar: {
    width: 8,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    minHeight: 2,
  },
  lineChartLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.xs,
  },
  summaryValue: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  transactionsTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  entryContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  entryDescription: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  entryCategory: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  entryValue: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
});
