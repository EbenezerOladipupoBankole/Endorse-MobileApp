import { Mail, Search, UserPlus, Users } from 'lucide-react-native';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListOption } from '@/components/ui/ListOption';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { Typography } from '@/components/ui/Typography';
import { useResource } from '@/hooks/useResource';
import { fetchInvoiceClients } from '@/lib/invoices/api';
import { makeId } from '@/lib/ids';
import { useTheme } from '@/theme';
import type { InvoiceClient } from '@/types/workflows';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ClientPickerProps {
  client: InvoiceClient | null;
  error?: string;
  onChange: (client: InvoiceClient) => void;
}

/** "Bill to" card plus a searchable client sheet with an inline "new client" form. */
export const ClientPicker = memo(function ClientPicker({ client, error, onChange }: ClientPickerProps) {
  const { colors, spacing, radius } = useTheme();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const select = useCallback(
    (next: InvoiceClient) => {
      onChange(next);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <>
      {client ? (
        <Card style={styles.selected}>
          <Avatar name={client.name} size={44} />
          <View style={styles.flex}>
            <Typography variant="headline" numberOfLines={1}>
              {client.name}
            </Typography>
            <Typography variant="caption" tone="textSecondary" numberOfLines={1}>
              {[client.company, client.email].filter(Boolean).join(' · ')}
            </Typography>
          </View>
          <Button label="Change" size="sm" variant="ghost" onPress={() => setOpen(true)} accessibilityLabel={`Change client, currently ${client.name}`} />
        </Card>
      ) : (
        <PressableScale
          onPress={() => setOpen(true)}
          accessibilityLabel="Add client"
          accessibilityHint="Choose who this invoice is billed to"
          style={[
            styles.empty,
            {
              borderColor: error ? colors.status.declined.fg : colors.borderStrong,
              borderRadius: radius.xl,
              padding: spacing.lg,
            },
          ]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
            <UserPlus size={20} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Typography variant="headline" color={colors.primary}>
              Add client
            </Typography>
            <Typography variant="caption" tone="textSecondary">
              Choose who you&apos;re billing
            </Typography>
          </View>
        </PressableScale>
      )}
      {error ? (
        <Typography variant="caption" color={colors.status.declined.fg} accessibilityLiveRegion="polite">
          {error}
        </Typography>
      ) : null}

      <BottomSheet visible={open} onRequestClose={close} title="Bill to" subtitle="Pick a client or add a new one">
        {open ? <ClientSheetBody onSelect={select} /> : null}
      </BottomSheet>
    </>
  );
});

/** Mounted only while the sheet is open so search/form state resets each time. */
function ClientSheetBody({ onSelect }: { onSelect: (client: InvoiceClient) => void }) {
  const { colors, spacing } = useTheme();
  const { resource, reload } = useResource(fetchInvoiceClients);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = resource.data ?? [];
    if (!q) return all;
    return all.filter((c) => [c.name, c.email, c.company].some((v) => v?.toLowerCase().includes(q)));
  }, [resource.data, query]);

  if (creating) {
    const nameError = submitted && !name.trim() ? 'Enter the client’s name' : undefined;
    const emailError = submitted && !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address' : undefined;
    return (
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg }}>
        <TextField label="Client name" value={name} onChangeText={setName} placeholder="Jane Cooper" error={nameError} autoFocus autoCapitalize="words" />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="jane@company.com"
          icon={Mail}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={[styles.row, { gap: spacing.md }]}>
          <Button label="Back" variant="secondary" onPress={() => setCreating(false)} style={styles.flex} />
          <Button
            label="Add client"
            icon={UserPlus}
            style={styles.flex}
            onPress={() => {
              setSubmitted(true);
              if (!name.trim() || !EMAIL_RE.test(email.trim())) return;
              // TODO(api): POST /clients and use the returned id.
              onSelect({ id: makeId('client'), name: name.trim(), email: email.trim() });
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        <TextField label="Search clients" value={query} onChangeText={setQuery} placeholder="Name, email or company" icon={Search} autoCorrect={false} autoCapitalize="none" />
      </View>
      <ListOption icon={UserPlus} label="New client" description="Add someone who isn't in your contacts" onPress={() => setCreating(true)} />
      <View style={[styles.divider, { backgroundColor: colors.border, marginHorizontal: spacing.xl }]} />
      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
        {resource.status === 'error' && !resource.data ? (
          <View style={{ paddingVertical: spacing.lg }}>
            <ErrorState title="Couldn't load clients" onRetry={reload} />
          </View>
        ) : !resource.data ? (
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg, paddingVertical: spacing.md }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.row, { gap: spacing.md }]}>
                <Skeleton width={40} height={40} radius={20} />
                <View style={[styles.flex, { gap: 6 }]}>
                  <Skeleton width="55%" height={13} />
                  <Skeleton width="75%" height={11} />
                </View>
              </View>
            ))}
          </View>
        ) : matches.length === 0 ? (
          <EmptyState compact icon={Users} title={query ? `No clients match “${query.trim()}”` : 'No clients yet'} message="Add a new client to bill them." actionLabel="New client" onAction={() => setCreating(true)} />
        ) : (
          matches.map((c) => (
            <PressableScale
              key={c.id}
              onPress={() => onSelect(c)}
              haptic="selection"
              scaleTo={0.98}
              accessibilityLabel={`${c.name}, ${c.company ?? c.email}`}
              style={[styles.clientRow, { paddingHorizontal: spacing.xl }]}>
              <Avatar name={c.name} size={40} />
              <View style={styles.flex}>
                <Typography variant="bodyStrong" numberOfLines={1}>
                  {c.name}
                </Typography>
                <Typography variant="caption" tone="textSecondary" numberOfLines={1}>
                  {[c.company, c.email].filter(Boolean).join(' · ')}
                </Typography>
              </View>
            </PressableScale>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  selected: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderStyle: 'dashed', minHeight: 72 },
  emptyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth },
  list: { maxHeight: 320 },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 10 },
});
