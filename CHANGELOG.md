# Changelog

## 1.1.0

Additive-only (shadcn-lite): four opt-in composition seams for `Form`, all
frozen at mount, all provider-less/prop-less by default to preserve current
behavior, testIDs, and copy exactly.

- Widget registry: `WidgetRegistryProvider` / `<Form widgets>` — inject widget
  overrides keyed by `(controlType, dataType, appearance)`, wrapping (not
  replacing) `pickWidget`'s existing precedence chain.
- Theming: `ThemeProvider` / `useTheme` / `useThemedStyles` — mount-time-only
  theme override over `tokens.ts` (not reactive by design).
- Composition slots: `Form`'s `slots` prop (`renderNavigation`, `renderError`,
  `renderGroup`) — render-prop overrides for nav/error/group-repeat layout.
- Validation hooks: `Form`'s `validators` prop / `ValidationRegistryProvider`
  — inject a validation callback per `(controlType, dataType, appearance)`,
  composing over `defaultAdvanceValidator` via `ctx.defaultValidate()`.

## 1.0.0

- Initial release
- 23 widgets: String, Int, Decimal, Long, Boolean, Date, Time, DateTime, SelectOne, SelectMulti, Note, Range, Uncast, Unsupported, Image, Signature, Audio, File, Video, GeoPoint, GeoShape, GeoTrace, Barcode
- Form component with screen-per-question navigation
- Adapter layer (`createAdapter`) for XForm session integration
- Reactive store (`FormSessionStore`, `useFormSession`)
- Design tokens system
- Optional peer-dependency gating for media, geo, and barcode widgets
- CLI stub (`list`, `add` commands)
- Widget registry (`registry.json`)
