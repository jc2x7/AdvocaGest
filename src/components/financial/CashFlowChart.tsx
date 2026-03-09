import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatCurrencyCompact } from '../../utils/currency';

interface CashFlowDataPoint {
  label: string;
  income: number;
  expense: number;
}

interface CashFlowChartProps {
  data: CashFlowDataPoint[];
  title?: string;
}

export default function CashFlowChart({
  data,
  title = 'Fluxo de Caixa',
}: CashFlowChartProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width - Spacing.md * 2;

  const labels = data.map((item) => item.label);
  const incomeData = data.length > 0 ? data.map((item) => item.income) : [0];
  const expenseData = data.length > 0 ? data.map((item) => item.expense) : [0];

  const chartData = {
    labels: labels.length > 0 ? labels : [''],
    datasets: [
      {
        data: incomeData,
        color: () => colors.success,
        strokeWidth: 2,
      },
      {
        data: expenseData,
        color: () => colors.error,
        strokeWidth: 2,
      },
    ],
    legend: ['Receitas', 'Despesas'],
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: () => colors.textSecondary,
    labelColor: () => colors.textSecondary,
    propsForLabels: {
      fontSize: Typography.xs,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
    formatYLabel: (value: string) => formatCurrencyCompact(Number(value)),
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card }, Shadows.sm]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Receitas
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Despesas
          </Text>
        </View>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Sem dados de fluxo de caixa
          </Text>
        </View>
      ) : (
        <LineChart
          data={chartData}
          width={screenWidth - Spacing.md * 2}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          bezier
          fromZero
          yAxisLabel="R$"
          yAxisSuffix=""
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.md,
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
  chart: {
    borderRadius: BorderRadius.sm,
    marginLeft: -Spacing.md,
  },
  emptyContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: Typography.sm,
  },
});
