import { useMemo } from 'react';

import { useColorScheme } from '@/components/useColorScheme';
import { darkTheme, lightTheme, type Theme } from './tokens';

/** Returns the active theme. The object is a stable module constant per scheme. */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}

/**
 * Builds a themed StyleSheet once per theme:
 *   const styles = useThemedStyles(createStyles);
 *   const createStyles = (t: Theme) => StyleSheet.create({ ... });
 * `factory` must be defined at module scope so it stays referentially stable.
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
