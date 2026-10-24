# Device marker verification — 24 October 2026

Implemented the approved icon-pin refinement without changing domain/simulation records or the house art.

- All four devices have a 34px visible face and 44px native button target, with accessible names and pressed state.
- Selected device has a high-contrast ring and 12px real serif-italic name. Labels avoid all pin faces; selected-only dashed connectors preserve association when moved away from the entry cluster.
- Existing demand frames project moving device anchors to DOM positions. No extra RAF loop or continuous pulse. The overlay adds four native buttons, four physical leaders, anchor dots, and at most one visible label connector; four obsolete 3D marker meshes were removed.
- Mouse activation and keyboard Enter select the correct device in the existing picker. Selecting a pin does not issue commands or open the inspector.
- Desktop 1440px and phone 390px inspected in real Chrome with actual WebGL. Tested room focus, two zoom-out steps, entry zoom-in, orbit drag, roof, moving door, and route-away/back. Targets remain 44px after zoom; all four remount once and the page does not overflow horizontally.
- Reduced-motion emulation reports `animation-name: none` on the selected face. Normal selection animation is 200ms and ends at a static ring.
- Axe reported zero violations. It marked the pre-existing viewer metadata backing as an incomplete overlap/contrast check; visual review confirms an opaque contrasting backing. Pin and name text contrast checks passed.
- Mechanical design audit's advisory colours/radius were normalized to existing palette tokens and the 6px control radius. The selected label is intentionally the existing metadata role, at 12px.
- TypeScript and production build pass. No additional dependency or external assets. The lazy scene changed by approximately 4.1kB minified / 1.5kB gzip JS, plus 2.2kB / 0.84kB CSS.

Local review images are in `.impeccable/review/markers/`: `desktop-final.png`, `phone-final.png`, `phone-light-final.png`, and room/door/orbit/zoom interaction captures. These are ignored local evidence, not product assets.

Independent finish review: disposition **ship** within the approved marker-refinement scope, with no material fixes. The reviewer confirmed the four pins, selected ring/name, physical leaders, separated entry targets, native focus/selection semantics, and reduced-motion handling against the specification. No unrelated feature or external image-comp comparison was scored.
