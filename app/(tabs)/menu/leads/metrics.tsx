import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import {
  getLeadsBySource,
  getConversionRate,
  getFunnelData,
  getAverageTimePerStage,
  getLossReasons,
  LeadsBySourceReport,
  ConversionRateReport,
  FunnelStageReport,
  AverageTimePerStageReport,
  LossReasonsReport,
} from '../../../../src/services/reports/leadReports';
import Card from '../../../../src/components/ui/Card';
import LoadingState from '../../../../src/components/ui/LoadingState';
import ErrorState from '../../../../src/components/ui/ErrorState';
import { BorderRadius, Spacing, Typography } from '../../../../src/constants/theme';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

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
  const monthsMap: Record<Period, number> = {
    month: 1,
    quarter: 3,
    semester: 6,
    year: 12,
  };
  const startDate = startOfMonth(subMonths(now, monthsMap[period] - 1));
  return { startDate, endDate };
}

const screenWidth = Dimensions.get('window').width;

export default function LeadMetricsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [period, setPeriod] = useState<Period>('quarter');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sourceData, setSourceData] = useState<LeadsBySourceReport[]>([]);
  const [conversionData, setConversionData] = useState<ConversionRateReport | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelStageReport[]>([]);
  const [stageTimeData, setStageTimeData] = useState<AverageTimePerStageReport[]>([]);
  const [lossData, setLossData] = useState<LossReasonsReport[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange(period);
      const [sources, conversion, funnel, stageTime, losses] = await Promise.all([
        getLeadsBySource(user.uid, startDate, endDate),
        getConversionRate(user.uid, startDate, endDate),
        getFunnelData(user.uid, startDate, endDate),
        getAverageTimePerStage(user.uid),
        getLossReasons(user.uid, startDate, endDate),
      ]);
      setSourceData(sources);
      setConversionData(conversion);
      setFunnelData(funnel);
      setStageTimeData(stageTime);
      setLossData(losses);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar metricas';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingState message="Carregando metricas..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const maxSourceCount = Math.max(...sourceData.map((s) => s.count), 1);
  const maxFunnelCount = Math.max(...funnelData.map((f) => f.count), 1);
  const maxLossCount = Math.max(...lossData.map((l) => l.count), 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Metricas de Leads</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[
              styles.periodChip,
              {
                backgroundColor: period === p.value ? colors.primary : colors.surfaceVariant,
              },
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
        {/* Conversion Rate Card */}
        {conversionData && (
          <Card style={styles.cardMargin}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Taxa de Conversao</Text>
            <View style={styles.conversionRow}>
              <View style={styles.conversionItem}>
                <Text style={[styles.conversionValue, { color: colors.primary }]}>
                  {conversionData.totalLeads}
                </Text>
                <Text style={[styles.conversionLabel, { color: colors.textSecondary }]}>Total</Text>
              </View>
              <View style={styles.conversionItem}>
                <Text style={[styles.conversionValue, { color: colors.success }]}>
                  {conversionData.wonLeads}
                </Text>
                <Text style={[styles.conversionLabel, { color: colors.textSecondary }]}>Ganhos</Text>
              </View>
              <View style={styles.conversionItem}>
                <Text style={[styles.conversionValue, { color: colors.error }]}>
                  {conversionData.lostLeads}
                </Text>
                <Text style={[styles.conversionLabel, { color: colors.textSecondary }]}>Perdidos</Text>
              </View>
              <View style={styles.conversionItem}>
                <Text style={[styles.conversionValue, { color: colors.warning }]}>
                  {conversionData.conversionRate.toFixed(1)}%
                </Text>
                <Text style={[styles.conversionLabel, { color: colors.textSecondary }]}>Conversao</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Funnel */}
        <Card style={styles.cardMargin}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Funil de Vendas</Text>
          {funnelData.map((stage) => (
            <View key={stage.stage} style={styles.funnelRow}>
              <View style={styles.funnelLabelRow}>
                <View style={[styles.funnelDot, { backgroundColor: stage.color }]} />
                <Text style={[styles.funnelLabel, { color: colors.text }]}>{stage.label}</Text>
                <Text style={[styles.funnelCount, { color: colors.textSecondary }]}>
                  {stage.count}
                </Text>
              </View>
              <View style={[styles.funnelBarBg, { backgroundColor: colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.funnelBar,
                    {
                      backgroundColor: stage.color,
                      width: `${(stage.count / maxFunnelCount) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </Card>

        {/* Sources Pie (represented as horizontal bars) */}
        <Card style={styles.cardMargin}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Leads por Origem</Text>
          {sourceData.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Sem dados no periodo</Text>
          ) : (
            sourceData.map((source) => (
              <View key={source.source} style={styles.barRow}>
                <View style={styles.barLabelRow}>
                  <Text style={[styles.barLabel, { color: colors.text }]}>{source.label}</Text>
                  <Text style={[styles.barValue, { color: colors.textSecondary }]}>
                    {source.count} ({source.percentage.toFixed(0)}%)
                  </Text>
                </View>
                <View style={[styles.barBg, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${(source.count / maxSourceCount) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Average Time Per Stage */}
        <Card style={styles.cardMargin}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tempo Medio por Estagio</Text>
          {stageTimeData.map((stage) => (
            <View key={stage.stage} style={styles.stageTimeRow}>
              <Text style={[styles.stageTimeLabel, { color: colors.text }]}>{stage.label}</Text>
              <Text style={[styles.stageTimeValue, { color: colors.primary }]}>
                {stage.averageDays} dias
              </Text>
            </View>
          ))}
        </Card>

        {/* Loss Reasons */}
        <Card style={styles.cardMargin}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Motivos de Perda</Text>
          {lossData.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Sem perdas no periodo</Text>
          ) : (
            lossData.map((loss) => (
              <View key={loss.reason} style={styles.barRow}>
                <View style={styles.barLabelRow}>
                  <Text style={[styles.barLabel, { color: colors.text }]}>{loss.reason}</Text>
                  <Text style={[styles.barValue, { color: colors.textSecondary }]}>
                    {loss.count} ({loss.percentage.toFixed(0)}%)
                  </Text>
                </View>
                <View style={[styles.barBg, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: colors.error,
                        width: `${(loss.count / maxLossCount) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: Typography.lg, fontWeight: '700' },
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
  cardMargin: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.md, fontWeight: '700', marginBottom: Spacing.md },
  conversionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  conversionItem: { alignItems: 'center', flex: 1 },
  conversionValue: { fontSize: Typography.xl, fontWeight: '700' },
  conversionLabel: { fontSize: Typography.xs, marginTop: 2 },
  funnelRow: { marginBottom: Spacing.sm },
  funnelLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  funnelDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  funnelLabel: { fontSize: Typography.sm, flex: 1 },
  funnelCount: { fontSize: Typography.sm, fontWeight: '600' },
  funnelBarBg: { height: 8, borderRadius: 4 },
  funnelBar: { height: 8, borderRadius: 4 },
  barRow: { marginBottom: Spacing.sm },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: Typography.sm },
  barValue: { fontSize: Typography.sm, fontWeight: '500' },
  barBg: { height: 8, borderRadius: 4 },
  barFill: { height: 8, borderRadius: 4 },
  stageTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  stageTimeLabel: { fontSize: Typography.sm },
  stageTimeValue: { fontSize: Typography.sm, fontWeight: '600' },
  emptyText: { fontSize: Typography.sm, textAlign: 'center', paddingVertical: Spacing.md },
});
