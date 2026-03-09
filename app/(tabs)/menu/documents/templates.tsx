import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import Button from '../../../../src/components/ui/Button';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../../src/constants/theme';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  isDefault: boolean;
  variables: string[];
  previewContent: string;
}

const TEMPLATES: DocumentTemplate[] = [
  {
    id: '1',
    name: 'Procuracao Ad Judicia',
    description: 'Modelo padrao de procuracao para representacao judicial.',
    category: 'Procuracoes',
    isDefault: true,
    variables: ['{{NOME_CLIENTE}}', '{{CPF_CLIENTE}}', '{{ENDERECO_CLIENTE}}', '{{NOME_ADVOGADO}}', '{{OAB}}'],
    previewContent: 'PROCURACAO AD JUDICIA\n\nPelo presente instrumento particular de procuracao, {{NOME_CLIENTE}}, inscrito(a) no CPF sob o n. {{CPF_CLIENTE}}, residente e domiciliado(a) em {{ENDERECO_CLIENTE}}, nomeia e constitui seu(sua) procurador(a) o(a) Dr(a). {{NOME_ADVOGADO}}, inscrito(a) na OAB sob o n. {{OAB}}, conferindo-lhe poderes da clausula "ad judicia"...',
  },
  {
    id: '2',
    name: 'Contrato de Honorarios',
    description: 'Contrato padrao de prestacao de servicos advocaticios.',
    category: 'Contratos',
    isDefault: true,
    variables: ['{{NOME_CLIENTE}}', '{{CPF_CLIENTE}}', '{{NOME_ADVOGADO}}', '{{OAB}}', '{{VALOR_HONORARIOS}}', '{{OBJETO}}'],
    previewContent: 'CONTRATO DE PRESTACAO DE SERVICOS ADVOCATICIOS\n\nPelo presente instrumento particular, de um lado {{NOME_CLIENTE}}, CPF {{CPF_CLIENTE}}, doravante denominado(a) CONTRATANTE, e de outro lado Dr(a). {{NOME_ADVOGADO}}, OAB {{OAB}}, doravante denominado(a) CONTRATADO(A)...\n\nOBJETO: {{OBJETO}}\nVALOR: {{VALOR_HONORARIOS}}',
  },
  {
    id: '3',
    name: 'Peticao Inicial Simples',
    description: 'Modelo basico de peticao inicial para acao civel.',
    category: 'Peticoes',
    isDefault: true,
    variables: ['{{COMARCA}}', '{{NOME_AUTOR}}', '{{CPF_AUTOR}}', '{{NOME_REU}}', '{{CPF_REU}}', '{{FATOS}}', '{{PEDIDOS}}'],
    previewContent: 'EXCELENTISSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{COMARCA}} COMARCA\n\n{{NOME_AUTOR}}, inscrito(a) no CPF sob o n. {{CPF_AUTOR}}, vem respeitosamente a presenca de Vossa Excelencia propor ACAO em face de {{NOME_REU}}, CPF {{CPF_REU}}...',
  },
  {
    id: '4',
    name: 'Recibo de Pagamento',
    description: 'Recibo padrao para confirmacao de pagamento de honorarios.',
    category: 'Recibos',
    isDefault: true,
    variables: ['{{NOME_ADVOGADO}}', '{{OAB}}', '{{NOME_CLIENTE}}', '{{VALOR}}', '{{REFERENCIA}}', '{{DATA}}'],
    previewContent: 'RECIBO DE PAGAMENTO\n\nEu, Dr(a). {{NOME_ADVOGADO}}, OAB {{OAB}}, declaro ter recebido de {{NOME_CLIENTE}} a quantia de {{VALOR}}, referente a {{REFERENCIA}}.\n\nData: {{DATA}}',
  },
  {
    id: '5',
    name: 'Declaracao de Hipossuficiencia',
    description: 'Declaracao de hipossuficiencia economica para justica gratuita.',
    category: 'Declaracoes',
    isDefault: true,
    variables: ['{{NOME_CLIENTE}}', '{{CPF_CLIENTE}}', '{{ENDERECO_CLIENTE}}'],
    previewContent: 'DECLARACAO DE HIPOSSUFICIENCIA\n\nEu, {{NOME_CLIENTE}}, inscrito(a) no CPF sob o n. {{CPF_CLIENTE}}, residente em {{ENDERECO_CLIENTE}}, declaro para os devidos fins que nao possuo condicoes financeiras de arcar com as custas processuais e honorarios advocaticios sem prejuizo do sustento proprio e de minha familia...',
  },
  {
    id: '6',
    name: 'Substabelecimento',
    description: 'Modelo de substabelecimento com ou sem reserva de poderes.',
    category: 'Procuracoes',
    isDefault: false,
    variables: ['{{NOME_ADVOGADO_ORIGINAL}}', '{{OAB_ORIGINAL}}', '{{NOME_ADVOGADO_NOVO}}', '{{OAB_NOVO}}', '{{TIPO}}'],
    previewContent: 'SUBSTABELECIMENTO\n\nPelo presente instrumento, Dr(a). {{NOME_ADVOGADO_ORIGINAL}}, OAB {{OAB_ORIGINAL}}, substabelece {{TIPO}} os poderes que lhe foram conferidos ao(a) Dr(a). {{NOME_ADVOGADO_NOVO}}, OAB {{OAB_NOVO}}...',
  },
  {
    id: '7',
    name: 'Notificacao Extrajudicial',
    description: 'Modelo de notificacao extrajudicial para cobranca.',
    category: 'Notificacoes',
    isDefault: false,
    variables: ['{{NOME_DESTINATARIO}}', '{{ENDERECO_DESTINATARIO}}', '{{NOME_REMETENTE}}', '{{MOTIVO}}', '{{PRAZO}}'],
    previewContent: 'NOTIFICACAO EXTRAJUDICIAL\n\nAo(A) Sr(a). {{NOME_DESTINATARIO}}\n{{ENDERECO_DESTINATARIO}}\n\nFica Vossa Senhoria notificado(a) por {{NOME_REMETENTE}} acerca de {{MOTIVO}}, devendo providenciar no prazo de {{PRAZO}} dias...',
  },
];

