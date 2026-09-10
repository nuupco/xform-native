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

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { resolveVariant } from './engine/appearance';
import { useTheme, useThemedStyles, type Theme } from '../theme/ThemeContext';
import { createFieldStyles } from './primitives/fieldStyles';
import { SelectionRow } from './primitives/SelectionRow';
import { SearchIcon } from './primitives/Icon';
import { BottomSheet } from './primitives/BottomSheet';
import { AppModal } from './primitives/Modal';
import { GeoMapChrome } from './primitives/GeoMapChrome';
import { MarkdownText } from '../text/MarkdownText';
import { stripOdkMarkdown } from '../text/parseOdkMarkdown';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';
import type { SelectChoice } from '@nuup/ts-rosa';
import { DOMParser } from '@xmldom/xmldom';
import type { Document as XmlDocument, Element as XmlElement } from '@xmldom/xmldom';

let _svgModule: any | null = null;
let _svgLoaded: boolean | undefined;

function getSvgModule(): any | null {
  if (_svgLoaded === undefined) {
    try {
      _svgModule = require('react-native-svg');
      _svgLoaded = true;
    } catch {
      _svgLoaded = false;
    }
  }
  return _svgModule;
}

const IMAGE_MAP_TAG_COMPONENT: Readonly<Record<string, string>> = {
  path: 'Path',
  rect: 'Rect',
  circle: 'Circle',
  ellipse: 'Ellipse',
  polygon: 'Polygon',
};

interface ImageMapShape {
  tag: string;
  id: string;
  attrs: Record<string, string>;
}

/** DOM-parses an SVG document, extracting every id-bearing shape ODK Collect's own svg_map_helper.js matches (<path>/<rect>/<circle>/<ellipse>/<polygon> — <g> excluded, no nested-shape composition here). */
function parseImageMapShapes(markup: string): { viewBox: string | null; shapes: ImageMapShape[] } {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml') as unknown as XmlDocument;
  const svgEl = doc.documentElement;
  if (!svgEl) return { viewBox: null, shapes: [] };

  const shapes: ImageMapShape[] = [];
  const walk = (node: XmlElement) => {
    const children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child || child.nodeType !== 1) continue;
      const el = child as unknown as XmlElement;
      const tag = el.tagName?.toLowerCase() ?? '';
      const id = el.getAttribute('id');
      if (tag in IMAGE_MAP_TAG_COMPONENT && id) {
        const attrs: Record<string, string> = {};
        const attributes = el.attributes;
        for (let j = 0; j < attributes.length; j++) {
          const attr = attributes[j];
          if (attr && attr.name !== 'id') attrs[attr.name] = attr.value;
        }
        shapes.push({ tag, id, attrs });
      }
      walk(el);
    }
  };
  walk(svgEl as unknown as XmlElement);

  return { viewBox: svgEl.getAttribute('viewBox'), shapes };
}

let _geoModule: any | null = null;
let _geoLoaded: boolean | undefined;

function getGeoModule(): any | null {
  if (_geoLoaded === undefined) {
    try {
      _geoModule = require('@nuup/xform-native-geo');
      _geoLoaded = true;
    } catch {
      _geoLoaded = false;
    }
  }
  return _geoModule;
}

// Same basemap layers as GeoPointWidget/GeoShapeWidget/GeoTraceWidget — a
// MapLibre.Map with no source/layer renders a blank canvas, it does not fall
// back to any built-in tiles.
const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }],
};

// ESRI World Imagery — free satellite tiles, no API key.
// ESRI URL order is z/y/x (row before column).
const ESRI_TILES = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
];
const ESRI_MAX_ZOOM = 17;

/** Parses a geopoint-convention string ("lat lon [alt [acc]]") to {lat, lon}. */
function parseGeometry(geometry: string | null | undefined): { lat: number; lon: number } | null {
  if (!geometry) return null;
  const parts = geometry.trim().split(/\s+/);
  const lat = parseFloat(parts[0] ?? '');
  const lon = parseFloat(parts[1] ?? '');
  if (isNaN(lat) || isNaN(lon)) return null;
  return { lat, lon };
}


export interface SelectOneWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

/** Column count for the `columns-n` variant, parsed from the raw appearance string (e.g. `columns-3`). */
function parseColumnsN(appearance: string | null | undefined): number {
  const match = (appearance ?? '').toLowerCase().match(/columns-(\d+)/);
  const n = match ? parseInt(match[1] ?? '', 10) : 1;
  return n >= 1 ? n : 1;
}

