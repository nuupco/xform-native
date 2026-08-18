/**
 * NavRow — pinned bottom navigation chrome (Back/Next, or Back/Finalizar on
 * the last step), design decisions 1/2/9.
 *
 * Pinned to bottom with an elevation-2 "upward" shadow (`elevationStyle(t, 2,
 * {direction:'up'})`) plus a 1px `outlineVariant` hairline separating it from
 * scroll content — the hairline is the cross-platform separator since
 * Android's `elevation` cannot point upward (decision 2). Back is a ghost
 * (`variant:'text'`) PressableButton; Next is filled `roles.primary` unless
 * `isLastStep`, in which case it renders "Finalizar" in `tone:'secondary'`
 * (gold) per decision 9. `Form.tsx` does not yet wire `isLastStep` (PR3
 * follow-up) — this component's own finish-variant rendering is complete and
 * tested here regardless.
 */
import { View, StyleSheet } from 'react-native';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import { elevationStyle } from '../theme/elevationStyle';
import { PressableButton } from '../widgets/primitives/PressableButton';
import { SafeAreaBottom } from '../widgets/primitives/SafeAreaBottom';

export interface NavRowProps {
  onBack: () => void;
  onNext: () => void;
  isLastStep?: boolean;
  backDisabled?: boolean;
  nextDisabled?: boolean;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    row: {
      ...elevationStyle(t, 2, { direction: 'up' }),
      borderTopWidth: 1,
      borderTopColor: t.color.roles.outlineVariant,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: t.spacing.md,
    },
  });
}

export function NavRow({ onBack, onNext, isLastStep, backDisabled, nextDisabled }: NavRowProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaBottom>
      <View testID="nav-row" style={styles.row} collapsable={false}>
        <PressableButton
          testID="nav-back"
          label="Atrás"
          variant="text"
          onPress={onBack}
          disabled={backDisabled}
          height={48}
        />
        <PressableButton
          testID="nav-next"
          label={isLastStep ? 'Finalizar' : 'Siguiente'}
          variant="filled"
          tone={isLastStep ? 'secondary' : 'primary'}
          onPress={onNext}
          disabled={nextDisabled}
          height={48}
        />
      </View>
    </SafeAreaBottom>
  );
}
