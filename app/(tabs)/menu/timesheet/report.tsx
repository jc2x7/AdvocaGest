import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import {
  getHoursWorked,
  getHoursByCase,
  getHoursByClient,
  getHoursByDayOfWeek,
  HoursWorkedReport,
  HoursByCaseReport,
  HoursByClientReport,
  HoursByDayOfWeekReport,
} from '../../../../src/services/reports/productivityReports';
import { exportAndSharePDF } from '../../../../src/services/reports/pdfExporter';
import { formatCurrency } from '../../../../src/utils/currency';
import Card from '../../../../src/components/ui/Card';
import Button from '../../../../src/components/ui/Button';
import LoadingState from '../../../../src/components/ui/LoadingState';
import ErrorState from '../../../../src/components/ui/ErrorState';
import { BorderRadius, Spacing, Typography } from '../../../../src/constants/theme';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
} from 'date-fns';

type Period = 'week' | 'month' | 'custom';

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Esta semana', value: 'week' },
  { label: 'Este mes', value: 'month' },
];

function getRange(period: Period): { startDate: Date; endDate: Date } {
  const now = new Date();
  switch (period) {
    case 'week':
      return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    case 'custom':
      return { startDate: subDays(now, 30), endDate: now };
  }
}

export default function TimesheetReportScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [period, setPeriod] = useState<Period>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [hoursData, setHoursData] = useState<HoursWorkedReport | null>(null);
  const [caseData, setCaseData] = useState<HoursByCaseReport[]>([]);
  const [clientData, setClientData] = useState<HoursByClientReport[]>([]);
  const [dayData, setDayData] = useState<HoursByDayOfWeekReport[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getRange(period);
      const [hours, byCase, byClient, byDay] = await Promise.all([
        getHoursWorked(user.uid, startDate, endDate),
        getHoursByCase(user.uid, startDate, endDate),
        getHoursByClient(user.uid, startDate, endDate),
        getHoursByDayOfWeek(user.uid, startDate, endDate),
      ]);
      setHoursData(hours);
      setCaseData(byCase);
      setClientData(byClient);
      setDayData(byDay);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar relatorio';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPDF = useCallback(async () => {
    if (!hoursData) return;
    setExporting(true);
    try {
      const rows = caseData.map((c) => ({
        caso: c.caseName,
        total: `${c.totalHours}h`,
        faturavel: `${c.billableHours}h`,
        percentual: `${c.percentage.toFixed(1)}%`,
      }));
      await exportAndSharePDF({
        title: 'Relatorio de Timesheet',
        subtitle: 'Horas trabalhadas',
        period: period === 'week' ? 'Esta semana' : 'Este mes',
        columns: [
          { header: 'Caso', accessor: 'caso' },
          { header: 'Total', accessor: 'total', align: 'right' },
          { header: 'Faturavel', accessor: 'faturavel', align: 'right' },
          { header: '%', accessor: 'percentual', align: 'right' },
        ],
        rows,
        summaryCards: [
          { label: 'Total de Horas', value: `${hoursData.totalHours}h` },
          { label: 'Faturaveis', value: `${hoursData.billableHours}h` },
          { label: '% Faturavel', value: `${hoursData.billablePercentage.toFixed(1)}%` },
          { label: 'Lancamentos', value: `${hoursData.totalEntries}` },
        ],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao exportar PDF';
      Alert.alert('Erro', message);
    } finally {
      setExporting(false);
    }
  }, [hoursData, caseData, period]);

  if (loading) {
    return <LoadingState message="Carregando relatorio..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const maxCaseHours = Math.max(...caseData.map((c) => c.totalHours), 1);
  const maxClientHours = Math.max(...clientData.map((c) => c.totalHours), 1);
  const maxDayHours = Math.max(...dayData.map((d) => d.totalHours), 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Relatorio de Horas</Text>
        <TouchableOpacity onPress={handleExportPDF} disabled={exporting}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
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
        {/* Total Hours Card */}
        {hoursData && (
          <Card style={styles.cardMargin}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumo</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {hoursData.totalHours.toFixed(1)}h
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {hoursData.billableHours.toFixed(1)}h
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Faturaveis</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.warning }]}>
                  {hoursData.nonBillableHours.toFixed(1)}h
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Nao faturaveis</Text>
              </View>
            </View>
            {/* Billable vs Non-billable bar */}
            <View style={[styles.breakdownBar, { backgroundColor: colors.surfaceVariant }]}>
              <View
                style={[
                  styles.breakdownFill,
                  {
                    backgroundColor: colors.success,
                    width: `${hoursData.billablePercentage}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.breakdownLabels}>
              <Text style={[styles.breakdownLabel, { color: colors.success }]}>
                Faturavel: {hoursData.billablePercentage.toFixed(1)}%
              </Text>
              <Text style={[styles.breakdownLabel, { color: colors.warning }]}>
                Nao faturavel: {(100 - hoursData.billablePercentage).toFixed(1)}%
              </Text>
            </View>
          </Card>
        )}

        {/* Hours by Case */}
        <Card style={styles.cardMargin}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Horas por Processo</Text>
          {caseData.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Sem dados</Text>
          ) : (
            caseData.map((item) => (
              <View key={item.caseId} style={styles.barRow}>
                <View style={styles.barLabelRow}>
                  <Text style={[styles.barLabel, { color: colors.text }]} numberOfLines={1}>
                    {item.caseName}
                  </Text>
                  <Text style={[styles.barValue, { color: colors.textSecondary }]}>
                    {item.totalHours}h
                  </Text>
                </View>
                <View style={[styles.barBg, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.barFill,
                      { backgroundColor: colors.primary, width: `${(item.totalHours / maxCaseHours) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Hours by Client */}
        <Card style={styles.cardMargin}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Horas por Cliente</Text>
          {clientData.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Sem dados</Text>
          ) : (
            clientData.map((item) => (
              <View key={item.clientId} style={styles.barRow}>
                <View style={styles.barLabelRow}>
                  <Text style={[styles.barLabel, { color: colors.text }]} numberOfLines={1}>
                    {item.clientName}
                  </Text>
                  <Text style={[styles.barValue, { color: colors.textSecondary }]}>
                    {item.totalHours}h
                  </Text>
                </View>
                <View style={[styles.barBg, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.barFill,
                      { backgroundColor: colors.secondary, width: `${(item.totalHours / maxClientHours) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Hours by Day of Week */}
        <Card style={styles.cardMargin}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Horas por Dia da Semana</Text>
          <View style={styles.dayChart}>
            {dayData.map((item) => (
              <View key={item.dayIndex} style={styles.dayColumn}>
                <Text style={[styles.dayHours, { color: colors.textSecondary }]}>
                  {item.totalHours > 0 ? `${item.totalHours.toFixed(1)}` : '0'}
                </Text>
                <View style={[styles.dayBarContainer, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.dayBar,
                      {
                        backgroundColor: colors.primary,
                        height: `${maxDayHours > 0 ? (item.totalHours / maxDayHours) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.dayLabel, { color: colors.textTertiary }]}>
                  {item.dayLabel.substring(0, 3)}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Button
          title="Exportar PDF"
          onPress={handleExportPDF}
          variant="primary"
          size="lg"
          loading={exporting}
          icon={<Ionicons name="document-outline" size={18} color="#ffffff" />}
          style={styles.exportButton}
        />
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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontSize: Typography.xl, fontWeight: '700' },
  summaryLabel: { fontSize: Typography.xs, marginTop: 2 },
  breakdownBar: { height: 10, borderRadius: 5, marginBottom: Spacing.xs },
  breakdownFill: { height: 10, borderRadius: 5 },
  breakdownLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { fontSize: Typography.xs },
  barRow: { marginBottom: Spacing.sm },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: Typography.sm, flex: 1, marginRight: Spacing.sm },
  barValue: { fontSize: Typography.sm, fontWeight: '500' },
  barBg: { height: 8, borderRadius: 4 },
  barFill: { height: 8, borderRadius: 4 },
  dayChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 },
  dayColumn: { alignItems: 'center', flex: 1 },
  dayHours: { fontSize: 10, marginBottom: 4 },
  dayBarContainer: { width: 20, height: 100, borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden' },
  dayBar: { width: 20, borderRadius: 10 },
  dayLabel: { fontSize: 10, marginTop: 4 },
  emptyText: { fontSize: Typography.sm, textAlign: 'center', paddingVertical: Spacing.md },
  exportButton: { marginTop: Spacing.sm },
});
