# Changelog

## 1.2.1

Bumps `@nuup/ts-rosa` to `v0.5.3`, which fixes `evaluator.validate()` to
correctly expand every repeat instance internally (nuupco/ts-rosa#3) —
`required`, `rank`, and now also `constraint` are all reliably checked across
every instance, closing the limitation noted in 1.2.0. `validateAll()` and
`isComplete()` were adjusted accordingly (no public API change).

## 1.2.0

Full-form validation sweep on `FormAdapter`:

- `validateAll(): readonly ValidationFailure[]` — checks required/constraint/
  rank across EVERY question, including every concrete instance of every
  repeat (not just the current step or the default/first repeat instance).
  Does not move the walker's cursor.
- `isComplete(): boolean` — convenience wrapper, `true` iff `validateAll()`
  finds no failures.
- `ValidationFailure` — `{ ref, type: 'required' | 'constraint' | 'rank', message }`.

Known limitation (upstream, in `@nuup/ts-rosa`): a `constraint` on a field
inside a repeat can only be reliably validated on that repeat's first
instance — `evaluator.validate()`'s constraint lookup keys on the literal,
unbracketed bind nodeset string, so any per-instance validation call misses
it. `required` and `rank` are correctly checked across every instance.

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
