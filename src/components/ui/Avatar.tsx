import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { useThemeColors } from '../../store/ThemeContext';
import { Typography } from '../../constants/theme';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  source?: ImageSourcePropType;
  uri?: string;
  size?: AvatarSize;
}

const sizeMap: Record<AvatarSize, { container: number; fontSize: number }> = {
  sm: { container: 32, fontSize: Typography.xs },
  md: { container: 44, fontSize: Typography.md },
  lg: { container: 64, fontSize: Typography.xl },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({
  name,
  source,
  uri,
  size = 'md',
}: AvatarProps) {
  const colors = useThemeColors();
  const [imageError, setImageError] = useState(false);
  const dimensions = sizeMap[size];
  const imageSource = source ?? (uri ? { uri } : undefined);
  const showImage = imageSource && !imageError;

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.container,
          height: dimensions.container,
          borderRadius: dimensions.container / 2,
          backgroundColor: colors.primary,
        },
      ]}
    >
      {showImage ? (
        <Image
          source={imageSource}
          onError={() => setImageError(true)}
          style={[
            styles.image,
            {
              width: dimensions.container,
              height: dimensions.container,
              borderRadius: dimensions.container / 2,
            },
          ]}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            { fontSize: dimensions.fontSize, color: '#ffffff' },
          ]}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
});
