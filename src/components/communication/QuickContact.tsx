import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

type ContactMethod = 'phone' | 'whatsapp' | 'email';

interface QuickContactProps {
  phone?: string;
  email?: string;
  clientName: string;
  onContactPress?: (method: ContactMethod) => void;
}

interface ContactButton {
  key: ContactMethod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: 'success' | 'primary' | 'info';
  available: boolean;
}

function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export default function QuickContact({
  phone,
  email,
  clientName,
  onContactPress,
}: QuickContactProps) {
  const { colors } = useTheme();

  const buttons: ContactButton[] = [
    {
      key: 'phone',
      label: 'Ligar',
      icon: 'call-outline',
      colorKey: 'success',
      available: !!phone,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: 'logo-whatsapp',
      colorKey: 'success',
      available: !!phone,
    },
    {
      key: 'email',
      label: 'E-mail',
      icon: 'mail-outline',
      colorKey: 'info',
      available: !!email,
    },
  ];

  const getColor = (colorKey: ContactButton['colorKey']): string => {
    const map: Record<ContactButton['colorKey'], string> = {
      success: colors.success,
      primary: colors.primary,
      info: colors.info,
    };
    return map[colorKey];
  };

  const handlePress = async (method: ContactMethod) => {
    onContactPress?.(method);

    try {
      switch (method) {
        case 'phone': {
          if (!phone) return;
          const phoneUrl = `tel:${cleanPhone(phone)}`;
          const canOpen = await Linking.canOpenURL(phoneUrl);
          if (canOpen) {
            await Linking.openURL(phoneUrl);
          }
          break;
        }
        case 'whatsapp': {
          if (!phone) return;
          const whatsappUrl = `whatsapp://send?phone=55${cleanPhone(phone)}&text=Ola ${clientName}`;
          const canOpen = await Linking.canOpenURL(whatsappUrl);
          if (canOpen) {
            await Linking.openURL(whatsappUrl);
          } else {
            Alert.alert(
              'WhatsApp nao encontrado',
              'O aplicativo WhatsApp nao esta instalado neste dispositivo.',
            );
          }
          break;
        }
        case 'email': {
          if (!email) return;
          const emailUrl = `mailto:${email}`;
          await Linking.openURL(emailUrl);
          break;
        }
      }
    } catch {
      Alert.alert('Erro', 'Nao foi possivel abrir o aplicativo.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }, Shadows.sm]}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        Contato Rapido
      </Text>
      <View style={styles.buttonsRow}>
        {buttons.map((button) => {
          const color = getColor(button.colorKey);

          return (
            <TouchableOpacity
              key={button.key}
              style={[
                styles.button,
                {
                  backgroundColor: button.available ? color + '15' : colors.surfaceVariant,
                  borderColor: button.available ? color : colors.border,
                },
              ]}
              onPress={() => handlePress(button.key)}
              disabled={!button.available}
              activeOpacity={0.7}
            >
              <Ionicons
                name={button.icon}
                size={22}
                color={button.available ? color : colors.disabled}
              />
              <Text
                style={[
                  styles.buttonLabel,
                  { color: button.available ? color : colors.disabled },
                ]}
              >
                {button.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  title: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.sm,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  buttonLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
});
