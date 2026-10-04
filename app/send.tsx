import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Send } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { DocumentStep } from '@/components/send/DocumentStep';
import { RecipientsStep } from '@/components/send/RecipientsStep';
import { ReviewStep } from '@/components/send/ReviewStep';
import { SendSuccess } from '@/components/send/SendSuccess';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { goBack, ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { StickyFooter } from '@/components/ui/StickyFooter';
import { sendEnvelope } from '@/lib/documents/api';
import { triggerHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme';
import type { DraftRecipient, EnvelopeDocument } from '@/types/workflows';

const STEPS = ['Document', 'Recipients', 'Review'];

type SendParams = { templateId?: string; name?: string; uri?: string };

function documentFromParams({ templateId, name, uri }: SendParams): EnvelopeDocument | null {
  if (templateId) return { name: name ?? 'Template', templateId };
  if (uri) return { name: name ?? 'Document', uri };
  return null;
}

export default function SendForSignatureScreen() {
  const { spacing } = useTheme();
  const params = useLocalSearchParams<SendParams>();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(0);
  const [document, setDocument] = useState<EnvelopeDocument | null>(() => documentFromParams(params));
  const [recipients, setRecipients] = useState<DraftRecipient[]>([]);
  const [signingOrder, setSigningOrder] = useState(false);
  /** null = use the default subject derived from the document name. */
  const [subject, setSubject] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(14);
  const [autoReminders, setAutoReminders] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<number | null>(null);

  const effectiveSubject = subject ?? (document ? `Please sign: ${document.name}` : '');
  const dirty = !!document || recipients.length > 0 || message.length > 0;
  const canContinue = step === 0 ? !!document : step === 1 ? recipients.length > 0 : !!effectiveSubject.trim();

  const goToStep = useCallback((next: number) => {
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const close = useCallback(() => {
    if (!dirty || sentTo !== null) {
      goBack();
      return;
    }
    Alert.alert('Discard this request?', 'Your document and recipients will not be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: goBack },
    ]);
  }, [dirty, sentTo]);

  const send = useCallback(async () => {
    if (!document) return;
    setSending(true);
    try {
      await sendEnvelope({
        document,
        recipients,
        subject: effectiveSubject.trim(),
        message: message.trim(),
        signingOrder: signingOrder && recipients.length > 1,
        expiresInDays,
        autoReminders,
      });
      triggerHaptic('success');
      setSentTo(recipients.length);
    } catch (error) {
      Alert.alert("Couldn't send", error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSending(false);
    }
  }, [document, recipients, effectiveSubject, message, signingOrder, expiresInDays, autoReminders]);

  const reset = useCallback(() => {
    setStep(0);
    setDocument(null);
    setRecipients([]);
    setSigningOrder(false);
    setSubject(null);
    setMessage('');
    setExpiresInDays(14);
    setAutoReminders(true);
    setSentTo(null);
  }, []);

  if (sentTo !== null && document) {
    return (
      <Screen edges={['top', 'bottom']}>
        <SendSuccess
          recipientCount={sentTo}
          documentName={document.name}
          onDone={() => router.replace('/(tabs)/home')}
          onSendAnother={reset}
        />
      </Screen>
    );
  }

  const isLast = step === STEPS.length - 1;

  return (
    <Screen>
      <ScreenHeader title="Send for signature" subtitle={document?.name} leading="close" onLeadingPress={close} />
      <View style={{ paddingBottom: spacing.md }}>
        <StepIndicator steps={STEPS} current={step} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxxl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          {step === 0 ? <DocumentStep document={document} onSelect={setDocument} /> : null}
          {step === 1 ? (
            <RecipientsStep recipients={recipients} onChange={setRecipients} signingOrder={signingOrder} onToggleOrder={setSigningOrder} />
          ) : null}
          {step === 2 && document ? (
            <ReviewStep
              document={document}
              recipients={recipients}
              signingOrder={signingOrder && recipients.length > 1}
              subject={effectiveSubject}
              onSubjectChange={setSubject}
              message={message}
              onMessageChange={setMessage}
              expiresInDays={expiresInDays}
              onExpiresChange={setExpiresInDays}
              autoReminders={autoReminders}
              onRemindersChange={setAutoReminders}
            />
          ) : null}
        </ScrollView>
        <StickyFooter>
          {step > 0 ? <Button label="Back" variant="secondary" onPress={() => goToStep(step - 1)} style={styles.back} /> : null}
          <Button
            label={isLast ? 'Send for signature' : 'Continue'}
            icon={isLast ? Send : ArrowRight}
            haptic={isLast ? 'medium' : 'light'}
            disabled={!canContinue}
            loading={sending}
            onPress={isLast ? send : () => goToStep(step + 1)}
            accessibilityHint={canContinue ? undefined : step === 0 ? 'Choose a document first' : 'Add at least one recipient'}
            style={styles.flex}
          />
        </StickyFooter>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  back: { minWidth: 96 },
});
