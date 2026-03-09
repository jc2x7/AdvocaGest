import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';

interface FinancialKPIData {
  receivedThisMonth: number;
  toReceive: number;
  overdue: number;
  expenses: number;
}

interface FinancialKPIsProps {
  data: FinancialKPIData;
  onPressCard?: (type: keyof FinancialKPIData) => void;
}

interface KPIConfig {
  key: keyof FinancialKPIData;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: 'success' | 'info' | 'error' | 'warning';
}

const KPIS: KPIConfig[] = [
  {
    key: 'receivedThisMonth',
    title: 'Recebido este mes',
    icon: 'checkmark-circle-outline',
    colorKey: 'success',
  },
  {
    key: 'toReceive',
    title: 'A Receber',
    icon: 'time-outline',
    colorKey: 'info',
  },
  {
    key: 'overdue',
    title: 'Vencido',
    icon: 'alert-circle-outline',
    colorKey: 'error',
  },
  {
    key: 'expenses',
    title: 'Despesas',
    icon: 'trending-down-outline',
    colorKey: 'warning',
  },
];

export default function FinancialKPIs({ data, onPressCard }: FinancialKPIsProps) {
  const { colors } = useTheme();

  const getColor = (colorKey: KPIConfig['colorKey']): string => {
    const map: Record<KPIConfig['colorKey'], string> = {
      success: colors.success,
      info: colors.info,
      error: colors.error,
      warning: colors.warning,
    };
    return map[colorKey];
  };

  const getBgColor = (colorKey: KPIConfig['colorKey']): string => {
    const map: Record<KPIConfig['colorKey'], string> = {
      success: colors.successLight,
      info: colors.infoLight,
      error: colors.errorLight,
      warning: colors.warningLight,
    };
    return map[colorKey];
  };

  return (
    <View style={styles.grid}>
      {KPIS.map((kpi) => {
        const color = getColor(kpi.colorKey);
        const bgColor = getBgColor(kpi.colorKey);

        return (
          <View
            key={kpi.key}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderLeftColor: color },
              Shadows.sm,
            ]}
            onTouchEnd={() => onPressCard?.(kpi.key)}
          >
            <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
              <Ionicons name={kpi.icon} size={20} color={color} />
            </View>
            <Text
              style={[styles.value, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(data[kpi.key])}
            </Text>
            <Text
              style={[styles.title, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {kpi.title}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    padding: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: Typography.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
