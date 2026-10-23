# Smart Home Trust Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. Those packaged skills are not installed here; execute using the available collaboration tools, explicit ownership, and the verification gates below.

**Goal:** Build the approved local frontend simulation with a furnished WebGL house and five functioning workspaces.

**Architecture:** A pure typed simulation reducer is the single source of truth. React views dispatch commands and read derived evidence/access/learning results. One lazy React Three Fiber scene displays physical state and selection; all controls also exist in the DOM.

**Tech Stack:** React 19, TypeScript, Vite, Three.js, React Three Fiber 9, drei 10, lucide-react, Vitest. Verify compatible published versions before installation; Node 24 is available.

**Spec:** `docs/superpowers/specs/2026-10-24-smart-home-trust-design.md`

## Global Constraints

- Application name: Smart Home Trust.
- Local development plus a production build, without deployment.
- The frontend is a simulation, not real security enforcement.
- Keep the accepted sidebar arrangement, centered room selector, full-width house, and details on request.
- The rough CSS model is not final artwork. Use actual WebGL, materially improved geometry, furniture, lighting, and materials.
- Verification must not inspect hidden physical truth or hardcode scenario outcomes.
- Asia/Kolkata demo timezone; two-second settling, one-second observation deadline, five-second verification lifetime.
- Recent activity is collapsed initially. All meaningful actions must exist in accessible DOM controls.
- Persist versioned state; reset clears scheduled work and all comparison variants.

## Files and ownership

- `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`: tooling and local app entry.
- `src/sim/types.ts`: shared domain records/actions.
- `src/sim/engine.ts`: deterministic command policy, scheduling, qualified observation verification, source eligibility, routine execution, scenarios, and reset.
- `src/sim/persistence.ts`: versioned snapshot recovery and storage.
- `src/sim/engine.test.ts`: material domain invariants.
- `src/house/HouseScene.tsx`: lazy WebGL view and camera controls.
- `src/house/HouseModel.tsx`: furnished architectural geometry and interactive device geometry.
- `src/house/types.ts`: scene props independent of simulation implementation.
- `src/components/*`: shell, shared controls, device inspector, activity history, scene fallback.
- `src/views/*`: Overview, Alibi, Access, Habits, DemoLab workspaces.
- `src/App.tsx`, `src/main.tsx`, `src/styles.css`: composition, lifecycle, responsive visual system.
- `public/fonts/*`: locally served font files.
- `README.md`, `DESIGN.md`, `.impeccable/design.json`: run instructions, simulation limits, durable design tokens.

## Task 1: Simulation and reproducible scenarios

**Files:** create `src/sim/types.ts`, `engine.ts`, `persistence.ts`, `engine.test.ts`.

**Interfaces:** export `createInitialState(): SimState`, `simulationReducer(state: SimState, action: SimAction): SimState`, `getProposals(state: SimState, variant: 'baseline' | 'guard'): Proposal[]`, `canControl(state: SimState, principal: PrincipalId, credential?: string): { allowed: boolean; reason: string }`, `loadSimulation(): { state: SimState; notice?: string }`, `saveSimulation(state: SimState): boolean`. The simulation owner must publish exact action/state shapes before UI integration.

- [x] Write focused tests demonstrating a false report is contradicted, stale/replayed/missing evidence is insufficient after deadline, a current badge expires, and bolt extension with an open door does not imply closure. Example test structure:
  ```ts
  const s = simulationReducer(createInitialState(), { type: 'SCENARIO', scenario: 'false-report' });
  const result = simulationReducer(s, { type: 'ADVANCE', ms: 3000 });
  expect(result.verification.current?.verdict).toBe('contradicted');
  ```
- [x] Implement source/epoch/sequence/challenge/command/time qualification and pure claim-versus-observation verification. The exact exported state/action schema may refine the example above; keep UI consumers synchronized.
- [x] Test guest direct removal versus surviving integration, full removal preserving owner, old shared-token denial after rotation, and invalid delegation ancestry.
- [x] Implement a shared command adapter for resident and scenario controls, with explicit allowed/denied events.
- [x] Test same-day deduplication, three-day thresholds, source filtering with owner retention, no unapproved activation, no routine feedback into training, isolated baseline execution, and source exclusion retaining explicit routine enabled state.
- [x] Implement seven-day seeded history, teaching controls, daily-light routine scheduling, pause/resume/review, and independent baseline light state.
- [x] Implement versioned storage with structural checks and clear recovery on unavailable/corrupt state. Persist due events rather than timer handles.
- [x] Run `npm test -- --run src/sim/engine.test.ts` and record meaningful cases. Review public interfaces before connecting UI.

## Task 2: Furnished interactive house

**Files:** create `src/house/types.ts`, `HouseScene.tsx`, `HouseModel.tsx`.

**Interfaces:** `HouseSceneProps` contains `room: 'all'|'living'|'bedroom'|'entry'`, `selectedDevice: 'lock'|'bolt-witness'|'door-contact'|'light'`, `home: { doorOpen: boolean; boltExtended: boolean; lightOn: boolean }`, `roofVisible: boolean`, `onSelectDevice(id): void`, `onSelectRoom(room): void`, `viewCommand: { kind: 'reset'|'zoom-in'|'zoom-out'; serial: number }`, `reducedMotion: boolean`, and optional `onReady(): void`/`onError(): void`.

