import { Check } from 'lucide-react-native';
import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/theme';

interface SendSuccessProps {
  recipientCount: number;
  documentName: string;
  onDone: () => void;
  onSendAnother: () => void;
}

/** Confirmation shown in place of the flow after a successful send. */
export const SendSuccess = memo(function SendSuccess({ recipientCount, documentName, onDone, onSendAnother }: SendSuccessProps) {
  const { colors, spacing } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0.4);

  useEffect(() => {
    scale.set(reduceMotion ? 1 : withSpring(1, { damping: 11, stiffness: 160 }));
  }, [scale, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const tone = colors.status.success;

  return (
    <View style={[styles.wrap, { paddingHorizontal: spacing.xxl, gap: spacing.md }]} accessibilityLiveRegion="polite">
      <Animated.View style={[styles.ringOuter, { backgroundColor: tone.soft }, animatedStyle]}>
        <View style={[styles.ringInner, { backgroundColor: tone.fg }]}>
          <Check size={40} color={colors.surface} strokeWidth={3} />
        </View>
      </Animated.View>
      <Typography variant="display" style={styles.center} accessibilityRole="header">
        Sent for signature
      </Typography>
      <Typography variant="body" tone="textSecondary" style={styles.center}>
        {documentName} was sent to {recipientCount} {recipientCount === 1 ? 'recipient' : 'recipients'}. We&apos;ll notify you as each
        person signs.
      </Typography>
      <View style={[styles.actions, { gap: spacing.md, marginTop: spacing.lg }]}>
        <Button label="Back to dashboard" onPress={onDone} haptic="medium" />
        <Button label="Send another" variant="secondary" onPress={onSendAnother} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringOuter: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ringInner: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  actions: { alignSelf: 'stretch' },
});
