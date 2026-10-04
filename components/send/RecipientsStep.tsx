import { ChevronDown, ChevronUp, Mail, Plus, Trash2, User, UserPlus, Users } from 'lucide-react-native';
import React, { memo, useCallback, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { Typography } from '@/components/ui/Typography';
import { useAuth } from '@/context/AuthContext';
import { useResource } from '@/hooks/useResource';
import { fetchContacts } from '@/lib/contacts';
import { triggerHaptic } from '@/lib/haptics';
import { makeId } from '@/lib/ids';
import { useTheme } from '@/theme';
import type { DraftRecipient, SignerRole } from '@/types/workflows';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLES: { value: SignerRole; label: string }[] = [
  { value: 'signer', label: 'Signer' },
  { value: 'approver', label: 'Approver' },
  { value: 'viewer', label: 'Viewer' },
];

interface RecipientCardProps {
  recipient: DraftRecipient;
  index: number;
  total: number;
  showOrder: boolean;
  onRoleChange: (id: string, role: SignerRole) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

const RecipientCard = memo(function RecipientCard({ recipient, index, total, showOrder, onRoleChange, onRemove, onMove }: RecipientCardProps) {
  const { colors, spacing } = useTheme();
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={styles.cardTop}>
        {showOrder ? (
          <View style={[styles.order, { backgroundColor: colors.primary }]} accessibilityLabel={`Signs ${index + 1} of ${total}`}>
            <Typography variant="captionStrong" tone="onPrimary" maxFontSizeMultiplier={1.2}>
              {index + 1}
            </Typography>
          </View>
        ) : null}
        <Avatar name={recipient.name} size={40} />
        <View style={styles.flex}>
          <Typography variant="headline" numberOfLines={1}>
            {recipient.name}
          </Typography>
          <Typography variant="caption" tone="textSecondary" numberOfLines={1}>
            {recipient.email}
          </Typography>
        </View>
        {showOrder ? (
          <>
            <IconAction icon="up" label={`Move ${recipient.name} up`} disabled={index === 0} onPress={() => onMove(recipient.id, -1)} />
            <IconAction icon="down" label={`Move ${recipient.name} down`} disabled={index === total - 1} onPress={() => onMove(recipient.id, 1)} />
          </>
        ) : null}
        <IconAction icon="remove" label={`Remove ${recipient.name}`} onPress={() => onRemove(recipient.id)} />
      </View>
      <View style={styles.roles} accessibilityRole="radiogroup" accessibilityLabel={`Role for ${recipient.name}`}>
        {ROLES.map((r) => (
          <Chip key={r.value} label={r.label} selected={recipient.role === r.value} onPress={() => onRoleChange(recipient.id, r.value)} />
        ))}
      </View>
    </Card>
  );
});

function IconAction({ icon, label, onPress, disabled }: { icon: 'up' | 'down' | 'remove'; label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  const Icon = icon === 'up' ? ChevronUp : icon === 'down' ? ChevronDown : Trash2;
  const color = icon === 'remove' ? colors.status.declined.fg : colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.iconAction, pressed && { backgroundColor: colors.surfaceMuted }, disabled && styles.disabled]}>
      <Icon size={18} color={color} />
    </Pressable>
  );
}

interface RecipientsStepProps {
  recipients: DraftRecipient[];
  onChange: (next: DraftRecipient[]) => void;
  signingOrder: boolean;
  onToggleOrder: (value: boolean) => void;
}

