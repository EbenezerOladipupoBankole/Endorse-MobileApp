import { BookOpen } from 'lucide-react-native';
import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AgreementPreview } from '@/components/templates/AgreementPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Typography } from '@/components/ui/Typography';
import { useResource } from '@/hooks/useResource';
import { agreementPlainText } from '@/lib/pdf/agreement';
import { fetchTemplateDetail } from '@/lib/templates/api';
import { useTheme } from '@/theme';

const EXCERPT_LENGTH = 240;

interface TemplateAgreementCardProps {
  templateId: string;
  /** Show the first lines of the agreement above the button. */
  showExcerpt?: boolean;
}

/** Lets the sender read the agreement recipients will receive. */
export const TemplateAgreementCard = memo(function TemplateAgreementCard({ templateId, showExcerpt }: TemplateAgreementCardProps) {
  const { radius, spacing } = useTheme();
  const fetcher = useCallback(() => fetchTemplateDetail(templateId), [templateId]);
  const { resource } = useResource(fetcher);
  const [open, setOpen] = useState(false);

  if (!resource.data) {
    if (resource.status === 'error') {
      return (
        <Typography variant="caption" tone="textSecondary">
          Couldn’t load the agreement text for this template.
        </Typography>
      );
    }
    return <Skeleton height={showExcerpt ? 120 : 48} radius={radius.lg} />;
  }

  const template = resource.data;
  const body = template.body?.trim();
  if (!body) {
    return (
      <Typography variant="caption" tone="textSecondary">
        No agreement text yet — add it in the editor so recipients can read it.
      </Typography>
    );
  }

  const plain = agreementPlainText(body).replace(/\s+/g, ' ').trim();
  const excerpt = plain.length > EXCERPT_LENGTH ? `${plain.slice(0, EXCERPT_LENGTH).trimEnd()}…` : plain;

  return (
    <Card style={{ gap: spacing.md }}>
      {showExcerpt ? (
        <View style={{ gap: 4 }}>
          <Typography variant="captionStrong" tone="textSecondary">
            Agreement recipients will read
          </Typography>
          <Typography variant="callout" tone="textSecondary">
            {excerpt}
          </Typography>
        </View>
      ) : null}
      <Button
        label={showExcerpt ? 'Read full agreement' : 'Read agreement'}
        icon={BookOpen}
        variant="secondary"
        size="sm"
        onPress={() => setOpen(true)}
        style={styles.button}
      />
      <AgreementPreview visible={open} onClose={() => setOpen(false)} title={template.name} body={body} />
    </Card>
  );
});

const styles = StyleSheet.create({
  button: { alignSelf: 'stretch' },
});
