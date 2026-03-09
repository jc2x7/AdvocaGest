import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';

interface KPIData {
  activeCases: number;
  weekHearings: number;
  pendingFees: number;
  urgentDeadlines: number;
}

interface KPICardsProps {
  data: KPIData;
  onPressCard?: (type: keyof KPIData) => void;
}

interface CardConfig {
  key: keyof KPIData;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  formatValue: (v: number) => string;
  colorKey: 'primary' | 'info' | 'warning' | 'error';
}

const CARDS: CardConfig[] = [
  {
    key: 'activeCases',
    title: 'Processos Ativos',
    icon: 'briefcase-outline',
    formatValue: (v: number) => String(v),
    colorKey: 'primary',
  },
  {
    key: 'weekHearings',
    title: 'Audiencias da Semana',
    icon: 'calendar-outline',
    formatValue: (v: number) => String(v),
    colorKey: 'info',
  },
  {
    key: 'pendingFees',
    title: 'Honorarios Pendentes',
    icon: 'cash-outline',
    formatValue: (v: number) => formatCurrency(v),
    colorKey: 'warning',
  },
  {
    key: 'urgentDeadlines',
    title: 'Prazos Urgentes',
    icon: 'alert-circle-outline',
    formatValue: (v: number) => String(v),
    colorKey: 'error',
  },
];

export default function KPICards({ data, onPressCard }: KPICardsProps) {
  const { colors } = useTheme();

  const getCardColor = (colorKey: CardConfig['colorKey']): string => {
    const map: Record<CardConfig['colorKey'], string> = {
      primary: colors.primary,
      info: colors.info,
      warning: colors.warning,
      error: colors.error,
    };
    return map[colorKey];
  };

  const getCardBg = (colorKey: CardConfig['colorKey']): string => {
    const map: Record<CardConfig['colorKey'], string> = {
      primary: colors.primaryLight,
      info: colors.infoLight,
      warning: colors.warningLight,
      error: colors.errorLight,
    };
    return map[colorKey];
  };

  return (
    <View style={styles.grid}>
      {CARDS.map((card) => {
        const color = getCardColor(card.colorKey);
        const bgColor = getCardBg(card.colorKey);

        return (
          <View
            key={card.key}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderLeftColor: color,
              },
              Shadows.sm,
            ]}
            onTouchEnd={() => onPressCard?.(card.key)}
          >
            <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
              <Ionicons name={card.icon} size={20} color={color} />
            </View>
            <Text
              style={[styles.value, { color: colors.text }]}
              numberOfLines={1}
            >
              {card.formatValue(data[card.key])}
            </Text>
            <Text
              style={[styles.title, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {card.title}
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
    fontSize: Typography.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