export const RecipientsStep = memo(function RecipientsStep({ recipients, onChange, signingOrder, onToggleOrder }: RecipientsStepProps) {
  const { colors, spacing } = useTheme();
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  // People the user has exchanged documents with, or billed.
  const { resource: contacts } = useResource(fetchContacts);

  const taken = new Set(recipients.map((r) => r.email.toLowerCase()));
  const trimmedEmail = email.trim().toLowerCase();
  const nameError = submitted && !name.trim() ? 'Enter a name' : undefined;
  const emailError = !submitted
    ? undefined
    : !EMAIL_RE.test(trimmedEmail)
      ? 'Enter a valid email address'
      : taken.has(trimmedEmail)
        ? 'This person is already a recipient'
        : undefined;

  const add = useCallback(
    (person: { name: string; email: string }) => {
      triggerHaptic('selection');
      onChange([...recipients, { id: makeId('r'), name: person.name, email: person.email, role: 'signer' }]);
    },
    [onChange, recipients],
  );

  const submit = () => {
    setSubmitted(true);
    if (!name.trim() || !EMAIL_RE.test(trimmedEmail) || taken.has(trimmedEmail)) return;
    add({ name: name.trim(), email: trimmedEmail });
    setName('');
    setEmail('');
    setSubmitted(false);
  };

  const onRoleChange = useCallback(
    (id: string, role: SignerRole) => onChange(recipients.map((r) => (r.id === id ? { ...r, role } : r))),
    [onChange, recipients],
  );
  const onRemove = useCallback((id: string) => onChange(recipients.filter((r) => r.id !== id)), [onChange, recipients]);
  const onMove = useCallback(
    (id: string, direction: -1 | 1) => {
      const from = recipients.findIndex((r) => r.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= recipients.length) return;
      const next = [...recipients];
      [next[from], next[to]] = [next[to], next[from]];
      onChange(next);
    },
    [onChange, recipients],
  );

  const myEmail = user?.email ?? undefined;
  const myName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : user?.displayName || 'Me';
  const suggestions = (contacts.data ?? []).filter((c) => !taken.has(c.email.toLowerCase())).slice(0, 12);

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ paddingHorizontal: spacing.xl, gap: 4 }}>
        <Typography variant="title2">Who needs to sign?</Typography>
        <Typography variant="callout" tone="textSecondary">
          Add signers, approvers or people who only need a copy.
        </Typography>
      </View>

      {recipients.length === 0 ? (
        <EmptyState compact icon={Users} title="No recipients yet" message="Add someone below or pick from your contacts." />
      ) : (
        <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
          {recipients.map((r, i) => (
            <RecipientCard
              key={r.id}
              recipient={r}
              index={i}
              total={recipients.length}
              showOrder={signingOrder}
              onRoleChange={onRoleChange}
              onRemove={onRemove}
              onMove={onMove}
            />
          ))}
        </View>
      )}

      {recipients.length > 1 ? (
        <View style={[styles.switchRow, { paddingHorizontal: spacing.xl }]}>
          <View style={styles.flex}>
            <Typography variant="bodyStrong">Set signing order</Typography>
            <Typography variant="caption" tone="textSecondary">
              Each person signs only after the one before them.
            </Typography>
          </View>
          <Switch
            value={signingOrder}
            onValueChange={onToggleOrder}
            accessibilityLabel="Set signing order"
            trackColor={{ true: colors.primary, false: colors.borderStrong }}
            thumbColor={colors.surface}
          />
        </View>
      ) : null}

      {(suggestions.length > 0 || (myEmail && !taken.has(myEmail.toLowerCase()))) ? (
        <View style={{ gap: spacing.sm }}>
          <Typography variant="micro" tone="textSecondary" style={{ paddingHorizontal: spacing.xl }}>
            QUICK ADD
          </Typography>
          <ChipRow>
            {myEmail && !taken.has(myEmail.toLowerCase()) ? (
              <Chip label="Add me" icon={User} onPress={() => add({ name: myName, email: myEmail.toLowerCase() })} />
            ) : null}
            {suggestions.map((c) => (
              <Chip key={c.id} label={c.name} icon={Plus} onPress={() => add({ name: c.name, email: c.email })} />
            ))}
          </ChipRow>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: spacing.xl }}>
        <Card style={{ gap: spacing.md }}>
          <Typography variant="headline">Add recipient</Typography>
          <TextField
            label="Full name"
            icon={User}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Amara Okafor"
            autoCapitalize="words"
            returnKeyType="next"
            error={nameError}
          />
          <TextField
            label="Email"
            icon={Mail}
            value={email}
            onChangeText={setEmail}
            placeholder="name@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={submit}
            error={emailError}
          />
          <Button label="Add recipient" icon={UserPlus} variant="secondary" onPress={submit} />
        </Card>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  order: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconAction: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
