import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateUtils';
import { FeeContract, FinancialEntry, EntryType } from '../../types/financial';
import { LegalCase } from '../../types/case';

interface CaseFinancialTabProps {
  legalCase: LegalCase;
  contracts: FeeContract[];
  entries: FinancialEntry[];
}

export default function CaseFinancialTab({
  legalCase,
  contracts,
  entries,
}: CaseFinancialTabProps) {
  const { colors } = useTheme();

  const totalIncome = entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.value, 0);

  const totalExpense = entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.value, 0);

  const balance = totalIncome - totalExpense;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <Ionicons name="trending-up-outline" size={20} color={colors.success} />
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Receitas
          </Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>
            {formatCurrency(totalIncome)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <Ionicons name="trending-down-outline" size={20} color={colors.error} />
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Despesas
          </Text>
          <Text style={[styles.summaryValue, { color: colors.error }]}>
            {formatCurrency(totalExpense)}
          </Text>
        </View>
      </View>

      <View style={[styles.balanceCard, { backgroundColor: colors.card }, Shadows.sm]}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
          Saldo do Processo
        </Text>
        <Text
          style={[
            styles.balanceValue,
            { color: balance >= 0 ? colors.success : colors.error },
          ]}
        >
          {formatCurrency(balance)}
        </Text>
        {legalCase.caseValue !== undefined && (
          <Text style={[styles.caseValueText, { color: colors.textTertiary }]}>
            Valor da Causa: {formatCurrency(legalCase.caseValue)}
          </Text>
        )}
      </View>

      {contracts.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Contratos de Honorarios
          </Text>
          {contracts.map((contract) => (
            <View
              key={contract.id}
              style={[styles.contractItem, { borderBottomColor: colors.borderLight }]}
            >
              <View style={styles.contractHeader}>
                <Text style={[styles.contractType, { color: colors.primary }]}>
                  {contract.type === 'fixed'
                    ? 'Valor Fixo'
                    : contract.type === 'success'
                      ? 'Exito'
                      : contract.type === 'mixed'
                        ? 'Misto'
                        : 'Hora'}
                </Text>
                <Text style={[styles.contractValue, { color: colors.text }]}>
                  {formatCurrency(contract.totalValue)}
                </Text>
              </View>
              <View style={styles.contractMeta}>
                <Text style={[styles.contractMetaText, { color: colors.textSecondary }]}>
                  {contract.paidCount}/{contract.installmentsCount} parcelas
                </Text>
                <Text style={[styles.contractMetaText, { color: colors.success }]}>
                  {formatCurrency(contract.paidTotal)} pago
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {entries.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Lancamentos
          </Text>
          {entries.map((entry) => {
            const isIncome = entry.type === 'income';

            return (
              <View
                key={entry.id}
                style={[styles.entryItem, { borderBottomColor: colors.borderLight }]}
              >
                <View style={[styles.entryIcon, {
                  backgroundColor: isIncome ? colors.successLight : colors.errorLight,
                }]}>
                  <Ionicons
                    name={isIncome ? 'arrow-down-outline' : 'arrow-up-outline'}
                    size={16}
                    color={isIncome ? colors.success : colors.error}
                  />
                </View>
                <View style={styles.entryContent}>
                  <Text style={[styles.entryDescription, { color: colors.text }]} numberOfLines={1}>
                    {entry.description}
                  </Text>
                  <Text style={[styles.entryCategory, { color: colors.textTertiary }]}>
                    {entry.category} - {formatDate(entry.date)}
                  </Text>
                </View>
                <Text style={[styles.entryValue, {
                  color: isIncome ? colors.success : colors.error,
                }]}>
                  {isIncome ? '+' : '-'}{formatCurrency(entry.value)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {contracts.length === 0 && entries.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Nenhum dado financeiro
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.xs,
  },
  summaryValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  balanceCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  balanceLabel: {
    fontSize: Typography.sm,
  },
  balanceValue: {
    fontSize: Typography.xxl,
    fontWeight: Typography.fontWeight.bold,
  },
  caseValueText: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
  },
  section: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  contractItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contractType: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  contractValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  contractMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contractMetaText: {
    fontSize: Typography.xs,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  entryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  entryContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  entryDescription: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  entryCategory: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  entryValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sm,
  },
});
