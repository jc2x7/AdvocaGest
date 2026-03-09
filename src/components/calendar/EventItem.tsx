import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';
import { formatTime, formatDate } from '../../utils/dateUtils';
import { Appointment, AppointmentType, AppointmentStatus } from '../../types/appointment';

interface EventItemProps {
  appointment: Appointment;
  onPress?: (appointment: Appointment) => void;
  showDate?: boolean;
}

const TYPE_CONFIG: Record<AppointmentType, { icon: keyof typeof Ionicons.glyphMap; label: string; colorKey: string }> = {
  hearing: { icon: 'hammer-outline', label: 'Audiencia', colorKey: 'warning' },
  deadline: { icon: 'alert-circle-outline', label: 'Prazo', colorKey: 'error' },
  meeting: { icon: 'people-outline', label: 'Reuniao', colorKey: 'info' },
  diligence: { icon: 'document-text-outline', label: 'Diligencia', colorKey: 'primary' },
  reminder: { icon: 'notifications-outline', label: 'Lembrete', colorKey: 'secondary' },
  personal: { icon: 'person-outline', label: 'Pessoal', colorKey: 'success' },
};

const STATUS_ICONS: Record<AppointmentStatus, keyof typeof Ionicons.glyphMap> = {
  scheduled: 'time-outline',
  completed: 'checkmark-circle-outline',
  cancelled: 'close-circle-outline',
};

export default function EventItem({
  appointment,
  onPress,
  showDate = false,
}: EventItemProps) {
  const { colors } = useTheme();

  const config = TYPE_CONFIG[appointment.type];
  const getColor = (): string => {
    const map: Record<string, string> = {
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
      primary: colors.primary,
      secondary: colors.secondary,
      success: colors.success,
    };
    return map[config.colorKey] || colors.primary;
  };
  const color = appointment.color || getColor();
  const isCancelled = appointment.status === 'cancelled';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderLeftColor: color, borderBottomColor: colors.borderLight },
        isCancelled && styles.cancelledContainer,
      ]}
      onPress={() => onPress?.(appointment)}
      activeOpacity={0.7}
    >
      <View style={styles.timeContainer}>
        {appointment.allDay ? (
          <Text style={[styles.allDay, { color }]}>Dia todo</Text>
        ) : (
          <>
            <Text style={[styles.time, { color }]}>
              {formatTime(appointment.date)}
            </Text>
            {appointment.endDate && (
              <Text style={[styles.endTime, { color: colors.textTertiary }]}>
                {formatTime(appointment.endDate)}
              </Text>
            )}
          </>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Ionicons name={config.icon} size={14} color={color} />
          <Text
            style={[
              styles.title,
              { color: colors.text },
              isCancelled && styles.cancelledText,
            ]}
            numberOfLines={1}
          >
            {appointment.title}
          </Text>
        </View>

        {showDate && (
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {formatDate(appointment.date)}
          </Text>
        )}

        {appointment.clientName && (
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {appointment.clientName}
            </Text>
          </View>
        )}

        {appointment.location && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {appointment.location}
            </Text>
          </View>
        )}
      </View>

      <Ionicons
        name={STATUS_ICONS[appointment.status]}
        size={18}
        color={
          appointment.status === 'completed'
            ? colors.success
            : appointment.status === 'cancelled'
              ? colors.error
              : colors.textTertiary
        }
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
  },
  cancelledContainer: {
    opacity: 0.6,
  },
  timeContainer: {
    width: 56,
    marginRight: Spacing.sm,
    alignItems: 'center',
  },
  time: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  endTime: {
    fontSize: Typography.xs,
  },
  allDay: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
  },
  cancelledText: {
    textDecorationLine: 'line-through',
  },
  dateText: {
    fontSize: Typography.xs,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: Typography.xs,
    flex: 1,
  },
});
