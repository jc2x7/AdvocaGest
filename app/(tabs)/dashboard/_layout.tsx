import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../src/store/ThemeContext';

export default function DashboardLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="calendar"
        options={{ title: 'Agenda' }}
      />
      <Stack.Screen
        name="deadlines"
        options={{ title: 'Prazos' }}
      />
      <Stack.Screen
        name="new-appointment"
        options={{ title: 'Novo Compromisso', presentation: 'modal' }}
      />
      <Stack.Screen
        name="notifications"
        options={{ title: 'Notificacoes' }}
      />
    </Stack>
  );
}
