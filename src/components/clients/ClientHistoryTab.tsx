import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatDateTime, getRelativeTime } from '../../utils/dateUtils';
import { Communication, CommunicationType, CommunicationDirection } from '../../types/communication';

interface ClientHistoryTabProps {
  communications: Communication[];
  onPressCommunication?: (communication: Communication) => void;
}

const TYPE_ICONS: Record<CommunicationType, keyof typeof Ionicons.glyphMap> = {
  phone_call: 'call-outline',
  whatsapp: 'logo-whatsapp',
  email: 'mail-outline',
  in_person: 'people-outline',
  video_call: 'videocam-outline',
  other: 'chatbubble-outline',
};

const TYPE_LABELS: Record<CommunicationType, string> = {
  phone_call: 'Ligacao',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  in_person: 'Presencial',
  video_call: 'Videochamada',
  other: 'Outro',
};

export default function ClientHistoryTab({
  communications,
  onPressCommunication,
}: ClientHistoryTabProps) {
  const { colors } = useTheme();

  const renderItem = ({ item, index }: { item: Communication; index: number }) => {
    const icon = TYPE_ICONS[item.type];
    const isIncoming = item.direction === 'incoming';
    const isLast = index === communications.length - 1;

    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineLeft}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]}>
            <Ionicons name={icon} size={14} color="#ffffff" />
          </View>
          {!isLast && (
            <View style={[styles.line, { backgroundColor: colors.borderLight }]} />
          )}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card },
            Shadows.sm,
            !isLast && styles.cardSpaced,
          ]}
        >
          <View style={styles.cardHeader} onTouchEnd={() => onPressCommunication?.(item)}>
            <View style={styles.cardHeaderLeft}>
              <Text style={[styles.typeLabel, { color: colors.primary }]}>
                {TYPE_LABELS[item.type]}
              </Text>
              <View style={[styles.directionBadge, {
                backgroundColor: isIncoming ? colors.infoLight : colors.successLight,
              }]}>
                <Ionicons
                  name={isIncoming ? 'arrow-down' : 'arrow-up'}
                  size={10}
                  color={isIncoming ? colors.info : colors.success}
                />
                <Text style={[styles.directionText, {
                  color: isIncoming ? colors.info : colors.success,
                }]}>
                  {isIncoming ? 'Recebida' : 'Enviada'}
                </Text>
              </View>
            </View>
            <Text style={[styles.timeText, { color: colors.textTertiary }]}>
              {getRelativeTime(item.date)}
            </Text>
          </View>

          <Text style={[styles.subject, { color: colors.text }]} numberOfLines={2}>
            {item.subject}
          </Text>

          {item.notes ? (
            <Text style={[styles.notes, { color: colors.textSecondary }]} numberOfLines={3}>
              {item.notes}
            </Text>
          ) : null}

          {item.duration !== undefined && item.duration > 0 ? (
            <View style={styles.durationContainer}>
              <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
              <Text style={[styles.duration, { color: colors.textTertiary }]}>
                {item.duration} min
              </Text>
            </View>
          ) : null}

          {item.followUpDate && !item.followUpDone ? (
            <View style={[styles.followUp, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="flag-outline" size={12} color={colors.warning} />
              <Text style={[styles.followUpText, { color: colors.warning }]}>
                Follow-up: {formatDateTime(item.followUpDate)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={communications}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Nenhuma comunicacao registrada
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
    width: 32,
    marginRight: Spacing.sm,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  directionText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
  },
  timeText: {
    fontSize: Typography.xs,
  },
  subject: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 4,
  },
  notes: {
    fontSize: Typography.xs,
    lineHeight: 18,
    marginBottom: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  duration: {
    fontSize: Typography.xs,
  },
  followUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  followUpText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
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
