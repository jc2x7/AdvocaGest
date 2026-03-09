import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import Button from '../../../../src/components/ui/Button';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../../src/constants/theme';

interface MessageTemplate {
  id: string;
  name: string;
  type: 'whatsapp' | 'email';
  subject?: string;
  content: string;
  variables: string[];
  isDefault: boolean;
}

interface MockClient {
  id: string;
  name: string;
  phone: string;
  email: string;
}

const TEMPLATES: MessageTemplate[] = [
  {
    id: '1',
    name: 'Lembrete de audiencia',
    type: 'whatsapp',
    content: 'Prezado(a) {{NOME_CLIENTE}}, informamos que sua audiencia esta agendada para o dia {{DATA_AUDIENCIA}} as {{HORA_AUDIENCIA}}, no {{LOCAL}}. Por favor, confirme sua presenca. Atenciosamente, {{NOME_ADVOGADO}}.',
    variables: ['NOME_CLIENTE', 'DATA_AUDIENCIA', 'HORA_AUDIENCIA', 'LOCAL', 'NOME_ADVOGADO'],
    isDefault: true,
  },
  {
    id: '2',
    name: 'Atualizacao processual',
    type: 'whatsapp',
    content: 'Prezado(a) {{NOME_CLIENTE}}, informamos que houve movimentacao no seu processo n. {{NUMERO_PROCESSO}}. {{DESCRICAO_MOVIMENTACAO}}. Para mais detalhes, estamos a disposicao. Att, {{NOME_ADVOGADO}}.',
    variables: ['NOME_CLIENTE', 'NUMERO_PROCESSO', 'DESCRICAO_MOVIMENTACAO', 'NOME_ADVOGADO'],
    isDefault: true,
  },
  {
    id: '3',
    name: 'Cobranca de honorarios',
    type: 'email',
    subject: 'Lembrete de Pagamento - Honorarios Advocaticios',
    content: 'Prezado(a) {{NOME_CLIENTE}},\n\nEsperamos que esteja bem.\n\nGostaramos de lembrar que a parcela no valor de {{VALOR}} referente aos honorarios advocaticios do processo {{NUMERO_PROCESSO}} vence em {{DATA_VENCIMENTO}}.\n\nPara sua comodidade, segue a chave PIX: {{CHAVE_PIX}}\n\nCaso ja tenha efetuado o pagamento, desconsidere esta mensagem.\n\nAtenciosamente,\n{{NOME_ADVOGADO}}\n{{OAB}}',
    variables: ['NOME_CLIENTE', 'VALOR', 'NUMERO_PROCESSO', 'DATA_VENCIMENTO', 'CHAVE_PIX', 'NOME_ADVOGADO', 'OAB'],
    isDefault: true,
  },
  {
    id: '4',
    name: 'Confirmacao de reuniao',
    type: 'whatsapp',
    content: 'Ola {{NOME_CLIENTE}}, confirmamos sua reuniao agendada para {{DATA}} as {{HORA}}, {{LOCAL_OU_LINK}}. Caso precise reagendar, avise com antecedencia. {{NOME_ADVOGADO}}.',
    variables: ['NOME_CLIENTE', 'DATA', 'HORA', 'LOCAL_OU_LINK', 'NOME_ADVOGADO'],
    isDefault: true,
  },
  {
    id: '5',
    name: 'Solicitacao de documentos',
    type: 'email',
    subject: 'Solicitacao de Documentos - {{NUMERO_PROCESSO}}',
    content: 'Prezado(a) {{NOME_CLIENTE}},\n\nPara dar continuidade ao seu processo, necessitamos dos seguintes documentos:\n\n{{LISTA_DOCUMENTOS}}\n\nSolicitamos o envio ate {{DATA_LIMITE}}.\n\nQualquer duvida, estamos a disposicao.\n\nAtenciosamente,\n{{NOME_ADVOGADO}}',
    variables: ['NOME_CLIENTE', 'NUMERO_PROCESSO', 'LISTA_DOCUMENTOS', 'DATA_LIMITE', 'NOME_ADVOGADO'],
    isDefault: true,
  },
  {
    id: '6',
    name: 'Boas-vindas ao escritorio',
    type: 'whatsapp',
    content: 'Ola {{NOME_CLIENTE}}! Seja bem-vindo(a) ao nosso escritorio. Sou {{NOME_ADVOGADO}} e serei o(a) responsavel pelo seu caso. Estou a disposicao para qualquer duvida. Obrigado(a) pela confianca!',
    variables: ['NOME_CLIENTE', 'NOME_ADVOGADO'],
    isDefault: false,
  },
  {
    id: '7',
    name: 'Encerramento de processo',
    type: 'email',
    subject: 'Conclusao do Processo - {{NUMERO_PROCESSO}}',
    content: 'Prezado(a) {{NOME_CLIENTE}},\n\nInformamos que o processo n. {{NUMERO_PROCESSO}} foi concluido com {{RESULTADO}}.\n\n{{OBSERVACOES}}\n\nAgradecemos pela confianca depositada em nosso escritorio.\n\nAtenciosamente,\n{{NOME_ADVOGADO}}\n{{OAB}}',
    variables: ['NOME_CLIENTE', 'NUMERO_PROCESSO', 'RESULTADO', 'OBSERVACOES', 'NOME_ADVOGADO', 'OAB'],
    isDefault: false,
  },
];

