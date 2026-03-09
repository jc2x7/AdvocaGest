import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';
import { formatDateTime, getRelativeTime } from '../../utils/dateUtils';
import { Communication, CommunicationType, CommunicationDirection } from '../../types/communication';

interface CommunicationItemProps {
  communication: Communication;
  onPress?: (communication: Communication) => void;
}

const TYPE_CONFIG: Record<CommunicationType, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  phone_call: { icon: 'call-outline', label: 'Ligacao' },
  whatsapp: { icon: 'logo-whatsapp', label: 'WhatsApp' },
  email: { icon: 'mail-outline', label: 'E-mail' },
  in_person: { icon: 'people-outline', label: 'Presencial' },
  video_call: { icon: 'videocam-outline', label: 'Videochamada' },
  other: { icon: 'chatbubble-outline', label: 'Outro' },
};

export default function CommunicationItem({
  communication,
  onPress,
}: CommunicationItemProps) {
  const { colors } = useTheme();

  const config = TYPE_CONFIG[communication.type];
  const isIncoming = communication.direction === 'incoming';

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.borderLight }]}
      onPress={() => onPress?.(communication)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name={config.icon} size={20} color={colors.primary} />
        <View
          style={[
            styles.directionIndicator,
            {
              backgroundColor: isIncoming ? colors.info : colors.success,
            },
          ]}
        >
          <Ionicons
            name={isIncoming ? 'arrow-down' : 'arrow-up'}
            size={8}
            color="#ffffff"
          />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.subject, { color: colors.text }]} numberOfLines={1}>
            {communication.subject}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {getRelativeTime(communication.date)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>
            {config.label}
          </Text>
          <Text style={[styles.clientName, { color: colors.textSecondary }]} numberOfLines={1}>
            {communication.clientName}
          </Text>
        </View>

        {communication.notes ? (
          <Text
            style={[styles.notes, { color: colors.textTertiary }]}
            numberOfLines={2}
          >
            {communication.notes}
          </Text>
        ) : null}

        <View style={styles.footer}>
          {communication.duration !== undefined && communication.duration > 0 && (
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
              <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                {communication.duration} min
              </Text>
            </View>
          )}

          {communication.followUpDate && !communication.followUpDone && (
            <View style={[styles.followUpBadge, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="flag-outline" size={10} color={colors.warning} />
              <Text style={[styles.followUpText, { color: colors.warning }]}>
                Follow-up pendente
              </Text>
            </View>
          )}

          {communication.followUpDone && (
            <View style={[styles.followUpBadge, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark-outline" size={10} color={colors.success} />
              <Text style={[styles.followUpText, { color: colors.success }]}>
                Follow-up concluido
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  directionIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  subject: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
    marginRight: Spacing.sm,
  },
  time: {
    fontSize: Typography.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  clientName: {
    fontSize: Typography.xs,
    flex: 1,
  },
  notes: {
    fontSize: Typography.xs,
    lineHeight: 18,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  footerText: {
    fontSize: Typography.xs,
  },
  followUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  followUpText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
  },
});
