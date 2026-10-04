import { useLocalSearchParams, router } from 'expo-router';
import { CircleCheck, Eraser, Minus, Move, PenLine, Plus, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import SignatureCanvas, { type SignatureViewRef } from 'react-native-signature-canvas';
import { WebView } from 'react-native-webview';

import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { ShareActions } from '@/components/ui/ShareActions';
import { goBack, HeaderIconButton, ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { StickyFooter } from '@/components/ui/StickyFooter';
import { Typography } from '@/components/ui/Typography';
import { useAuth } from '@/context/AuthContext';
import { useResource } from '@/hooks/useResource';
import { fileTypeFor } from '@/lib/documents/api';
import { isLocalFileUri } from '@/lib/fileUri';
import {
  createDocument,
  documentFingerprint,
  getDocumentRecord,
  recordFileUri,
  signDocument,
  trustedSignatures,
  type DocumentRecord,
} from '@/lib/firestore/documents';
import { triggerHaptic } from '@/lib/haptics';
import { agreementPlainText } from '@/lib/pdf/agreement';
import { createSignedPdf, PDF_UNSUPPORTED_ON_WEB, type PdfSignature, type SignaturePlacement } from '@/lib/pdf/signedPdf';
import { makeId } from '@/lib/ids';
import { requireUser } from '@/lib/session';
import { uploadUserFile } from '@/lib/storage';
import { useTheme, type Theme } from '@/theme';

const STEPS = ['Review', 'Place', 'Complete'];
const SIGNATURE_BOX = { width: 180, height: 90 };
const INITIAL_POSITION = { x: 40, y: 220 };
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.2;

type Phase = 'review' | 'placing' | 'processing' | 'signed';

interface AuditRecord {
  signer: string;
  signedAt: number;
  reference: string;
}

/** Everything needed to (re)build the signed PDF after signing. */
interface SignedInfo {
  signatureDataUrl: string;
  placement?: SignaturePlacement;
  signedAt: number;
  reference: string;
}

type PdfState = { status: 'idle' | 'working' } | { status: 'ready'; uri: string } | { status: 'error'; error: string };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Readable agreement text for template-based documents (headings in bold). */
function AgreementText({ body }: { body: string }) {
  const blocks = agreementPlainText(body.replace(/^## /gm, '\u0000')).split(/\n\s*\n/).filter((b) => b.trim());
  return (
    <ScrollView contentContainerStyle={styles.agreement} accessibilityLabel="Agreement text">
      {blocks.map((block, i) =>
        block.startsWith('\u0000') ? (
          <Typography key={i} variant="headline" style={styles.agreementHeading}>
            {block.slice(1).trim()}
          </Typography>
        ) : (
          <Typography key={i} variant="callout" tone="textSecondary">
            {block.trim()}
          </Typography>
        ),
      )}
      {/* Room so the "Sign here" field doesn't cover the last paragraph. */}
      <View style={styles.agreementSpacer} />
    </ScrollView>
  );
}

/** Light-weight stand-in page when there is no file to preview (e.g. demo documents). */
function PlaceholderPage({ title, theme }: { title: string; theme: Theme }) {
  const { colors } = theme;
  const line = (width: `${number}%`) => <View style={[styles.line, { width, backgroundColor: colors.border }]} />;
  return (
    <View style={styles.placeholderPage}>
      <View style={[styles.titleBar, { backgroundColor: colors.primary }]} />
      <Typography variant="title3" numberOfLines={2}>
        {title}
      </Typography>
      {line('96%')}
      {line('88%')}
      {line('92%')}
      {line('70%')}
      <View style={styles.paragraphGap} />
      {line('94%')}
      {line('86%')}
      {line('60%')}
    </View>
  );
}

export default function SignDocumentScreen() {
  const theme = useTheme();
  const { colors, radius, spacing, shadows } = theme;
  const { id, name, uri: uriParam } = useLocalSearchParams<{ id: string; name?: string; uri?: string }>();
  const { profile, user } = useAuth();
  const documentName = name || 'Untitled document';
  const isExisting = !!id && id !== 'new';
  // Route params can come from any deep link: only accept a file already on this device, and only for new documents.
  const uri = !isExisting && uriParam && isLocalFileUri(uriParam) ? uriParam : undefined;

  // Existing documents: load the record for its file / agreement text and earlier signatures.
  const recordFetcher = useCallback(
    (): Promise<DocumentRecord | null> => (isExisting ? getDocumentRecord(id) : Promise.resolve(null)),
    [id, isExisting],
  );
  const { resource: recordResource } = useResource(recordFetcher);
  const record = recordResource.data ?? null;
  const previewUri = uri ?? (record ? recordFileUri(record, requireUser()) : undefined);
  const previewType = uri ? fileTypeFor(documentName) : (record?.fileType ?? fileTypeFor(documentName));

  const [phase, setPhase] = useState<Phase>('review');
  const [signatureUri, setSignatureUri] = useState<string | null>(null);
  const [padOpen, setPadOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [audit, setAudit] = useState<AuditRecord | null>(null);
  const [pageBox, setPageBox] = useState({ width: 0, height: 0 });
  const [signedInfo, setSignedInfo] = useState<SignedInfo | null>(null);
  const [pdf, setPdf] = useState<PdfState>({ status: 'idle' });
  const signatureRef = useRef<SignatureViewRef>(null);

  // Animated values and the drag responder are created once per mount.
  const [pan] = useState(() => new Animated.ValueXY(INITIAL_POSITION));
  // Latest drag position, read when the signature is confirmed (not during render).
  const position = useRef({ ...INITIAL_POSITION });
  useEffect(() => {
    const listener = pan.addListener((value) => {
      position.current = value;
    });
    return () => pan.removeListener(listener);
  }, [pan]);
  const [stamp] = useState(() => new Animated.Value(0));
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pan.extractOffset();
          triggerHaptic('selection');
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: () => pan.flattenOffset(),
      }),
    [pan],
  );

  const step = phase === 'review' ? 0 : phase === 'signed' ? 2 : 1;
  const signerName = profile ? `${profile.firstName} ${profile.lastName}` : user?.displayName || 'You';

  const handleSignature = (signature: string) => {
    setSignatureUri(signature);
    setPadOpen(false);
    setPhase('placing');
    triggerHaptic('light');
  };

  const resetSignature = () => {
    setSignatureUri(null);
    setScale(1);
    pan.setValue(INITIAL_POSITION);
    setPhase('review');
  };

  /** Signature box on screen → fractions of the page box (accounts for the scale transform). */
  const currentPlacement = (): SignaturePlacement | undefined => {
    if (!pageBox.width || !pageBox.height) return undefined;
    const w = SIGNATURE_BOX.width * scale;
    const h = SIGNATURE_BOX.height * scale;
    const left = position.current.x + (SIGNATURE_BOX.width - w) / 2;
    const top = position.current.y + (SIGNATURE_BOX.height - h) / 2;
    return {
      xRatio: clamp01(left / pageBox.width),
      yRatio: clamp01(top / pageBox.height),
      widthRatio: clamp01(w / pageBox.width),
    };
  };

  /** Builds the shareable signed PDF (stamped original + certificate). */
  const generatePdf = async (info: SignedInfo) => {
    if (Platform.OS === 'web') {
      setPdf({ status: 'error', error: PDF_UNSUPPORTED_ON_WEB });
      return;
    }
    setPdf({ status: 'working' });
    try {
      const me = requireUser();
      const mine: PdfSignature = {
        name: signerName,
        email: me.email,
        signedAt: info.signedAt,
        signatureDataUrl: info.signatureDataUrl,
        reference: info.reference,
        placement: info.placement,
      };
      let pdfUri: string;
      if (isExisting) {
        // Include everyone who has signed so far; only this signature has a known placement.
        const fresh = await getDocumentRecord(id);
        const others: PdfSignature[] = trustedSignatures(fresh)
          .filter((s) => s.email !== me.email)
          .map((s) => ({ name: s.name, email: s.email, signedAt: s.actedAt ?? fresh.updatedAt, signatureDataUrl: s.signatureDataUrl! }));
        pdfUri = await createSignedPdf({
          title: fresh.title,
          fileUri: recordFileUri(fresh, me),
          fileType: fresh.fileType,
          agreementBody: fresh.agreementBody,
          signatures: [...others, mine],
          reference: fresh.id.toUpperCase(),
          fingerprint: documentFingerprint(fresh),
        });
      } else {
        pdfUri = await createSignedPdf({
          title: documentName.replace(/\.(pdf|docx?|png|jpe?g)$/i, ''),
          fileUri: uri,
          fileType: fileTypeFor(documentName),
          signatures: [mine],
          reference: info.reference,
        });
      }
      setPdf({ status: 'ready', uri: pdfUri });
    } catch (err) {
      setPdf({ status: 'error', error: err instanceof Error ? err.message : 'Could not prepare the PDF.' });
    }
  };

  const confirmPlacement = async () => {
    if (!signatureUri) return;
    const placement = currentPlacement();
    setPhase('processing');
    try {
      // TODO(api): flatten the signature into the stored PDF server-side; the shareable signed copy is built on-device.
      if (isExisting) {
        await signDocument(id, signatureUri);
      } else {
        // A file the user uploaded and signed themselves becomes a completed document in their account.
        const me = requireUser();
        const fileUri = uri ? await uploadUserFile(me.uid, uri, documentName) : undefined;
        await createDocument({
          title: documentName.replace(/\.(pdf|docx?|png|jpe?g)$/i, ''),
          status: 'completed',
          signers: [{ id: me.uid, name: me.name, email: me.email, role: 'signer', signatureDataUrl: signatureUri, actedAt: Date.now() }],
          signerStatus: 'signed',
          fileUri: fileUri ?? uri,
          fileType: fileTypeFor(documentName),
          firstEvent: 'signed',
        });
      }
      const info: SignedInfo = {
        signatureDataUrl: signatureUri,
        placement,
        signedAt: Date.now(),
        reference: isExisting ? id.toUpperCase() : makeId('END').toUpperCase(),
      };
      setAudit({ signer: signerName, signedAt: info.signedAt, reference: info.reference });
      setSignedInfo(info);
      setPhase('signed');
      triggerHaptic('success');
      Animated.spring(stamp, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }).start();
      generatePdf(info);
    } catch (err) {
      console.error('Error signing document:', err);
      setPhase('placing');
      Alert.alert('Signing failed', err instanceof Error ? err.message : 'We could not apply your signature. Please try again.');
    }
  };

  const onPageLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setPageBox({ width, height });
  };

  const shareTitle = `Signed: ${documentName}`;
  const shareMessage = `Here's the signed copy of ${documentName}, signed with Endorse.`;

  const close = () => {
    if (phase === 'placing') {
      Alert.alert('Discard signature?', 'Your signature has not been applied yet.', [
        { text: 'Keep signing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: goBack },
      ]);
    } else {
      goBack();
    }
  };

  const subtitle =
    phase === 'signed' ? 'Signed and secured' : phase === 'placing' ? 'Drag to position your signature' : 'Review, then add your signature';

  return (
    <Screen>
      <ScreenHeader title={documentName} subtitle={subtitle} leading="close" onLeadingPress={close} />
      <View style={{ paddingBottom: spacing.md }}>
        <StepIndicator steps={STEPS} current={step} />
      </View>

      {/* Document canvas */}
      <View style={[styles.canvas, { paddingHorizontal: spacing.xl, paddingBottom: spacing.md }]}>
        <View
          onLayout={onPageLayout}
          style={[styles.page, shadows.md, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
          {isExisting && recordResource.status === 'loading' ? (
            <View style={styles.centerFill}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : previewUri && previewType !== 'docx' ? (
            previewType === 'pdf' ? (
              <WebView
                source={{ uri: previewUri }}
                style={styles.fill}
                // Show this one file and nothing else: no scripts, no navigation away, file access only for local files.
                originWhitelist={['file://*', 'content://*', 'https://firebasestorage.googleapis.com/*']}
                onShouldStartLoadWithRequest={(request) => request.url === previewUri}
                javaScriptEnabled={false}
                allowFileAccess={isLocalFileUri(previewUri)}
                scalesPageToFit
              />
            ) : (
              <Image source={{ uri: previewUri }} style={styles.fill} resizeMode="contain" accessibilityLabel={`Preview of ${documentName}`} />
            )
          ) : record?.agreementBody ? (
            <AgreementText body={record.agreementBody} />
          ) : (
            <PlaceholderPage title={documentName} theme={theme} />
          )}

          {/* Guided "sign here" field */}
          {phase === 'review' ? (
            <PressableScale
              onPress={() => setPadOpen(true)}
              haptic="medium"
              accessibilityLabel="Signature field. Tap to add your signature"
              style={[styles.signHere, { borderColor: colors.accent, backgroundColor: colors.accentSoft, borderRadius: radius.md }]}>
              <View style={[styles.signHereFlag, { backgroundColor: colors.accent }]}>
                <PenLine size={14} color={colors.onAccent} strokeWidth={2.5} />
                <Typography variant="micro" tone="onAccent">
                  SIGN HERE
                </Typography>
              </View>
              <Typography variant="captionStrong" tone="textSecondary">
                Tap to add your signature
              </Typography>
            </PressableScale>
          ) : null}

          {/* Placed signature */}
          {signatureUri ? (
            <Animated.View
              {...(phase === 'placing' ? panResponder.panHandlers : {})}
              accessibilityLabel={phase === 'placing' ? 'Your signature. Drag to move it' : 'Your signature'}
              style={[
                styles.signature,
                {
                  borderColor: phase === 'placing' ? colors.primary : 'transparent',
                  borderRadius: radius.sm,
                  transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }],
                },
              ]}>
              <Image source={{ uri: signatureUri }} style={styles.fill} resizeMode="contain" />
              {phase === 'placing' ? (
                <View style={[styles.moveBadge, { backgroundColor: colors.primary }]}>
                  <Move size={12} color={colors.onPrimary} />
                </View>
              ) : null}
              {phase === 'signed' ? (
                <Animated.View style={[styles.verified, { backgroundColor: colors.status.success.fg, transform: [{ scale: stamp }] }]}>
                  <ShieldCheck size={12} color={colors.surface} strokeWidth={2.5} />
                  <Typography variant="micro" color={colors.surface}>
                    VERIFIED
                  </Typography>
                </Animated.View>
              ) : null}
            </Animated.View>
          ) : null}

          {audit ? (
            <View style={styles.audit} accessible accessibilityLabel={`Signed by ${audit.signer}, reference ${audit.reference}`}>
              <Typography variant="micro" tone="textTertiary">
                SIGNED BY {audit.signer.toUpperCase()}
              </Typography>
              <Typography variant="micro" tone="textTertiary">
                {new Date(audit.signedAt).toLocaleString()} · {audit.reference}
              </Typography>
            </View>
          ) : null}
        </View>

        {/* Resize controls while placing */}
        {phase === 'placing' ? (
          <View style={[styles.toolbar, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill }, shadows.md]}>
            <HeaderIconButton icon={Minus} label="Make signature smaller" onPress={() => setScale((s) => Math.max(MIN_SCALE, +(s - 0.15).toFixed(2)))} />
            <Typography variant="captionStrong" tone="textSecondary" style={styles.scaleLabel}>
              {Math.round(scale * 100)}%
            </Typography>
            <HeaderIconButton icon={Plus} label="Make signature larger" onPress={() => setScale((s) => Math.min(MAX_SCALE, +(s + 0.15).toFixed(2)))} />
          </View>
        ) : null}
      </View>

      <StickyFooter
        summary={
          phase === 'signed' ? (
            <View style={{ gap: spacing.md }}>
              <View style={[styles.banner, { backgroundColor: colors.status.success.soft, borderRadius: radius.md }]}>
                <CircleCheck size={20} color={colors.status.success.fg} />
                <Typography variant="calloutStrong" color={colors.status.success.fg} style={styles.flex}>
                  Document signed. A copy has been added to your documents.
                </Typography>
              </View>
              {pdf.status === 'ready' ? (
                <View style={{ gap: spacing.sm }}>
                  <Typography variant="captionStrong" tone="textSecondary">
                    Share the signed PDF
                  </Typography>
                  <ShareActions getFile={async () => pdf.uri} title={shareTitle} message={shareMessage} />
                </View>
              ) : pdf.status === 'error' ? (
                <View style={styles.pdfRow} accessibilityLiveRegion="polite">
                  <Typography variant="caption" color={colors.status.declined.fg} style={styles.flex}>
                    {pdf.error}
                  </Typography>
                  {Platform.OS !== 'web' && signedInfo ? (
                    <Button label="Retry" icon={RefreshCw} variant="secondary" size="sm" onPress={() => generatePdf(signedInfo)} />
                  ) : null}
                </View>
              ) : (
                <View style={styles.pdfRow} accessibilityLiveRegion="polite">
                  <ActivityIndicator color={colors.primary} />
                  <Typography variant="caption" tone="textSecondary">
                    Preparing PDF…
                  </Typography>
                </View>
              )}
            </View>
          ) : phase === 'review' ? (
            <Typography variant="caption" tone="textSecondary" style={styles.center}>
              Tap the highlighted field or the button below to sign.
            </Typography>
          ) : null
        }>
        {phase === 'review' ? (
          <Button label="Add signature" icon={PenLine} variant="accent" haptic="medium" onPress={() => setPadOpen(true)} style={styles.flex} />
        ) : phase === 'signed' ? (
          <Button label="Done" variant="primary" onPress={() => router.replace('/(tabs)/home')} style={styles.flex} />
        ) : (
          <>
            <Button label="Redraw" icon={RotateCcw} variant="secondary" onPress={resetSignature} style={styles.flex} />
            <Button
              label={phase === 'processing' ? 'Securing…' : 'Confirm & sign'}
              variant="accent"
              haptic="medium"
              loading={phase === 'processing'}
              onPress={confirmPlacement}
              style={styles.wide}
            />
          </>
        )}
      </StickyFooter>

      {/* Signature pad */}
      <Modal visible={padOpen} animationType="slide" onRequestClose={() => setPadOpen(false)}>
        <Screen edges={['top', 'bottom']}>
          <ScreenHeader
            title="Draw your signature"
            subtitle="Use your finger to sign above the line"
            leading="close"
            onLeadingPress={() => setPadOpen(false)}
            actions={[{ icon: Eraser, label: 'Clear signature', onPress: () => signatureRef.current?.clearSignature() }]}
          />
          <View style={[styles.padWrap, { margin: spacing.xl, borderColor: colors.borderStrong, borderRadius: radius.xl }]}>
            <SignatureCanvas
              ref={signatureRef}
              onOK={handleSignature}
              onEmpty={() => Alert.alert('Nothing to save', 'Draw your signature first.')}
              autoClear={false}
              imageType="image/png"
              webStyle={`.m-signature-pad { box-shadow: none; border: none; } .m-signature-pad--footer { display: none; margin: 0; } body, html { background: #FFFFFF; }`}
            />
            <View pointerEvents="none" style={[styles.baseline, { borderColor: colors.borderStrong }]}>
              <Typography variant="caption" tone="textTertiary">
                ✕
              </Typography>
            </View>
          </View>
          <View style={[styles.padFooter, { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }]}>
            <Button label="Cancel" variant="secondary" onPress={() => setPadOpen(false)} style={styles.flex} />
            <Button label="Apply signature" variant="accent" haptic="medium" onPress={() => signatureRef.current?.readSignature()} style={styles.wide} />
          </View>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wide: { flex: 1.5 },
  center: { textAlign: 'center' },
  fill: { flex: 1, width: '100%', height: '100%', backgroundColor: 'transparent' },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  agreement: { padding: 24, gap: 10 },
  agreementHeading: { marginTop: 6 },
  agreementSpacer: { height: 170 },
  pdfRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  canvas: { flex: 1 },
  page: { flex: 1, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  placeholderPage: { flex: 1, padding: 28, gap: 10 },
  titleBar: { width: 56, height: 6, borderRadius: 3, marginBottom: 6 },
  line: { height: 6, borderRadius: 3 },
  paragraphGap: { height: 12 },
  signHere: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 64,
    minHeight: 84,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signHereFlag: { position: 'absolute', top: -12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  signature: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIGNATURE_BOX.width,
    height: SIGNATURE_BOX.height,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 4,
  },
  moveBadge: { position: 'absolute', top: -10, left: -10, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  verified: { position: 'absolute', top: -12, right: -12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  audit: { position: 'absolute', left: 28, bottom: 20, gap: 2 },
  toolbar: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  scaleLabel: { minWidth: 44, textAlign: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  padWrap: { flex: 1, borderWidth: 1.5, borderStyle: 'dashed', overflow: 'hidden' },
  baseline: { position: 'absolute', left: 24, right: 24, bottom: '30%', borderBottomWidth: 1.5, paddingBottom: 2 },
  padFooter: { flexDirection: 'row' },
});
