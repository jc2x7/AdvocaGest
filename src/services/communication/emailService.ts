import { Linking, Alert } from 'react-native';

/**
 * Builds a mailto: URI from the given parameters.
 */
function buildMailtoUri(
  to: string,
  subject?: string,
  body?: string,
): string {
  const params: string[] = [];

  if (subject) {
    params.push(`subject=${encodeURIComponent(subject)}`);
  }

  if (body) {
    params.push(`body=${encodeURIComponent(body)}`);
  }

  const queryString = params.length > 0 ? `?${params.join('&')}` : '';
  return `mailto:${encodeURIComponent(to)}${queryString}`;
}

/**
 * Opens the default email client with a new message pre-filled
 * with the given recipient, subject and body.
 */
export async function openEmail(
  to: string,
  subject?: string,
  body?: string,
): Promise<void> {
  const url = buildMailtoUri(to, subject, body);
  const supported = await Linking.canOpenURL(url);

  if (!supported) {
    Alert.alert(
      'E-mail nao disponivel',
      'Nao foi possivel abrir o aplicativo de e-mail. Verifique se ha um cliente de e-mail configurado.',
    );
    return;
  }

  await Linking.openURL(url);
}

/**
 * Replaces template variables in a string.
 *
 * Variables in the template follow the pattern {{variableName}}.
 * Example:
 *   template: "Prezado(a) {{clientName}}, seu processo {{caseNumber}} foi atualizado."
 *   variables: { clientName: "Joao", caseNumber: "123456" }
 *   result:    "Prezado(a) Joao, seu processo 123456 foi atualizado."
 */
function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }

  return result;
}

/**
 * Opens the email client with a message composed from a template.
 *
 * The template string may contain {{variableName}} placeholders
 * that will be replaced with values from the variables map.
 *
 * The template can include a subject line on the first line, separated
 * from the body by a newline. If no newline is found, the entire
 * template is treated as the body.
 */
export async function openEmailWithTemplate(
  to: string,
  template: string,
  variables: Record<string, string>,
): Promise<void> {
  const processedContent = replaceTemplateVariables(template, variables);

  const firstNewline = processedContent.indexOf('\n');
  let subject: string | undefined;
  let body: string;

  if (firstNewline !== -1) {
    subject = processedContent.substring(0, firstNewline).trim();
    body = processedContent.substring(firstNewline + 1).trim();
  } else {
    body = processedContent;
  }

  await openEmail(to, subject, body);
}
