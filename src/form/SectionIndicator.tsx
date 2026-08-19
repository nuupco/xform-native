/**
 * SectionIndicator — Phase 7 / PR2. Presentational breadcrumb showing the
 * walker's current ancestor group/repeat chain (`PathSegment[]`, root→leaf).
 * Pure component: not wired into Form.tsx yet (PR3).
 *
 * Visual language reuses the `surfaceVariant`/`labelMedium` idiom of the
 * example app's `screenStyles.sectionHeader` (design decision 12), minus
 * uppercase — these are author-written sentences, not short category
 * labels. Lives in the LIBRARY, not `example/`, so tokens are read directly
 * from the theme rather than importing example styles.
 *
 * Rendering rules (spec topic sdd/material3-campo-restyle/phase7-spec):
 * - `[]` ⇒ render nothing (no placeholder, no form-title root crumb).
 * - group segment ⇒ label verbatim.
 * - repeat segment ⇒ `${label} ${multiplicity + 1} de ${total}` (1-indexed
 *   for display; `multiplicity` itself is 0-indexed per JavaRosa/ts-rosa).
 * - `countBound` does not change copy (design default: identical copy for
 *   jr:count-bound vs. unbounded repeats — see design decision 6 / spec
 *   Open Questions).
 * - segment with `label: null` is omitted entirely.
 * - long chains use TAIL truncation: only the last MAX_VISIBLE_SEGMENTS
 *   segments show, prefixed with a leading "…" (design decision 12).
 * - non-interactive: plain View/Text, no Pressable, no onPress.
 */
import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import type { PathSegment } from '../adapter/FormAdapter';

const MAX_VISIBLE_SEGMENTS = 3;
const SEPARATOR = '›';

function createStyles(t: Theme) {
  return StyleSheet.create({
    row: {
      backgroundColor: t.color.roles.surfaceVariant,
      borderRadius: t.radius.md,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      marginBottom: t.spacing.sm,
    },
    segment: {
      ...t.typography.labelMedium,
      color: t.color.roles.onSurfaceVariant,
    },
    segmentFinal: {
      ...t.typography.titleSmall,
      color: t.color.roles.onSurface,
    },
    separator: {
      ...t.typography.labelMedium,
      color: t.color.roles.outline,
    },
  });
}

function segmentCopy(segment: PathSegment): string | null {
  if (segment.label === null) return null;
  if (segment.kind === 'repeat') {
    return `${segment.label} ${segment.multiplicity + 1} de ${segment.total}`;
  }
  return segment.label;
}

export interface SectionIndicatorProps {
  path: readonly PathSegment[];
  testID?: string;
}

export function SectionIndicator({ path, testID = 'section-indicator' }: SectionIndicatorProps) {
  const styles = useThemedStyles(createStyles);

  const labeled = path.filter((segment) => segment.label !== null);
  if (labeled.length === 0) {
    return null;
  }

  const truncated = labeled.length > MAX_VISIBLE_SEGMENTS;
  const visible = truncated ? labeled.slice(labeled.length - MAX_VISIBLE_SEGMENTS) : labeled;

  return (
    <View style={styles.row} testID={testID} collapsable={false}>
      <Text testID="section-indicator-text" numberOfLines={2} ellipsizeMode="tail">
        {truncated && (
          <Text testID="section-indicator-ellipsis" style={styles.segment}>
            {'… '}
            <Text style={styles.separator}>{SEPARATOR}</Text>
            {' '}
          </Text>
        )}
        {visible.map((segment, i) => {
          const isLast = i === visible.length - 1;
          return (
            <Text key={i}>
              {i > 0 && (
                <Text style={styles.separator}>
                  {' '}
                  {SEPARATOR}
                  {' '}
                </Text>
              )}
              <Text testID="section-indicator-segment" style={isLast ? styles.segmentFinal : styles.segment}>
                {segmentCopy(segment)}
              </Text>
            </Text>
          );
        })}
      </Text>
    </View>
  );
}
