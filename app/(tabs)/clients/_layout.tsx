import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../src/store/ThemeContext';

export default function ClientsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Clientes' }}
      />
      <Stack.Screen
        name="new"
        options={{ title: 'Novo Cliente', presentation: 'modal' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Perfil do Cliente' }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{ title: 'Editar Cliente' }}
      />
    </Stack>
  );
}
