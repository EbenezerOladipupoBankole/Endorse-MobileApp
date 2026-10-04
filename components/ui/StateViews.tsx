import type { LucideIcon } from 'lucide-react-native';
import { RefreshCw } from 'lucide-react-native';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { Button } from './Button';
import { Typography } from './Typography';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

/** Friendly empty state: a layered icon "illustration", short copy and a CTA. */
export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  compact,
}: EmptyStateProps) {
  const { colors, spacing } = useTheme();
  const inner = compact ? 52 : 68;
  const outer = inner + 20;
  return (
    <View style={[styles.wrap, { paddingVertical: compact ? spacing.xl : spacing.xxxl }]}>
      <View style={[styles.center, { width: outer, height: outer, borderRadius: outer / 2, backgroundColor: colors.primarySoft }]}>
        <View style={[styles.center, { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: colors.surface }]}>
          <Icon size={compact ? 22 : 28} color={colors.primary} strokeWidth={1.75} />
        </View>
      </View>
      <Typography variant="title3" style={styles.text}>
        {title}
      </Typography>
      {message ? (
        <Typography variant="callout" tone="textSecondary" style={[styles.text, styles.message]}>
          {message}
        </Typography>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" style={{ marginTop: spacing.sm }} />
      ) : null}
    </View>
  );
});

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export const ErrorState = memo(function ErrorState({ title = "Couldn't load this section", message, onRetry }: ErrorStateProps) {
  const { colors, spacing, radius } = useTheme();
  const tone = colors.status.declined;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.error, { backgroundColor: tone.soft, borderRadius: radius.lg, padding: spacing.lg, marginHorizontal: spacing.xl }]}>
      <View style={styles.errorText}>
        <Typography variant="calloutStrong" color={tone.fg}>
          {title}
        </Typography>
        <Typography variant="caption" tone="textSecondary">
          {message ?? 'Check your connection and try again.'}
        </Typography>
      </View>
      <Button label="Retry" icon={RefreshCw} onPress={onRetry} variant="secondary" size="sm" />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 32, gap: 6 },
  center: { alignItems: 'center', justifyContent: 'center' },
  text: { textAlign: 'center' },
  message: { maxWidth: 300, marginBottom: 4 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorText: { flex: 1, gap: 2 },
});
