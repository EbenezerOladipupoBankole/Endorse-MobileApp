import { Eye, Plus, TriangleAlert } from 'lucide-react-native';
import React, { memo, useMemo, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Typography } from '@/components/ui/Typography';
import { placeholdersIn } from '@/lib/pdf/agreement';
import { fontFamily, useTheme } from '@/theme';
import type { TemplateField } from '@/types/workflows';

interface AgreementEditorProps {
  body: string;
  fields: TemplateField[];
  onChangeBody: (body: string) => void;
  /** Creates text fields for placeholders that don't have one yet. */
  onAddFields: (labels: string[]) => void;
  onPreview: () => void;
}

/** Edits the readable agreement text and keeps its {{placeholders}} in sync with fields. */
export const AgreementEditor = memo(function AgreementEditor({ body, fields, onChangeBody, onAddFields, onPreview }: AgreementEditorProps) {
  const { colors, spacing, radius } = useTheme();
  const [focused, setFocused] = useState(false);

  const used = useMemo(() => placeholdersIn(body), [body]);
  const labels = useMemo(() => new Set(fields.map((f) => f.label)), [fields]);
  const missing = used.filter((label) => !labels.has(label));

  const insert = (label: string) => {
    const spacer = body.length === 0 || /\s$/.test(body) ? '' : ' ';
    onChangeBody(`${body}${spacer}{{${label}}}`);
  };

  return (
    <Card style={{ gap: spacing.lg }}>
      <View style={{ gap: 6 }}>
        <TextInput
          value={body}
          onChangeText={onChangeBody}
          multiline
          placeholder={'Write the agreement here.\n\n## 1. Section heading\nUse {{Field name}} where a signer fills something in.'}
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel="Agreement text"
          accessibilityHint="Start a line with two hash signs for a heading. Wrap field names in double braces."
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlignVertical="top"
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: fontFamily.regular,
              borderColor: focused ? colors.primary : colors.borderStrong,
              borderWidth: focused ? 1.5 : 1,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
            },
            Platform.OS === 'web' ? { outlineWidth: 0 } : null,
          ]}
        />
        <Typography variant="caption" tone="textTertiary">
          Start a line with “## ” for a heading. Leave a blank line between paragraphs.
        </Typography>
      </View>

      {fields.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Typography variant="captionStrong" tone="textSecondary">
            Insert field
          </Typography>
          <View style={styles.wrap}>
            {fields.map((field) => (
              <Chip
                key={field.id}
                label={field.label}
                icon={Plus}
                selected={false}
                onPress={() => insert(field.label)}
              />
            ))}
          </View>
          <Typography variant="caption" tone="textTertiary">
            Tap a field to add it at the end of the text.
          </Typography>
        </View>
      ) : null}

      {missing.length > 0 ? (
        <View
          accessibilityRole="alert"
          style={[{ backgroundColor: colors.status.waiting.soft, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm }]}>
          <View style={styles.warningHead}>
            <TriangleAlert size={18} color={colors.status.waiting.fg} />
            <Typography variant="calloutStrong" color={colors.status.waiting.fg} style={styles.flex}>
              {missing.length === 1 ? '1 placeholder has no field' : `${missing.length} placeholders have no field`}
            </Typography>
          </View>
          <Typography variant="caption" tone="textSecondary">
            {missing.join(', ')}
          </Typography>
          <Button label="Add missing fields" icon={Plus} size="sm" variant="secondary" onPress={() => onAddFields(missing)} />
        </View>
      ) : null}

      <Button label="Preview agreement" icon={Eye} variant="secondary" onPress={onPreview} disabled={!body.trim()} />
    </Card>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  input: { minHeight: 260, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, lineHeight: 22 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  warningHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
