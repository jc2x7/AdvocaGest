import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatCurrencyCompact } from '../../utils/currency';

interface MonthRevenue {
  month: string;
  value: number;
}

interface RevenueChartProps {
  data: MonthRevenue[];
  title?: string;
}

export default function RevenueChart({
  data,
  title = 'Faturamento (6 meses)',
}: RevenueChartProps) {
  const { colors, isDark } = useTheme();
  const screenWidth = Dimensions.get('window').width - Spacing.md * 2;

  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        data: data.length > 0 ? data.map((item) => item.value) : [0],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: () => colors.primary,
    labelColor: () => colors.textSecondary,
    barPercentage: 0.6,
    propsForLabels: {
      fontSize: Typography.xs,
    },
    formatYLabel: (value: string) => formatCurrencyCompact(Number(value)),
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card }, Shadows.sm]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Sem dados de faturamento
          </Text>
        </View>
      ) : (
        <BarChart
          data={chartData}
          width={screenWidth - Spacing.md * 2}
          height={200}
          chartConfig={chartConfig}
          style={styles.chart}
          showBarTops={false}
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
    marginBottom: Spacing.md,
  },
  chart: {
    borderRadius: BorderRadius.sm,
    marginLeft: -Spacing.md,
  },
  emptyContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: Typography.sm,
  },
});
