import { Ban, Download, RotateCcw, Share2 } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { ListOption } from '@/components/ui/ListOption';
import { useTheme } from '@/theme';
import type { DocumentAction, DocumentSummary } from '@/types/dashboard';

interface DocumentActionsSheetProps {
  /** The document whose menu is open; null when closed. */
  doc: DocumentSummary | null;
  visible: boolean;
  onRequestClose: () => void;
  onDismissed: () => void;
  onAction: (action: DocumentAction) => void;
}

/** Overflow menu for a document row: resend, download, share, void. */
export function DocumentActionsSheet({ doc, visible, onRequestClose, onDismissed, onAction }: DocumentActionsSheetProps) {
  const { colors, spacing } = useTheme();
  const pending = doc?.status === 'waiting_on_others';
  return (
    <BottomSheet visible={visible} onRequestClose={onRequestClose} onDismissed={onDismissed} title={doc?.title ?? 'Document'} subtitle="Document actions">
      <View style={{ paddingTop: spacing.sm }}>
        {pending ? (
          <ListOption icon={RotateCcw} label="Resend" description="Remind recipients who haven't signed" tone={colors.status.waiting} onPress={() => onAction('resend')} />
        ) : null}
        <ListOption icon={Download} label="Download" description="Save a PDF copy to your device" onPress={() => onAction('download')} />
        <ListOption icon={Share2} label="Share" description="Send a link or copy" tone={colors.status.success} onPress={() => onAction('share')} />
        {pending ? <ListOption icon={Ban} label="Void document" description="Cancel this request for all recipients" destructive onPress={() => onAction('void')} /> : null}
      </View>
    </BottomSheet>
  );
}
