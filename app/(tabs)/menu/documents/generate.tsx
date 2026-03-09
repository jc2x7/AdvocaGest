import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import KeyboardWrapper from '../../../../src/components/layout/KeyboardWrapper';
import Input from '../../../../src/components/ui/Input';
import Button from '../../../../src/components/ui/Button';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../../src/constants/theme';

interface TemplateOption {
  id: string;
  name: string;
  variables: string[];
  content: string;
}

const AVAILABLE_TEMPLATES: TemplateOption[] = [
  {
    id: '1',
    name: 'Procuracao Ad Judicia',
    variables: ['NOME_CLIENTE', 'CPF_CLIENTE', 'ENDERECO_CLIENTE', 'NOME_ADVOGADO', 'OAB'],
    content: '<h1 style="text-align:center">PROCURACAO AD JUDICIA</h1><p>Pelo presente instrumento particular de procuracao, <strong>{{NOME_CLIENTE}}</strong>, inscrito(a) no CPF sob o n. <strong>{{CPF_CLIENTE}}</strong>, residente e domiciliado(a) em <strong>{{ENDERECO_CLIENTE}}</strong>, nomeia e constitui seu(sua) procurador(a) o(a) Dr(a). <strong>{{NOME_ADVOGADO}}</strong>, inscrito(a) na OAB sob o n. <strong>{{OAB}}</strong>, conferindo-lhe poderes da clausula "ad judicia", em conformidade com o art. 105 do Codigo de Processo Civil, para o foro em geral, podendo propor contra quem de direito as acoes competentes e defende-lo(a) nas contrarias, seguindo umas e outras ate final decisao, usando os recursos legais e acompanhando-os, conferindo-lhe ainda poderes especiais para confessar, reconhecer a procedencia do pedido, transigir, desistir, renunciar ao direito sobre o que se funda a acao, receber, dar quitacao e firmar compromisso.</p>',
  },
  {
    id: '2',
    name: 'Contrato de Honorarios',
    variables: ['NOME_CLIENTE', 'CPF_CLIENTE', 'NOME_ADVOGADO', 'OAB', 'VALOR_HONORARIOS', 'OBJETO'],
    content: '<h1 style="text-align:center">CONTRATO DE PRESTACAO DE SERVICOS ADVOCATICIOS</h1><p>Pelo presente instrumento particular, de um lado <strong>{{NOME_CLIENTE}}</strong>, CPF <strong>{{CPF_CLIENTE}}</strong>, doravante denominado(a) CONTRATANTE, e de outro lado Dr(a). <strong>{{NOME_ADVOGADO}}</strong>, OAB <strong>{{OAB}}</strong>, doravante denominado(a) CONTRATADO(A), celebram o presente contrato de prestacao de servicos advocaticios, mediante as clausulas e condicoes seguintes:</p><p><strong>CLAUSULA PRIMEIRA - DO OBJETO:</strong> {{OBJETO}}</p><p><strong>CLAUSULA SEGUNDA - DOS HONORARIOS:</strong> O(A) CONTRATANTE pagara ao(a) CONTRATADO(A) o valor de <strong>{{VALOR_HONORARIOS}}</strong> a titulo de honorarios advocaticios.</p>',
  },
  {
    id: '3',
    name: 'Peticao Inicial Simples',
    variables: ['COMARCA', 'NOME_AUTOR', 'CPF_AUTOR', 'NOME_REU', 'CPF_REU', 'FATOS', 'PEDIDOS'],
    content: '<h2 style="text-align:center">EXCELENTISSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{COMARCA}} COMARCA</h2><p><strong>{{NOME_AUTOR}}</strong>, inscrito(a) no CPF sob o n. {{CPF_AUTOR}}, vem respeitosamente a presenca de Vossa Excelencia propor ACAO em face de <strong>{{NOME_REU}}</strong>, CPF {{CPF_REU}}, pelos fatos e fundamentos a seguir expostos:</p><h3>DOS FATOS</h3><p>{{FATOS}}</p><h3>DOS PEDIDOS</h3><p>{{PEDIDOS}}</p>',
  },
  {
    id: '4',
    name: 'Recibo de Pagamento',
    variables: ['NOME_ADVOGADO', 'OAB', 'NOME_CLIENTE', 'VALOR', 'REFERENCIA', 'DATA'],
    content: '<h1 style="text-align:center">RECIBO DE PAGAMENTO</h1><p>Eu, Dr(a). <strong>{{NOME_ADVOGADO}}</strong>, OAB <strong>{{OAB}}</strong>, declaro ter recebido de <strong>{{NOME_CLIENTE}}</strong> a quantia de <strong>{{VALOR}}</strong>, referente a <strong>{{REFERENCIA}}</strong>.</p><p>Data: <strong>{{DATA}}</strong></p>',
  },
  {
    id: '5',
    name: 'Declaracao de Hipossuficiencia',
    variables: ['NOME_CLIENTE', 'CPF_CLIENTE', 'ENDERECO_CLIENTE'],
    content: '<h1 style="text-align:center">DECLARACAO DE HIPOSSUFICIENCIA</h1><p>Eu, <strong>{{NOME_CLIENTE}}</strong>, inscrito(a) no CPF sob o n. <strong>{{CPF_CLIENTE}}</strong>, residente em <strong>{{ENDERECO_CLIENTE}}</strong>, declaro para os devidos fins que nao possuo condicoes financeiras de arcar com as custas processuais e honorarios advocaticios sem prejuizo do sustento proprio e de minha familia, fazendo jus aos beneficios da Justica Gratuita nos termos da Lei.</p>',
  },
];

