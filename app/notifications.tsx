import { router } from 'expo-router';
import { BellOff } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { ActionRequiredCard } from '@/components/dashboard/ActionRequiredCard';
import { ActivityItem, ActivityItemSkeleton } from '@/components/dashboard/ActivityItem';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { useResource } from '@/hooks/useResource';
import { fetchActionRequired, fetchActivity } from '@/lib/dashboard/api';
import { useTheme } from '@/theme';
import type { ActivityEvent, DocumentSummary, Resource } from '@/types/dashboard';

// TODO(api): back this with a server-written notifications inbox; for now it is derived from the user's envelopes.
async function fetchInbox() {
  const [actionRequired, activity] = await Promise.all([fetchActionRequired(), fetchActivity()]);
  return { actionRequired, activity };
}

function openDocument(id: string) {
  router.push({ pathname: '/document/[id]', params: { id } });
}

const SKELETON_ROWS = 4;

export default function NotificationsScreen() {
  const { spacing, colors } = useTheme();
  const { resource, reload } = useResource(fetchInbox);
  const loading = resource.status === 'loading';
  const now = resource.fetchedAt ?? 0;

  // ActionRequiredCard takes its own Resource; project it out of the combined one.
  const actionRequired = useMemo<Resource<DocumentSummary[]>>(
    () => ({ ...resource, data: resource.data?.actionRequired }),
    [resource],
  );

  const handleSign = useCallback((doc: DocumentSummary) => openDocument(doc.id), []);
  const handleOpenActivity = useCallback((event: ActivityEvent) => openDocument(event.documentId), []);

  const activity = resource.data?.activity;

  return (
    <Screen>
      <ScreenHeader title="Notifications" />
      <ScrollView
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.lg }}
        refreshControl={<RefreshControl refreshing={loading && !!resource.data} onRefresh={reload} tintColor={colors.primary} />}>
        <SectionHeader title="Needs your signature" />
        <ActionRequiredCard resource={actionRequired} onSign={handleSign} onRetry={reload} />

        <SectionHeader title="Recent activity" />
        {resource.status === 'error' && !activity ? (
          <ErrorState title="Couldn't load activity" onRetry={reload} />
        ) : !activity ? (
          <View>
            {Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <ActivityItemSkeleton key={i} isFirst={i === 0} isLast={i === SKELETON_ROWS - 1} />
            ))}
          </View>
        ) : activity.length === 0 ? (
          <EmptyState compact icon={BellOff} title="No activity yet" message="When someone views, signs or declines your documents, it shows up here." />
        ) : (
          <View>
            {activity.map((event, i) => (
              <ActivityItem
                key={event.id}
                event={event}
                now={now}
                isFirst={i === 0}
                isLast={i === activity.length - 1}
                onPress={handleOpenActivity}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
