import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Minus, Plus, SearchX, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AgreementEditor } from '@/components/templates/AgreementEditor';
import { AgreementPreview } from '@/components/templates/AgreementPreview';
import { FieldEditorSheet } from '@/components/templates/FieldEditorSheet';
import { FieldRow } from '@/components/templates/FieldRow';
import { FIELD_META, FIELD_TYPES } from '@/components/templates/templateMeta';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ListOption } from '@/components/ui/ListOption';
import { Screen } from '@/components/ui/Screen';
import { goBack, ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { StickyFooter } from '@/components/ui/StickyFooter';
import { TextField } from '@/components/ui/TextField';
import { Typography } from '@/components/ui/Typography';
import { useResource } from '@/hooks/useResource';
import { triggerHaptic } from '@/lib/haptics';
import { makeId } from '@/lib/ids';
import { emptyTemplateDraft, fetchTemplateDetail, saveTemplate } from '@/lib/templates/api';
import { useTheme } from '@/theme';
import type { FieldType, TemplateDetail, TemplateDraft, TemplateField } from '@/types/workflows';
import { TEMPLATE_CATEGORIES } from '@/types/workflows';

const MIN_MINUTES = 1;
const MAX_MINUTES = 60;

function toDraft(source: TemplateDetail | TemplateDraft): TemplateDraft {
  const { id, name, category, description, estimatedMinutes, roles, fields, body } = source;
  return { id, name, category, description, estimatedMinutes, roles: [...roles], fields: fields.map((f) => ({ ...f })), body: body ?? '' };
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Typography variant="title3" accessibilityRole="header">
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="caption" tone="textSecondary">
          {subtitle}
        </Typography>
      ) : null}
    </View>
  );
}

