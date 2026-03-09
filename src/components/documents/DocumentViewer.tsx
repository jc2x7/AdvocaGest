import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';
import { LegalDocument, DocumentFileType } from '../../types/document';
import { formatDate } from '../../utils/dateUtils';

interface DocumentViewerProps {
  document: LegalDocument;
  onClose?: () => void;
  onDownload?: (document: LegalDocument) => void;
  onShare?: (document: LegalDocument) => void;
}

const FILE_TYPE_ICONS: Record<DocumentFileType, keyof typeof Ionicons.glyphMap> = {
  pdf: 'document-text',
  image: 'image',
  doc: 'document',
  other: 'attach',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentViewer({
  document,
  onClose,
  onDownload,
  onShare,
}: DocumentViewerProps) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const isImage = document.type === 'image';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {document.name}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {formatFileSize(document.fileSize)} - v{document.version}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {onShare && (
            <TouchableOpacity
              onPress={() => onShare(document)}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onDownload && (
            <TouchableOpacity
              onPress={() => onDownload(document)}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="download-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.previewContainer}>
        {isImage && !hasError ? (
          <>
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Carregando...
                </Text>
              </View>
            )}
            <Image
              source={{ uri: document.fileUrl }}
              style={[styles.image, { width: screenWidth }]}
              resizeMode="contain"
              onLoadEnd={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          </>
        ) : (
          <View style={styles.noPreviewContainer}>
            <View style={[styles.bigIcon, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons
                name={FILE_TYPE_ICONS[document.type]}
                size={64}
                color={colors.textTertiary}
              />
            </View>
            <Text style={[styles.noPreviewTitle, { color: colors.text }]}>
              {hasError ? 'Erro ao carregar' : 'Visualizacao nao disponivel'}
            </Text>
            <Text style={[styles.noPreviewText, { color: colors.textSecondary }]}>
              {hasError
                ? 'Nao foi possivel carregar este documento.'
                : 'Este tipo de arquivo nao pode ser visualizado no app.'}
            </Text>
            {onDownload && (
              <TouchableOpacity
                style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                onPress={() => onDownload(document)}
              >
                <Ionicons name="download-outline" size={18} color="#ffffff" />
                <Text style={styles.downloadButtonText}>Baixar Documento</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={[styles.infoBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          {document.mimeType}
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Atualizado em {formatDate(document.updatedAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  headerSubtitle: {
    fontSize: Typography.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    zIndex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.sm,
  },
  image: {
    flex: 1,
  },
  noPreviewContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  bigIcon: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPreviewTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  noPreviewText: {
    fontSize: Typography.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  infoText: {
    fontSize: Typography.xs,
  },
});