export default function DocumentTemplatesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);

  const handleUseTemplate = useCallback((template: DocumentTemplate) => {
    setPreviewTemplate(null);
    router.push({
      pathname: '/(tabs)/menu/documents/generate' as `/${string}`,
      params: { templateId: template.id },
    });
  }, [router]);

  const renderTemplate = useCallback(({ item }: { item: DocumentTemplate }) => (
    <TouchableOpacity
      style={[styles.templateCard, Shadows.sm, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
      activeOpacity={0.7}
      onPress={() => setPreviewTemplate(item)}
    >
      <View style={styles.templateHeader}>
        <View style={[styles.templateIcon, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="document-text" size={22} color={colors.primary} />
        </View>
        {item.isDefault && (
          <View style={[styles.defaultBadge, { backgroundColor: `${colors.secondary}20` }]}>
            <Text style={[styles.defaultBadgeText, { color: colors.secondary }]}>Padrao</Text>
          </View>
        )}
      </View>
      <Text style={[styles.templateName, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.templateDescription, { color: colors.textSecondary }]} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.templateFooter}>
        <Text style={[styles.templateCategory, { color: colors.textTertiary }]}>
          {item.category}
        </Text>
        <Text style={[styles.variableCount, { color: colors.textTertiary }]}>
          {item.variables.length} variavel(is)
        </Text>
      </View>
    </TouchableOpacity>
  ), [colors]);

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
        visible={previewTemplate !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewTemplate(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPreviewTemplate(null)}>
          <Pressable
            style={[styles.modalContent, Shadows.lg, { backgroundColor: colors.surface }]}
            onPress={() => {}}
          >
            {previewTemplate && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{previewTemplate.name}</Text>
                  <TouchableOpacity
                    onPress={() => setPreviewTemplate(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  {previewTemplate.description}
                </Text>

                <Text style={[styles.variablesTitle, { color: colors.text }]}>Variaveis:</Text>
                <View style={styles.variablesContainer}>
                  {previewTemplate.variables.map((v) => (
                    <View key={v} style={[styles.variableChip, { backgroundColor: `${colors.info}15` }]}>
                      <Text style={[styles.variableText, { color: colors.info }]}>{v}</Text>
                    </View>
                  ))}
                </View>

                <Text style={[styles.previewTitle, { color: colors.text }]}>Pre-visualizacao:</Text>
                <ScrollView
                  style={[styles.previewBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={[styles.previewText, { color: colors.text }]}>
                    {previewTemplate.previewContent}
                  </Text>
                </ScrollView>

                <Button
                  title="Usar este modelo"
                  onPress={() => handleUseTemplate(previewTemplate)}
                  icon={<Ionicons name="create-outline" size={18} color="#ffffff" />}
                  style={styles.useButton}
                />
              </>
            )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  defaultBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  templateName: {
    fontSize: Typography.md,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  templateDescription: {
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  templateCategory: {
    fontSize: Typography.xs,
  },
  variableCount: {
    fontSize: Typography.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.md,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    flex: 1,
  },
  modalDescription: {
    fontSize: Typography.sm,
    marginBottom: Spacing.md,
  },
  variablesTitle: {
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
  previewTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  previewBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    maxHeight: 200,
  },
  previewText: {
    fontSize: Typography.sm,
    lineHeight: 22,
  },
  useButton: {
    marginTop: Spacing.md,
  },
});
