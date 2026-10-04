import { FileUp, LayoutTemplate, PenLine, ReceiptText, ScanLine, Send } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { ListOption } from '@/components/ui/ListOption';
import type { CreateAction } from '@/hooks/useCreateActions';
import { useTheme } from '@/theme';

interface CreateSheetProps {
  visible: boolean;
  onRequestClose: () => void;
  onDismissed: () => void;
  onSelect: (action: CreateAction) => void;
}

/** The "+" menu: every way to start new work. */
export function CreateSheet({ visible, onRequestClose, onDismissed, onSelect }: CreateSheetProps) {
  const { colors, spacing } = useTheme();
  const s = colors.status;
  return (
    <BottomSheet
      visible={visible}
      onRequestClose={onRequestClose}
      onDismissed={onDismissed}
      title="Create"
      subtitle="Start a new document, agreement or invoice">
      <View style={{ paddingTop: spacing.sm }}>
        <ListOption icon={PenLine} label="Sign a document" description="Upload a PDF or image and add your signature" onPress={() => onSelect('sign')} />
        <ListOption icon={Send} label="Send for signature" description="Request signatures from one or more people" tone={s.success} onPress={() => onSelect('send')} />
        <ListOption icon={ScanLine} label="Scan a document" description="Capture paper with your camera" tone={s.waiting} onPress={() => onSelect('scan')} />
        <ListOption icon={FileUp} label="Upload a file" description="PDF, Word or image from your device" tone={s.draft} onPress={() => onSelect('upload')} />
        <ListOption icon={LayoutTemplate} label="Use a template" description="NDA, lease, service agreement and more" tone={s.expiring} onPress={() => onSelect('template')} />
        <ListOption icon={ReceiptText} label="Create invoice" description="Bill a client and track payment" onPress={() => onSelect('invoice')} />
      </View>
    </BottomSheet>
  );
}
