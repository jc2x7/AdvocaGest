import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../src/store/ThemeContext';

export default function FinancialLayout() {
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
        options={{ title: 'Financeiro' }}
      />
      <Stack.Screen
        name="contracts"
        options={{ title: 'Contratos' }}
      />
      <Stack.Screen
        name="contracts/new"
        options={{ title: 'Novo Contrato', presentation: 'modal' }}
      />
      <Stack.Screen
        name="contracts/[id]"
        options={{ title: 'Detalhes do Contrato' }}
      />
      <Stack.Screen
        name="receivables"
        options={{ title: 'Recebiveis' }}
      />
      <Stack.Screen
        name="expenses"
        options={{ title: 'Despesas' }}
      />
      <Stack.Screen
        name="expenses/new"
        options={{ title: 'Nova Despesa', presentation: 'modal' }}
      />
      <Stack.Screen
        name="cashflow"
        options={{ title: 'Fluxo de Caixa' }}
      />
      <Stack.Screen
        name="reports"
        options={{ title: 'Relatorios' }}
      />
    </Stack>
  );
}
