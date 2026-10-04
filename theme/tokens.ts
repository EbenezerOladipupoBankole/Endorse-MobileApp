/**
 * Endorse design tokens — the single source of truth for color, spacing,
 * radius, typography and elevation. Built on the brand palette from
 * `design_handoff_endorse` (navy ink, brand blue, signature yellow) and
 * extended with neutrals, semantic status colors and a dark theme.
 *
 * Screens should consume these through `useTheme()` rather than importing
 * raw hex values, so the whole app can switch themes consistently.
 */
import type { TextStyle, ViewStyle } from 'react-native';

/* ------------------------------------------------------------------ */
/* Raw palette (do not use directly in components)                     */
/* ------------------------------------------------------------------ */

export const palette = {
  navy950: '#08111F',
  navy900: '#0E1D34',
  navy800: '#14213D',
  navy700: '#1D3358',
  navy600: '#24365A',

  blue700: '#0B5594', // logo blue, pressed
  blue600: '#0E68B4', // logo blue (sampled from assets/images/logo_main.jpg)
  blue400: '#6FA3E8',
  blue100: '#DCE9F9',
  blue50: '#E7F0FA',

  yellow500: '#F8D12D', // logo yellow
  yellow100: '#FEF7D9',

  gray900: '#14213D',
  gray700: '#45536B',
  gray600: '#5C6B84',
  gray500: '#617088',
  gray300: '#C5D0DE',
  gray200: '#DDE5EF',
  gray150: '#E3EAF3',
  gray100: '#EEF3F9',
  gray50: '#F5F8FC',
  white: '#FFFFFF',

  green700: '#1A7A4C',
  green400: '#4CC38A',
  amber700: '#9A5B00',
  amber400: '#F2B544',
  orange700: '#B4460F',
  orange400: '#F28C5B',
  red700: '#B42318',
  red400: '#F07A6E',
} as const;

/* ------------------------------------------------------------------ */
/* Semantic color roles                                                */
/* ------------------------------------------------------------------ */

export interface StatusColor {
  /** Foreground: text and icons. Meets WCAG AA on `soft` and on `surface`. */
  fg: string;
  /** Tinted background for chips and icon wells. */
  soft: string;
}

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  overlay: string;

  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;

  accent: string;
  accentSoft: string;
  onAccent: string;

  /** Deep brand surface used for hero cards (always dark, both themes). */
  brandSurface: string;
  brandSurfaceEnd: string;
  onBrand: string;
  onBrandMuted: string;

  skeleton: string;
  skeletonHighlight: string;
  shadow: string;

  status: {
    awaiting: StatusColor; // needs my signature
    waiting: StatusColor; // waiting on others
    success: StatusColor; // completed / paid / signed
    draft: StatusColor;
    expiring: StatusColor;
    declined: StatusColor; // declined / overdue / error
  };
}

const lightColors: ColorTokens = {
  background: palette.white,
  surface: palette.white,
  surfaceMuted: palette.gray100,
  surfaceElevated: palette.white,
  border: palette.gray150,
  borderStrong: palette.gray200,
  overlay: 'rgba(8, 17, 31, 0.45)',

  text: palette.navy800,
  textSecondary: palette.gray600,
  textTertiary: palette.gray500,
  textInverse: palette.white,

  primary: palette.blue600,
  primaryPressed: palette.blue700,
  primarySoft: palette.blue50,
  onPrimary: palette.white,

  accent: palette.yellow500,
  accentSoft: palette.yellow100,
  onAccent: palette.navy800,

  brandSurface: palette.navy700,
  brandSurfaceEnd: palette.navy900,
  onBrand: palette.white,
  onBrandMuted: '#C9D6EA',

  skeleton: palette.gray150,
  skeletonHighlight: palette.gray100,
  shadow: palette.navy800,

  status: {
    awaiting: { fg: palette.blue600, soft: palette.blue50 },
    waiting: { fg: palette.amber700, soft: '#FDF1D8' },
    success: { fg: palette.green700, soft: '#E3F4EA' },
    draft: { fg: palette.gray600, soft: palette.gray100 },
    expiring: { fg: palette.orange700, soft: '#FCEBE1' },
    declined: { fg: palette.red700, soft: '#FBE8E6' },
  },
};

