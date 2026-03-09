import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { getRelativeTime } from '../../utils/dateUtils';

type ActivityType =
  | 'case_created'
  | 'case_updated'
  | 'client_added'
  | 'document_uploaded'
  | 'payment_received'
  | 'deadline_completed'
  | 'hearing_scheduled'
  | 'movement_added'
  | 'communication'
  | 'task_completed';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: Date | string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: keyof typeof Ionicons.glyphMap; colorKey: 'primary' | 'success' | 'info' | 'warning' | 'secondary' }
> = {
  case_created: { icon: 'briefcase-outline', colorKey: 'primary' },
  case_updated: { icon: 'create-outline', colorKey: 'info' },
  client_added: { icon: 'person-add-outline', colorKey: 'success' },
  document_uploaded: { icon: 'document-outline', colorKey: 'info' },
  payment_received: { icon: 'cash-outline', colorKey: 'success' },
  deadline_completed: { icon: 'checkmark-circle-outline', colorKey: 'success' },
  hearing_scheduled: { icon: 'hammer-outline', colorKey: 'warning' },
  movement_added: { icon: 'swap-vertical-outline', colorKey: 'info' },
  communication: { icon: 'chatbubble-outline', colorKey: 'secondary' },
  task_completed: { icon: 'checkbox-outline', colorKey: 'success' },
};

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const { colors } = useTheme();

  const items = activities.slice(0, 10);

  const getColor = (colorKey: string): string => {
    const map: Record<string, string> = {
      primary: colors.primary,
      success: colors.success,
      info: colors.info,
      warning: colors.warning,
      secondary: colors.secondary,
    };
    return map[colorKey] || colors.primary;
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card }, Shadows.sm]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Atividades Recentes
      </Text>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Nenhuma atividade recente
          </Text>
        </View>
      ) : (
        items.map((activity, index) => {
          const config = ACTIVITY_CONFIG[activity.type];
          const color = getColor(config.colorKey);
          const isLast = index === items.length - 1;

          return (
            <View key={activity.id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[styles.dot, { backgroundColor: color }]}
                >
                  <Ionicons name={config.icon} size={12} color="#ffffff" />
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.line,
                      { backgroundColor: colors.borderLight },
                    ]}
                  />
                )}
              </View>

              <View style={[styles.timelineContent, !isLast && styles.timelineContentSpaced]}>
                <Text
                  style={[styles.activityTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {activity.title}
                </Text>
                <Text
                  style={[
                    styles.activityDescription,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {activity.description}
                </Text>
                <Text
                  style={[styles.activityTime, { color: colors.textTertiary }]}
                >
                  {getRelativeTime(activity.date)}
                </Text>
              </View>
            </View>
          );
        })
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
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 28,
    marginRight: Spacing.sm,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineContentSpaced: {
    paddingBottom: Spacing.md,
  },
  activityTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: Typography.xs,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: Typography.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.sm,
  },
});
