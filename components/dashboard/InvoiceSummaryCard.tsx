import { Plus, ReceiptText, TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { Typography } from '@/components/ui/Typography';
import { formatMoney } from '@/lib/invoices/currencies';
import { useTheme } from '@/theme';
import type { InvoiceSummary, Resource } from '@/types/dashboard';

const CHART_HEIGHT = 56;

/** Smooth area sparkline. Decorative — the numbers are announced separately. */
const Sparkline = memo(function Sparkline({ values, color, width }: { values: number[]; color: string; width: number }) {
  const paths = useMemo(() => {
    if (values.length < 2 || width <= 0) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = 4;
    const step = width / (values.length - 1);
    const y = (v: number) => pad + (1 - (v - min) / (max - min || 1)) * (CHART_HEIGHT - pad * 2);
    const points = values.map((v, i) => [i * step, y(v)] as const);
    // Catmull-Rom → cubic Bézier for a gentle curve.
    let line = `M${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i - 1] ?? points[i];
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      const [x3, y3] = points[i + 2] ?? points[i + 1];
      line += ` C${x1 + (x2 - x0) / 6},${y1 + (y2 - y0) / 6} ${x2 - (x3 - x1) / 6},${y2 - (y3 - y1) / 6} ${x2},${y2}`;
    }
    return { line, area: `${line} L${width},${CHART_HEIGHT} L0,${CHART_HEIGHT} Z` };
  }, [values, width]);

  if (!paths) return <View style={{ height: CHART_HEIGHT }} />;
  return (
    <View aria-hidden>
      <Svg width={width} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.22} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={paths.area} fill="url(#sparkFill)" />
        <Path d={paths.line} stroke={color} strokeWidth={2.25} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
});

interface InvoiceSummaryCardProps {
  resource: Resource<InvoiceSummary>;
  onCreateInvoice: () => void;
  onRetry: () => void;
}

export const InvoiceSummaryCard = memo(function InvoiceSummaryCard({ resource, onCreateInvoice, onRetry }: InvoiceSummaryCardProps) {
  const { colors, radius, spacing, shadows } = useTheme();
  const [chartWidth, setChartWidth] = useState(0);
  const outer = { marginHorizontal: spacing.xl };

  if (resource.status === 'error' && !resource.data) {
    return <ErrorState title="Couldn't load invoices" onRetry={onRetry} />;
  }
  if (!resource.data) {
    return <Skeleton height={248} radius={radius.xl} style={outer} />;
  }

  const inv = resource.data;
  if (inv.invoiceCount === 0) {
    return (
      <View style={[outer, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.xl }]}>
        <EmptyState compact icon={ReceiptText} title="No invoices yet" message="Bill a client and track what's paid, unpaid and overdue." actionLabel="Create invoice" onAction={onCreateInvoice} />
      </View>
    );
  }
  const collected = inv.trend.reduce((sum, v) => sum + v, 0);
  const up = inv.changePct >= 0;
  const trendTone = up ? colors.status.success : colors.status.declined;
  const TrendIcon = up ? TrendingUp : TrendingDown;
  const totals = [
    { label: 'Paid', amount: inv.paid, tone: colors.status.success },
    { label: 'Unpaid', amount: inv.unpaid, tone: colors.status.waiting },
    { label: 'Overdue', amount: inv.overdue, tone: colors.status.declined },
  ];

  return (
    <View
      style={[
        outer,
        shadows.sm,
        { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.lg },
      ]}>
      <View
        accessible
        accessibilityLabel={`${inv.trendLabel}: ${formatMoney(collected, inv.currency)}, ${up ? 'up' : 'down'} ${Math.abs(inv.changePct).toFixed(1)} percent`}
        style={styles.headRow}>
        <View style={styles.flex}>
          <Typography variant="caption" tone="textSecondary">
            {inv.trendLabel}
          </Typography>
          <Typography variant="stat">{formatMoney(collected, inv.currency)}</Typography>
        </View>
        <View style={[styles.delta, { backgroundColor: trendTone.soft }]}>
          <TrendIcon size={14} color={trendTone.fg} strokeWidth={2.5} />
          <Typography variant="captionStrong" color={trendTone.fg} maxFontSizeMultiplier={1.3}>
            {Math.abs(inv.changePct).toFixed(1)}%
          </Typography>
        </View>
      </View>

      <View onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
        <Sparkline values={inv.trend} color={colors.primary} width={chartWidth} />
      </View>

      <View style={[styles.totals, { borderTopColor: colors.border }]}>
        {totals.map((t) => (
          <View key={t.label} style={styles.total} accessible accessibilityLabel={`${t.label}: ${formatMoney(t.amount, inv.currency)}`}>
            <View style={styles.totalLabel}>
              <View style={[styles.dot, { backgroundColor: t.tone.fg }]} />
              <Typography variant="caption" tone="textSecondary">
                {t.label}
              </Typography>
            </View>
            <Typography variant="headline" numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(t.amount, inv.currency, true)}
            </Typography>
          </View>
        ))}
      </View>

      {inv.overdueCount > 0 ? (
        <Typography variant="caption" color={colors.status.declined.fg}>
          {inv.overdueCount} {inv.overdueCount === 1 ? 'invoice is' : 'invoices are'} overdue — send a reminder.
        </Typography>
      ) : null}

      <Button label="Create invoice" icon={Plus} variant="primary" onPress={onCreateInvoice} />
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  totals: { flexDirection: 'row', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14 },
  total: { flex: 1, gap: 2 },
  totalLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
