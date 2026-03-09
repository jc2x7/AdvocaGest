import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import { exportAndSharePDF } from '../../../../src/services/reports/pdfExporter';
import * as CaseReports from '../../../../src/services/reports/caseReports';
import * as FinancialReports from '../../../../src/services/reports/financialReports';
import * as ClientReports from '../../../../src/services/reports/clientReports';
import * as LeadReports from '../../../../src/services/reports/leadReports';
import * as ProductivityReports from '../../../../src/services/reports/productivityReports';
import { formatCurrency } from '../../../../src/utils/currency';
import Card from '../../../../src/components/ui/Card';
import LoadingState from '../../../../src/components/ui/LoadingState';
import ErrorState from '../../../../src/components/ui/ErrorState';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../../src/constants/theme';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Period = 'month' | 'quarter' | 'semester' | 'year';

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Mes', value: 'month' },
  { label: 'Trimestre', value: 'quarter' },
  { label: 'Semestre', value: 'semester' },
  { label: 'Ano', value: 'year' },
];

function getDateRange(period: Period): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = endOfMonth(now);
  const monthsMap: Record<Period, number> = { month: 1, quarter: 3, semester: 6, year: 12 };
  const startDate = startOfMonth(subMonths(now, monthsMap[period] - 1));
  return { startDate, endDate };
}

interface ReportItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

