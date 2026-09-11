# @nuup/xform-native

[![npm version](https://img.shields.io/npm/v/@nuup/xform-native)](https://www.npmjs.com/package/@nuup/xform-native)
[![tests](https://img.shields.io/badge/tests-266%2B-brightgreen)]()
[![license](https://img.shields.io/npm/l/@nuup/xform-native)](https://github.com/nuupco/xform-native/blob/main/LICENSE)

React Native XForm renderer built on [`@nuup/ts-rosa`](https://github.com/nuupco/ts-rosa). Turn XForm/XML definitions into interactive mobile forms with 23 built-in widgets, optional peer-dependency gating, and a reactive screen-per-question navigator.

## Installation

The package isn't published to npm — install it straight from GitHub. `lib/` (the built output) is committed to the repo, so no build step runs on install.

```bash
npm install github:nuupco/xform-native#main @nuup/ts-rosa
```

Or pin to a specific commit/tag instead of `#main` for reproducible installs:

```bash
npm install github:nuupco/xform-native#<commit-or-tag> @nuup/ts-rosa
```

`package.json` entry, equivalent to the command above:

```json
"dependencies": {
  "@nuup/xform-native": "github:nuupco/xform-native#main",
  "@nuup/ts-rosa": "github:nuupco/ts-rosa#v0.5.2"
}
```

> `@nuup/ts-rosa` is the XForm engine (parser + session). You need it to create a `FormSession` from XML.

Then install the peer dependencies your form actually uses — see [Optional Peer Dependencies](#optional-peer-dependencies) below (`react` and `react-native` are always required; the rest are optional and gate specific widgets).

## Quick Start

```tsx
import { Form, FormSessionStore } from '@nuup/xform-native';
import { parseDocument, createFormSession } from '@nuup/ts-rosa';
import { DOMParser } from '@xmldom/xmldom';

const xml = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml">
  <h:head><model><instance><data><name/></data></instance></model></h:head>
  <h:body><input ref="/data/name"><label>Name</label></input></h:body>
</h:html>`;

const doc = new DOMParser().parseFromString(xml, 'text/xml');
const def = parseDocument(doc as unknown as Document);
const session = createFormSession(def);
const store = new FormSessionStore(session);

export default function App() {
  return <Form store={store} />;
}
```

## Widget Catalog

| Widget | DataType | Optional Deps | Description |
|--------|----------|---------------|-------------|
| `StringWidget` | `string` | — | Single-line text input |
| `IntWidget` | `int` | — | Integer numeric input |
| `DecimalWidget` | `decimal` | — | Decimal numeric input |
| `LongWidget` | `long` | — | Long text / multiline input |
| `BooleanWidget` | `boolean` | — | Yes/no toggle or checkbox |
| `DateWidget` | `date` | `@react-native-community/datetimepicker` (optional) | Manual TextInput entry, plus a native date picker button when the dep is installed |
| `TimeWidget` | `time` | — | Time picker |
| `DateTimeWidget` | `dateTime` | — | Date + time picker |
| `SelectOneWidget` | `selectOne` | — | Single-choice select |
| `SelectMultiWidget` | `selectMulti` | — | Multi-choice select |
| `NoteWidget` | `string` | — | Read-only informational text |
| `RangeWidget` | `int` / `decimal` | — | Slider for numeric ranges |
| `UncastWidget` | `uncast` | — | Fallback for uncast values |
| `UnsupportedWidget` | `unsupported` | — | Placeholder for unsupported types |
| `ImageWidget` | `binary` | `expo-image-picker` | Photo capture / library pick |
| `SignatureWidget` | `binary` | `react-native-svg` | Signature pad capture |
| `AudioWidget` | `binary` | `expo-av` | Audio recording / playback |
| `FileWidget` | `binary` | `expo-document-picker` | Generic file picker |
| `VideoWidget` | `binary` | `expo-camera`, `expo-av` | Video capture / playback |
| `GeoPointWidget` | `geopoint` | `@nuup/xform-native-geo` | Map-based point capture |
| `GeoShapeWidget` | `geoshape` | `@nuup/xform-native-geo` | Polygon drawing on map |
| `GeoTraceWidget` | `geotrace` | `@nuup/xform-native-geo` | Polyline drawing on map |
| `BarcodeWidget` | `binary` | `expo-camera` | Camera barcode scanner |

## Optional Peer Dependencies

Media, geo, and barcode widgets are gated behind optional peer dependencies. If a dependency is missing at runtime, the widget gracefully falls back to `UnsupportedWidget`.

`DateWidget` is different: its optional peer dependency only ADDS a native date picker button next to the existing manual TextInput. Without it, `DateWidget` behaves exactly as before (manual TextInput only) — it never falls back to `UnsupportedWidget`.

| Package | Widgets | Install |
|---------|---------|---------|
| `expo-image-picker` | ImageWidget | `npm install expo-image-picker` |
| `expo-av` | AudioWidget, VideoWidget | `npm install expo-av` |
| `expo-camera` | VideoWidget, BarcodeWidget | `npm install expo-camera` |
| `react-native-svg` | SignatureWidget | `npm install react-native-svg` |
| `expo-document-picker` | FileWidget | `npm install expo-document-picker` |
| `@maplibre/maplibre-react-native` | GeoPointWidget, GeoShapeWidget, GeoTraceWidget | `npm install @maplibre/maplibre-react-native` |
| `@react-native-community/datetimepicker` | DateWidget (`default` variant, adds native picker button) | `npm install @react-native-community/datetimepicker` |

### Installing `@nuup/xform-native-geo`

`@nuup/xform-native-geo` powers `GeoPointWidget`, `GeoShapeWidget`, and `GeoTraceWidget` (MapLibre + `expo-location`). It lives in this same repo, under `packages/xform-native-geo`, and isn't published to npm either — install it as a **git subdirectory dependency** (npm ≥ 6.8 supports this natively via the `?subdirectory=` query on a git URL):

```bash
npm install "github:nuupco/xform-native#main&subdirectory=packages/xform-native-geo"
```

`package.json` entry:

```json
"dependencies": {
  "@nuup/xform-native-geo": "github:nuupco/xform-native#main&subdirectory=packages/xform-native-geo"
}
```

It ships as plain TypeScript source (no build step needed). It also needs its own peer dependencies:

```bash
npm install @maplibre/maplibre-react-native expo-location expo-file-system
```

Without `@nuup/xform-native-geo` installed, the three geo widgets fall back to `UnsupportedWidget` — the rest of the library works fine.

## CLI

The package ships a `xform-native` bin (`bin/cli.js`) for widget discovery — it does **not** install anything itself, only tells you which file to copy and which optional peer dependency it needs. Once `@nuup/xform-native` is installed (see above), run it with `npx`:

```bash
npx xform-native list
```

```
Available widgets:
  StringWidget
  IntWidget
  DecimalWidget
  ...
  GeoPointWidget
  GeoShapeWidget
  GeoTraceWidget
  BarcodeWidget
```

```bash
npx xform-native add GeoPointWidget
```

```
To use GeoPointWidget, copy the source:
  cp node_modules/@nuup/xform-native/src/widgets/GeoPointWidget.tsx ./src/components/GeoPointWidget.tsx

Optional peer dependencies required:
  @nuup/xform-native-geo
```

Use `add` when you want to fork/customize a single widget instead of using the one exported by the library; for normal usage you just `import { GeoPointWidget } from '@nuup/xform-native'` and never touch the CLI.

## API Reference

### `Form`

Screen-per-question navigator. Subscribes to a `FormSessionStore` and renders the active question with validation surfaces.

```tsx
import { Form } from '@nuup/xform-native';
<Form store={store} />
```

`Form` also accepts four optional, additive props — each is frozen at mount
and, when omitted, produces exactly the same markup, testIDs, and copy as
before. See "Composition & Theming" below for details.

## Composition & Theming

Four opt-in seams let a consumer customize `Form` without forking it. All are
additive: omitting them preserves current behavior exactly.

### Widget registry

Override which widget component renders for a given
`(controlType, dataType, appearance)` triple, either via context or via the
`widgets` prop directly on `Form` (`widgets` wins ties over context entries).
Overrides wrap — never replace — the built-in `pickWidget` dispatch chain.

```tsx
import { Form, WidgetRegistryProvider } from '@nuup/xform-native';
import type { WidgetOverride, XFormWidgetProps } from '@nuup/xform-native';

function RankAutocompleteWidget({ nodeRef, store }: XFormWidgetProps) {
  // custom rendering
}

const overrides: WidgetOverride[] = [
  {
    match: { controlType: 'select1', appearance: 'autocomplete' },
    Widget: RankAutocompleteWidget,
  },
];

<WidgetRegistryProvider widgets={overrides}>
  <Form store={store} />
</WidgetRegistryProvider>;

// or, directly on Form:
<Form store={store} widgets={overrides} />;
```

### Theming

`ThemeProvider` supplies a theme override to `useTheme()` / `useThemedStyles()`
at mount time. Theming is **not reactive**: changing the `theme` prop on an
already-mounted subtree does not re-render existing widgets — remount to pick
up a new theme.

```tsx
import { ThemeProvider, useTheme, mergeTheme } from '@nuup/xform-native';

<ThemeProvider theme={{ color: { primary: '#1B5E20' } }}>
  <Form store={store} />
</ThemeProvider>;

// inside a custom widget:
function MyWidget() {
  const theme = useTheme(); // custom values, or `tokens` defaults with no provider
}
```

### Composition slots

`Form`'s `slots` prop lets you replace the navigation row, the
validation-error surface, or group/repeat layout with your own render props.
Every slot context includes `defaultElement` — the exact JSX `Form` would
have rendered — so you can wrap instead of reimplement.

```tsx
import { Form } from '@nuup/xform-native';
import type { FormSlots } from '@nuup/xform-native';

const slots: FormSlots = {
  renderNavigation: ({ onBack, onNext, defaultElement }) => (
    <MyNavBar onBack={onBack} onNext={onNext}>{defaultElement}</MyNavBar>
  ),
  renderError: ({ block, defaultElement }) => (
    <MyToast>{block.message}</MyToast>
  ),
};

<Form store={store} slots={slots} />;
```

### Validation hooks

`Form`'s `validators` prop lets you inject a validation callback per
`(controlType, dataType, appearance)`. It is a **plain callback**, not a
React hook, run inside `Form`'s existing `handleNext` logic. Use
`ctx.defaultValidate()` to compose over the built-in required/constraint
checks instead of reimplementing them.

```tsx
import { Form } from '@nuup/xform-native';
import type { ValidatorOverride } from '@nuup/xform-native';

const validators: ValidatorOverride[] = [
  {
    match: { controlType: 'note' },
    validate: (ctx) => {
      const defaultBlock = ctx.defaultValidate();
      if (defaultBlock) return defaultBlock;
      return null; // no additional custom rule
    },
  },
];

<Form store={store} validators={validators} />;
```

### `FormSessionStore`

Reactive wrapper around a `FormAdapter`. Implements the `useSyncExternalStore` contract.

```tsx
import { FormSessionStore } from '@nuup/xform-native';
const store = new FormSessionStore(session);
store.stepForward();
store.stepBackward();
store.answerQuestion(ref, value);
```

### `useFormSession`

Hook that re-renders when the store version bumps.

```tsx
import { useFormSession } from '@nuup/xform-native';
const snapshot = useFormSession(store); // { version: number }
```

### `createAdapter`

Builds a `FormAdapter` from a `FormSession`.

```tsx
import { createAdapter } from '@nuup/xform-native';
const adapter = createAdapter(session);
```

### `isWidgetAvailable`

Runtime check for widget availability based on data type and optional peer deps.

```tsx
import { isWidgetAvailable } from '@nuup/xform-native';
isWidgetAvailable('binary', { mediatype: 'image/*' });
```

### `pickWidget`

Dispatches `(dataType, controlType, appearance)` → `{ Widget, variant }`.

```tsx
import { pickWidget } from '@nuup/xform-native';
const { Widget, variant } = pickWidget('string', 'input', null);
```

### `tokens`

Default design tokens (colors, spacing, typography).

```tsx
import { tokens } from '@nuup/xform-native';
tokens.color.primary; // '#0D47A1'
```

## Contributing

```bash
git clone https://github.com/nuupco/xform-native.git
cd xform-native
npm install
npm test
npm run build
```

Please open issues and pull requests on [GitHub](https://github.com/nuupco/xform-native).

## License

MIT
