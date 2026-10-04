import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';

export type CreateAction = 'sign' | 'send' | 'scan' | 'upload' | 'template' | 'invoice';

/**
 * The "create" verbs shared by the dashboard quick actions and the tab
 * bar's "+" sheet. Keeps navigation for new work in one place.
 */
export function useCreateActions() {
  const picking = useRef(false);

  const pickAndOpen = useCallback(async () => {
    if (picking.current) return;
    picking.current = true;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        const file = result.assets[0];
        router.push({ pathname: '/sign/[id]', params: { id: 'new', name: file.name, uri: file.uri } });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Could not open file', 'Please try again or choose a different document.');
    } finally {
      picking.current = false;
    }
  }, []);

  return useCallback(
    (action: CreateAction) => {
      switch (action) {
        case 'sign':
        case 'upload':
          pickAndOpen();
          break;
        case 'scan':
          router.push('/scanner');
          break;
        case 'template':
          router.push('/(tabs)/templates');
          break;
        case 'send':
          router.push('/send');
          break;
        case 'invoice':
          router.push('/invoice/new');
          break;
      }
    },
    [pickAndOpen],
  );
}
