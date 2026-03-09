import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../../../src/store/ThemeContext';
import SearchBar from '../../../../src/components/ui/SearchBar';
import FilterChips from '../../../../src/components/ui/FilterChips';
import EmptyState from '../../../../src/components/ui/EmptyState';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../../src/constants/theme';

interface DocumentItem {
  id: string;
  name: string;
  category: string;
  size: string;
  createdAt: Date;
  caseTitle?: string;
  clientName?: string;
  fileType: string;
}

const CATEGORY_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'petitions', label: 'Peticoes' },
  { key: 'decisions', label: 'Decisoes' },
  { key: 'evidence', label: 'Provas' },
  { key: 'proxies', label: 'Procuracoes' },
  { key: 'contracts', label: 'Contratos' },
  { key: 'receipts', label: 'Recibos' },
  { key: 'reports', label: 'Relatorios' },
];

const MOCK_DOCUMENTS: DocumentItem[] = [
  { id: '1', name: 'Peticao Inicial - Processo 001', category: 'petitions', size: '245 KB', createdAt: new Date(2026, 2, 1), caseTitle: 'Acao de Cobranca', clientName: 'Joao Silva', fileType: 'pdf' },
  { id: '2', name: 'Procuracao Ad Judicia', category: 'proxies', size: '120 KB', createdAt: new Date(2026, 1, 28), clientName: 'Maria Santos', fileType: 'pdf' },
  { id: '3', name: 'Contrato de Honorarios', category: 'contracts', size: '180 KB', createdAt: new Date(2026, 1, 25), clientName: 'Pedro Oliveira', fileType: 'pdf' },
  { id: '4', name: 'Sentenca - Processo 002', category: 'decisions', size: '340 KB', createdAt: new Date(2026, 1, 20), caseTitle: 'Acao Trabalhista', clientName: 'Ana Costa', fileType: 'pdf' },
  { id: '5', name: 'Comprovante de Pagamento', category: 'receipts', size: '90 KB', createdAt: new Date(2026, 1, 15), clientName: 'Carlos Lima', fileType: 'jpg' },
];

function getFileIcon(fileType: string): keyof typeof Ionicons.glyphMap {
  switch (fileType) {
    case 'pdf': return 'document-text';
    case 'doc':
    case 'docx': return 'document';
    case 'jpg':
    case 'png': return 'image';
    default: return 'document-outline';
  }
}

function getFileColor(fileType: string): string {
  switch (fileType) {
    case 'pdf': return '#ef4444';
    case 'doc':
    case 'docx': return '#3b82f6';
    case 'jpg':
    case 'png': return '#10b981';
    default: return '#64748b';
  }
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function DocumentsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredDocuments = useMemo(() => {
    return MOCK_DOCUMENTS.filter((doc) => {
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleUploadDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        Alert.alert('Documento selecionado', `Arquivo: ${result.assets[0].name}`);
      }
    } catch {
      Alert.alert('Erro', 'Nao foi possivel selecionar o documento.');
    }
  }, []);

  const renderDocumentCard = useCallback(({ item }: { item: DocumentItem }) => {
    const iconName = getFileIcon(item.fileType);
    const iconColor = getFileColor(item.fileType);

    return (
      <TouchableOpacity
        style={[styles.documentCard, Shadows.sm, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
        activeOpacity={0.7}
        onPress={() => Alert.alert(item.name, `Categoria: ${item.category}\nTamanho: ${item.size}`)}
      >
        <View style={[styles.fileIcon, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.documentInfo}>
          <Text style={[styles.documentName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.clientName && (
            <Text style={[styles.documentMeta, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.clientName}
              {item.caseTitle ? ` - ${item.caseTitle}` : ''}
            </Text>
          )}
          <Text style={[styles.documentDate, { color: colors.textTertiary }]}>
            {formatDate(item.createdAt)} - {item.size}
          </Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  }, [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar documento..."
        />
      </View>

      <FilterChips
        options={CATEGORY_FILTERS}
        selectedKey={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <View style={styles.headerRow}>
        <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
          {filteredDocuments.length} documento(s)
        </Text>
        <TouchableOpacity
          style={[styles.templatesButton, { backgroundColor: `${colors.primary}15` }]}
          onPress={() => router.push('/(tabs)/menu/documents/templates' as `/${string}`)}
          activeOpacity={0.7}
        >
          <Ionicons name="copy-outline" size={16} color={colors.primary} />
          <Text style={[styles.templatesText, { color: colors.primary }]}>Modelos</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredDocuments}
        renderItem={renderDocumentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="Nenhum documento encontrado"
            message="Adicione documentos ou ajuste os filtros de busca."
          />
        }
      />

      <TouchableOpacity
        style={[styles.fab, Shadows.lg, { backgroundColor: colors.primary }]}
        onPress={handleUploadDocument}
        activeOpacity={0.8}
      >
        <Ionicons name="cloud-upload" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resultCount: {
    fontSize: Typography.sm,
  },
  templatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  templatesText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  documentMeta: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  documentDate: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
