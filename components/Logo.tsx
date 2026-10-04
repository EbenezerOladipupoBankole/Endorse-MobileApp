import React from 'react';
import { Image, type StyleProp, type ImageStyle } from 'react-native';

const LOGO = require('../assets/images/logo_main.jpg');

interface LogoProps {
  /** Rendered width and height in points (the source artwork is square). */
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/** The official Endorse logo (assets/images/logo_main.jpg). */
export const Logo = ({ size = 120, style }: LogoProps) => (
  <Image
    source={LOGO}
    style={[{ width: size, height: size }, style]}
    resizeMode="contain"
    accessibilityRole="image"
    accessibilityLabel="Endorse"
  />
);
