import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { TimerState } from '../../types/timesheet';

interface TimerWidgetProps {
  initialState?: TimerState;
  onStart?: (state: TimerState) => void;
  onStop?: (state: TimerState) => void;
  onPause?: (state: TimerState) => void;
  onResume?: (state: TimerState) => void;
  caseName?: string;
  clientName?: string;
  description?: string;
}

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function TimerWidget({
  initialState,
  onStart,
  onStop,
  onPause,
  onResume,
  caseName,
  clientName,
  description = '',
}: TimerWidgetProps) {
  const { colors } = useTheme();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRunning, setIsRunning] = useState(initialState?.isRunning || false);
  const [elapsed, setElapsed] = useState(initialState?.elapsed || 0);
  const [startTime, setStartTime] = useState<Date | null>(
    initialState?.startTime || null,
  );

  const getTimerState = useCallback((): TimerState => ({
    isRunning,
    startTime,
    elapsed,
    description,
    caseId: undefined,
    caseName,
    clientId: undefined,
    clientName,
    billable: true,
  }), [isRunning, startTime, elapsed, description, caseName, clientName]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    const now = new Date();
    setIsRunning(true);
    setStartTime(now);
    setElapsed(0);
    onStart?.({
      isRunning: true,
      startTime: now,
      elapsed: 0,
      description,
      caseName,
      clientName,
      billable: true,
    });
  };

  const handleStop = () => {
    setIsRunning(false);
    const state = getTimerState();
    onStop?.({ ...state, isRunning: false });
    setElapsed(0);
    setStartTime(null);
  };

  const handlePause = () => {
    setIsRunning(false);
    const state = getTimerState();
    onPause?.({ ...state, isRunning: false });
  };

  const handleResume = () => {
    setIsRunning(true);
    onResume?.(getTimerState());
  };

  const hasStarted = startTime !== null;
  const elapsedHours = elapsed / 3600;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isRunning ? colors.primary + '10' : colors.card,
          borderColor: isRunning ? colors.primary : colors.border,
        },
        Shadows.sm,
      ]}
    >
      {(caseName || clientName) && (
        <View style={styles.contextRow}>
          {clientName && (
            <View style={styles.contextItem}>
              <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
              <Text
                style={[styles.contextText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {clientName}
              </Text>
            </View>
          )}
          {caseName && (
            <View style={styles.contextItem}>
              <Ionicons name="briefcase-outline" size={12} color={colors.textSecondary} />
              <Text
                style={[styles.contextText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {caseName}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.timerDisplay}>
        <Text
          style={[
            styles.timerText,
            { color: isRunning ? colors.primary : colors.text },
          ]}
        >
          {formatElapsed(elapsed)}
        </Text>
        {isRunning && (
          <View style={[styles.liveDot, { backgroundColor: colors.error }]} />
        )}
      </View>

      {hasStarted && (
        <Text style={[styles.hoursText, { color: colors.textTertiary }]}>
          {elapsedHours.toFixed(2)} horas
        </Text>
      )}

      <View style={styles.controls}>
        {!hasStarted ? (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.success }]}
            onPress={handleStart}
            activeOpacity={0.7}
          >
            <Ionicons name="play" size={22} color="#ffffff" />
            <Text style={styles.buttonText}>Iniciar</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            {isRunning ? (
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: colors.warning }]}
                onPress={handlePause}
                activeOpacity={0.7}
              >
                <Ionicons name="pause" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Pausar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: colors.success }]}
                onPress={handleResume}
                activeOpacity={0.7}
              >
                <Ionicons name="play" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Retomar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.error }]}
              onPress={handleStop}
              activeOpacity={0.7}
            >
              <Ionicons name="stop" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Parar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    alignItems: 'center',
  },
  contextRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contextText: {
    fontSize: Typography.xs,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timerText: {
    fontSize: Typography.xxxl + 8,
    fontWeight: Typography.fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  hoursText: {
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  controls: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  activeControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
});