export default function GenerateDocumentScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ templateId?: string }>();

  const initialTemplate = AVAILABLE_TEMPLATES.find((t) => t.id === params.templateId) ?? null;

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(initialTemplate);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (user) {
      initial['NOME_ADVOGADO'] = user.name;
      initial['OAB'] = `${user.oabState} ${user.oabNumber}`;
    }
    return initial;
  });
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleVariableChange = useCallback((key: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSelectTemplate = useCallback((template: TemplateOption) => {
    setSelectedTemplate(template);
    setShowTemplatePicker(false);
  }, []);

  const generatedHtml = useMemo(() => {
    if (!selectedTemplate) return '';
    let html = selectedTemplate.content;
    for (const variable of selectedTemplate.variables) {
      const value = variableValues[variable] ?? `[${variable}]`;
      html = html.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    }
    return html;
  }, [selectedTemplate, variableValues]);

  const fullHtmlDocument = useMemo(() => {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:serif;padding:40px;line-height:1.8;color:#333}h1,h2,h3{text-align:center;margin-bottom:20px}p{text-align:justify;margin-bottom:12px}</style></head><body>${generatedHtml}</body></html>`;
  }, [generatedHtml]);

  const handleGeneratePdf = useCallback(async () => {
    if (!selectedTemplate) {
      Alert.alert('Erro', 'Selecione um modelo antes de gerar o PDF.');
      return;
    }

    setGenerating(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: fullHtmlDocument });
      Alert.alert('PDF gerado', 'O documento foi gerado com sucesso. Deseja compartilhar?', [
        { text: 'Fechar', style: 'cancel' },
        {
          text: 'Compartilhar',
          onPress: async () => {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Sharing.shareAsync(uri);
            } else {
              Alert.alert('Erro', 'Compartilhamento nao disponivel neste dispositivo.');
            }
          },
        },
      ]);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel gerar o PDF.');
    } finally {
      setGenerating(false);
    }
  }, [selectedTemplate, fullHtmlDocument]);

  const handleShare = useCallback(async () => {
    if (!selectedTemplate) return;

    try {
      const { uri } = await Print.printToFileAsync({ html: fullHtmlDocument });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Erro', 'Compartilhamento nao disponivel neste dispositivo.');
      }
    } catch {
      Alert.alert('Erro', 'Nao foi possivel compartilhar o documento.');
    }
  }, [selectedTemplate, fullHtmlDocument]);

  const formatVariableLabel = (variable: string): string => {
    return variable
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  return (
    <KeyboardWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Modelo</Text>

        <TouchableOpacity
          style={[styles.templateSelector, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => setShowTemplatePicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={22} color={colors.textSecondary} />
          <View style={styles.templateSelectorContent}>
            <Text
              style={[
                styles.templateSelectorText,
                { color: selectedTemplate ? colors.text : colors.placeholder },
              ]}
            >
              {selectedTemplate?.name ?? 'Selecione um modelo'}
            </Text>
          </View>
          <Ionicons name="chevron-down-outline" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        {selectedTemplate && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Preencher variaveis</Text>

            {selectedTemplate.variables.map((variable) => (
              <Input
                key={variable}
                label={formatVariableLabel(variable)}
                value={variableValues[variable] ?? ''}
                onChangeText={(text) => handleVariableChange(variable, text)}
              />
            ))}

            <View style={styles.actionsRow}>
              <Button
                title="Visualizar"
                variant="outline"
                onPress={() => setShowPreview(true)}
                icon={<Ionicons name="eye-outline" size={18} color={colors.primary} />}
                style={styles.actionButton}
              />
              <Button
                title="Gerar PDF"
                onPress={handleGeneratePdf}
                loading={generating}
                icon={<Ionicons name="download-outline" size={18} color="#ffffff" />}
                style={styles.actionButton}
              />
            </View>

            <Button
              title="Compartilhar"
              variant="secondary"
              onPress={handleShare}
              icon={<Ionicons name="share-outline" size={18} color={colors.text} />}
              style={styles.shareButton}
            />
          </>
        )}

        <Modal visible={showTemplatePicker} transparent animationType="fade" onRequestClose={() => setShowTemplatePicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowTemplatePicker(false)}>
            <Pressable style={[styles.modalContent, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Modelo</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {AVAILABLE_TEMPLATES.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateOption,
                      selectedTemplate?.id === template.id && { backgroundColor: `${colors.primary}15` },
                    ]}
                    onPress={() => handleSelectTemplate(template)}
                  >
                    <View style={styles.templateOptionInfo}>
                      <Text style={[styles.templateOptionName, { color: colors.text }]}>
                        {template.name}
                      </Text>
                      <Text style={[styles.templateOptionVars, { color: colors.textSecondary }]}>
                        {template.variables.length} variavel(is)
                      </Text>
                    </View>
                    {selectedTemplate?.id === template.id && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={showPreview} transparent animationType="slide" onRequestClose={() => setShowPreview(false)}>
          <View style={[styles.previewModal, { backgroundColor: colors.background }]}>
            <View style={[styles.previewHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Text style={[styles.previewTitle, { color: colors.text }]}>Pre-visualizacao</Text>
              <TouchableOpacity onPress={() => setShowPreview(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.previewContent}
              contentContainerStyle={styles.previewContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.previewPaper, Shadows.md, { backgroundColor: '#ffffff' }]}>
                <Text style={styles.previewText}>
                  {generatedHtml.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
                </Text>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  templateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    minHeight: 56,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  templateSelectorContent: {
    flex: 1,
  },
  templateSelectorText: {
    fontSize: Typography.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  shareButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  modalScroll: {
    maxHeight: 400,
  },
  templateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: 2,
  },
  templateOptionInfo: {
    flex: 1,
  },
  templateOptionName: {
    fontSize: Typography.md,
    fontWeight: '500',
  },
  templateOptionVars: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  previewModal: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  previewTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  previewContent: {
    flex: 1,
  },
  previewContentContainer: {
    padding: Spacing.md,
  },
  previewPaper: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    minHeight: 400,
  },
  previewText: {
    fontSize: Typography.sm,
    lineHeight: 24,
    color: '#333333',
  },
});
