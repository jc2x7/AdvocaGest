import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/store/ThemeContext';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../src/constants/theme';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: '1',
    question: 'Como cadastrar um novo cliente?',
    answer: 'Acesse o menu "Clientes", toque no botao "+" no canto inferior direito e preencha os dados do cliente. Voce pode adicionar informacoes como CPF/CNPJ, endereco, telefone e e-mail.',
  },
  {
    id: '2',
    question: 'Como acompanhar os prazos processuais?',
    answer: 'Os prazos sao exibidos no Dashboard e na tela de Agenda. Voce tambem recebe notificacoes automaticas antes do vencimento. Configure os alertas em Configuracoes > Notificacoes.',
  },
  {
    id: '3',
    question: 'Como gerar documentos automaticamente?',
    answer: 'Acesse Menu > Documentos > Modelos. Selecione um modelo, escolha o processo/cliente relacionado e o sistema preenche automaticamente as variaveis. Depois, basta gerar o PDF.',
  },
  {
    id: '4',
    question: 'Como registrar horas trabalhadas (Timesheet)?',
    answer: 'Acesse Menu > Timesheet. Voce pode iniciar um cronometro em tempo real ou registrar manualmente as horas trabalhadas em cada processo. Os registros sao usados para gerar relatorios.',
  },
  {
    id: '5',
    question: 'Como controlar as financas do escritorio?',
    answer: 'Na aba Financeiro, voce encontra o controle de honorarios, despesas, receitas e relatorios financeiros. E possivel registrar pagamentos, gerar cobranças e acompanhar o fluxo de caixa.',
  },
  {
    id: '6',
    question: 'Como funciona a gestao de leads?',
    answer: 'Leads sao potenciais clientes. Acesse Menu > Leads para cadastrar novos contatos, acompanhar o funil de vendas e converter leads em clientes quando fechar o contrato.',
  },
  {
    id: '7',
    question: 'Posso usar o app offline?',
    answer: 'Sim, o AdvogaPlan funciona parcialmente offline. Dados consultados recentemente ficam em cache e voce pode registrar novas informacoes que serao sincronizadas quando a conexao for restabelecida.',
  },
  {
    id: '8',
    question: 'Como exportar meus dados?',
    answer: 'Acesse Configuracoes > Dados > Exportar CSV. Voce pode exportar clientes, processos e dados financeiros em formato CSV compativel com Excel e Google Sheets.',
  },
  {
    id: '9',
    question: 'Como alterar minha senha?',
    answer: 'Acesse Configuracoes > Seguranca > Alterar senha. Um e-mail de redefinicao sera enviado para o endereco cadastrado. Siga as instrucoes do e-mail para criar uma nova senha.',
  },
  {
    id: '10',
    question: 'Como configurar a autenticacao biometrica?',
    answer: 'Acesse Configuracoes > Seguranca e ative a opcao "Autenticacao biometrica". O app usara a impressao digital ou reconhecimento facial configurados no seu dispositivo.',
  },
  {
    id: '11',
    question: 'Como compartilhar documentos com clientes?',
    answer: 'Apos gerar ou fazer upload de um documento, toque no botao de compartilhamento. Voce pode enviar por WhatsApp, e-mail ou outros aplicativos instalados no dispositivo.',
  },
  {
    id: '12',
    question: 'Como registrar comunicacoes com clientes?',
    answer: 'Acesse Menu > Comunicacoes e toque no botao "+". Registre ligacoes, e-mails, reunioes e mensagens de WhatsApp. Todas as comunicacoes ficam vinculadas ao historico do cliente.',
  },
];