function createStyles(t: Theme) {
  const f = createFieldStyles(t);
  return StyleSheet.create({
    container: {
      marginVertical: t.spacing.xs,
    },
    dropdownTrigger: {
      ...f.field,
    },
    dropdownTriggerText: {
      ...f.fieldText,
    },
    // Search bar (spec: "SelectOne Widget (incl. search variant) ... fixed
    // filled search bar with magnifying-glass icon, pill radius, on top").
    searchBar: {
      ...f.fieldRow,
      paddingHorizontal: t.spacing.md,
      marginBottom: t.spacing.xs,
    },
    searchInput: {
      ...f.field,
      ...f.fieldText,
      flex: 1,
      borderRadius: t.radius.pill,
      backgroundColor: t.color.roles.surfaceVariant,
      borderWidth: 0,
    },
    // likert
    likertRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      marginVertical: t.spacing.sm,
    },
    // columns
    columnsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    columnsCell: {
      flex: 1,
      margin: 4,
      minWidth: '40%',
    },
    columnsPackCell: {
      flex: 1,
      margin: 2,
      minWidth: '40%',
    },
    // quick (unchanged chrome — chip design, not a SelectionRow)
    quickRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
    },
    quickChip: {
      paddingVertical: t.spacing.xs,
      paddingHorizontal: t.spacing.md,
      marginHorizontal: t.spacing.xs,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.color.roles.outline,
      backgroundColor: t.color.roles.surface,
    },
    quickChipSelected: {
      backgroundColor: t.color.roles.primary,
      borderColor: t.color.roles.primary,
    },
    quickChipLabel: {
      ...t.typography.bodyLarge,
      color: t.color.roles.onSurface,
    },
    quickChipLabelSelected: {
      color: t.color.roles.onPrimary,
    },
    // no-buttons — same 56dp row height as the default radio row, minus the
    // indicator, so the whole row remains the tap target with no visual gap.
    noButtonsRow: {
      minHeight: 56,
      justifyContent: 'center',
      paddingHorizontal: t.spacing.md,
    },
    noButtonsLabel: {
      ...t.typography.bodyLarge,
      color: t.color.roles.onSurface,
    },
    noButtonsLabelSelected: {
      color: t.color.roles.primary,
    },
    // label (ODK LabelWidget) — plain, non-interactive caption row
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: t.spacing.sm,
    },
    labelText: {
      ...t.typography.bodyLarge,
      color: t.color.roles.onSurface,
      textAlign: 'center',
    },
    // map (SelectOneFromMapWidget)
    mapOpenButton: {
      ...f.field,
    },
    mapOpenButtonText: {
      ...f.fieldText,
    },
    modalContent: {
      flex: 1,
      width: '100%',
    },
    map: {
      flex: 1,
      width: '100%',
    },
    mapPin: {
      width: 20,
      height: 20,
      backgroundColor: t.color.roles.error,
      borderRadius: 10,
    },
    mapPinSelected: {
      backgroundColor: t.color.roles.primary,
    },
    mapPinLabel: {
      ...t.typography.bodySmall,
      color: t.color.roles.onSurface,
      backgroundColor: t.color.roles.surface,
      paddingHorizontal: t.spacing.xs,
      borderRadius: t.radius.sm,
      marginTop: 2,
      textAlign: 'center',
    },
  });
}

