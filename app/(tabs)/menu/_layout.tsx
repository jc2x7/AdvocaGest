import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../src/store/ThemeContext';

export default function MenuLayout() {
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
        options={{ title: 'Menu' }}
      />
      <Stack.Screen
        name="profile"
        options={{ title: 'Perfil do Advogado' }}
      />
      <Stack.Screen
        name="office"
        options={{ title: 'Dados do Escritorio' }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: 'Configuracoes' }}
      />
      <Stack.Screen
        name="support"
        options={{ title: 'Suporte e FAQ' }}
      />
      <Stack.Screen
        name="documents/index"
        options={{ title: 'Documentos' }}
      />
      <Stack.Screen
        name="documents/templates"
        options={{ title: 'Modelos de Documento' }}
      />
      <Stack.Screen
        name="documents/generate"
        options={{ title: 'Gerar Documento', presentation: 'modal' }}
      />
      <Stack.Screen
        name="communications/index"
        options={{ title: 'Comunicacoes' }}
      />
      <Stack.Screen
        name="communications/new"
        options={{ title: 'Nova Comunicacao', presentation: 'modal' }}
      />
      <Stack.Screen
        name="communications/templates"
        options={{ title: 'Modelos de Mensagem' }}
      />
    </Stack>
  );
}
