import { Mail, MessageCircle, Share2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { shareFile, type ShareChannel, type ShareFileOptions } from '@/lib/share';
import { useTheme } from '@/theme';
import { Button } from './Button';

interface ShareActionsProps extends ShareFileOptions {
  /** Produces (or returns the cached) local PDF to share. */
  getFile: () => Promise<string>;
  /** Show the generic "More" option. */
  showMore?: boolean;
}

/** WhatsApp / Email / More buttons that share a generated PDF. */
export function ShareActions({ getFile, showMore = true, ...options }: ShareActionsProps) {
  const { spacing } = useTheme();
  const [busy, setBusy] = useState<ShareChannel | null>(null);

  const share = async (channel: ShareChannel) => {
    setBusy(channel);
    try {
      const uri = await getFile();
      await shareFile(uri, channel, options);
    } catch (error) {
      Alert.alert('Couldn’t share', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <Button
        label="WhatsApp"
        icon={MessageCircle}
        variant="secondary"
        size="sm"
        loading={busy === 'whatsapp'}
        onPress={() => share('whatsapp')}
        accessibilityHint="Opens the share sheet with the PDF attached; choose WhatsApp"
        style={styles.flex}
      />
      <Button
        label="Email"
        icon={Mail}
        variant="secondary"
        size="sm"
        loading={busy === 'email'}
        onPress={() => share('email')}
        accessibilityHint="Opens a new email with the PDF attached"
        style={styles.flex}
      />
      {showMore ? (
        <Button
          label="More"
          icon={Share2}
          variant="secondary"
          size="sm"
          loading={busy === 'any'}
          onPress={() => share('any')}
          style={styles.flex}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  flex: { flex: 1 },
});