const darkColors: ColorTokens = {
  background: palette.navy950,
  surface: '#111D33',
  surfaceMuted: '#18263F',
  surfaceElevated: '#16233B',
  border: '#22324F',
  borderStrong: '#2C3E60',
  overlay: 'rgba(0, 0, 0, 0.6)',

  text: '#EEF3FA',
  textSecondary: '#A9B6CB',
  textTertiary: '#8F9DB4',
  textInverse: palette.navy800,

  primary: palette.blue400,
  primaryPressed: '#8BB6EE',
  primarySoft: '#1A3155',
  onPrimary: palette.navy950,

  accent: palette.yellow500,
  accentSoft: '#3A3118',
  onAccent: palette.navy800,

  brandSurface: '#1A2F52',
  brandSurfaceEnd: '#0F1C33',
  onBrand: palette.white,
  onBrandMuted: '#C9D6EA',

  skeleton: '#1C2A44',
  skeletonHighlight: '#24365A',
  shadow: '#000000',

  status: {
    awaiting: { fg: palette.blue400, soft: '#1A3155' },
    waiting: { fg: palette.amber400, soft: '#382B12' },
    success: { fg: palette.green400, soft: '#133426' },
    draft: { fg: '#A9B6CB', soft: '#1F2D47' },
    expiring: { fg: palette.orange400, soft: '#3A2216' },
    declined: { fg: palette.red400, soft: '#3B1A1A' },
  },
};

/* ------------------------------------------------------------------ */
/* Spacing, radius, typography, elevation                              */
/* ------------------------------------------------------------------ */

/** 4pt grid. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

/** Minimum accessible touch target (iOS HIG 44pt / Material 48dp). */
export const touchTarget = 44;

export const fontFamily = {
  display: 'Sora_700Bold',
  displaySemiBold: 'Sora_600SemiBold',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

type TypeStyle = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'>;

/**
 * Type scale. Display styles use Sora; UI text uses Plus Jakarta Sans.
 * Never set `fontWeight` alongside these — the weight lives in the family.
 */
export const typography = {
  display: { fontFamily: fontFamily.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  title1: { fontFamily: fontFamily.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  title2: { fontFamily: fontFamily.displaySemiBold, fontSize: 18, lineHeight: 24, letterSpacing: -0.3 },
  title3: { fontFamily: fontFamily.displaySemiBold, fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  stat: { fontFamily: fontFamily.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.6 },
  headline: { fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 20, letterSpacing: -0.1 },
  body: { fontFamily: fontFamily.medium, fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  bodyStrong: { fontFamily: fontFamily.semiBold, fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  callout: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  calloutStrong: { fontFamily: fontFamily.semiBold, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  caption: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  captionStrong: { fontFamily: fontFamily.semiBold, fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  micro: { fontFamily: fontFamily.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
} satisfies Record<string, TypeStyle>;

export type TypographyVariant = keyof typeof typography;

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

const makeShadows = (color: string, strength: number) => ({
  none: {} as ShadowStyle,
  sm: {
    shadowColor: color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05 * strength,
    shadowRadius: 3,
    elevation: 1,
  } as ShadowStyle,
  md: {
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07 * strength,
    shadowRadius: 16,
    elevation: 3,
  } as ShadowStyle,
  lg: {
    shadowColor: color,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12 * strength,
    shadowRadius: 28,
    elevation: 8,
  } as ShadowStyle,
});

export const motion = {
  pressScale: 0.97,
  fast: 150,
  normal: 240,
  slow: 360,
} as const;

/* ------------------------------------------------------------------ */
/* Theme objects                                                       */
/* ------------------------------------------------------------------ */

export interface Theme {
  scheme: 'light' | 'dark';
  isDark: boolean;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: ReturnType<typeof makeShadows>;
  motion: typeof motion;
  touchTarget: number;
}

export const lightTheme: Theme = {
  scheme: 'light',
  isDark: false,
  colors: lightColors,
  spacing,
  radius,
  typography,
  shadows: makeShadows(lightColors.shadow, 1),
  motion,
  touchTarget,
};

export const darkTheme: Theme = {
  scheme: 'dark',
  isDark: true,
  colors: darkColors,
  spacing,
  radius,
  typography,
  // Shadows read poorly on dark surfaces; borders carry the separation instead.
  shadows: makeShadows(darkColors.shadow, 2.5),
  motion,
  touchTarget,
};
