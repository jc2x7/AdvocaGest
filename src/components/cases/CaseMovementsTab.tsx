import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatDate, getRelativeTime } from '../../utils/dateUtils';
import { CaseMovement } from '../../types/movement';

interface CaseMovementsTabProps {
  movements: CaseMovement[];
}

export default function CaseMovementsTab({ movements }: CaseMovementsTabProps) {
  const { colors } = useTheme();

  const renderItem = ({ item, index }: { item: CaseMovement; index: number }) => {
    const isLast = index === movements.length - 1;
    const dotColor = item.isImportant ? colors.warning : colors.primary;

    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineLeft}>
          <View style={[styles.dot, { backgroundColor: dotColor }]}>
            {item.isImportant ? (
              <Ionicons name="star" size={10} color="#ffffff" />
            ) : (
              <View style={styles.innerDot} />
            )}
          </View>
          {!isLast && (
            <View style={[styles.line, { backgroundColor: colors.borderLight }]} />
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm, !isLast && styles.cardSpaced]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.date, { color: colors.primary }]}>
              {formatDate(item.date)}
            </Text>
            <Text style={[styles.relative, { color: colors.textTertiary }]}>
              {getRelativeTime(item.date)}
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={4}>
            {item.description}
          </Text>

          {item.source ? (
            <View style={styles.sourceRow}>
              <Ionicons name="link-outline" size={12} color={colors.textTertiary} />
              <Text style={[styles.sourceText, { color: colors.textTertiary }]}>
                {item.source}
              </Text>
            </View>
          ) : null}

          <View style={[styles.typeBadge, {
            backgroundColor: item.type === 'system' ? colors.infoLight : colors.surfaceVariant,
          }]}>
            <Text style={[styles.typeText, {
              color: item.type === 'system' ? colors.info : colors.textSecondary,
            }]}>
              {item.type === 'system' ? 'Sistema' : 'Manual'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={movements}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="swap-vertical-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Nenhuma movimentacao registrada
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 28,
    marginRight: Spacing.sm,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  card: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  cardSpaced: {
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  relative: {
    fontSize: Typography.xs,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 4,
  },
  description: {
    fontSize: Typography.xs,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  sourceText: {
    fontSize: Typography.xs,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.semibold,
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
