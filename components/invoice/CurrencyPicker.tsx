import { Check, ChevronDown, Search } from 'lucide-react-native';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View, type ListRenderItem } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { Typography } from '@/components/ui/Typography';
import { CURRENCIES, getCurrency, type Currency } from '@/lib/invoices/currencies';
import { useTheme } from '@/theme';

interface CurrencyPickerProps {
  value: string;
  onChange: (code: string) => void;
}

const keyExtractor = (c: Currency) => c.code;

/** Compact "🇳🇬 NGN ₦" trigger that opens a searchable currency list. */
export const CurrencyPicker = memo(function CurrencyPicker({ value, onChange }: CurrencyPickerProps) {
  const { colors, radius, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const current = getCurrency(value);

  const term = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      term
        ? CURRENCIES.filter((c) => c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term) || c.symbol.toLowerCase().includes(term))
        : CURRENCIES,
    [term],
  );

  const choose = useCallback(
    (code: string) => {
      onChange(code);
      setOpen(false);
    },
    [onChange],
  );

  const renderItem = useCallback<ListRenderItem<Currency>>(
    ({ item }) => {
      const selected = item.code === value;
      return (
        <Pressable
          onPress={() => choose(item.code)}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${item.code}`}
          accessibilityState={{ selected }}
          style={({ pressed }) => [
            styles.option,
            { paddingHorizontal: spacing.xl, borderBottomColor: colors.border },
            (pressed || selected) && { backgroundColor: colors.primarySoft },
          ]}>
          <Typography variant="title3" style={styles.flag} importantForAccessibility="no">
            {item.flag}
          </Typography>
          <View style={styles.flex}>
            <Typography variant="bodyStrong">{item.name}</Typography>
            <Typography variant="caption" tone="textSecondary">
              {item.code} · {item.symbol}
            </Typography>
          </View>
          {selected ? <Check size={20} color={colors.primary} /> : null}
        </Pressable>
      );
    },
    [choose, colors, spacing.xl, value],
  );

  return (
    <>
      <Pressable
        onPress={() => {
          setQuery('');
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Currency: ${current.name}. Change currency`}
        style={({ pressed }) => [
          styles.trigger,
          { borderColor: colors.borderStrong, borderRadius: radius.pill, backgroundColor: pressed ? colors.surfaceMuted : colors.surface },
        ]}>
        <Typography variant="callout" importantForAccessibility="no">
          {current.flag}
        </Typography>
        <Typography variant="captionStrong" maxFontSizeMultiplier={1.3}>
          {current.code} · {current.symbol}
        </Typography>
        <ChevronDown size={16} color={colors.textSecondary} />
      </Pressable>

      <BottomSheet visible={open} onRequestClose={() => setOpen(false)} title="Currency" subtitle="Amounts on this document use this currency">
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}>
          <TextField
            label="Search"
            icon={Search}
            value={query}
            onChangeText={setQuery}
            placeholder="Naira, NGN, KES, cedi…"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={12}
          ListEmptyComponent={<EmptyState compact icon={Search} title="No currency found" message="Try a currency code such as NGN or GHS." />}
        />
      </BottomSheet>
    </>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 12, borderWidth: 1, alignSelf: 'flex-start' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, borderBottomWidth: StyleSheet.hairlineWidth },
  flag: { width: 32, textAlign: 'center' },
  list: { maxHeight: 420 },
});
