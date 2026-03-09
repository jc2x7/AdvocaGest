import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { Lead, LeadStage, LEAD_STAGES } from '../../types/lead';

interface LeadKanbanProps {
  leads: Lead[];
  onPressLead?: (lead: Lead) => void;
  onPressAddLead?: (stage: LeadStage) => void;
}

const KANBAN_STAGES: LeadStage[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation'];

export default function LeadKanban({
  leads,
  onPressLead,
  onPressAddLead,
}: LeadKanbanProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const columnWidth = screenWidth * 0.72;

  const getStageLeads = (stage: LeadStage): Lead[] =>
    leads.filter((lead) => lead.stage === stage);

  const getStageConfig = (stage: LeadStage) => {
    const found = LEAD_STAGES.find((s) => s.value === stage);
    return found || { label: stage, color: '#64748b', value: stage };
  };

  const renderLeadCard = (lead: Lead) => (
    <TouchableOpacity
      key={lead.id}
      style={[styles.leadCard, { backgroundColor: colors.card }, Shadows.sm]}
      onPress={() => onPressLead?.(lead)}
      activeOpacity={0.7}
    >
      <Text style={[styles.leadName, { color: colors.text }]} numberOfLines={1}>
        {lead.name}
      </Text>
      <Text style={[styles.leadArea, { color: colors.textSecondary }]} numberOfLines={1}>
        {lead.area}
      </Text>
      <View style={styles.leadFooter}>
        {lead.estimatedValue !== undefined && (
          <Text style={[styles.leadValue, { color: colors.success }]}>
            {formatCurrency(lead.estimatedValue)}
          </Text>
        )}
        <View style={styles.scoreContainer}>
          <Text style={[styles.leadScore, { color: colors.textTertiary }]}>
            Score: {lead.score}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      pagingEnabled={false}
      snapToInterval={columnWidth + Spacing.sm}
      decelerationRate="fast"
    >
      {KANBAN_STAGES.map((stage) => {
        const config = getStageConfig(stage);
        const stageLeads = getStageLeads(stage);
        const stageTotal = stageLeads.reduce(
          (sum, lead) => sum + (lead.estimatedValue || 0),
          0,
        );

        return (
          <View key={stage} style={[styles.column, { width: columnWidth }]}>
            <View style={styles.columnHeader}>
              <View style={styles.columnTitleRow}>
                <View style={[styles.columnDot, { backgroundColor: config.color }]} />
                <Text style={[styles.columnTitle, { color: colors.text }]}>
                  {config.label}
                </Text>
                <View style={[styles.countBadge, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.countText, { color: colors.textSecondary }]}>
                    {stageLeads.length}
                  </Text>
                </View>
              </View>
              {stageTotal > 0 && (
                <Text style={[styles.totalText, { color: colors.textTertiary }]}>
                  {formatCurrency(stageTotal)}
                </Text>
              )}
            </View>

            <ScrollView
              style={[styles.columnContent, { backgroundColor: colors.surfaceVariant }]}
              contentContainerStyle={styles.columnContentContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {stageLeads.map(renderLeadCard)}

              {onPressAddLead && (
                <TouchableOpacity
                  style={[styles.addButton, { borderColor: colors.border }]}
                  onPress={() => onPressAddLead(stage)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-outline" size={18} color={colors.textTertiary} />
                  <Text style={[styles.addText, { color: colors.textTertiary }]}>
                    Adicionar
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  column: {
    flex: 1,
  },
  columnHeader: {
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  columnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  columnDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  columnTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  countText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  totalText: {
    fontSize: Typography.xs,
    marginLeft: 18,
  },
  columnContent: {
    borderRadius: BorderRadius.md,
    maxHeight: 500,
  },
  columnContentContainer: {
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  leadCard: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  leadName: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 2,
  },
  leadArea: {
    fontSize: Typography.xs,
    marginBottom: Spacing.xs,
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadValue: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  leadScore: {
    fontSize: Typography.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