export function SelectOneWidget({ nodeRef, store, appearance }: SelectOneWidgetProps) {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const choices = store.adapter.getChoices(nodeRef);
  const currentValue = store.adapter.resolveValue(nodeRef);
  const variant = resolveVariant('selectOne', 'select1', appearance);
  const isReadonly = nodeState?.readonly ?? false;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mapVisible, setMapVisible] = useState(false);
  const [imageMapMarkup, setImageMapMarkup] = useState<string | null>(null);

  const rawLabelImageUri = variant === 'image-map' ? store.adapter.getLabelMediaUri('image') : null;

  // Unconditional Hook Ordering (same invariant as the map/geo hooks above):
  // fetching + parsing only happens for image-map, but the effect itself is
  // declared for every variant.
  useEffect(() => {
    if (variant !== 'image-map' || !rawLabelImageUri || !store.mediaResolver) {
      setImageMapMarkup(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const uri = await store.mediaResolver!.resolve(rawLabelImageUri);
      if (!uri) return;
      const res = await fetch(uri);
      const text = await res.text();
      if (!cancelled) setImageMapMarkup(text);
    })();
    return () => {
      cancelled = true;
    };
  }, [variant, rawLabelImageUri, store]);

  const handleSelectFromMap = useCallback(
    (value: string) => {
      if (isReadonly) return;
      store.answerQuestion(nodeRef, value);
      setMapVisible(false);
    },
    [isReadonly, nodeRef, store],
  );

  // Hoisted above all variant branching (Unconditional Hook Ordering): this
  // widget re-renders as the SAME instance when only `appearance` changes,
  // so hook count/order must stay invariant across variants.
  const filtered = useMemo(() => {
    if (!query.trim()) return choices;
    const q = query.toLowerCase();
    return choices.filter(
      (c) =>
        (c.label ?? c.value).toLowerCase().includes(q) ||
        c.value.toLowerCase().includes(q),
    );
  }, [choices, query]);

  function handleSelect(value: string) {
    if (isReadonly) return;
    store.answerQuestion(nodeRef, value);
    setSheetOpen(false);
  }

  if (variant === 'minimal') {
    const selected = choices.find((c) => c.value === currentValue);
    return (
      <View style={styles.container}>
        <Pressable
          testID="select-one-dropdown-trigger"
          style={styles.dropdownTrigger}
          onPress={() => !isReadonly && setSheetOpen(true)}
          accessible={!isReadonly}
        >
          <Text style={styles.dropdownTriggerText}>
            {stripOdkMarkdown(selected?.label ?? selected?.value ?? 'Select…')}
          </Text>
        </Pressable>
        <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} testID="select-one-sheet">
          {choices.map((choice, index) => (
            <SelectionRow
              key={`${choice.value}__${index}`}
              testID={`select-one-option-${choice.value}`}
              control="radio"
              selected={choice.value === currentValue}
              label={choice.label ?? choice.value}
              onPress={() => handleSelect(choice.value)}
            />
          ))}
        </BottomSheet>
      </View>
    );
  }

  if (variant === 'autocomplete') {
    const selected = choices.find((c) => c.value === currentValue);
    return (
      <View style={styles.container}>
        <Pressable
          testID="select-one-dropdown-trigger"
          style={styles.dropdownTrigger}
          onPress={() => !isReadonly && setSheetOpen(true)}
          accessible={!isReadonly}
        >
          <Text style={styles.dropdownTriggerText}>
            {stripOdkMarkdown(selected?.label ?? selected?.value ?? 'Select…')}
          </Text>
        </Pressable>
        <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} testID="select-one-sheet">
          <View style={styles.searchBar}>
            <SearchIcon testID="select-one-search-icon" />
            <TextInput
              testID="select-one-minimal-autocomplete-search"
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              editable={!isReadonly}
              placeholder="Search…"
            />
          </View>
          {filtered.map((choice, index) => (
            <SelectionRow
              key={`${choice.value}__${index}`}
              testID={`select-one-option-${choice.value}`}
              control="radio"
              selected={choice.value === currentValue}
              label={choice.label ?? choice.value}
              onPress={() => handleSelect(choice.value)}
            />
          ))}
        </BottomSheet>
      </View>
    );
  }

  if (variant === 'likert') {
    return (
      <View style={styles.container}>
        <ScrollView
          testID="select-one-likert-container"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.likertRow}
        >
          {choices.map((choice, index) => (
            <SelectionRow
              key={`${choice.value}__${index}`}
              testID={`select-one-likert-option-${choice.value}`}
              control="radio"
              density="likert"
              selected={choice.value === currentValue}
              label={choice.label ?? choice.value}
              disabled={isReadonly}
              onPress={() => handleSelect(choice.value)}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (variant === 'columns') {
    return (
      <View style={styles.container}>
        <View testID="select-one-columns-list" style={styles.columnsWrap}>
          {choices.map((item, index) => (
            <View key={`${item.value}__${index}`} style={styles.columnsCell}>
              <SelectionRow
                testID={`select-one-columns-option-${item.value}`}
                control="radio"
                selected={item.value === currentValue}
                label={item.label ?? item.value}
                disabled={isReadonly}
                onPress={() => handleSelect(item.value)}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'columns-pack') {
    return (
      <View style={styles.container}>
        <View testID="select-one-columns-pack-list" style={styles.columnsWrap}>
          {choices.map((item, index) => (
            <View key={`${item.value}__${index}`} style={styles.columnsPackCell}>
              <SelectionRow
                testID={`select-one-columns-pack-option-${item.value}`}
                control="radio"
                density="pack"
                selected={item.value === currentValue}
                label={item.label ?? item.value}
                disabled={isReadonly}
                onPress={() => handleSelect(item.value)}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'compact') {
    return (
      <View style={styles.container}>
        <View testID="select-one-compact-list" style={styles.columnsWrap}>
          {choices.map((item, index) => (
            <View key={`${item.value}__${index}`} style={styles.columnsCell}>
              <SelectionRow
                testID={`select-one-compact-option-${item.value}`}
                control="radio"
                selected={item.value === currentValue}
                label={item.label ?? item.value}
                disabled={isReadonly}
                onPress={() => handleSelect(item.value)}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'no-buttons') {
    return (
      <View style={styles.container}>
        {choices.map((choice, index) => {
          const isSelected = choice.value === currentValue;
          return (
            <Pressable
              key={`${choice.value}__${index}`}
              testID={`select-one-no-buttons-option-${choice.value}`}
              style={styles.noButtonsRow}
              onPress={() => handleSelect(choice.value)}
              disabled={isReadonly}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: isReadonly }}
            >
              <MarkdownText
                value={choice.label ?? choice.value}
                baseStyle={[styles.noButtonsLabel, isSelected && styles.noButtonsLabelSelected]}
              />
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (variant === 'list' || variant === 'list-nolabel') {
    const showLabel = variant === 'list';
    return (
      <View style={styles.container}>
        <ScrollView
          testID="select-one-list-container"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.likertRow}
        >
          {choices.map((choice, index) => (
            <SelectionRow
              key={`${choice.value}__${index}`}
              testID={`select-one-list-option-${choice.value}`}
              control="radio"
              density="likert"
              selected={choice.value === currentValue}
              label={showLabel ? (choice.label ?? choice.value) : undefined}
              disabled={isReadonly}
              onPress={() => handleSelect(choice.value)}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (variant === 'label') {
    // ODK Collect's LabelWidget: caption-only, never produces an answer.
    return (
      <View style={styles.container}>
        <View testID="select-one-label-container" style={styles.labelRow}>
          {choices.map((choice, index) => (
            <MarkdownText
              key={`${choice.value}__${index}`}
              testID={`select-one-label-text-${choice.value}`}
              value={choice.label ?? choice.value}
              baseStyle={styles.labelText}
            />
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'columns-n') {
    const numColumns = parseColumnsN(appearance);
    return (
      <View style={styles.container}>
        <View testID="select-one-columns-n-list" style={styles.columnsWrap}>
          {choices.map((item, index) => (
            <View key={`${item.value}__${index}`} style={[styles.columnsCell, { minWidth: `${100 / numColumns}%` }]}>
              <SelectionRow
                testID={`select-one-columns-n-option-${item.value}`}
                control="radio"
                selected={item.value === currentValue}
                label={item.label ?? item.value}
                disabled={isReadonly}
                onPress={() => handleSelect(item.value)}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'quick') {
    return (
      <View style={styles.container}>
        <ScrollView
          testID="select-one-quick-container"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}
        >
          {choices.map((choice, index) => {
            const isSelected = choice.value === currentValue;
            return (
              <Pressable
                key={`${choice.value}__${index}`}
                testID={`select-one-quick-option-${choice.value}`}
                style={[styles.quickChip, isSelected && styles.quickChipSelected]}
                onPress={() => handleSelect(choice.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: isReadonly }}
              >
                <MarkdownText
                  value={choice.label ?? choice.value}
                  baseStyle={[styles.quickChipLabel, isSelected && styles.quickChipLabelSelected]}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  if (variant === 'map') {
    const geo = getGeoModule();
    const plottable = choices
      .map((choice: SelectChoice) => ({ choice, point: parseGeometry(choice.geometry) }))
      .filter((c): c is { choice: SelectChoice; point: { lat: number; lon: number } } => c.point !== null);

    // No map dep, or no choice carries geometry to plot — the variant has
    // nothing to render, so fall back to the default radio list below.
    if (geo && plottable.length > 0) {
      const { MapLibre } = geo;
      const selected = choices.find((c) => c.value === currentValue);
      const firstPoint = plottable[0]!.point;
      const mapCenter: [number, number] = [firstPoint.lon, firstPoint.lat];

      return (
        <View style={styles.container}>
          <Pressable
            testID="select-one-map-open-button"
            style={styles.mapOpenButton}
            onPress={() => !isReadonly && setMapVisible(true)}
            accessible={!isReadonly}
          >
            <Text style={styles.mapOpenButtonText}>
              {stripOdkMarkdown(selected?.label ?? selected?.value ?? 'Select…')}
            </Text>
          </Pressable>

          <AppModal
            visible={mapVisible}
            onRequestClose={() => setMapVisible(false)}
            testID="select-one-map-modal"
            fullScreen
            animationType="slide"
          >
            <View style={styles.modalContent}>
              <GeoMapChrome>
                <MapLibre.Map style={styles.map} mapStyle={OSM_STYLE} testID="select-one-map">
                  <MapLibre.Camera initialViewState={{ center: mapCenter, zoom: 12 }} />

                  <MapLibre.RasterSource
                    id="esri-satellite"
                    tiles={ESRI_TILES}
                    tileSize={256}
                    maxzoom={ESRI_MAX_ZOOM}
                  >
                    <MapLibre.Layer id="esri-satellite-layer" type="raster" layerIndex={1} />
                  </MapLibre.RasterSource>

                  {geo.SATELLITE_TILE_URI_TEMPLATE && (
                    <MapLibre.RasterSource
                      id="esri-offline"
                      tiles={[geo.SATELLITE_TILE_URI_TEMPLATE]}
                      tileSize={256}
                      maxzoom={ESRI_MAX_ZOOM}
                    >
                      <MapLibre.Layer id="esri-offline-layer" type="raster" layerIndex={2} />
                    </MapLibre.RasterSource>
                  )}

                  {plottable.map(({ choice, point }) => (
                    <MapLibre.Marker
                      key={choice.value}
                      id={`select-one-map-pin-${choice.value}`}
                      lngLat={[point.lon, point.lat]}
                      onPress={() => handleSelectFromMap(choice.value)}
                    >
                      <Pressable
                        testID={`select-one-map-pin-${choice.value}`}
                        onPress={() => handleSelectFromMap(choice.value)}
                      >
                        <View
                          style={[
                            styles.mapPin,
                            choice.value === currentValue && styles.mapPinSelected,
                          ]}
                        />
                        <Text style={styles.mapPinLabel}>{choice.label ?? choice.value}</Text>
                      </Pressable>
                    </MapLibre.Marker>
                  ))}
                </MapLibre.Map>
              </GeoMapChrome>
            </View>
          </AppModal>
        </View>
      );
    }
  }

  if (variant === 'image-map' && imageMapMarkup) {
    const svg = getSvgModule();
    if (svg) {
      const { viewBox, shapes } = parseImageMapShapes(imageMapMarkup);
      const matched = shapes
        .map((shape) => ({
          shape,
          choice: choices.find((c) => c.value.toLowerCase() === shape.id.toLowerCase()),
        }))
        .filter((m): m is { shape: ImageMapShape; choice: SelectChoice } => m.choice !== undefined);

      if (matched.length > 0) {
        return (
          <View style={styles.container}>
            <svg.Svg
              testID="select-one-image-map-svg"
              width="100%"
              height="100%"
              viewBox={viewBox ?? undefined}
            >
              {matched.map(({ shape, choice }) => {
                const Component = svg[IMAGE_MAP_TAG_COMPONENT[shape.tag]!];
                const selected = choice.value === currentValue;
                return (
                  <Component
                    key={shape.id}
                    {...shape.attrs}
                    // Selection is otherwise invisible — the shape's own SVG
                    // attrs never reflect the answered value, so the tapped
                    // region must be re-colored here to give any feedback.
                    fill={selected ? theme.color.roles.primary : shape.attrs['fill']}
                    fillOpacity={selected ? 0.5 : shape.attrs['fill-opacity']}
                    stroke={selected ? theme.color.roles.primary : shape.attrs['stroke']}
                    strokeWidth={selected ? 2 : shape.attrs['stroke-width']}
                    testID={`select-one-image-map-region-${choice.value}`}
                    accessibilityState={{ selected }}
                    onPress={() => handleSelect(choice.value)}
                  />
                );
              })}
            </svg.Svg>
          </View>
        );
      }
    }
  }

  // default (radio-style) — fallback for unrecognized variants
  return (
    <View style={styles.container}>
      {choices.map((choice, index) => (
        <SelectionRow
          key={`${choice.value}__${index}`}
          testID={`select-one-option-${choice.value}`}
          control="radio"
          selected={choice.value === currentValue}
          label={choice.label ?? choice.value}
          disabled={isReadonly}
          onPress={() => handleSelect(choice.value)}
        />
      ))}
    </View>
  );
}
