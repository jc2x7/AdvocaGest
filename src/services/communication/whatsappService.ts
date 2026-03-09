import { Linking, Alert } from 'react-native';

/**
 * Cleans a phone number string and formats it for WhatsApp API
 * with the Brazilian country code (+55).
 *
 * Accepts inputs such as:
 *   "(11) 99999-9999" -> "5511999999999"
 *   "11999999999"     -> "5511999999999"
 *   "+5511999999999"  -> "5511999999999"
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.startsWith('55') && digitsOnly.length >= 12) {
    return digitsOnly;
  }

  return `55${digitsOnly}`;
}

/**
 * Opens WhatsApp with the given phone number and optional pre-filled message.
 * Uses the wa.me deep link format.
 */
export async function openWhatsApp(
  phone: string,
  message?: string,
): Promise<void> {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  let url = `https://wa.me/${formattedPhone}`;

  if (message) {
    const encodedMessage = encodeURIComponent(message);
    url = `${url}?text=${encodedMessage}`;
  }

  const supported = await Linking.canOpenURL(url);

  if (!supported) {
    Alert.alert(
      'WhatsApp nao encontrado',
      'Nao foi possivel abrir o WhatsApp. Verifique se o aplicativo esta instalado.',
    );
    return;
  }

  await Linking.openURL(url);
}
