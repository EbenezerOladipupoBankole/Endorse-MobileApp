import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/theme';
import type { TemplateField } from '@/types/workflows';
import { FIELD_META } from './templateMeta';

interface FieldRowProps {
  field: TemplateField;
  index: number;
  count: number;
  onPress: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

/** One field in the editor list: type icon, label, role, required badge and reorder controls. */
export const FieldRow = memo(function FieldRow({ field, index, count, onPress, onMove }: FieldRowProps) {
  const { colors, radius, spacing } = useTheme();
  const meta = FIELD_META[field.type];
  const Icon = meta.icon;
  const isFirst = index === 0;
  const isLast = index === count - 1;

  return (
    <View style={[styles.row, { borderTopColor: colors.border, borderTopWidth: isFirst ? 0 : StyleSheet.hairlineWidth }]}>
      <PressableScale
        onPress={() => onPress(field.id)}
        haptic="selection"
        scaleTo={0.985}
        accessibilityLabel={`${field.label}, ${meta.label} field for ${field.role}${field.required ? ', required' : ''}`}
        accessibilityHint="Edit this field"
        style={[styles.main, { paddingVertical: spacing.md }]}>
        <View style={[styles.well, { backgroundColor: colors.primarySoft, borderRadius: radius.md }]}>
          <Icon size={18} color={colors.primary} strokeWidth={2.1} />
        </View>
        <View style={styles.text}>
          <Typography variant="calloutStrong" numberOfLines={1}>
            {field.label || meta.label}
          </Typography>
          <View style={styles.meta}>
            <Typography variant="caption" tone="textSecondary" numberOfLines={1}>
              {meta.label} · {field.role}
            </Typography>
            {field.required ? (
              <View style={[styles.badge, { backgroundColor: colors.status.awaiting.soft }]}>
                <Typography variant="micro" color={colors.status.awaiting.fg} maxFontSizeMultiplier={1.2}>
                  REQUIRED
                </Typography>
              </View>
            ) : null}
          </View>
        </View>
      </PressableScale>
      <View style={styles.reorder}>
        <Pressable
          onPress={() => onMove(field.id, -1)}
          disabled={isFirst}
          hitSlop={{ top: 6, bottom: 2, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel={`Move ${field.label} up`}
          accessibilityState={{ disabled: isFirst }}
          style={({ pressed }) => [styles.arrow, pressed && { backgroundColor: colors.surfaceMuted }, isFirst && styles.disabled]}>
          <ChevronUp size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => onMove(field.id, 1)}
          disabled={isLast}
          hitSlop={{ top: 2, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel={`Move ${field.label} down`}
          accessibilityState={{ disabled: isLast }}
          style={({ pressed }) => [styles.arrow, pressed && { backgroundColor: colors.surfaceMuted }, isLast && styles.disabled]}>
          <ChevronDown size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  well: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  reorder: { gap: 2 },
  arrow: { width: 36, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.3 },
});
