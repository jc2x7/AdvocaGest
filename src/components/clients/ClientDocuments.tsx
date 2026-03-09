import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { getRelativeTime } from '../../utils/dateUtils';
import { LegalDocument, DocumentCategory, DocumentFileType, DOCUMENT_CATEGORIES } from '../../types/document';

interface ClientDocumentsProps {
  documents: LegalDocument[];
  onPressDocument?: (document: LegalDocument) => void;
  onPressUpload?: () => void;
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

export default function ClientDocuments({
  documents,
  onPressDocument,
  onPressUpload,
}: ClientDocumentsProps) {
  const { colors } = useTheme();

  const grouped = documents.reduce<Record<string, LegalDocument[]>>((acc, doc) => {
    const key = doc.category;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(doc);
    return acc;
  }, {});

  const sections = Object.entries(grouped).map(([category, docs]) => ({
    category: category as DocumentCategory,
    label: getCategoryLabel(category as DocumentCategory),
    documents: docs,
  }));

  const renderDocument = (doc: LegalDocument) => {
    const icon = FILE_TYPE_ICONS[doc.type];

    return (
      <TouchableOpacity
        key={doc.id}
        style={[styles.docItem, { borderBottomColor: colors.borderLight }]}
        onPress={() => onPressDocument?.(doc)}
        activeOpacity={0.7}
      >
        <View style={[styles.docIcon, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.docContent}>
          <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>
            {doc.name}
          </Text>
          <Text style={[styles.docMeta, { color: colors.textTertiary }]}>
            {formatFileSize(doc.fileSize)} - {getRelativeTime(doc.updatedAt)}
          </Text>
        </View>
        <Ionicons name="download-outline" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  };

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

      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Nenhum documento
          </Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.category}
          renderItem={({ item: section }) => (
            <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="folder-outline" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {section.label}
                </Text>
                <View style={[styles.countBadge, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.countText, { color: colors.textSecondary }]}>
                    {section.documents.length}
                  </Text>
                </View>
              </View>
              {section.documents.map(renderDocument)}
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    gap: Spacing.sm,
  },
  section: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  countText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
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
