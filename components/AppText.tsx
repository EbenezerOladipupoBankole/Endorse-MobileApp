import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

export function AppText(props: TextProps) {
  // Try to determine weight based on fontWeight in style if passed
  let family = 'Inter_500Medium';
  
  if (props.style) {
    const flatStyle = StyleSheet.flatten(props.style);
    if (flatStyle.fontWeight === '400' || flatStyle.fontWeight === 'normal') family = 'Inter_400Regular';
    if (flatStyle.fontWeight === '600') family = 'Inter_600SemiBold';
    if (flatStyle.fontWeight === '700' || flatStyle.fontWeight === 'bold') family = 'Inter_700Bold';
    if (flatStyle.fontWeight === '800') family = 'Inter_800ExtraBold';
    if (flatStyle.fontWeight === '900') family = 'Inter_900Black';
  }

  return (
    <Text {...props} style={[{ fontFamily: family }, props.style]} />
  );
}