export default function TemplateEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const navigation = useNavigation();
  const { colors, spacing, radius } = useTheme();

  const fetcher = useCallback(
    () => (isNew ? Promise.resolve(emptyTemplateDraft()) : fetchTemplateDetail(id ?? '')),
    [id, isNew],
  );
  const { resource, reload } = useResource<TemplateDetail | TemplateDraft>(fetcher);

  const [draft, setDraft] = useState<TemplateDraft | null>(null);
  const [snapshot, setSnapshot] = useState('');
  const [loadedFrom, setLoadedFrom] = useState<unknown>(null);
  // Seed the editable draft once the resource arrives (render-time state sync).
  if (resource.data && resource.data !== loadedFrom) {
    const next = toDraft(resource.data);
    setLoadedFrom(resource.data);
    setDraft(next);
    setSnapshot(JSON.stringify(next));
  }

  const [nameError, setNameError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [fieldSheetVisible, setFieldSheetVisible] = useState(false);
  const pendingDelete = useRef(false);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const pendingType = useRef<FieldType | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const dirty = draft !== null && JSON.stringify(draft) !== snapshot;
  const allowLeave = useRef(false);

  // Confirm before discarding unsaved changes (back button, swipe, hardware back).
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!dirty || allowLeave.current) return;
      e.preventDefault();
      Alert.alert('Discard changes?', 'Your edits to this template will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
  }, [navigation, dirty]);

  const update = useCallback((patch: Partial<TemplateDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const updateField = useCallback((fieldId: string, patch: Partial<TemplateField>) => {
    setDraft((prev) => (prev ? { ...prev, fields: prev.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) } : prev));
  }, []);

  const moveField = useCallback((fieldId: string, direction: -1 | 1) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const index = prev.fields.findIndex((f) => f.id === fieldId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.fields.length) return prev;
      const fields = [...prev.fields];
      [fields[index], fields[target]] = [fields[target], fields[index]];
      return { ...prev, fields };
    });
    triggerHaptic('selection');
  }, []);

  /* ----------------------------- Roles ----------------------------- */

  const addRole = useCallback(() => {
    const role = newRole.trim();
    if (!role || !draft) return;
    if (draft.roles.some((r) => r.toLowerCase() === role.toLowerCase())) {
      Alert.alert('Role already exists', `“${role}” is already a role on this template.`);
      return;
    }
    update({ roles: [...draft.roles, role] });
    setNewRole('');
    triggerHaptic('selection');
  }, [newRole, draft, update]);

  const removeRole = useCallback(
    (role: string) => {
      if (!draft) return;
      update({ roles: draft.roles.filter((r) => r !== role) });
    },
    [draft, update],
  );

  /* ----------------------------- Fields ---------------------------- */

  const openField = useCallback((fieldId: string) => {
    setEditingId(fieldId);
    setFieldSheetVisible(true);
  }, []);

  const closeFieldSheet = useCallback(() => setFieldSheetVisible(false), []);

  const requestDeleteField = useCallback(() => {
    pendingDelete.current = true;
    setFieldSheetVisible(false);
  }, []);

  const handleFieldSheetDismissed = useCallback(() => {
    if (pendingDelete.current && editingId) {
      setDraft((prev) => (prev ? { ...prev, fields: prev.fields.filter((f) => f.id !== editingId) } : prev));
      triggerHaptic('warning');
    }
    pendingDelete.current = false;
    setEditingId(null);
  }, [editingId]);

  const chooseFieldType = useCallback((type: FieldType) => {
    pendingType.current = type;
    setAddSheetVisible(false);
  }, []);

  const handleAddSheetDismissed = useCallback(() => {
    const type = pendingType.current;
    pendingType.current = null;
    if (!type) return;
    setDraft((prev) => {
      if (!prev) return prev;
      const role = prev.roles[prev.roles.length - 1] ?? 'Signer';
      const field: TemplateField = { id: makeId('f'), type, label: `${role} ${FIELD_META[type].label.toLowerCase()}`, role, required: type !== 'checkbox' };
      return { ...prev, fields: [...prev.fields, field] };
    });
    triggerHaptic('success');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }, []);

  /** Creates text fields for agreement placeholders that have no field yet. */
  const addFieldsForLabels = useCallback((labels: string[]) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const role = prev.roles[prev.roles.length - 1] ?? 'Signer';
      const added: TemplateField[] = labels.map((label) => ({ id: makeId('f'), type: 'text', label, role, required: true }));
      return { ...prev, fields: [...prev.fields, ...added] };
    });
    triggerHaptic('success');
  }, []);

  /* ------------------------------ Save ----------------------------- */

  const save = useCallback(async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      setNameError('Give your template a name');
      triggerHaptic('warning');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setSaving(true);
    try {
      await saveTemplate(draft);
      triggerHaptic('success');
      allowLeave.current = true;
      goBack();
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }, [draft]);

  const usedRoles = useMemo(() => new Set(draft?.fields.map((f) => f.role)), [draft?.fields]);
  const editingField = draft?.fields.find((f) => f.id === editingId) ?? null;
  // Saving a starter creates the user's own copy (see saveTemplate).
  const isStarter = !isNew && !!(resource.data && 'builtIn' in resource.data && resource.data.builtIn);
  const title = isNew ? 'New template' : isStarter ? 'Customize starter' : 'Edit template';

  /* ----------------------------- States ---------------------------- */

  if (!draft) {
    const notFound = resource.status === 'error' && resource.error === 'Template not found';
    return (
      <Screen>
        <ScreenHeader title={title} />
        {resource.status === 'error' ? (
          notFound ? (
            <EmptyState icon={SearchX} title="Template not found" message="It may have been deleted." actionLabel="Back to templates" onAction={() => router.replace('/(tabs)/templates')} />
          ) : (
            <View style={{ paddingTop: spacing.lg }}>
              <ErrorState title="Couldn't load this template" message={resource.error} onRetry={reload} />
            </View>
          )
        ) : (
          <View style={{ padding: spacing.xl, gap: spacing.lg }} accessibilityLabel="Loading template">
            <Skeleton height={260} radius={radius.xl} />
            <Skeleton height={110} radius={radius.xl} />
            <Skeleton height={220} radius={radius.xl} />
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={title} subtitle={dirty ? 'Unsaved changes' : draft.name || undefined} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.xxl, paddingBottom: spacing.huge }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          {/* Details */}
          <View style={styles.section}>
            <SectionTitle title="Details" />
            <Card style={{ gap: spacing.lg }}>
              <TextField
                label="Template name"
                value={draft.name}
                onChangeText={(name) => {
                  update({ name });
                  if (nameError && name.trim()) setNameError(undefined);
                }}
                placeholder="e.g. Mutual NDA"
                error={nameError}
                returnKeyType="next"
              />
              <View style={styles.group}>
                <Typography variant="captionStrong" tone="textSecondary">
                  Category
                </Typography>
                <View style={styles.wrap}>
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <Chip key={c} label={c} selected={draft.category === c} onPress={() => update({ category: c })} />
                  ))}
                </View>
              </View>
              <TextField
                label="Description"
                value={draft.description}
                onChangeText={(description) => update({ description })}
                placeholder="What is this agreement for?"
                multiline
              />
              <View style={styles.stepperRow}>
                <View style={styles.flex}>
                  <Typography variant="captionStrong" tone="textSecondary">
                    Estimated time to sign
                  </Typography>
                  <Typography variant="caption" tone="textTertiary">
                    Shown to recipients before they start
                  </Typography>
                </View>
                <View style={[styles.stepper, { borderColor: colors.borderStrong, borderRadius: radius.md }]}>
                  <Pressable
                    onPress={() => update({ estimatedMinutes: Math.max(MIN_MINUTES, draft.estimatedMinutes - 1) })}
                    disabled={draft.estimatedMinutes <= MIN_MINUTES}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease minutes"
                    style={({ pressed }) => [styles.stepButton, pressed && { backgroundColor: colors.surfaceMuted }]}>
                    <Minus size={18} color={colors.text} />
                  </Pressable>
                  <Typography
                    variant="headline"
                    style={styles.stepValue}
                    accessibilityLabel={`${draft.estimatedMinutes} minutes`}
                    accessibilityLiveRegion="polite">
                    {draft.estimatedMinutes} min
                  </Typography>
                  <Pressable
                    onPress={() => update({ estimatedMinutes: Math.min(MAX_MINUTES, draft.estimatedMinutes + 1) })}
                    disabled={draft.estimatedMinutes >= MAX_MINUTES}
                    accessibilityRole="button"
                    accessibilityLabel="Increase minutes"
                    style={({ pressed }) => [styles.stepButton, pressed && { backgroundColor: colors.surfaceMuted }]}>
                    <Plus size={18} color={colors.text} />
                  </Pressable>
                </View>
              </View>
            </Card>
          </View>

          {/* Agreement text */}
          <View style={styles.section}>
            <SectionTitle title="Agreement text" subtitle="What recipients read before signing. Fields appear as blanks for them to fill." />
            <AgreementEditor
              body={draft.body ?? ''}
              fields={draft.fields}
              onChangeBody={(body) => update({ body })}
              onAddFields={addFieldsForLabels}
              onPreview={() => setPreviewVisible(true)}
            />
          </View>

          {/* Roles */}
          <View style={styles.section}>
            <SectionTitle title="Roles" subtitle="Who fills in this template. Roles used by a field can't be removed." />
            <Card style={{ gap: spacing.lg }}>
              <View style={styles.wrap}>
                {draft.roles.map((role) => {
                  const inUse = usedRoles.has(role);
                  return (
                    <View key={role} style={[styles.roleChip, { backgroundColor: colors.primarySoft }]}>
                      <Typography variant="captionStrong" color={colors.primary}>
                        {role}
                      </Typography>
                      {!inUse ? (
                        <Pressable
                          onPress={() => removeRole(role)}
                          hitSlop={12}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove role ${role}`}
                          style={styles.roleRemove}>
                          <X size={14} color={colors.primary} strokeWidth={2.5} />
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
              </View>
              <View style={styles.addRole}>
                <TextField
                  label="Add a role"
                  value={newRole}
                  onChangeText={setNewRole}
                  placeholder="e.g. Witness"
                  returnKeyType="done"
                  onSubmitEditing={addRole}
                  containerStyle={styles.flex}
                />
                <Button label="Add" icon={Plus} variant="secondary" onPress={addRole} disabled={!newRole.trim()} style={styles.addRoleButton} />
              </View>
            </Card>
          </View>

          {/* Fields */}
          <View style={styles.section}>
            <SectionTitle title="Fields" subtitle={`${draft.fields.length} ${draft.fields.length === 1 ? 'field' : 'fields'} · tap to edit, arrows to reorder`} />
            <Card style={{ paddingVertical: draft.fields.length ? spacing.xs : spacing.lg }}>
              {draft.fields.length === 0 ? (
                <Typography variant="callout" tone="textSecondary" style={styles.center}>
                  No fields yet. Add a signature field so recipients know where to sign.
                </Typography>
              ) : (
                draft.fields.map((field, index) => (
                  <FieldRow key={field.id} field={field} index={index} count={draft.fields.length} onPress={openField} onMove={moveField} />
                ))
              )}
            </Card>
            <Button label="Add field" icon={Plus} variant="secondary" onPress={() => setAddSheetVisible(true)} />
          </View>
        </ScrollView>

        <StickyFooter>
          <Button label={isNew || isStarter ? 'Save as my template' : 'Save template'} variant="primary" onPress={save} loading={saving} style={styles.flex} haptic="medium" />
        </StickyFooter>
      </KeyboardAvoidingView>

      <FieldEditorSheet
        field={editingField}
        roles={draft.roles}
        visible={fieldSheetVisible}
        onRequestClose={closeFieldSheet}
        onDismissed={handleFieldSheetDismissed}
        onChange={(patch) => editingId && updateField(editingId, patch)}
        onDelete={requestDeleteField}
      />

      <AgreementPreview visible={previewVisible} onClose={() => setPreviewVisible(false)} title={draft.name} body={draft.body} />

      <BottomSheet visible={addSheetVisible} onRequestClose={() => setAddSheetVisible(false)} onDismissed={handleAddSheetDismissed} title="Add field" subtitle="Choose what recipients fill in">
        <View style={{ paddingTop: spacing.sm }}>
          {FIELD_TYPES.map((type) => (
            <ListOption key={type} icon={FIELD_META[type].icon} label={FIELD_META[type].label} description={FIELD_META[type].description} onPress={() => chooseFieldType(type)} />
          ))}
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  section: { gap: 12 },
  sectionTitle: { gap: 2 },
  group: { gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  stepButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 56, textAlign: 'center' },
  roleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingLeft: 12, paddingRight: 10, borderRadius: 999 },
  roleRemove: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  addRole: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  addRoleButton: { minHeight: 50 },
});
