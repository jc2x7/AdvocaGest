import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { formatCurrency } from '../../../src/utils/currency';
import {
  getContracts,
  getFinancialEntriesByDateRange,
} from '../../../src/services/firebase/financialService';
import { getOverdueInstallments } from '../../../src/services/firebase/financialService';
import LoadingState from '../../../src/components/ui/LoadingState';
import ErrorState from '../../../src/components/ui/ErrorState';
import type { FeeContract, FinancialEntry, Installment } from '../../../src/types/financial';

interface KPIData {
  receivedThisMonth: number;
  toReceive: number;
  overdue: number;
  expensesThisMonth: number;
}

interface MonthlyChartData {
  month: string;
  income: number;
  expense: number;
}

interface QuickAccessItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

function getMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getLast6MonthsRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function buildChartData(entries: FinancialEntry[]): MonthlyChartData[] {
  const now = new Date();
  const months: MonthlyChartData[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months.push({ month: MONTH_LABELS[d.getMonth()], income: 0, expense: 0 });
  }

  entries.forEach((entry) => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    const monthDiff =
      (now.getFullYear() - entryDate.getFullYear()) * 12 +
      (now.getMonth() - entryDate.getMonth());
    const index = 5 - monthDiff;
    if (index >= 0 && index < 6) {
      if (entry.type === 'income') {
        months[index].income += entry.value;
      } else {
        months[index].expense += entry.value;
      }
    }
  });

  return months;
}

export default function FinancialDashboard() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPIData>({
    receivedThisMonth: 0,
    toReceive: 0,
    overdue: 0,
    expensesThisMonth: 0,
  });
  const [chartData, setChartData] = useState<MonthlyChartData[]>([]);

  const quickAccessItems: QuickAccessItem[] = [
    { key: 'contracts', label: 'Contratos', icon: 'document-text-outline', route: '/(tabs)/financial/contracts', color: colors.primary },
    { key: 'receivables', label: 'Recebiveis', icon: 'wallet-outline', route: '/(tabs)/financial/receivables', color: colors.success },
    { key: 'expenses', label: 'Despesas', icon: 'trending-down-outline', route: '/(tabs)/financial/expenses', color: colors.error },
    { key: 'cashflow', label: 'Fluxo de Caixa', icon: 'swap-horizontal-outline', route: '/(tabs)/financial/cashflow', color: colors.info },
    { key: 'reports', label: 'Relatorios', icon: 'bar-chart-outline', route: '/(tabs)/financial/reports', color: colors.secondary },
  ];

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const { start, end } = getMonthRange();
      const sixMonths = getLast6MonthsRange();

      const [contracts, overdueInstallments, monthEntries, sixMonthEntries] = await Promise.all([
        getContracts(user.uid),
        getOverdueInstallments(user.uid),
        getFinancialEntriesByDateRange(user.uid, start, end),
        getFinancialEntriesByDateRange(user.uid, sixMonths.start, sixMonths.end),
      ]);

      const receivedThisMonth = monthEntries
        .filter((e) => e.type === 'income')
        .reduce((sum, e) => sum + e.value, 0);

      const expensesThisMonth = monthEntries
        .filter((e) => e.type === 'expense')
        .reduce((sum, e) => sum + e.value, 0);

      const toReceive = contracts
        .filter((c) => c.status === 'active')
        .reduce((sum, c) => sum + (c.totalValue - c.paidTotal), 0);

      const overdueTotal = overdueInstallments.reduce((sum, inst) => sum + inst.value, 0);

      setKpis({
        receivedThisMonth,
        toReceive,
        overdue: overdueTotal,
        expensesThisMonth,
      });

      setChartData(buildChartData(sixMonthEntries));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados financeiros';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  if (loading) {
    return <LoadingState message="Carregando dados financeiros..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const maxChartValue = Math.max(
    ...chartData.map((d) => Math.max(d.income, d.expense)),
    1,
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumo do Mes</Text>

      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <View style={[styles.kpiIconContainer, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
          </View>
          <Text style={[styles.kpiValue, { color: colors.success }]}>
            {formatCurrency(kpis.receivedThisMonth)}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Recebido no mes</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <View style={[styles.kpiIconContainer, { backgroundColor: colors.infoLight }]}>
            <Ionicons name="time-outline" size={22} color={colors.info} />
          </View>
          <Text style={[styles.kpiValue, { color: colors.info }]}>
            {formatCurrency(kpis.toReceive)}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>A receber</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <View style={[styles.kpiIconContainer, { backgroundColor: colors.errorLight }]}>
            <Ionicons name="alert-circle-outline" size={22} color={colors.error} />
          </View>
          <Text style={[styles.kpiValue, { color: colors.error }]}>
            {formatCurrency(kpis.overdue)}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Em atraso</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <View style={[styles.kpiIconContainer, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="trending-down-outline" size={22} color={colors.warning} />
          </View>
          <Text style={[styles.kpiValue, { color: colors.warning }]}>
            {formatCurrency(kpis.expensesThisMonth)}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Despesas no mes</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Receitas x Despesas</Text>

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

        <View style={styles.chartContainer}>
          {chartData.map((item) => (
            <View key={item.month} style={styles.chartColumn}>
              <View style={styles.barsContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: maxChartValue > 0 ? (item.income / maxChartValue) * 120 : 0,
                      backgroundColor: colors.success,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: maxChartValue > 0 ? (item.expense / maxChartValue) * 120 : 0,
                      backgroundColor: colors.error,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
                {item.month}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Acesso Rapido</Text>

      <View style={styles.quickAccessGrid}>
        {quickAccessItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.quickAccessCard, { backgroundColor: colors.card }, Shadows.sm]}
            activeOpacity={0.7}
            onPress={() => router.push(item.route as `/${string}`)}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={[styles.quickAccessLabel, { color: colors.text }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  kpiCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  kpiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  kpiValue: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: Typography.xs,
  },
  chartCard: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
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
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: Spacing.md,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 130,
  },
  bar: {
    width: 14,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 2,
  },
  chartLabel: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  quickAccessCard: {
    width: '30%',
    flexGrow: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickAccessLabel: {
    fontSize: Typography.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
