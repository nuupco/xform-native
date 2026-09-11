/**
 * SelectOneWidget — renders a single-select question (REQ-13, REQ-14).
 *
 * Value shape (ts-rosa codecs.ts:180-183, AnswerValue.ts:30):
 *   selectOne value = string (a single choice token).
 *   store.answerQuestion receives the token string directly.
 *
 * Variants (ADR-3 selectOne, 11 render branches):
 *   default      → radio-style list, SelectionRow (control:'radio')
 *   minimal      → bottom-sheet dropdown (BottomSheet + SelectionRow rows)
 *   autocomplete → minimal + a filled pill search bar (SearchIcon) on top
 *                  of the BottomSheet's SelectionRow rows ("search" appearance
 *                  alias resolves here — spec's "SelectOne search variant")
 *   likert       → horizontal row of SelectionRow cells (density: 'likert')
 *   columns      → multi-column FlatList, SelectionRow (default density)
 *   columns-pack → compact multi-column FlatList, SelectionRow (density: 'pack')
 *   compact      → same multi-column FlatList as `columns`, dropping the text
 *                  label when a choice has associated media. ts-rosa's
 *                  SelectChoice (getChoices()) exposes only value/label — no
 *                  media reference — so no choice this widget ever sees has
 *                  media, and the label is always shown (falls back to the
 *                  `columns` behavior per spec: "if no media, show the label
 *                  the same as columns").
 *   no-buttons   → same row list as `default`, without the radio indicator —
 *                  the whole row stays the tap target (SelectionRow already
 *                  makes the full row pressable)
 *   quick        → horizontal ScrollView of chip/tag Pressables (unchanged
 *                  chrome — a chip is not a row, kept off SelectionRow per
 *                  the design doc's own per-widget key list: quickChip/
 *                  quickChipSelected stay distinct from the row primitive)
 *
 * list         → horizontal row of SelectionRow cells (density: 'likert'),
 *                 label displayed above the radio — ODK Collect's ListWidget
 *                 (radio buttons aligned horizontally, meant to sit under a
 *                 field-list LabelWidget header, but works standalone here).
 * list-nolabel → same as `list` but the choice label text is suppressed
 *                 (ODK's ListWidget with displayLabel=false) — only the
 *                 radio indicators show.
 * label        → ODK Collect's LabelWidget: renders only the choice labels
 *                 in a horizontal row, with NO interactive control and NO
 *                 answer ever produced (ODK's LabelWidget.getAnswer() always
 *                 returns null — it exists purely to caption a field-list of
 *                 list-nolabel widgets). Faithfully reproduced here: no
 *                 SelectionIndicator, no onPress, store is never written.
 * columns-n    → same multi-column FlatList as `columns`, but the column
 *                 count is parsed from the appearance string itself
 *                 (columns-3, columns-12, ...) instead of being fixed at 2 —
 *                 mirrors ODK's Appearances.getNumberOfColumns.
 * map          → ODK Collect's SelectOneFromMapWidget: tapping the field
 *                 opens a full-screen map with every choice plotted as a pin
 *                 (from SelectChoice.geometry, itemset-only). Tapping a pin
 *                 selects that choice and closes the map. Falls through to
 *                 `default` when the map dep is absent or no choice carries
 *                 geometry (the variant has nothing to plot).
 *
 * image-map   → ODK Collect's SelectOneImageMapWidget: the question's own
 *                 label carries a `jr://images/...svg` itext media
 *                 reference (ts-rosa's getLabelMediaUri('image')). The
 *                 host-supplied store.mediaResolver resolves that raw
 *                 reference to a loadable URI, the SVG is fetched and
 *                 DOM-parsed, and every <path>/<rect>/<circle>/<ellipse>/
 *                 <polygon> whose `id` case-insensitively matches a
 *                 choice's `value` becomes a tappable react-native-svg
 *                 shape (same Svg/onPress pattern as SignatureWidget).
 *                 Falls back to `default` when react-native-svg or
 *                 store.mediaResolver is absent, the label carries no
 *                 image media, or the fetch/parse fails to produce any
 *                 matched shape.
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface SelectOneWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function SelectOneWidget({ nodeRef, store, appearance }: SelectOneWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=SelectOneWidget.d.ts.map