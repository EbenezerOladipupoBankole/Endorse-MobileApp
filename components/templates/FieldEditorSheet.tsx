import { Trash2 } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/theme';
import type { TemplateField } from '@/types/workflows';
import { FIELD_META, FIELD_TYPES } from './templateMeta';

interface FieldEditorSheetProps {
  /** Field being edited; the last value is kept while the sheet animates out. */
  field: TemplateField | null;
  roles: string[];
  visible: boolean;
  onRequestClose: () => void;
  onDismissed: () => void;
  onChange: (patch: Partial<TemplateField>) => void;
  onDelete: () => void;
}

/** Edits one template field in place: label, type, role and required. */
export function FieldEditorSheet({ field, roles, visible, onRequestClose, onDismissed, onChange, onDelete }: FieldEditorSheetProps) {
  const { colors, spacing } = useTheme();
  return (
    <BottomSheet visible={visible} onRequestClose={onRequestClose} onDismissed={onDismissed} title="Edit field" subtitle={field ? FIELD_META[field.type].label : undefined}>
      {field ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.scroll}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg }}>
          <TextField
            label="Label"
            value={field.label}
            onChangeText={(label) => onChange({ label })}
            placeholder={FIELD_META[field.type].label}
            returnKeyType="done"
          />

          <View style={styles.group}>
            <Typography variant="captionStrong" tone="textSecondary">
              Type
            </Typography>
            <View style={styles.wrap}>
              {FIELD_TYPES.map((type) => (
                <Chip key={type} label={FIELD_META[type].label} icon={FIELD_META[type].icon} selected={field.type === type} onPress={() => onChange({ type })} />
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <Typography variant="captionStrong" tone="textSecondary">
              Filled by
            </Typography>
            <View style={styles.wrap}>
              {roles.map((role) => (
                <Chip key={role} label={role} selected={field.role === role} onPress={() => onChange({ role })} />
              ))}
            </View>
          </View>

          <View style={[styles.switchRow, { borderColor: colors.border }]}>
            <View style={styles.flex}>
              <Typography variant="bodyStrong">Required</Typography>
              <Typography variant="caption" tone="textSecondary">
                Signers can’t finish until this is filled.
              </Typography>
            </View>
            <Switch
              value={field.required}
              onValueChange={(required) => onChange({ required })}
              accessibilityLabel="Required field"
              trackColor={{ true: colors.primary, false: colors.borderStrong }}
              thumbColor={colors.surface}
            />
          </View>

          <View style={[styles.actions, { gap: spacing.md }]}>
            <Button label="Delete field" icon={Trash2} variant="danger" onPress={onDelete} style={styles.flex} />
            <Button label="Done" variant="primary" onPress={onRequestClose} style={styles.flex} />
          </View>
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { maxHeight: 560 },
  group: { gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  actions: { flexDirection: 'row', paddingBottom: 4 },
});
