import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

type UploadSource = 'camera' | 'gallery' | 'file';

interface DocumentUploadProps {
  onSelectSource: (source: UploadSource) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  title?: string;
}

interface SourceOption {
  key: UploadSource;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: 'primary' | 'info' | 'success';
}

const SOURCE_OPTIONS: SourceOption[] = [
  {
    key: 'camera',
    label: 'Camera',
    description: 'Tirar uma foto do documento',
    icon: 'camera-outline',
    colorKey: 'primary',
  },
  {
    key: 'gallery',
    label: 'Galeria',
    description: 'Escolher imagem da galeria',
    icon: 'images-outline',
    colorKey: 'info',
  },
  {
    key: 'file',
    label: 'Arquivo',
    description: 'Selecionar PDF ou documento',
    icon: 'document-attach-outline',
    colorKey: 'success',
  },
];

export default function DocumentUpload({
  onSelectSource,
  isUploading = false,
  uploadProgress = 0,
  title = 'Enviar Documento',
}: DocumentUploadProps) {
  const { colors } = useTheme();

  const getColor = (colorKey: SourceOption['colorKey']): string => {
    const map: Record<SourceOption['colorKey'], string> = {
      primary: colors.primary,
      info: colors.info,
      success: colors.success,
    };
    return map[colorKey];
  };

  const getBgColor = (colorKey: SourceOption['colorKey']): string => {
    const map: Record<SourceOption['colorKey'], string> = {
      primary: colors.primaryLight + '20',
      info: colors.infoLight,
      success: colors.successLight,
    };
    return map[colorKey];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }, Shadows.sm]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {isUploading ? (
        <View style={styles.uploadingContainer}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${uploadProgress}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              Enviando... {uploadProgress.toFixed(0)}%
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.optionsContainer}>
          {SOURCE_OPTIONS.map((option) => {
            const color = getColor(option.colorKey);
            const bgColor = getBgColor(option.colorKey);

            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.option, { borderColor: colors.border }]}
                onPress={() => onSelectSource(option.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: bgColor }]}>
                  <Ionicons name={option.icon} size={28} color={color} />
                </View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDesc, { color: colors.textTertiary }]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  title: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  optionDesc: {
    fontSize: Typography.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  uploadingContainer: {
    paddingVertical: Spacing.md,
  },
  progressContainer: {
    gap: Spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: Typography.sm,
    textAlign: 'center',
  },
});
