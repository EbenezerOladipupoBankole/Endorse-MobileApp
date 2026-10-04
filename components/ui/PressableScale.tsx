import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { triggerHaptic, type HapticKind } from '@/lib/haptics';
import { motion } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Scale while pressed. */
  scaleTo?: number;
  haptic?: HapticKind;
}

/** Pressable with a subtle spring "press-in" and an optional haptic tick. */
export function PressableScale({
  style,
  children,
  scaleTo = motion.pressScale,
  haptic = 'light',
  disabled,
  onPressIn,
  onPressOut,
  onPress,
  accessibilityRole = 'button',
  accessibilityState,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      onPressIn={(e) => {
        if (!reduceMotion) scale.set(withTiming(scaleTo, { duration: motion.fast }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, { damping: 14, stiffness: 260 }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        triggerHaptic(haptic);
        onPress?.(e);
      }}
      style={[style, animatedStyle, disabled && { opacity: 0.5 }]}>
      {children}
    </AnimatedPressable>
  );
}
