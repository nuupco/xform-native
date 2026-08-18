/**
 * ErrorBanner — animated `errorContainer` band shared by ConstraintSurface
 * and RequiredSurface (spec R3, design decision 4).
 *
 * Renders nothing when no message is supplied. Mounts with an
 * `Animated.timing` fade (opacity 0->1) + slide (translateY 4->0), 200ms,
 * `Easing.out(Easing.quad)`, `useNativeDriver: true` — RN's built-in
 * `Animated` API only, no Reanimated dependency (decision 4).
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import { AlertIcon } from '../widgets/primitives/Icon';

export interface ErrorBannerProps {
  message?: string | null;
  testID?: string;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      backgroundColor: t.color.roles.errorContainer,
      borderRadius: t.radius.sm,
      padding: t.spacing.sm,
    },
    text: {
      ...t.typography.bodySmall,
      color: t.color.roles.error,
      flexShrink: 1,
    },
  });
}

export function ErrorBanner({ message, testID }: ErrorBannerProps) {
  const styles = useThemedStyles(createStyles);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    translateY.setValue(4);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View
      testID={testID}
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
    >
      <AlertIcon />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}
