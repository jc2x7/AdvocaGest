import React from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { getRelativeTime } from '../../utils/dateUtils';
import { LegalDocument, DocumentCategory, DocumentFileType, DOCUMENT_CATEGORIES } from '../../types/document';

interface CaseDocumentsTabProps {
  documents: LegalDocument[];
  onPressDocument?: (document: LegalDocument) => void;
  onPressUpload?: () => void;
}

interface DocumentSection {
  title: string;
  data: LegalDocument[];
}

const FILE_TYPE_ICONS: Record<DocumentFileType, keyof typeof Ionicons.glyphMap> = {
  pdf: 'document-text-outline',
  image: 'image-outline',
  doc: 'document-outline',
  other: 'attach-outline',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCategoryLabel(category: DocumentCategory): string {
  const found = DOCUMENT_CATEGORIES.find((c) => c.value === category);
  return found ? found.label : category;
}

export default function CaseDocumentsTab({
  documents,
  onPressDocument,
  onPressUpload,
}: CaseDocumentsTabProps) {
  const { colors } = useTheme();

  const sections: DocumentSection[] = DOCUMENT_CATEGORIES
    .map((cat) => ({
      title: cat.label,
      data: documents.filter((d) => d.category === cat.value),
    }))
    .filter((section) => section.data.length > 0);

  const renderItem = ({ item }: { item: LegalDocument }) => {
    const icon = FILE_TYPE_ICONS[item.type];

    return (
      <TouchableOpacity
        style={[styles.docItem, { borderBottomColor: colors.borderLight }]}
        onPress={() => onPressDocument?.(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.docIcon, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.docContent}>
          <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.docMetaRow}>
            <Text style={[styles.docMeta, { color: colors.textTertiary }]}>
              {formatFileSize(item.fileSize)}
            </Text>
            <Text style={[styles.docMeta, { color: colors.textTertiary }]}>
              v{item.version}
            </Text>
            <Text style={[styles.docMeta, { color: colors.textTertiary }]}>
              {getRelativeTime(item.updatedAt)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: DocumentSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Ionicons name="folder-outline" size={16} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {section.title}
      </Text>
      <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
        ({section.data.length})
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {onPressUpload && (
        <TouchableOpacity
          style={[styles.uploadButton, { borderColor: colors.primary, backgroundColor: colors.card }]}
          onPress={onPressUpload}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
          <Text style={[styles.uploadText, { color: colors.primary }]}>
            Enviar Documento
          </Text>
        </TouchableOpacity>
      )}

      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Nenhum documento
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  list: {
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  sectionCount: {
    fontSize: Typography.xs,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  docIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  docContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  docName: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },
  docMetaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  docMeta: {
    fontSize: Typography.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sm,
  },
});
