import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../store/ThemeContext';
import { BorderRadius, Shadows, Spacing, Typography } from '../../constants/theme';

type PickerMode = 'date' | 'time' | 'datetime';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: PickerMode;
  label?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export default function DateTimePicker({
  value,
  onChange,
  mode = 'date',
  label,
  minimumDate,
  maximumDate,
}: DateTimePickerProps) {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [selectedDate, setSelectedDate] = useState(value);
  const [selectedHour, setSelectedHour] = useState(value.getHours());
  const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());

  const showDate = mode === 'date' || mode === 'datetime';
  const showTime = mode === 'time' || mode === 'datetime';

  const displayText = (() => {
    if (mode === 'date') return formatDate(value);
    if (mode === 'time') return formatTime(value);
    return `${formatDate(value)} ${formatTime(value)}`;
  })();

  const openPicker = () => {
    setViewYear(value.getFullYear());
    setViewMonth(value.getMonth());
    setSelectedDate(value);
    setSelectedHour(value.getHours());
    setSelectedMinute(value.getMinutes());
    setVisible(true);
  };

  const handleConfirm = () => {
    const newDate = new Date(selectedDate);
    if (showTime) {
      newDate.setHours(selectedHour, selectedMinute, 0, 0);
    }
    onChange(newDate);
    setVisible(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isDateDisabled = (day: number): boolean => {
    const d = new Date(viewYear, viewMonth, day);
    if (minimumDate && d < new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate())) {
      return true;
    }
    if (maximumDate && d > new Date(maximumDate.getFullYear(), maximumDate.getMonth(), maximumDate.getDate())) {
      return true;
    }
    return false;
  };

  const selectDay = (day: number) => {
    setSelectedDate(new Date(viewYear, viewMonth, day));
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const isSelectedDay = (day: number): boolean => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
    );
  };

  const isTodayDay = (day: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  return (
    <>
      <TouchableOpacity
        onPress={openPicker}
        style={[
          styles.trigger,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
        activeOpacity={0.7}
      >
        <Ionicons
          name={showTime && !showDate ? 'time-outline' : 'calendar-outline'}
          size={20}
          color={colors.textSecondary}
          style={styles.triggerIcon}
        />
        <View style={styles.triggerContent}>
          {label && (
            <Text style={[styles.triggerLabel, { color: colors.textSecondary }]}>
              {label}
            </Text>
          )}
          <Text style={[styles.triggerValue, { color: colors.text }]}>
            {displayText}
          </Text>
        </View>
        <Ionicons
          name="chevron-down-outline"
          size={16}
          color={colors.textTertiary}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setVisible(false)}
        >
          <Pressable
            style={[
              styles.pickerContainer,
              Shadows.lg,
              { backgroundColor: colors.surface },
            ]}
            onPress={() => {}}
          >
            {showDate && (
              <>
                <View style={styles.monthHeader}>
                  <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.monthTitle, { color: colors.text }]}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </Text>
                  <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.weekRow}>
                  {WEEKDAY_NAMES.map((name) => (
                    <Text
                      key={name}
                      style={[styles.weekDay, { color: colors.textTertiary }]}
                    >
                      {name}
                    </Text>
                  ))}
                </View>

                <View style={styles.daysGrid}>
                  {calendarCells.map((day, index) => {
                    if (day === null) {
                      return <View key={`empty-${index}`} style={styles.dayCell} />;
                    }
                    const disabled = isDateDisabled(day);
                    const selected = isSelectedDay(day);
                    const today = isTodayDay(day);

                    return (
                      <TouchableOpacity
                        key={`day-${day}`}
                        disabled={disabled}
                        onPress={() => selectDay(day)}
                        style={[
                          styles.dayCell,
                          selected && {
                            backgroundColor: colors.primary,
                            borderRadius: 20,
                          },
                          today && !selected && {
                            borderWidth: 1,
                            borderColor: colors.primary,
                            borderRadius: 20,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: colors.text },
                            selected && { color: '#ffffff' },
                            disabled && { color: colors.disabled },
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {showTime && (
              <View style={styles.timeContainer}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                  Horario
                </Text>
                <View style={styles.timeRow}>
                  <ScrollView
                    style={styles.timeScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.timeScrollContent}
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                      <TouchableOpacity
                        key={`h-${h}`}
                        onPress={() => setSelectedHour(h)}
                        style={[
                          styles.timeOption,
                          selectedHour === h && {
                            backgroundColor: colors.primary,
                            borderRadius: BorderRadius.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            { color: colors.text },
                            selectedHour === h && { color: '#ffffff' },
                          ]}
                        >
                          {String(h).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={[styles.timeSeparator, { color: colors.text }]}>:</Text>
                  <ScrollView
                    style={styles.timeScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.timeScrollContent}
                  >
                    {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                      <TouchableOpacity
                        key={`m-${m}`}
                        onPress={() => setSelectedMinute(m)}
                        style={[
                          styles.timeOption,
                          selectedMinute === m && {
                            backgroundColor: colors.primary,
                            borderRadius: BorderRadius.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            { color: colors.text },
                            selectedMinute === m && { color: '#ffffff' },
                          ]}
                        >
                          {String(m).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant }]}
              >
                <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.actionText, { color: '#ffffff' }]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    minHeight: 56,
  },
  triggerIcon: {
    marginRight: Spacing.sm,
  },
  triggerContent: {
    flex: 1,
  },
  triggerLabel: {
    fontSize: Typography.xs,
    marginBottom: 2,
  },
  triggerValue: {
    fontSize: Typography.md,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  pickerContainer: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  monthTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: Typography.sm,
  },
  timeContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  timeLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  timeScroll: {
    width: 60,
    height: 150,
  },
  timeScrollContent: {
    alignItems: 'center',
  },
  timeOption: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    minWidth: 48,
    alignItems: 'center',
  },
  timeOptionText: {
    fontSize: Typography.md,
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: Typography.xl,
    fontWeight: '700',
    marginHorizontal: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  actionBtn: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  actionText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
});
