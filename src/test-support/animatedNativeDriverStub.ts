/**
 * Global jest setup — stubs `Animated.timing` to avoid a pre-existing repo
 * dependency-pinning crash (react@19.2.7 vs react-native-renderer@19.0.0,
 * see PR2 apply-progress "Issues Found") that throws when
 * `useNativeDriver: true` connects to the native animated module in this
 * jest env. `ErrorBanner` (PR2) is the first, and now `RequiredSurface`/
 * `ConstraintSurface` (PR3, which delegate to it) are further, real usages —
 * every RTL test that renders one needs this stub, not just `ErrorBanner`'s
 * own unit tests. Synchronously resolves `start()` without touching the
 * native path; asserts nothing about animation config (that's covered by
 * `ErrorBanner.test.tsx`'s own `jest.spyOn` assertions).
 */
import { Animated } from 'react-native';

jest.spyOn(Animated, 'timing').mockImplementation(((_value: unknown, _config: { toValue: unknown }) => ({
  start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }),
  stop: () => {},
  reset: () => {},
})) as unknown as typeof Animated.timing);
