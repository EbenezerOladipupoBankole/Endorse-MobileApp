import type { LucideIcon } from 'lucide-react-native';
import React, { forwardRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { fontFamily, useTheme } from '@/theme';
import { Typography } from './Typography';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  helper?: string;
  icon?: LucideIcon;
  /** Rendered inside the field on the right (e.g. a unit or a button). */
  trailing?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/** Labeled input with focus ring, helper and error text. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, helper, icon: Icon, trailing, containerStyle, multiline, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.status.declined.fg : focused ? colors.primary : colors.borderStrong;

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Typography variant="captionStrong" tone="textSecondary">
        {label}
      </Typography>
      <View
        style={[
          styles.field,
          multiline && styles.multiline,
          { borderColor, borderRadius: radius.md, backgroundColor: colors.surface },
          focused && { borderWidth: 1.5 },
        ]}>
        {Icon ? <Icon size={18} color={colors.textTertiary} /> : null}
        <TextInput
          ref={ref}
          {...rest}
          multiline={multiline}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          placeholderTextColor={colors.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            { color: colors.text, fontFamily: fontFamily.medium },
            multiline && styles.inputMultiline,
            Platform.OS === 'web' ? { outlineWidth: 0 } : null,
          ]}
        />
        {trailing}
      </View>
      {error ? (
        <Typography variant="caption" color={colors.status.declined.fg} accessibilityLiveRegion="polite">
          {error}
        </Typography>
      ) : helper ? (
        <Typography variant="caption" tone="textTertiary">
          {helper}
        </Typography>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 14, borderWidth: 1 },
  multiline: { alignItems: 'flex-start', paddingVertical: 10 },
  input: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 12 },
  inputMultiline: { minHeight: 96, paddingVertical: 2, textAlignVertical: 'top' },
});