const MOCK_CLIENTS: MockClient[] = [
  { id: '1', name: 'Joao Silva', phone: '5511999990001', email: 'joao@email.com' },
  { id: '2', name: 'Maria Santos', phone: '5511999990002', email: 'maria@email.com' },
  { id: '3', name: 'Pedro Oliveira', phone: '5511999990003', email: 'pedro@email.com' },
  { id: '4', name: 'Ana Costa', phone: '5511999990004', email: 'ana@email.com' },
];

export default function CommunicationTemplatesScreen() {
  const { colors } = useTheme();
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<MessageTemplate | null>(null);

  const handleUseTemplate = useCallback((template: MessageTemplate) => {
    setPendingTemplate(template);
    setShowClientPicker(true);
  }, []);

  const handleSelectClient = useCallback((client: MockClient) => {
    setShowClientPicker(false);
    if (!pendingTemplate) return;

    let message = pendingTemplate.content;
    message = message.replace(/\{\{NOME_CLIENTE\}\}/g, client.name);

    if (pendingTemplate.type === 'whatsapp') {
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `whatsapp://send?phone=${client.phone}&text=${encodedMessage}`;
      Linking.openURL(whatsappUrl).catch(() => {
        Alert.alert('Erro', 'Nao foi possivel abrir o WhatsApp.');
      });
    } else {
      let subject = pendingTemplate.subject ?? '';
      subject = subject.replace(/\{\{NOME_CLIENTE\}\}/g, client.name);
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(message);
      const mailUrl = `mailto:${client.email}?subject=${encodedSubject}&body=${encodedBody}`;
      Linking.openURL(mailUrl).catch(() => {
        Alert.alert('Erro', 'Nao foi possivel abrir o aplicativo de e-mail.');
      });
    }

    setPendingTemplate(null);
  }, [pendingTemplate]);

  const highlightVariables = useCallback((text: string, highlightColor: string): React.ReactNode => {
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, index) => {
      if (part.match(/^\{\{[^}]+\}\}$/)) {
        return (
          <Text key={index} style={{ color: highlightColor, fontWeight: '600' }}>
            {part}
          </Text>
        );
      }
      return part;
    });
  }, []);

  const renderTemplate = useCallback(({ item }: { item: MessageTemplate }) => {
    const isWhatsapp = item.type === 'whatsapp';
    const typeColor = isWhatsapp ? '#25d366' : '#ef4444';
    const typeIcon: keyof typeof Ionicons.glyphMap = isWhatsapp ? 'logo-whatsapp' : 'mail';

    return (
      <TouchableOpacity
        style={[styles.templateCard, Shadows.sm, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
        activeOpacity={0.7}
        onPress={() => setSelectedTemplate(item)}
      >
        <View style={styles.templateHeader}>
          <View style={[styles.typeIcon, { backgroundColor: `${typeColor}15` }]}>
            <Ionicons name={typeIcon} size={20} color={typeColor} />
          </View>
          <View style={styles.templateHeaderInfo}>
            <Text style={[styles.templateName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.templateType, { color: typeColor }]}>
              {isWhatsapp ? 'WhatsApp' : 'E-mail'}
            </Text>
          </View>
          {item.isDefault && (
            <View style={[styles.defaultBadge, { backgroundColor: `${colors.secondary}20` }]}>
              <Text style={[styles.defaultText, { color: colors.secondary }]}>Padrao</Text>
            </View>
          )}
        </View>
        <Text style={[styles.templatePreview, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.content}
        </Text>
        <View style={styles.templateFooter}>
          <Text style={[styles.variableCount, { color: colors.textTertiary }]}>
            {item.variables.length} variavel(is)
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={TEMPLATES}
        renderItem={renderTemplate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={selectedTemplate !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTemplate(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedTemplate(null)}>
          <Pressable
            style={[styles.previewModal, Shadows.lg, { backgroundColor: colors.surface }]}
            onPress={() => {}}
          >
            {selectedTemplate && (
              <>
                <View style={styles.previewHeader}>
                  <Text style={[styles.previewTitle, { color: colors.text }]}>
                    {selectedTemplate.name}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedTemplate(null)}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {selectedTemplate.subject && (
                  <View style={styles.subjectRow}>
                    <Text style={[styles.subjectLabel, { color: colors.textSecondary }]}>Assunto:</Text>
                    <Text style={[styles.subjectValue, { color: colors.text }]}>
                      {highlightVariables(selectedTemplate.subject, colors.info)}
                    </Text>
                  </View>
                )}

                <ScrollView
                  style={[styles.previewBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={[styles.previewText, { color: colors.text }]}>
                    {highlightVariables(selectedTemplate.content, colors.info)}
                  </Text>
                </ScrollView>

                <Text style={[styles.variablesLabel, { color: colors.text }]}>Variaveis:</Text>
                <View style={styles.variablesContainer}>
                  {selectedTemplate.variables.map((v) => (
                    <View key={v} style={[styles.variableChip, { backgroundColor: `${colors.info}15` }]}>
                      <Text style={[styles.variableText, { color: colors.info }]}>{`{{${v}}}`}</Text>
                    </View>
                  ))}
                </View>

                <Button
                  title="Usar este modelo"
                  onPress={() => {
                    setSelectedTemplate(null);
                    handleUseTemplate(selectedTemplate);
                  }}
                  icon={<Ionicons name="send-outline" size={18} color="#ffffff" />}
                  style={styles.useButton}
                />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showClientPicker} transparent animationType="fade" onRequestClose={() => setShowClientPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowClientPicker(false)}>
          <Pressable style={[styles.clientModal, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.clientModalTitle, { color: colors.text }]}>Selecionar Cliente</Text>
            <Text style={[styles.clientModalDesc, { color: colors.textSecondary }]}>
              As variaveis do cliente serao preenchidas automaticamente.
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {MOCK_CLIENTS.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={styles.clientOption}
                  onPress={() => handleSelectClient(client)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-circle-outline" size={28} color={colors.textSecondary} />
                  <View style={styles.clientInfo}>
                    <Text style={[styles.clientName, { color: colors.text }]}>{client.name}</Text>
                    <Text style={[styles.clientContact, { color: colors.textSecondary }]}>
                      {pendingTemplate?.type === 'whatsapp' ? client.phone : client.email}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
  },
  templateCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateHeaderInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  templateType: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  defaultBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  defaultText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  templatePreview: {
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  templateFooter: {
    marginTop: Spacing.sm,
  },
  variableCount: {
    fontSize: Typography.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  previewModal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.md,
    maxHeight: '85%',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    flex: 1,
  },
  subjectRow: {
    marginBottom: Spacing.sm,
  },
  subjectLabel: {
    fontSize: Typography.xs,
    fontWeight: '500',
    marginBottom: 2,
  },
  subjectValue: {
    fontSize: Typography.sm,
  },
  previewBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    maxHeight: 200,
    marginBottom: Spacing.md,
  },
  previewText: {
    fontSize: Typography.sm,
    lineHeight: 22,
  },
  variablesLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  variablesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  variableChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  variableText: {
    fontSize: Typography.xs,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  useButton: {
    marginTop: Spacing.sm,
  },
  clientModal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.md,
    maxHeight: '60%',
  },
  clientModalTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  clientModalDesc: {
    fontSize: Typography.sm,
    marginBottom: Spacing.md,
  },
  clientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: Typography.md,
    fontWeight: '500',
  },
  clientContact: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
});
