# Clear device-selection markers

Status: approved by the user on 24 October 2026; implemented with browser verification. Small visual and interaction refinement to the existing house viewer.

## Intent

Make connected devices easy to discover and the selected device obvious at a glance. The current world-space spheres are tiny (selected radius 0.075, other radius 0.045), can be obscured by scene geometry, and have no visible device names. Keep the approved house, dashboard arrangement, simulation state, and device inspector workflow.

## Approaches

- **Selected by the user:** camera-facing device-icon pins for all four devices, with a high-contrast ring and short name label on the selected device. Larger interaction targets and restrained feedback improve discovery without naming every object at once.
- **Considered:** larger outlined dots with a selected label. Simpler but less identifiable at a glance.
- **Considered:** permanent name labels on every device. More explicit but crowds the three neighbouring entry devices and the phone viewport.

## Confirmed behaviour

- Show visible pins for the front-door lock, bolt witness, door contact, and living-room light.
- Give each pin a recognisable icon, opaque contrasting surface, and border; use the existing teal for selection rather than assigning a security verdict through colour.
- The selected pin has a stronger high-contrast ring and a short adjacent device-name label. Retain the device chooser and Inspect device control below the model.
- Keep pins facing the viewer and approximately constant in screen size while orbiting/zooming. Builder sizing target: a 32–36px visible icon with a minimum 44px click/tap area.
- Space the three entry markers when their projected locations would overlap; connect displaced pins to their physical device with a subtle leader. Keep labels within the viewer and clear of room tabs, zoom/roof controls, and other pins.
- Clicking or keyboard-activating a pin selects that device and updates the existing selected-device row. It does not issue a device command or automatically open the inspector.
- Selection expands the pin briefly, approximately 180–220ms, then settles into a static selected ring/label. No continuous pulse, ambient motion, or permanent render loop. Reduced motion shows the final state immediately.
- Preserve a clear device-location connection as the camera moves. Pin visibility denotes a connected device, not proof of line of sight or a security result; the roof toggle does not disable selection.

## Constraints and non-goals

Use the existing React/Three.js scene and icons; no new effect library or external asset. Prefer an ordinary DOM overlay projected from scene anchors, avoiding the previous drei Html portal lifecycle problem. Overlay container must not block orbit gestures; only actual pin buttons receive pointer events. Recompute positions on camera/viewport/animated-device changes, clean up subscriptions, and keep offscreen/hidden rendering bounded.

Device labels follow the established serif-italic, sentence-case, untracked metadata treatment, with enough size/contrast to read. Icon buttons have meaningful accessible names, visible keyboard focus, and selected-state semantics. Keep the DOM chooser/fallback working when WebGL is unavailable.

Do not alter simulated access, evidence, routines, saved state, house art, or the dashboard arrangement. The separate Ghost Access expansion remains a separate design awaiting approval.

## Verification

Inspect the real viewer on desktop and 390px phone: all four markers noticeable, entry pins distinguishable, selected name readable, orbit/zoom and roof controls usable, no overlay clipping, correct device selected by mouse/touch/keyboard, and reduced-motion behaviour static. Check initial view, room focus, zoom limits, and door movement. Run TypeScript and production build checks; existing domain tests need no new presentation-only unit tests.

## Builder discretion

Exact icon glyphs, pin spacing/placement, leader geometry, restrained easing, and source-file decomposition are builder choices within these requirements. The pending gate is approval of this short design; implementation planning follows approval.
