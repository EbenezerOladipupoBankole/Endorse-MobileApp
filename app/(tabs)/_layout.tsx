import { Redirect, Tabs } from 'expo-router';
import { CircleUser, FolderOpen, House, LayoutTemplate, Plus } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { CreateSheet } from '@/components/dashboard/CreateSheet';
import { useAuth } from '@/context/AuthContext';
import { mustVerifyEmail } from '@/lib/authPolicy';
import { PressableScale } from '@/components/ui/PressableScale';
import { useCreateActions, type CreateAction } from '@/hooks/useCreateActions';
import { fontFamily, useTheme } from '@/theme';

const ICON_SIZE = 23;

/** Raised centre "+" button that opens the create sheet instead of navigating. */
function CreateTabButton({ onPress }: { onPress: () => void }) {
  const { colors, shadows } = useTheme();
  return (
    <View style={styles.fabSlot}>
      <PressableScale
        onPress={onPress}
        haptic="medium"
        scaleTo={0.92}
        accessibilityLabel="Create new"
        accessibilityHint="Opens options to sign, send, scan or create"
        style={[styles.fab, { backgroundColor: colors.primary, borderColor: colors.surface }, shadows.lg, { shadowColor: colors.primary }]}>
        <Plus size={26} color={colors.onPrimary} strokeWidth={2.5} />
      </PressableScale>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const runAction = useCreateActions();
  const [sheetOpen, setSheetOpen] = useState(false);
  const pendingAction = useRef<CreateAction | null>(null);

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const handleSelect = useCallback((action: CreateAction) => {
    pendingAction.current = action;
    setSheetOpen(false);
  }, []);
  // Navigate only once the sheet's Modal is gone, so pickers/screens present cleanly.
  const handleDismissed = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    if (action) setTimeout(() => runAction(action), Platform.OS === 'ios' ? 250 : 0);
  }, [runAction]);

  // Signed-in, verified accounts only.
  const { user, loading, emailVerified } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (mustVerifyEmail(emailVerified)) return <Redirect href={{ pathname: '/(auth)/otp', params: { email: user.email ?? '' } }} />;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            elevation: 0,
          },
          tabBarLabelStyle: { fontFamily: fontFamily.semiBold, fontSize: 11 },
          sceneStyle: { backgroundColor: colors.background },
        }}>
        <Tabs.Screen
          name="home"
          options={{ title: 'Home', tabBarIcon: ({ color }) => <House size={ICON_SIZE} color={color} /> }}
        />
        <Tabs.Screen
          name="two"
          options={{ title: 'Documents', tabBarIcon: ({ color }) => <FolderOpen size={ICON_SIZE} color={color} /> }}
        />
        <Tabs.Screen
          name="plus"
          options={{ title: 'Create', tabBarButton: () => <CreateTabButton onPress={openSheet} /> }}
          listeners={{ tabPress: (e) => e.preventDefault() }}
        />
        <Tabs.Screen
          name="templates"
          options={{ title: 'Templates', tabBarIcon: ({ color }) => <LayoutTemplate size={ICON_SIZE} color={color} /> }}
        />
        <Tabs.Screen
          name="three"
          options={{ title: 'Profile', tabBarIcon: ({ color }) => <CircleUser size={ICON_SIZE} color={color} /> }}
        />
      </Tabs>
      <CreateSheet visible={sheetOpen} onRequestClose={closeSheet} onDismissed={handleDismissed} onSelect={handleSelect} />
    </>
  );
}

const styles = StyleSheet.create({
  fabSlot: { flex: 1, alignItems: 'center' },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    marginTop: -22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