export default function SupportScreen() {
  const { colors } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const toggleFaq = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleSendFeedback = useCallback(async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Erro', 'Digite seu feedback antes de enviar.');
      return;
    }

    setSendingFeedback(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Obrigado!', 'Seu feedback foi enviado com sucesso. Agradecemos sua contribuicao.');
      setFeedbackText('');
      setShowFeedbackModal(false);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel enviar o feedback.');
    } finally {
      setSendingFeedback(false);
    }
  }, [feedbackText]);

  const handleRateApp = useCallback(() => {
    Alert.alert(
      'Avaliar o App',
      'Voce sera redirecionado para a loja de aplicativos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Avaliar',
          onPress: () => {
            Linking.openURL('https://play.google.com/store').catch(() => {});
          },
        },
      ],
    );
  }, []);

  const handleOpenLink = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Nao foi possivel abrir o link.');
    });
  }, []);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.versionCard, Shadows.sm, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
        <Ionicons name="logo-react" size={40} color={colors.primary} />
        <View style={styles.versionInfo}>
          <Text style={[styles.appName, { color: colors.text }]}>AdvogaPlan</Text>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>Versao 1.0.0</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Perguntas Frequentes</Text>

      {FAQ_DATA.map((item) => {
        const isExpanded = expandedId === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.faqItem,
              {
                backgroundColor: colors.card,
                borderColor: isExpanded ? colors.primary : colors.borderLight,
              },
            ]}
            onPress={() => toggleFaq(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQuestion, { color: colors.text }]} numberOfLines={isExpanded ? undefined : 2}>
                {item.question}
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textTertiary}
              />
            </View>
            {isExpanded && (
              <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                {item.answer}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Contato</Text>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
        onPress={() => setShowFeedbackModal(true)}
        activeOpacity={0.7}
      >
        <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="chatbox-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.actionInfo}>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Enviar feedback</Text>
          <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
            Compartilhe sugestoes ou relate problemas
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
        onPress={handleRateApp}
        activeOpacity={0.7}
      >
        <View style={[styles.actionIcon, { backgroundColor: '#fbbf2415' }]}>
          <Ionicons name="star-outline" size={22} color="#f59e0b" />
        </View>
        <View style={styles.actionInfo}>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Avaliar o aplicativo</Text>
          <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
            Deixe sua avaliacao na loja
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal</Text>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
        onPress={() => handleOpenLink('https://advocaplan.com.br/termos')}
        activeOpacity={0.7}
      >
        <View style={[styles.actionIcon, { backgroundColor: `${colors.info}15` }]}>
          <Ionicons name="document-text-outline" size={22} color={colors.info} />
        </View>
        <View style={styles.actionInfo}>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Termos de uso</Text>
        </View>
        <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
        onPress={() => handleOpenLink('https://advocaplan.com.br/privacidade')}
        activeOpacity={0.7}
      >
        <View style={[styles.actionIcon, { backgroundColor: `${colors.success}15` }]}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.success} />
        </View>
        <View style={styles.actionInfo}>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Politica de privacidade</Text>
        </View>
        <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />

      <Modal visible={showFeedbackModal} transparent animationType="fade" onRequestClose={() => setShowFeedbackModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowFeedbackModal(false)}>
          <Pressable style={[styles.modalContent, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Enviar Feedback</Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Sua opiniao e muito importante para melhorarmos o aplicativo.
            </Text>
            <TextInput
              style={[
                styles.feedbackInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              placeholder="Escreva seu feedback aqui..."
              placeholderTextColor={colors.placeholder}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Text style={[styles.modalActionText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: colors.primary, opacity: sendingFeedback ? 0.5 : 1 }]}
                onPress={handleSendFeedback}
                disabled={sendingFeedback}
              >
                <Text style={[styles.modalActionText, { color: '#ffffff' }]}>
                  {sendingFeedback ? 'Enviando...' : 'Enviar'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: Spacing.md,
  },
  versionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  versionInfo: {
    flex: 1,
  },
  appName: {
    fontSize: Typography.xl,
    fontWeight: '700',
  },
  versionText: {
    fontSize: Typography.sm,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  faqItem: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  faqQuestion: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  faqAnswer: {
    fontSize: Typography.sm,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  actionDescription: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  bottomSpacer: {
    height: Spacing.xl,
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
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  modalDescription: {
    fontSize: Typography.sm,
    marginBottom: Spacing.md,
  },
  feedbackInput: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.md,
    minHeight: 120,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalActionText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
});