- [x] Build original single-storey geometry with open sight lines, aligned wall openings, full-size floor, window frames, warm timber, soft linens, rounded sofa/bed/table geometry, cabinetry, and simple plants. Use proper meshes/materials, not DOM boxes or a flat illustration.
- [x] Use a dedicated door pivot and independent visible bolt geometry. Drive both from physical state; animate user/state changes only.
- [x] Add meaningful light change in the living area and clickable device/witness targets. Keep selection markers restrained and matching DOM device names.
- [x] Fit the default and per-room cameras so no part of the home is cropped. Bound orbit/zoom, implement reset and roof toggle, and keep room changes recoverable.
- [x] Cap DPR, bound shadow maps and light counts, use on-demand frames, stop work hidden/offscreen, respect reduced motion, and dispose listeners/resources.
- [x] Expose errors to the parent fallback. Visually inspect the actual scene at desktop and phone widths.

## Task 3: App shell and Overview

**Files:** create tooling, entrypoints, `src/App.tsx`, `src/styles.css`, shared components, `src/views/Overview.tsx`.

**Consumes:** the simulation reducer and scene interfaces from Tasks 1–2. **Produces:** one accessible, persistent app shell that all workspaces share.

- [x] Create scripts `dev`, `build`, `preview`, `test`, `typecheck`; install only approved runtime/testing dependencies and commit a lockfile.
- [x] Create a quiet blue-grey sidebar frame and white sheet, real local IBM Plex Sans/serif italic fonts, consistent lucide icons, and keyboard-visible focus.
- [x] Connect the reducer to one visible-tab simulation tick; auto-pause hidden, persist changes, show storage notices, and use one configured timezone formatter.
- [x] Implement five sidebar destinations and phone menu with active state and focus-safe dismissal.
- [x] Implement centered room tabs, full-width lazy scene, roof/view controls, DOM device chooser, compact selected-device row, optional inspector, compact trust-summary rows, and collapsed activity.
- [x] Use this concrete interaction contract:
  ```tsx
  <button aria-expanded={inspecting} aria-controls="device-inspector"
    onClick={() => setInspecting(v => !v)}>Inspect device</button>
  ```
  Return focus to the opener when details close; on phones bring newly opened details into view without forced motion.
- [x] Provide loading and no-WebGL home compositions with the same DOM controls. Verify viewport fitting and no horizontal overflow at 390px.

## Task 4: Evidence, access, learning and laboratory views

**Files:** create `src/views/Alibi.tsx`, `Access.tsx`, `Habits.tsx`, `DemoLab.tsx`, and reusable evidence/activity components.

**Consumes:** domain state/actions; no view computes or writes its own verdict or permission result.

- [x] ALIBI: show claim, observation, verdict/expiry, door state separately, current controls, qualified/rejected evidence reasons, and historical events. Text describes a claim at a time, not overall security.
- [x] Ghost Access: list explicit paths, beneficiaries, status, resources/actions and ancestry; implement direct removal, full removal, per-path attempts, shared-token rotation, and continued owner operation.
- [x] Habit Guard: show baseline and filtered proposal sets with source counts, contributing days, teaching grants, source exclusion, approve/enable/pause/resume/review, and isolated baseline light state/counters.
- [x] Demo Lab: guided presets with observed outcomes, freely editable message/source/timing inputs, running/pause/advance controls, deterministic scenario reset, and confirmed global reset. Resident controls do not expose attack switches.
- [x] Verify user-visible counts derive from state, ordinary failures do not imply attacks, and all demonstration data is clearly identified.

## Task 5: Integrated verification and delivery

**Files:** update tests, `README.md`, `DESIGN.md`, `.impeccable/design.json`, and this checklist.

- [x] Run `npm run typecheck`, `npm test -- --run`, and `npm run build`; repair observed failures before browser QA.
- [x] Read the Sites portable-preview reference; serve the local app and show it in the Codex browser panel.
- [x] Batch desktop/phone browser checks for all workspaces, inspector and menu focus, room/roof/camera controls, lock/light changes, attack outcomes, source-filtered proposals, approval/scheduled execution, reload/reset, reduced motion, and fallback. Capture actual WebGL screenshots after scene readiness.
- [x] Run the design detector once over finished UI, audit accessibility, and inspect desktop/phone screenshots. Fix the batched findings and confirm the changed behaviour.
- [x] Have an independent reviewer inspect screenshots against the approved layout and model-quality requirement. Address material gaps and recapture changed views.
- [x] Document commands, local preview URL, limits, storage/reset, timing, seeded data, and validated scenarios. Preserve plan.md as source context.
- [x] Save durable design tokens and update completed checklist items. Commit design, plan, implementation and verification documentation if a local repository is initialized. Do not push or publish.

## Plan self-review

The house and simulation can be developed independently against explicit interfaces; the UI owner integrates them. Tasks cover every spec section, including isolated routine scheduling and the provisional-model quality requirement. All unknown fine implementation details are delegated in the approved spec. Additional planning/execution skills referenced by the generic header are absent from the installed catalog; the available tool workflow and this plan supply the execution gates without another user decision.

