import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { HeaderIconButton } from './ScreenHeader';
import { Typography } from './Typography';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Read via a module function so render stays free of direct Date.now() calls. */
function currentTime() {
  return Date.now();
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function sameDay(a: number, b: number) {
  return startOfDay(a) === startOfDay(b);
}

/** Keeps the time-of-day of `timeSource` on the chosen calendar day. */
function withTimeOf(day: Date, timeSource: number): number {
  const t = new Date(timeSource);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), t.getHours(), t.getMinutes(), t.getSeconds()).getTime();
}

interface CalendarSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  /** Currently selected date (epoch ms). */
  value: number;
  /** Earliest / latest selectable dates (inclusive). */
  minDate?: number;
  maxDate?: number;
  onSelect: (value: number) => void;
  onRequestClose: () => void;
}

interface ViewMonth {
  year: number;
  month: number;
}

const monthOf = (ms: number): ViewMonth => {
  const d = new Date(ms);
  return { year: d.getFullYear(), month: d.getMonth() };
};

/** Month-grid date picker in a bottom sheet. Selection is committed with Done. */
export function CalendarSheet({ visible, title, subtitle, value, minDate, maxDate, onSelect, onRequestClose }: CalendarSheetProps) {
  const { colors, spacing, radius } = useTheme();
  const [view, setView] = useState<ViewMonth>(() => monthOf(value));
  const [pending, setPending] = useState(value);
  const [today, setToday] = useState(currentTime);
  const [wasVisible, setWasVisible] = useState(visible);

  // Each time the sheet opens, start from the current value (render-time sync, no effect).
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setView(monthOf(value));
      setPending(value);
      setToday(currentTime());
    }
  }

  const minDay = minDate !== undefined ? startOfDay(minDate) : undefined;
  const maxDay = maxDate !== undefined ? startOfDay(maxDate) : undefined;
  const isDisabled = (day: Date) => {
    const t = day.getTime();
    return (minDay !== undefined && t < minDay) || (maxDay !== undefined && t > maxDay);
  };

  // 6 weeks × 7 days, padded with nulls before the 1st.
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const out: (Date | null)[] = Array.from({ length: first.getDay() }, () => null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(view.year, view.month, d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [view]);

  const shiftMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const prevDisabled = minDay !== undefined && new Date(view.year, view.month, 1).getTime() <= minDay;
  const nextDisabled = maxDay !== undefined && new Date(view.year, view.month + 1, 1).getTime() > maxDay;
  const todayAllowed = !isDisabled(new Date(startOfDay(today)));

  return (
    <BottomSheet visible={visible} onRequestClose={onRequestClose} title={title} subtitle={subtitle}>
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
        <View style={styles.header}>
          <View style={prevDisabled ? styles.dim : undefined}>
            <HeaderIconButton icon={ChevronLeft} label="Previous month" onPress={() => !prevDisabled && shiftMonth(-1)} />
          </View>
          <Typography variant="title3" style={styles.monthLabel} accessibilityRole="header" accessibilityLiveRegion="polite">
            {MONTHS[view.month]} {view.year}
          </Typography>
          <View style={nextDisabled ? styles.dim : undefined}>
            <HeaderIconButton icon={ChevronRight} label="Next month" onPress={() => !nextDisabled && shiftMonth(1)} />
          </View>
        </View>

        <View style={styles.week} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {WEEKDAYS.map((d) => (
            <Typography key={d} variant="micro" tone="textTertiary" style={styles.weekday} maxFontSizeMultiplier={1.2}>
              {d.slice(0, 2).toUpperCase()}
            </Typography>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (!day) return <View key={`pad-${i}`} style={styles.cell} />;
            const t = day.getTime();
            const selected = sameDay(t, pending);
            const isToday = sameDay(t, today);
            const disabled = isDisabled(day);
            return (
              <View key={t} style={styles.cell}>
                <Pressable
                  disabled={disabled}
                  onPress={() => setPending(withTimeOf(day, pending))}
                  accessibilityRole="button"
                  accessibilityLabel={`${WEEKDAYS[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]} ${day.getFullYear()}${isToday ? ', today' : ''}`}
                  accessibilityState={{ selected, disabled }}
                  style={({ pressed }) => [
                    styles.day,
                    { borderRadius: radius.pill },
                    selected && { backgroundColor: colors.primary },
                    !selected && isToday && { borderWidth: 1.5, borderColor: colors.primary },
                    !selected && pressed && { backgroundColor: colors.primarySoft },
                    disabled && styles.dim,
                  ]}>
                  <Typography
                    variant={selected || isToday ? 'calloutStrong' : 'callout'}
                    color={selected ? colors.onPrimary : disabled ? colors.textTertiary : colors.text}
                    maxFontSizeMultiplier={1.3}>
                    {day.getDate()}
                  </Typography>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={[styles.footer, { gap: spacing.md }]}>
          <Button
            label="Today"
            variant="secondary"
            onPress={() => {
              if (!todayAllowed) return;
              setView(monthOf(today));
              setPending(withTimeOf(new Date(today), pending));
            }}
            style={[styles.flex, !todayAllowed && styles.dim]}
          />
          <Button
            label="Done"
            haptic="selection"
            onPress={() => {
              onSelect(pending);
              onRequestClose();
            }}
            style={styles.flex}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { flex: 1, textAlign: 'center' },
  week: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  day: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.35 },
  footer: { flexDirection: 'row', paddingTop: 4 },
});
