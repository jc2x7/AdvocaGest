import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../src/store/ThemeContext';

export default function CasesLayout() {
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
        options={{ title: 'Processos' }}
      />
      <Stack.Screen
        name="new"
        options={{ title: 'Novo Processo', presentation: 'modal' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Detalhes do Processo' }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{ title: 'Editar Processo' }}
      />
    </Stack>
  );
}
