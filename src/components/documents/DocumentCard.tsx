import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { getRelativeTime } from '../../utils/dateUtils';
import { LegalDocument, DocumentFileType, DocumentCategory, DOCUMENT_CATEGORIES } from '../../types/document';

interface DocumentCardProps {
  document: LegalDocument;
  onPress?: (document: LegalDocument) => void;
  onDownload?: (document: LegalDocument) => void;
}

const FILE_TYPE_ICONS: Record<DocumentFileType, keyof typeof Ionicons.glyphMap> = {
  pdf: 'document-text',
  image: 'image',
  doc: 'document',
  other: 'attach',
};

const FILE_TYPE_COLORS: Record<DocumentFileType, string> = {
  pdf: '#ef4444',
  image: '#3b82f6',
  doc: '#2563eb',
  other: '#64748b',
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

export default function DocumentCard({
  document,
  onPress,
  onDownload,
}: DocumentCardProps) {
  const { colors } = useTheme();

  const icon = FILE_TYPE_ICONS[document.type];
  const iconColor = FILE_TYPE_COLORS[document.type];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}
      onPress={() => onPress?.(document)}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={icon} size={28} color={iconColor} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {document.name}
          </Text>

          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                {getCategoryLabel(document.category)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoText, { color: colors.textTertiary }]}>
              {formatFileSize(document.fileSize)}
            </Text>
            <Text style={[styles.infoText, { color: colors.textTertiary }]}>
              v{document.version}
            </Text>
            <Text style={[styles.infoText, { color: colors.textTertiary }]}>
              {getRelativeTime(document.updatedAt)}
            </Text>
          </View>

          {document.tags && document.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {document.tags.slice(0, 3).map((tag, index) => (
                <View
                  key={`${tag}-${index}`}
                  style={[styles.tag, { backgroundColor: colors.primaryLight + '20' }]}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {onDownload && (
          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => onDownload(document)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="download-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
