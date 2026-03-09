import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatDate, formatTime, getDaysUntil } from '../../utils/dateUtils';
import { Appointment, AppointmentType } from '../../types/appointment';

interface UpcomingEventsProps {
  appointments: Appointment[];
  onPressEvent?: (appointment: Appointment) => void;
  onPressViewAll?: () => void;
}

const TYPE_CONFIG: Record<AppointmentType, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  hearing: { icon: 'hammer-outline', label: 'Audiencia' },
  deadline: { icon: 'alert-circle-outline', label: 'Prazo' },
  meeting: { icon: 'people-outline', label: 'Reuniao' },
  diligence: { icon: 'document-text-outline', label: 'Diligencia' },
  reminder: { icon: 'notifications-outline', label: 'Lembrete' },
  personal: { icon: 'person-outline', label: 'Pessoal' },
};

function getCountdownText(date: Date | string): string {
  const days = getDaysUntil(date);
  if (days < 0) return `${Math.abs(days)}d atras`;
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanha';
  return `em ${days}d`;
}

function getCountdownColor(date: Date | string, colors: ReturnType<typeof useTheme>['colors']): string {
  const days = getDaysUntil(date);
  if (days < 0) return colors.error;
  if (days === 0) return colors.warning;
  if (days <= 2) return colors.warning;
  return colors.success;
}

export default function UpcomingEvents({
  appointments,
  onPressEvent,
  onPressViewAll,
}: UpcomingEventsProps) {
  const { colors } = useTheme();

  const items = appointments.slice(0, 5);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card }, Shadows.sm]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Proximos Compromissos
        </Text>
        {onPressViewAll && (
          <TouchableOpacity onPress={onPressViewAll}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>
              Ver todos
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="calendar-outline"
            size={32}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Nenhum compromisso agendado
          </Text>
        </View>
      ) : (
        items.map((appointment, index) => {
          const config = TYPE_CONFIG[appointment.type];
          const countdownColor = getCountdownColor(appointment.date, colors);

          return (
            <TouchableOpacity
              key={appointment.id}
              style={[
                styles.eventItem,
                index < items.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderLight,
                },
              ]}
              onPress={() => onPressEvent?.(appointment)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.surfaceVariant },
                ]}
              >
                <Ionicons
                  name={config.icon}
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View style={styles.eventContent}>
                <Text
                  style={[styles.eventTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {appointment.title}
                </Text>
                <Text
                  style={[
                    styles.eventMeta,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {formatDate(appointment.date)} as {formatTime(appointment.date)}
                  {appointment.location ? ` - ${appointment.location}` : ''}
                </Text>
              </View>

              <View style={styles.countdownContainer}>
                <Text style={[styles.countdown, { color: countdownColor }]}>
                  {getCountdownText(appointment.date)}
                </Text>
              </View>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  viewAll: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  eventContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  eventTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },
  eventMeta: {
    fontSize: Typography.xs,
  },
  countdownContainer: {
    alignItems: 'flex-end',
  },
  countdown: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sm,
  },
});
