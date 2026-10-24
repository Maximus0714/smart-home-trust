# Device Markers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Those packages are absent; execute this small change inline with the checks below.

**Goal:** Replace tiny device dots with noticeable, accessible icon pins and selected labels.

**Architecture:** Give each device group a stable scene anchor name. A projection component updates an ordinary sibling DOM overlay during existing demand-rendered frames; no portal and no additional permanent animation loop. Four buttons and leader lines use a bounded screen layout that separates the entry cluster.

**Tech Stack:** Existing React, React Three Fiber, Three.js, lucide-react, CSS.

**Spec:** `docs/superpowers/specs/2026-10-24-device-marker-design.md`

## Global Constraints

- Preserve simulation state, house art, layout, inspector workflow, and WebGL fallback.
- All four pins remain visible, selected icon has a high-contrast ring and short name.
- 44px minimum hit targets; 32–36px visible pins.
- No continuous pulse or additional render loop; reduced motion skips selection animation.
- No new dependency. Use existing metadata styling and labelled native buttons outside the aria-hidden canvas.

## Task 1: Anchored icon overlay

**Files:** modify `src/house/HouseModel.tsx`, `src/house/HouseScene.tsx`; create `src/house/DeviceMarkers.tsx`, `src/house/device-markers.css`.

**Interfaces:** a shared `MarkerElements` registry maps device IDs to button and SVG line refs. `MarkerProjection({elements})` uses scene/camera/viewport to project `device-anchor-${id}` groups. `DeviceMarkers({elements,selectedDevice,onSelectDevice,reducedMotion})` renders the accessible buttons.

- [x] Name the existing DeviceTarget groups, retain the physical device geometry and mesh click targets, and remove obsolete tiny-dot geometry.
- [x] Add four native icon buttons with `aria-pressed`, descriptive accessible names, selected-only visible name, hover/focus styling, and 44px hit area. Animate only the icon face for 200ms when selected.
- [x] During existing scene frames, read anchor world positions after animated parents/camera updates, project to CSS pixels, offset entry pins, clamp to safe viewport bounds, separate overlapping pins, and connect displaced pins with leader lines. Position the selected label away from neighbours and viewport controls.
  ```ts
  anchor.updateWorldMatrix(true, false)
  anchor.getWorldPosition(point).project(camera)
  const x = (point.x * .5 + .5) * size.width
  const y = (-point.y * .5 + .5) * size.height
  ```
- [x] Mount the overlay as a sibling of Canvas within HouseScene. Empty overlay space uses `pointer-events:none`; buttons restore pointer events and stop drag propagation. Scene unmount disposes the DOM refs automatically.

## Task 2: Verify and document

- [x] Run `npm run typecheck` and `npm run build`. Presentation-only tests are browser interactions, not implementation-mirroring unit tests.
- [x] Inspect desktop1440/phone390 normal viewport screenshots after actual scene readiness. Verify four noticeable pins, entry separation, selected-label placement, keyboard selection/focus, room focus, orbit, zoom, moving door, and roof.
- [x] Test reduced motion and route-away/back lifecycle. Check console errors, accessibility, and overflow in one batched round; fix observed issues and confirm.
- [x] Update design/verification notes, mark design approved/implemented, and commit the scoped change. Keep the pending Ghost Access expansion separate.

