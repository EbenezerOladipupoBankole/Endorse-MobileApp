import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Check, FileUp, LayoutTemplate, ScanLine } from 'lucide-react-native';
import React, { memo, useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListOption } from '@/components/ui/ListOption';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { Typography } from '@/components/ui/Typography';
import { useResource } from '@/hooks/useResource';
import { fetchTemplateList } from '@/lib/templates/api';
import { useTheme } from '@/theme';
import { TemplateAgreementCard } from './TemplateAgreementCard';
import type { AgreementTemplate } from '@/types/dashboard';
import type { EnvelopeDocument } from '@/types/workflows';

/** Small "page" illustration for the selected document. */
const PageThumbnail = memo(function PageThumbnail() {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.thumb, { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: radius.sm }]}>
      <View style={[styles.thumbBand, { backgroundColor: colors.primary }]} />
      {[28, 34, 22, 30].map((w, i) => (
        <View key={i} style={[styles.thumbLine, { width: w, backgroundColor: colors.border }]} />
      ))}
      <View style={[styles.thumbSign, { borderColor: colors.accent }]} />
    </View>
  );
});

interface SelectedDocumentCardProps {
  document: EnvelopeDocument;
  onChange: () => void;
}

export const SelectedDocumentCard = memo(function SelectedDocumentCard({ document, onChange }: SelectedDocumentCardProps) {
  const { colors, spacing } = useTheme();
  const source = document.templateId ? 'From template' : document.uri ? 'Uploaded file' : 'Document';
  return (
    <Card style={[styles.selected, { gap: spacing.lg }]}>
      <PageThumbnail />
      <View style={styles.flex}>
        <View style={styles.sourceRow}>
          <Check size={14} color={colors.status.success.fg} strokeWidth={2.6} />
          <Typography variant="captionStrong" color={colors.status.success.fg}>
            {source}
          </Typography>
        </View>
        <Typography variant="headline" numberOfLines={2}>
          {document.name}
        </Typography>
        {document.pageCount ? (
          <Typography variant="caption" tone="textSecondary">
            {document.pageCount} pages
          </Typography>
        ) : null}
      </View>
      <Button label="Change" size="sm" variant="secondary" onPress={onChange} accessibilityLabel={`Change document ${document.name}`} />
    </Card>
  );
});

const TemplatePicker = memo(function TemplatePicker({ onPick }: { onPick: (t: AgreementTemplate) => void }) {
  const { colors, radius, spacing } = useTheme();
  const { resource, reload } = useResource(fetchTemplateList);

  if (resource.status === 'error' && !resource.data) {
    return (
      <View style={styles.pickerInset}>
        <ErrorState title="Couldn't load templates" onRetry={reload} />
      </View>
    );
  }
  if (!resource.data) {
    return (
      <View style={{ gap: spacing.sm, paddingHorizontal: spacing.xl }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={56} radius={radius.md} />
        ))}
      </View>
    );
  }
  if (resource.data.length === 0) {
    return <EmptyState compact icon={LayoutTemplate} title="No templates yet" message="Create a template from the Templates tab." />;
  }
  return (
    <View style={{ gap: spacing.sm, paddingHorizontal: spacing.xl }}>
      {resource.data.map((t) => (
        <PressableScale
          key={t.id}
          onPress={() => onPick(t)}
          haptic="selection"
          scaleTo={0.98}
          accessibilityLabel={`${t.name}, ${t.category}, ${t.fieldCount} fields`}
          style={[styles.templateRow, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface }]}>
          <View style={[styles.templateIcon, { backgroundColor: colors.primarySoft, borderRadius: radius.sm }]}>
            <LayoutTemplate size={18} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Typography variant="calloutStrong" numberOfLines={1}>
              {t.name}
            </Typography>
            <Typography variant="caption" tone="textSecondary">
              {t.category} · {t.fieldCount} fields
            </Typography>
          </View>
        </PressableScale>
      ))}
    </View>
  );
});

interface DocumentStepProps {
  document: EnvelopeDocument | null;
  onSelect: (doc: EnvelopeDocument | null) => void;
}

export const DocumentStep = memo(function DocumentStep({ document, onSelect }: DocumentStepProps) {
  const { colors, spacing } = useTheme();
  const [showTemplates, setShowTemplates] = useState(false);

  const pickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
      if (!result.canceled) {
        const file = result.assets[0];
        onSelect({ name: file.name, uri: file.uri });
      }
    } catch {
      Alert.alert('Could not open file', 'Please try again or choose a different document.');
    }
  }, [onSelect]);

  const pickTemplate = useCallback(
    (t: AgreementTemplate) => {
      setShowTemplates(false);
      onSelect({ name: t.name, templateId: t.id });
    },
    [onSelect],
  );

  if (document) {
    return (
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
        <Typography variant="title2">Your document</Typography>
        <SelectedDocumentCard document={document} onChange={() => onSelect(null)} />
        {document.templateId ? <TemplateAgreementCard templateId={document.templateId} /> : null}
        <Typography variant="caption" tone="textSecondary">
          Next, add the people who need to sign or approve it.
        </Typography>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ paddingHorizontal: spacing.xl, gap: 4 }}>
        <Typography variant="title2">Choose a document</Typography>
        <Typography variant="callout" tone="textSecondary">
          Upload a PDF or image, start from a template, or scan paper.
        </Typography>
      </View>
      <View>
        <ListOption icon={FileUp} label="Upload a file" description="PDF or image from your device" onPress={pickFile} />
        <ListOption
          icon={LayoutTemplate}
          label="Use a template"
          description={showTemplates ? 'Pick one below' : 'NDA, lease, service agreement and more'}
          tone={colors.status.expiring}
          onPress={() => setShowTemplates((v) => !v)}
        />
        {showTemplates ? (
          <View style={{ paddingBottom: spacing.md }}>
            <TemplatePicker onPick={pickTemplate} />
          </View>
        ) : null}
        <ListOption
          icon={ScanLine}
          label="Scan a document"
          description="Capture paper with your camera"
          tone={colors.status.waiting}
          // TODO(nav): the scanner saves to the vault and can't hand the file back to this flow yet.
          onPress={() => router.push('/scanner')}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  selected: { flexDirection: 'row', alignItems: 'center' },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  thumb: { width: 52, height: 66, borderWidth: 1, padding: 7, paddingTop: 0, gap: 5, overflow: 'hidden' },
  thumbBand: { height: 5, marginHorizontal: -7, marginBottom: 3 },
  thumbLine: { height: 3, borderRadius: 2 },
  thumbSign: { marginTop: 'auto', width: 26, height: 9, borderWidth: 1, borderStyle: 'dashed', borderRadius: 2 },
  pickerInset: { paddingVertical: 4 },
  templateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 12, borderWidth: 1 },
  templateIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
