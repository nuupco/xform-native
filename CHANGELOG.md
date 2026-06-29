# Changelog

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
