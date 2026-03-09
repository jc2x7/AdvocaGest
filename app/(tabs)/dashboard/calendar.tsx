import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { formatTime, formatDate } from '../../../src/utils/dateUtils';
import LoadingState from '../../../src/components/ui/LoadingState';
import ErrorState from '../../../src/components/ui/ErrorState';
import EmptyState from '../../../src/components/ui/EmptyState';
import FilterChips from '../../../src/components/ui/FilterChips';
import { getAppointments } from '../../../src/services/firebase/appointmentService';
import { Appointment, AppointmentType } from '../../../src/types/appointment';

type CalendarView = 'month' | 'week' | 'day';

const VIEW_OPTIONS = [
  { key: 'month', label: 'Mes' },
  { key: 'week', label: 'Semana' },
  { key: 'day', label: 'Dia' },
];

const TYPE_COLORS: Record<AppointmentType, string> = {
  hearing: '#ef4444',
  deadline: '#f59e0b',
  meeting: '#3b82f6',
  diligence: '#8b5cf6',
  reminder: '#22c55e',
  personal: '#64748b',
};

const TYPE_LABELS: Record<AppointmentType, string> = {
  hearing: 'Audiencia',
  deadline: 'Prazo',
  meeting: 'Reuniao',
  diligence: 'Diligencia',
  reminder: 'Lembrete',
  personal: 'Pessoal',
};

const TYPE_ICONS: Record<AppointmentType, keyof typeof Ionicons.glyphMap> = {
  hearing: 'hammer-outline',
  deadline: 'alert-circle-outline',
  meeting: 'people-outline',
  diligence: 'document-text-outline',
  reminder: 'notifications-outline',
  personal: 'person-outline',
};

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDates(date: Date): Date[] {
  const dayOfWeek = date.getDay();
  const start = new Date(date);
  start.setDate(start.getDate() - dayOfWeek);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export default function CalendarScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [calendarView, setCalendarView] = useState<CalendarView>('month');

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await getAppointments(user.uid);
      setAppointments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar agenda.';
      setError(message);
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    void load();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const markedDates = useMemo(() => {
    const marks: Record<string, { dots: Array<{ key: string; color: string }>; selected?: boolean; selectedColor?: string }> = {};
    appointments.forEach((apt) => {
      const dateStr = toDateString(apt.date instanceof Date ? apt.date : new Date(apt.date));
      if (!marks[dateStr]) {
        marks[dateStr] = { dots: [] };
      }
      const existing = marks[dateStr];
      if (existing.dots.length < 4) {
        const dotColor = TYPE_COLORS[apt.type];
        if (!existing.dots.some((d) => d.color === dotColor)) {
          existing.dots.push({ key: apt.type, color: dotColor });
        }
      }
    });

    if (marks[selectedDate]) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: colors.primary,
      };
    } else {
      marks[selectedDate] = {
        dots: [],
        selected: true,
        selectedColor: colors.primary,
      };
    }

    return marks;
  }, [appointments, selectedDate, colors.primary]);

  const selectedDayAppointments = useMemo(() => {
    if (calendarView === 'week') {
      const selectedDateObj = new Date(selectedDate + 'T00:00:00');
      const weekDates = getWeekDates(selectedDateObj);
      const weekStrings = weekDates.map((d) => toDateString(d));
      return appointments.filter((apt) => {
        const dateStr = toDateString(apt.date instanceof Date ? apt.date : new Date(apt.date));
        return weekStrings.includes(dateStr);
      });
    }
    return appointments.filter((apt) => {
      const dateStr = toDateString(apt.date instanceof Date ? apt.date : new Date(apt.date));
      return dateStr === selectedDate;
    });
  }, [appointments, selectedDate, calendarView]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  const renderAppointmentItem = useCallback(
    ({ item }: { item: Appointment }) => {
      const typeColor = TYPE_COLORS[item.type];
      const typeLabel = TYPE_LABELS[item.type];
      const typeIcon = TYPE_ICONS[item.type];

      return (
        <TouchableOpacity
          style={[styles.eventCard, { backgroundColor: colors.card, borderLeftColor: typeColor }, Shadows.sm]}
          activeOpacity={0.7}
        >
          <View style={styles.eventHeader}>
            <View style={[styles.eventIconBg, { backgroundColor: typeColor + '20' }]}>
              <Ionicons name={typeIcon} size={18} color={typeColor} />
            </View>
            <View style={styles.eventInfo}>
              <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.eventType, { color: typeColor }]}>{typeLabel}</Text>
            </View>
            <Text style={[styles.eventTime, { color: colors.textSecondary }]}>
              {item.allDay ? 'Dia inteiro' : formatTime(item.date)}
            </Text>
          </View>
          {item.location ? (
            <View style={styles.eventDetailRow}>
              <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.eventDetailText, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          ) : null}
          {item.caseName ? (
            <View style={styles.eventDetailRow}>
              <Ionicons name="briefcase-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.eventDetailText, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.caseName}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      );
    },
    [colors],
  );

  if (loading) {
    return <LoadingState message="Carregando agenda..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* View Toggle */}
      <FilterChips
        options={VIEW_OPTIONS}
        selectedKey={calendarView}
        onSelect={(key) => setCalendarView(key as CalendarView)}
      />

      {/* Calendar */}
      {calendarView !== 'day' && (
        <Calendar
          current={selectedDate}
          onDayPress={handleDayPress}
          markingType="multi-dot"
          markedDates={markedDates}
          hideExtraDays={calendarView === 'week'}
          theme={{
            backgroundColor: colors.background,
            calendarBackground: colors.card,
            textSectionTitleColor: colors.textSecondary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: colors.disabled,
            monthTextColor: colors.text,
            arrowColor: colors.primary,
            textMonthFontWeight: Typography.fontWeight.semibold,
            textDayFontSize: Typography.sm,
            textMonthFontSize: Typography.md,
          }}
          style={[styles.calendar, { borderColor: colors.border }]}
        />
      )}

      {/* Day Header */}
      {calendarView === 'day' && (
        <View style={[styles.dayHeader, { backgroundColor: colors.card }]}>
          <Text style={[styles.dayHeaderText, { color: colors.text }]}>
            {formatDate(selectedDate)}
          </Text>
        </View>
      )}

      {/* Events List */}
      <View style={styles.eventsContainer}>
        <Text style={[styles.eventsTitle, { color: colors.text }]}>
          {calendarView === 'week'
            ? 'Eventos da semana'
            : `Eventos de ${formatDate(selectedDate)}`}
        </Text>

        <FlatList
          data={selectedDayAppointments}
          renderItem={renderAppointmentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="Sem eventos"
              message="Nenhum compromisso para esta data."
            />
          }
        />
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }, Shadows.lg]}
        onPress={() => router.push('/(tabs)/dashboard/new-appointment')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendar: {
    borderBottomWidth: 1,
  },
  dayHeader: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: Typography.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  eventsContainer: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  eventsTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  eventsList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl + Spacing.xl,
  },
  eventCard: {
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIconBg: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  eventInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  eventTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  eventType: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
    marginTop: 1,
  },
  eventTime: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingLeft: 44,
    gap: 4,
  },
  eventDetailText: {
    fontSize: Typography.xs,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
