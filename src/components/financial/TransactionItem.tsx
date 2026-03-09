import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateUtils';
import { FinancialEntry } from '../../types/financial';

interface TransactionItemProps {
  entry: FinancialEntry;
  onPress?: (entry: FinancialEntry) => void;
}

export default function TransactionItem({ entry, onPress }: TransactionItemProps) {
  const { colors } = useTheme();

  const isIncome = entry.type === 'income';
  const iconColor = isIncome ? colors.success : colors.error;
  const bgColor = isIncome ? colors.successLight : colors.errorLight;

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.borderLight }]}
      onPress={() => onPress?.(entry)}
      activeOpacity={0.7}
    >
      <View style={[styles.icon, { backgroundColor: bgColor }]}>
        <Ionicons
          name={isIncome ? 'arrow-down-outline' : 'arrow-up-outline'}
          size={18}
          color={iconColor}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>
          {entry.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.category, { color: colors.textTertiary }]}>
            {entry.category}
          </Text>
          <Text style={[styles.date, { color: colors.textTertiary }]}>
            {formatDate(entry.date)}
          </Text>
        </View>
        {entry.clientName && (
          <View style={styles.clientRow}>
            <Ionicons name="person-outline" size={10} color={colors.textTertiary} />
            <Text style={[styles.clientText, { color: colors.textTertiary }]} numberOfLines={1}>
              {entry.clientName}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: iconColor }]}>
          {isIncome ? '+' : '-'}{formatCurrency(entry.value)}
        </Text>
        {entry.paymentMethod && (
          <Text style={[styles.paymentMethod, { color: colors.textTertiary }]}>
            {entry.paymentMethod.toUpperCase()}
          </Text>
        )}
        {entry.isRecurring && (
          <View style={[styles.recurringBadge, { backgroundColor: colors.infoLight }]}>
            <Ionicons name="repeat-outline" size={10} color={colors.info} />
            <Text style={[styles.recurringText, { color: colors.info }]}>
              Recorrente
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  description: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  category: {
    fontSize: Typography.xs,
  },
  date: {
    fontSize: Typography.xs,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  clientText: {
    fontSize: Typography.xs,
    flex: 1,
  },
  valueContainer: {
    alignItems: 'flex-end',
    gap: 2,
  },
  value: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  paymentMethod: {
    fontSize: 10,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  recurringText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
  },
});
