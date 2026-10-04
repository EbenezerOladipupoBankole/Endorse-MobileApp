import * as MailComposer from 'expo-mail-composer';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

export type ShareChannel = 'whatsapp' | 'email' | 'any';

export interface ShareFileOptions {
  /** Shown as the share-sheet title and used as the email subject. */
  title: string;
  /** Email body / message text. */
  message?: string;
  /** Pre-filled email recipients. */
  recipients?: string[];
  mimeType?: string;
}

async function openShareSheet(uri: string, { title, mimeType = 'application/pdf' }: ShareFileOptions) {
  if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) {
    // Web: open the file so the browser can download / print it.
    await Linking.openURL(uri);
    return;
  }
  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle: title,
    UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
  });
}

/**
 * Shares a local file (normally a generated PDF).
 *
 * - `whatsapp` / `any`: the system share sheet, where WhatsApp, Gmail, Drive,
 *   etc. appear. WhatsApp has no public API for attaching files directly.
 * - `email`: the mail composer with the file attached; falls back to the share
 *   sheet when no mail account is set up on the device.
 */
export async function shareFile(uri: string, channel: ShareChannel, options: ShareFileOptions): Promise<void> {
  if (channel === 'email' && Platform.OS !== 'web' && (await MailComposer.isAvailableAsync())) {
    await MailComposer.composeAsync({
      subject: options.title,
      body: options.message ?? '',
      recipients: options.recipients,
      attachments: [uri],
    });
    return;
  }
  await openShareSheet(uri, options);
}
