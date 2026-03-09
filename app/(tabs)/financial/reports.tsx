import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { formatCurrency } from '../../../src/utils/currency';
import {
  getContracts,
  getFinancialEntries,
  getFinancialEntriesByDateRange,
} from '../../../src/services/firebase/financialService';
import LoadingState from '../../../src/components/ui/LoadingState';
import ErrorState from '../../../src/components/ui/ErrorState';
import type { FeeContract, FinancialEntry } from '../../../src/types/financial';

const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

interface ReportCard {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const REPORT_CARDS: ReportCard[] = [
  {
    key: 'revenue_by_month',
    title: 'Receita por Mes',
    icon: 'bar-chart-outline',
    description: 'Evolucao mensal das receitas',
  },
  {
    key: 'expenses_by_category',
    title: 'Despesas por Categoria',
    icon: 'pie-chart-outline',
    description: 'Distribuicao de gastos por categoria',
  },
  {
    key: 'profitability_by_client',
    title: 'Rentabilidade por Cliente',
    icon: 'people-outline',
    description: 'Receita gerada por cada cliente',
  },
  {
    key: 'profitability_by_case',
    title: 'Rentabilidade por Processo',
    icon: 'briefcase-outline',
    description: 'Receita por processo ativo',
  },
  {
    key: 'dre',
    title: 'DRE Simplificado',
    icon: 'document-text-outline',
    description: 'Demonstrativo de resultado do exercicio',
  },
  {
    key: 'projection',
    title: 'Projecao 12 Meses',
    icon: 'trending-up-outline',
    description: 'Previsao de receitas e despesas',
  },
];

interface MonthlyData {
  month: string;
  value: number;
}

interface CategoryData {
  category: string;
  value: number;
  percentage: number;
}

interface ClientProfitData {
  clientName: string;
  revenue: number;
}

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contracts, setContracts] = useState<FeeContract[]>([]);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const [contractsData, entriesData] = await Promise.all([
        getContracts(user.uid),
        getFinancialEntries(user.uid),
      ]);
      setContracts(contractsData);
      setEntries(entriesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar relatorios';
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

  // Revenue by month (last 12 months)
  const revenueByMonth = useMemo((): MonthlyData[] => {
    const now = new Date();
    const result: MonthlyData[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      const monthRevenue = entries
        .filter((e) => {
          if (e.type !== 'income') return false;
          const ed = e.date instanceof Date ? e.date : new Date(e.date);
          return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
        })
        .reduce((sum, e) => sum + e.value, 0);
      result.push({
        month: `${MONTH_NAMES_SHORT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
        value: monthRevenue,
      });
    }
    return result;
  }, [entries]);

  // Expenses by category
  const expensesByCategory = useMemo((): CategoryData[] => {
    const categoryMap: Record<string, number> = {};
    entries
      .filter((e) => e.type === 'expense')
      .forEach((e) => {
        categoryMap[e.category] = (categoryMap[e.category] ?? 0) + e.value;
      });

    const total = Object.values(categoryMap).reduce((sum, v) => sum + v, 0);
    return Object.entries(categoryMap)
      .map(([category, value]) => ({
        category,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);

  // Profitability by client
  const profitByClient = useMemo((): ClientProfitData[] => {
    const clientMap: Record<string, number> = {};
    entries
      .filter((e) => e.type === 'income' && e.clientName)
      .forEach((e) => {
        const name = e.clientName ?? 'Sem cliente';
        clientMap[name] = (clientMap[name] ?? 0) + e.value;
      });

    return Object.entries(clientMap)
      .map(([clientName, revenue]) => ({ clientName, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [entries]);

  // Profitability by case
  const profitByCase = useMemo(() => {
    const caseMap: Record<string, { caseName: string; revenue: number }> = {};
    entries
      .filter((e) => e.type === 'income' && e.caseName)
      .forEach((e) => {
        const key = e.caseId ?? e.caseName ?? 'unknown';
        if (!caseMap[key]) {
          caseMap[key] = { caseName: e.caseName ?? 'Sem processo', revenue: 0 };
        }
        caseMap[key].revenue += e.value;
      });

    return Object.values(caseMap).sort((a, b) => b.revenue - a.revenue);
  }, [entries]);

  // DRE (simplified)
  const dreData = useMemo(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const yearEntries = entries.filter((e) => {
      const ed = e.date instanceof Date ? e.date : new Date(e.date);
      return ed >= yearStart;
    });

    const totalRevenue = yearEntries
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + e.value, 0);

    const totalExpenses = yearEntries
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + e.value, 0);

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      result: totalRevenue - totalExpenses,
      margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
    };
  }, [entries]);

  // 12-month projection
  const projectionData = useMemo((): MonthlyData[] => {
    const now = new Date();
    const last3MonthsIncome: number[] = [];
    const last3MonthsExpense: number[] = [];

    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIncome = entries
        .filter((e) => {
          if (e.type !== 'income') return false;
          const ed = e.date instanceof Date ? e.date : new Date(e.date);
          return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
        })
        .reduce((sum, e) => sum + e.value, 0);

      const monthExpense = entries
        .filter((e) => {
          if (e.type !== 'expense') return false;
          const ed = e.date instanceof Date ? e.date : new Date(e.date);
          return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
        })
        .reduce((sum, e) => sum + e.value, 0);

      last3MonthsIncome.push(monthIncome);
      last3MonthsExpense.push(monthExpense);
    }

    const avgIncome = last3MonthsIncome.length > 0
      ? last3MonthsIncome.reduce((a, b) => a + b, 0) / last3MonthsIncome.length
      : 0;
    const avgExpense = last3MonthsExpense.length > 0
      ? last3MonthsExpense.reduce((a, b) => a + b, 0) / last3MonthsExpense.length
      : 0;

    const result: MonthlyData[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      result.push({
        month: `${MONTH_NAMES_SHORT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
        value: Math.round((avgIncome - avgExpense) * 100) / 100,
      });
    }
    return result;
  }, [entries]);

  const handleExportPDF = useCallback(() => {
    Alert.alert(
      'Exportar PDF',
      'A funcionalidade de exportacao em PDF sera disponibilizada em breve.',
    );
  }, []);

  const renderReportDetail = useCallback(() => {
    if (!activeReport) return null;

    const maxBarValue = (data: { value: number }[]) =>
      Math.max(...data.map((d) => Math.abs(d.value)), 1);

    switch (activeReport) {
      case 'revenue_by_month': {
        const max = maxBarValue(revenueByMonth);
        return (
          <View>
            <Text style={[styles.detailTitle, { color: colors.text }]}>Receita por Mes</Text>
            {revenueByMonth.map((item) => (
              <View key={item.month} style={styles.chartRow}>
                <Text style={[styles.chartRowLabel, { color: colors.textSecondary }]}>
                  {item.month}
                </Text>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        width: `${(item.value / max) * 100}%`,
                        backgroundColor: colors.success,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartRowValue, { color: colors.text }]}>
                  {formatCurrency(item.value)}
                </Text>
              </View>
            ))}
          </View>
        );
      }

      case 'expenses_by_category': {
        const categoryColors = [
          colors.error, colors.warning, colors.info, colors.primary,
          colors.secondary, colors.success, colors.accent,
        ];
        return (
          <View>
            <Text style={[styles.detailTitle, { color: colors.text }]}>Despesas por Categoria</Text>
            {expensesByCategory.map((item, index) => (
              <View key={item.category} style={styles.chartRow}>
                <Text style={[styles.chartRowLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.category}
                </Text>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor: categoryColors[index % categoryColors.length],
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartRowValue, { color: colors.text }]}>
                  {formatCurrency(item.value)}
                </Text>
              </View>
            ))}
            {expensesByCategory.length === 0 && (
              <Text style={[styles.emptyReportText, { color: colors.textSecondary }]}>
                Nenhuma despesa registrada
              </Text>
            )}
          </View>
        );
      }

      case 'profitability_by_client': {
        const maxClient = Math.max(...profitByClient.map((c) => c.revenue), 1);
        return (
          <View>
            <Text style={[styles.detailTitle, { color: colors.text }]}>
              Rentabilidade por Cliente
            </Text>
            {profitByClient.map((item) => (
              <View key={item.clientName} style={styles.chartRow}>
                <Text style={[styles.chartRowLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.clientName}
                </Text>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        width: `${(item.revenue / maxClient) * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartRowValue, { color: colors.text }]}>
                  {formatCurrency(item.revenue)}
                </Text>
              </View>
            ))}
            {profitByClient.length === 0 && (
              <Text style={[styles.emptyReportText, { color: colors.textSecondary }]}>
                Nenhuma receita vinculada a clientes
              </Text>
            )}
          </View>
        );
      }

      case 'profitability_by_case': {
        const maxCase = Math.max(...profitByCase.map((c) => c.revenue), 1);
        return (
          <View>
            <Text style={[styles.detailTitle, { color: colors.text }]}>
              Rentabilidade por Processo
            </Text>
            {profitByCase.map((item) => (
              <View key={item.caseName} style={styles.chartRow}>
                <Text style={[styles.chartRowLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.caseName}
                </Text>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        width: `${(item.revenue / maxCase) * 100}%`,
                        backgroundColor: colors.info,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartRowValue, { color: colors.text }]}>
                  {formatCurrency(item.revenue)}
                </Text>
              </View>
            ))}
            {profitByCase.length === 0 && (
              <Text style={[styles.emptyReportText, { color: colors.textSecondary }]}>
                Nenhuma receita vinculada a processos
              </Text>
            )}
          </View>
        );
      }

      case 'dre': {
        return (
          <View>
            <Text style={[styles.detailTitle, { color: colors.text }]}>
              DRE Simplificado ({new Date().getFullYear()})
            </Text>
            <View style={[styles.dreRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dreLabel, { color: colors.text }]}>Receita Bruta</Text>
              <Text style={[styles.dreValue, { color: colors.success }]}>
                {formatCurrency(dreData.revenue)}
              </Text>
            </View>
            <View style={[styles.dreRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dreLabel, { color: colors.text }]}>(-) Despesas Operacionais</Text>
              <Text style={[styles.dreValue, { color: colors.error }]}>
                {formatCurrency(dreData.expenses)}
              </Text>
            </View>
            <View style={[styles.dreRow, styles.dreTotalRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dreTotalLabel, { color: colors.text }]}>Resultado Liquido</Text>
              <Text
                style={[
                  styles.dreTotalValue,
                  { color: dreData.result >= 0 ? colors.success : colors.error },
                ]}
              >
                {formatCurrency(dreData.result)}
              </Text>
            </View>
            <View style={[styles.dreRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dreLabel, { color: colors.textSecondary }]}>Margem Liquida</Text>
              <Text
                style={[
                  styles.dreValue,
                  { color: dreData.margin >= 0 ? colors.success : colors.error },
                ]}
              >
                {dreData.margin.toFixed(1)}%
              </Text>
            </View>
          </View>
        );
      }

      case 'projection': {
        const max = maxBarValue(projectionData);
        return (
          <View>
            <Text style={[styles.detailTitle, { color: colors.text }]}>
              Projecao 12 Meses (Saldo Estimado)
            </Text>
            <Text style={[styles.detailSubtitle, { color: colors.textSecondary }]}>
              Baseado na media dos ultimos 3 meses
            </Text>
            {projectionData.map((item) => (
              <View key={item.month} style={styles.chartRow}>
                <Text style={[styles.chartRowLabel, { color: colors.textSecondary }]}>
                  {item.month}
                </Text>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        width: `${(Math.abs(item.value) / max) * 100}%`,
                        backgroundColor: item.value >= 0 ? colors.success : colors.error,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.chartRowValue,
                    { color: item.value >= 0 ? colors.success : colors.error },
                  ]}
                >
                  {formatCurrency(item.value)}
                </Text>
              </View>
            ))}
          </View>
        );
      }

      default:
        return null;
    }
  }, [
    activeReport, colors, revenueByMonth, expensesByCategory,
    profitByClient, profitByCase, dreData, projectionData,
  ]);

  if (loading) {
    return <LoadingState message="Carregando relatorios..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.reportGrid}>
          {REPORT_CARDS.map((report) => (
            <TouchableOpacity
              key={report.key}
              style={[styles.reportCard, { backgroundColor: colors.card }, Shadows.sm]}
              activeOpacity={0.7}
              onPress={() => setActiveReport(report.key)}
            >
              <View style={[styles.reportIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name={report.icon} size={24} color={colors.primary} />
              </View>
              <Text style={[styles.reportTitle, { color: colors.text }]}>{report.title}</Text>
              <Text style={[styles.reportDescription, { color: colors.textSecondary }]}>
                {report.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.7}
          onPress={handleExportPDF}
        >
          <Ionicons name="download-outline" size={20} color="#ffffff" />
          <Text style={styles.exportButtonText}>Exportar PDF</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={activeReport !== null}
        animationType="slide"
        onRequestClose={() => setActiveReport(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Relatorio</Text>
            <TouchableOpacity
              onPress={() => setActiveReport(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {renderReportDetail()}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  reportCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  reportIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  reportTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  reportDescription: {
    fontSize: Typography.xs,
    lineHeight: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: Typography.md,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  modalContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  detailTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  detailSubtitle: {
    fontSize: Typography.sm,
    marginBottom: Spacing.md,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  chartRowLabel: {
    width: 60,
    fontSize: Typography.xs,
  },
  chartBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  chartRowValue: {
    width: 90,
    textAlign: 'right',
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  emptyReportText: {
    textAlign: 'center',
    fontSize: Typography.sm,
    marginTop: Spacing.lg,
  },
  dreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
  },
  dreTotalRow: {
    paddingVertical: Spacing.md,
  },
  dreLabel: {
    fontSize: Typography.sm,
  },
  dreValue: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  dreTotalLabel: {
    fontSize: Typography.md,
    fontWeight: '700',
  },
  dreTotalValue: {
    fontSize: Typography.lg,
    fontWeight: '700',
  },
});