interface ReportCategory {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  items: ReportItem[];
}

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    key: 'processuais',
    title: 'Processuais',
    icon: 'briefcase-outline',
    color: '#3b82f6',
    items: [
      { key: 'cases_by_area', icon: 'pie-chart-outline', title: 'Por area', description: 'Distribuicao por area juridica' },
      { key: 'cases_by_phase', icon: 'layers-outline', title: 'Por fase', description: 'Processos por fase processual' },
      { key: 'cases_by_court', icon: 'business-outline', title: 'Por vara/tribunal', description: 'Distribuicao por vara' },
      { key: 'cases_by_result', icon: 'checkmark-done-outline', title: 'Por resultado', description: 'Analise de resultados' },
      { key: 'avg_duration', icon: 'time-outline', title: 'Duracao media', description: 'Tempo medio por tipo' },
      { key: 'stalled', icon: 'alert-circle-outline', title: 'Parados', description: 'Processos sem movimentacao' },
    ],
  },
  {
    key: 'financeiros',
    title: 'Financeiros',
    icon: 'cash-outline',
    color: '#22c55e',
    items: [
      { key: 'monthly_revenue', icon: 'trending-up-outline', title: 'Receita mensal', description: 'Evolucao da receita' },
      { key: 'expenses', icon: 'trending-down-outline', title: 'Despesas', description: 'Despesas por categoria' },
      { key: 'cash_flow', icon: 'swap-horizontal-outline', title: 'Fluxo de caixa', description: 'Entradas vs saidas' },
      { key: 'dre', icon: 'document-text-outline', title: 'DRE', description: 'Demonstracao do resultado' },
      { key: 'profitability', icon: 'stats-chart-outline', title: 'Lucratividade', description: 'Lucro por cliente' },
      { key: 'projection', icon: 'analytics-outline', title: 'Projecao', description: 'Projecao de receita' },
    ],
  },
  {
    key: 'clientes',
    title: 'Clientes',
    icon: 'people-outline',
    color: '#8b5cf6',
    items: [
      { key: 'active_inactive', icon: 'person-outline', title: 'Ativos vs inativos', description: 'Status dos clientes' },
      { key: 'new_per_month', icon: 'person-add-outline', title: 'Novos por mes', description: 'Captacao de clientes' },
      { key: 'clients_by_area', icon: 'grid-outline', title: 'Por area', description: 'Clientes por area' },
      { key: 'billing_ranking', icon: 'trophy-outline', title: 'Ranking de faturamento', description: 'Top clientes' },
    ],
  },
  {
    key: 'captacao',
    title: 'Captacao',
    icon: 'megaphone-outline',
    color: '#f59e0b',
    items: [
      { key: 'leads_by_source', icon: 'pie-chart-outline', title: 'Por origem', description: 'Leads por canal' },
      { key: 'conversion', icon: 'funnel-outline', title: 'Conversao', description: 'Taxa de conversao' },
      { key: 'funnel', icon: 'filter-outline', title: 'Funil', description: 'Funil de captacao' },
      { key: 'avg_time', icon: 'time-outline', title: 'Tempo medio', description: 'Tempo por estagio' },
      { key: 'loss_reasons', icon: 'close-circle-outline', title: 'Motivos de perda', description: 'Analise de perdas' },
      { key: 'roi', icon: 'calculator-outline', title: 'ROI', description: 'Retorno por canal' },
    ],
  },
  {
    key: 'produtividade',
    title: 'Produtividade',
    icon: 'speedometer-outline',
    color: '#ec4899',
    items: [
      { key: 'hours_worked', icon: 'time-outline', title: 'Horas trabalhadas', description: 'Total de horas' },
      { key: 'hours_by_case', icon: 'briefcase-outline', title: 'Por processo', description: 'Horas por processo' },
      { key: 'tasks_completed', icon: 'checkbox-outline', title: 'Tarefas concluidas', description: 'Taxa de conclusao' },
      { key: 'deadline_compliance', icon: 'alarm-outline', title: 'Cumprimento de prazos', description: 'Pontualidade' },
    ],
  },
  {
    key: 'gerencial',
    title: 'Gerencial',
    icon: 'bar-chart-outline',
    color: '#0ea5e9',
    items: [
      { key: 'executive', icon: 'desktop-outline', title: 'Painel executivo', description: 'Visao geral do escritorio' },
      { key: 'kpis', icon: 'pulse-outline', title: 'KPIs', description: 'Indicadores chave' },
      { key: 'growth', icon: 'trending-up-outline', title: 'Crescimento', description: 'Evolucao do escritorio' },
      { key: 'seasonality', icon: 'calendar-outline', title: 'Sazonalidade', description: 'Padroes temporais' },
    ],
  },
];

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [period, setPeriod] = useState<Period>('quarter');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  const toggleCategory = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleReportPress = useCallback(
    async (reportKey: string) => {
      if (!user) return;
      setLoadingReport(reportKey);
      const { startDate, endDate } = getDateRange(period);

      try {
        switch (reportKey) {
          case 'cases_by_area': {
            const data = await CaseReports.getCasesByArea(user.uid, startDate, endDate);
            await exportAndSharePDF({
              title: 'Processos por Area',
              period: `${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`,
              columns: [
                { header: 'Area', accessor: 'area' },
                { header: 'Quantidade', accessor: 'count', align: 'right' },
                { header: '%', accessor: 'pct', align: 'right' },
              ],
              rows: data.map((d) => ({ area: d.label, count: d.count, pct: `${d.percentage.toFixed(1)}%` })),
            });
            break;
          }
          case 'cases_by_phase': {
            const data = await CaseReports.getCasesByPhase(user.uid, startDate, endDate);
            await exportAndSharePDF({
              title: 'Processos por Fase',
              period: `${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`,
              columns: [
                { header: 'Fase', accessor: 'phase' },
                { header: 'Quantidade', accessor: 'count', align: 'right' },
                { header: '%', accessor: 'pct', align: 'right' },
              ],
              rows: data.map((d) => ({ phase: d.label, count: d.count, pct: `${d.percentage.toFixed(1)}%` })),
            });
            break;
          }
          case 'monthly_revenue': {
            const data = await FinancialReports.getMonthlyRevenue(user.uid, 12);
            await exportAndSharePDF({
              title: 'Receita Mensal',
              columns: [
                { header: 'Mes', accessor: 'month' },
                { header: 'Receita', accessor: 'income', align: 'right' },
                { header: 'Despesas', accessor: 'expenses', align: 'right' },
                { header: 'Lucro', accessor: 'profit', align: 'right' },
              ],
              rows: data.map((d) => ({
                month: d.monthLabel,
                income: formatCurrency(d.income),
                expenses: formatCurrency(d.expenses),
                profit: formatCurrency(d.profit),
              })),
            });
            break;
          }
          case 'dre': {
            const data = await FinancialReports.getDRE(user.uid, startDate, endDate);
            await exportAndSharePDF({
              title: 'DRE - Demonstracao do Resultado',
              period: data.periodo,
              columns: [
                { header: 'Descricao', accessor: 'desc' },
                { header: 'Valor', accessor: 'valor', align: 'right' },
              ],
              rows: [
                { desc: 'Receita Bruta', valor: formatCurrency(data.receitaBruta) },
                { desc: '(-) Deducoes', valor: formatCurrency(-data.deducoes) },
                { desc: 'Receita Liquida', valor: formatCurrency(data.receitaLiquida) },
                { desc: '(-) Custo dos Servicos', valor: formatCurrency(-data.custoServicos) },
                { desc: 'Lucro Bruto', valor: formatCurrency(data.lucroBruto) },
                { desc: '(-) Despesas Operacionais', valor: formatCurrency(-data.despesasOperacionais) },
                { desc: 'Resultado Operacional', valor: formatCurrency(data.resultadoOperacional) },
              ],
            });
            break;
          }
          case 'leads_by_source': {
            const data = await LeadReports.getLeadsBySource(user.uid, startDate, endDate);
            await exportAndSharePDF({
              title: 'Leads por Origem',
              period: `${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`,
              columns: [
                { header: 'Origem', accessor: 'source' },
                { header: 'Quantidade', accessor: 'count', align: 'right' },
                { header: '%', accessor: 'pct', align: 'right' },
              ],
              rows: data.map((d) => ({ source: d.label, count: d.count, pct: `${d.percentage.toFixed(1)}%` })),
            });
            break;
          }
          case 'hours_worked': {
            const data = await ProductivityReports.getHoursWorked(user.uid, startDate, endDate);
            await exportAndSharePDF({
              title: 'Horas Trabalhadas',
              period: `${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`,
              columns: [
                { header: 'Metrica', accessor: 'metric' },
                { header: 'Valor', accessor: 'value', align: 'right' },
              ],
              rows: [
                { metric: 'Total de horas', value: `${data.totalHours}h` },
                { metric: 'Horas faturaveis', value: `${data.billableHours}h` },
                { metric: 'Horas nao faturaveis', value: `${data.nonBillableHours}h` },
                { metric: '% faturavel', value: `${data.billablePercentage.toFixed(1)}%` },
                { metric: 'Total de lancamentos', value: `${data.totalEntries}` },
              ],
            });
            break;
          }
          default:
            Alert.alert('Em desenvolvimento', 'Este relatorio sera implementado em breve.');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao gerar relatorio';
        Alert.alert('Erro', message);
      } finally {
        setLoadingReport(null);
      }
    },
    [user, period]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Relatorios</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[
              styles.periodChip,
              { backgroundColor: period === p.value ? colors.primary : colors.surfaceVariant },
            ]}
            onPress={() => setPeriod(p.value)}
          >
            <Text
              style={[
                styles.periodText,
                { color: period === p.value ? '#ffffff' : colors.textSecondary },
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {REPORT_CATEGORIES.map((category) => {
          const isExpanded = expandedCategories.has(category.key);
          return (
            <View key={category.key} style={styles.categoryContainer}>
              <TouchableOpacity
                onPress={() => toggleCategory(category.key)}
                style={[
                  styles.categoryHeader,
                  Shadows.sm,
                  { backgroundColor: colors.card, borderColor: colors.borderLight },
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon} size={22} color={category.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>{category.title}</Text>
                  <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                    {category.items.length} relatorios
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={[styles.itemsContainer, { borderColor: colors.borderLight }]}>
                  {category.items.map((item, idx) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.reportItem,
                        idx < category.items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                      ]}
                      onPress={() => handleReportPress(item.key)}
                      disabled={loadingReport === item.key}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.reportIcon, { backgroundColor: colors.surfaceVariant }]}>
                        <Ionicons name={item.icon} size={18} color={category.color} />
                      </View>
                      <View style={styles.reportInfo}>
                        <Text style={[styles.reportTitle, { color: colors.text }]}>{item.title}</Text>
                        <Text style={[styles.reportDesc, { color: colors.textSecondary }]}>
                          {item.description}
                        </Text>
                      </View>
                      {loadingReport === item.key ? (
                        <View style={styles.reportAction}>
                          <Text style={[styles.loadingText, { color: colors.primary }]}>...</Text>
                        </View>
                      ) : (
                        <View style={styles.reportActions}>
                          <Ionicons name="share-outline" size={16} color={colors.textTertiary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: Typography.xl, fontWeight: '700' },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  periodChip: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  periodText: { fontSize: Typography.sm, fontWeight: '500' },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  categoryContainer: { marginBottom: Spacing.md },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryInfo: { flex: 1 },
  categoryTitle: { fontSize: Typography.md, fontWeight: '700' },
  categoryCount: { fontSize: Typography.xs, marginTop: 2 },
  itemsContainer: {
    marginTop: -1,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
  },
  reportIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  reportInfo: { flex: 1 },
  reportTitle: { fontSize: Typography.sm, fontWeight: '500' },
  reportDesc: { fontSize: Typography.xs, marginTop: 1 },
  reportAction: { marginLeft: Spacing.sm },
  reportActions: { marginLeft: Spacing.sm },
  loadingText: { fontSize: Typography.md, fontWeight: '700' },
});
