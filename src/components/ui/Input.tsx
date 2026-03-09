import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../store/ThemeContext';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';

type MaskType = 'cpf' | 'cnpj' | 'phone' | 'cep' | 'currency' | 'date' | 'oab';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  clearable?: boolean;
  maskType?: MaskType;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

function applyMask(value: string, maskType: MaskType): string {
  const digits = value.replace(/\D/g, '');

  switch (maskType) {
    case 'cpf': {
      return digits
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    case 'cnpj': {
      return digits
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
    case 'phone': {
      if (digits.length <= 10) {
        return digits
          .slice(0, 10)
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
      }
      return digits
        .slice(0, 11)
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
    }
    case 'cep': {
      return digits.slice(0, 8).replace(/(\d{5})(\d{1,3})$/, '$1-$2');
    }
    case 'currency': {
      if (digits.length === 0) return '';
      const numericValue = parseInt(digits, 10);
      const formatted = (numericValue / 100).toFixed(2);
      return `R$ ${formatted.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    }
    case 'date': {
      return digits
        .slice(0, 8)
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2');
    }
    case 'oab': {
      return digits.slice(0, 6).replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    default:
      return value;
  }
}

export default function Input({
  label,
  value,
  onChangeText,
  error,
  leftIcon,
  isPassword = false,
  clearable = false,
  maskType,
  containerStyle,
  disabled = false,
  ...rest
}: InputProps) {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const animatedLabel = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);

  const hasValue = value.length > 0;

  useEffect(() => {
    Animated.timing(animatedLabel, {
      toValue: isFocused || hasValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, hasValue, animatedLabel]);

  const labelTop = animatedLabel.interpolate({
    inputRange: [0, 1],
    outputRange: [16, -8],
  });

  const labelFontSize = animatedLabel.interpolate({
    inputRange: [0, 1],
    outputRange: [Typography.md, Typography.xs],
  });

  const handleChangeText = useCallback(
    (text: string) => {
      if (maskType) {
        onChangeText(applyMask(text, maskType));
      } else {
        onChangeText(text);
      }
    },
    [maskType, onChangeText]
  );

  const handleClear = useCallback(() => {
    onChangeText('');
    inputRef.current?.focus();
  }, [onChangeText]);

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.border;

  const labelColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.textSecondary;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.container,
          {
            borderColor,
            backgroundColor: disabled
              ? colors.surfaceVariant
              : colors.surface,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.leftIcon}
          />
        )}

        <View style={styles.inputContainer}>
          <Animated.Text
            style={[
              styles.label,
              {
                top: labelTop,
                fontSize: labelFontSize,
                color: labelColor,
                backgroundColor: disabled
                  ? colors.surfaceVariant
                  : colors.surface,
              },
            ]}
          >
            {label}
          </Animated.Text>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={isPassword && !passwordVisible}
            editable={!disabled}
            style={[
              styles.input,
              {
                color: colors.text,
                paddingLeft: leftIcon ? 0 : 0,
              },
            ]}
            placeholderTextColor={colors.placeholder}
            {...rest}
          />
        </View>

        {isPassword && (
          <TouchableOpacity
            onPress={() => setPasswordVisible((prev) => !prev)}
            style={styles.rightAction}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {clearable && hasValue && !isPassword && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.rightAction}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle-outline"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 56,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 0,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  input: {
    fontSize: Typography.md,
    paddingVertical: Spacing.sm + 4,
  },
  rightAction: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
