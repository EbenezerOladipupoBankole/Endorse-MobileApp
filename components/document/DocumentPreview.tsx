import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { DOCUMENT_STATUS_META } from '@/lib/dashboard/format';
import { useTheme } from '@/theme';
import type { DocumentStatus } from '@/types/dashboard';

interface DocumentPreviewProps {
  status: DocumentStatus;
  fileType: 'pdf' | 'docx' | 'image';
  fileUri?: string;
}

const PAGE_WIDTH = 150;
const PAGE_HEIGHT = 194;

/** Stacked "page" illustration (or the real image when the file is one). Decorative. */
export const DocumentPreview = memo(function DocumentPreview({ status, fileType, fileUri }: DocumentPreviewProps) {
  const { colors, radius, shadows } = useTheme();
  const tone = colors.status[DOCUMENT_STATUS_META[status].tone];
  const page = { width: PAGE_WIDTH, height: PAGE_HEIGHT, borderRadius: radius.md, backgroundColor: colors.surface, borderColor: colors.border };

  return (
    <View aria-hidden style={[styles.stage, { backgroundColor: tone.soft, borderRadius: radius.xl }]}>
      <View style={styles.stack}>
        <View style={[styles.page, page, styles.back2, { backgroundColor: colors.surfaceMuted }]} />
        <View style={[styles.page, page, styles.back1]} />
        <View style={[styles.page, page, shadows.md, styles.front]}>
          {fileType === 'image' && fileUri ? (
            <Image source={{ uri: fileUri }} style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]} resizeMode="cover" />
          ) : (
            <>
              <View style={[styles.band, { backgroundColor: tone.fg, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md }]} />
              <View style={styles.body}>
                <View style={[styles.heading, { backgroundColor: colors.text }]} />
                {[92, 80, 88, 70, 84, 60].map((w, i) => (
                  <View key={i} style={[styles.line, { width: `${w}%`, backgroundColor: colors.borderStrong }]} />
                ))}
                <View style={[styles.signBox, { borderColor: tone.fg }]}>
                  <View style={[styles.signLine, { backgroundColor: tone.fg }]} />
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  stage: { height: 248, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  stack: { width: PAGE_WIDTH + 24, height: PAGE_HEIGHT + 16 },
  page: { position: 'absolute', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  back2: { left: 24, top: 0, transform: [{ rotate: '6deg' }] },
  back1: { left: 12, top: 6, transform: [{ rotate: '3deg' }] },
  front: { left: 0, top: 14 },
  band: { height: 8 },
  body: { flex: 1, padding: 14, gap: 7 },
  heading: { width: '55%', height: 7, borderRadius: 4, marginBottom: 4, opacity: 0.85 },
  line: { height: 4, borderRadius: 2 },
  signBox: { marginTop: 'auto', height: 28, width: '62%', borderWidth: 1, borderStyle: 'dashed', borderRadius: 4, justifyContent: 'flex-end', padding: 5 },
  signLine: { height: 2, borderRadius: 1, width: '70%' },
});
