import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../store/ThemeContext';
import { Spacing, Typography } from '../../constants/theme';

interface OfflineIndicatorProps {
  isOffline: boolean;
  isSyncing?: boolean;
}

export default function OfflineIndicator({
  isOffline,
  isSyncing = false,
}: OfflineIndicatorProps) {
  const colors = useThemeColors();
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const shouldShow = isOffline || isSyncing;

  useEffect(() => {
    if (shouldShow) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -60,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldShow, translateY, opacity]);

  const backgroundColor = isSyncing ? colors.warning : colors.error;
  const textColor = '#ffffff';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        {isSyncing ? (
          <>
            <ActivityIndicator size="small" color={textColor} />
            <Text style={[styles.text, { color: textColor }]}>
              Sincronizando...
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="cloud-offline-outline" size={18} color={textColor} />
            <Text style={[styles.text, { color: textColor }]}>
              Voce esta offline. Seus dados serao sincronizados automaticamente.
            </Text>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  text: {
    fontSize: Typography.xs,
    fontWeight: '500',
    flexShrink: 1,
  },
});
