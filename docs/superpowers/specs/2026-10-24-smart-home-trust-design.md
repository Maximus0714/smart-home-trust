# Smart Home Trust — frontend demonstration design

Status: approved by the user on 24 October 2026; implemented and verified locally.

## Intent

Build a local, polished browser demonstration of the smart-home trust concept in plan.md. Its centerpiece is a furnished, interactive 3D house connected to a coherent simulation. Judges can explore normal device actions, observe contradictory reports, inspect lingering access, and compare learning proposals. Explain the separate decisions of authorization, claim verification, and teaching eligibility.

The user chose a frontend demonstration rather than a backend implementation. Every control, credential, sensor, access decision, and learning result in this version is simulated in the browser. This demonstrates application behaviour; it does not enforce security on actual devices or establish the backend controls in plan.md.

## Confirmed decisions

- Application name: Smart Home Trust.
- Stack: React, TypeScript, Vite, React Three Fiber.
- Local development plus a production build, without deployment.
- Desktop first, with phone layouts retaining essential controls and a house viewer.
- Furnished single-storey cutaway house, roof toggle, orbit and zoom, room selection, device selection, and device controls/evidence.
- Door position, bolt position, and light state animate independently of reported device claims.
- Sidebar destinations: Overview, ALIBI, Ghost Access, Habit Guard, Demo Lab.
- Overview carries the main house, compact module summaries, and shared activity history.
- Separate Demo Lab supports guided presets and free experimentation.
- Browser-local persistence and Reset demo.
- User delegated visual design decisions, then requested a centered room selector and a less crowded, easier-to-use layout.
- Retain the latest sidebar mockup arrangement. Do not replace it with the proposed top navigation and bottom dock.

## Goals, non-goals, and anti-goals

### Goals

- Make the house a useful way to discover and operate the demo.
- Keep the initial screen simple and reveal detailed evidence when requested.
- Use one consistent state model across the house, all views, and event history.
- Let a judge run repeatable scenarios and change their inputs.
- Preserve the domain distinctions and honest outcome language in plan.md.
- Deliver working controls, responsive layout, accessible alternatives, and a reproducible local build.

### Non-goals

No real devices, backend service, real authentication, server-side authorization, secure credential storage, actual socket/session revocation, vendor integrations, cloud hosting, photorealistic asset pipeline, complex permission graph, advanced machine learning, multiple floors, custom home editor, or additional simulated device types.

### Anti-goals

Do not imply the frontend protects a physical home. Do not display an invented security score, fabricated performance results, or a supported verdict as “home secure.” Do not make ordinary sensor absence proof of an attack. Do not make the dashboard a dense collection of always-open panels. Do not treat the rough CSS model as accepted final artwork.

## Approaches

### Chosen: React + TypeScript + Vite + React Three Fiber

The user selected this approach after comparison with plain TypeScript and Three.js. Shared application state can drive both familiar DOM controls and 3D objects. Vite suits local-only frontend delivery. Trade-off: the 3D runtime is substantial and requires lazy loading, bounded rendering, and a fallback.

### Considered: plain TypeScript + Three.js

Offers direct scene control and fewer framework abstractions, but requires more manual coordination between navigation, selection, persistence, controls, simulation, and the scene. Not selected.

### Scope alternative considered and rejected: backend simulation

An actual gateway/backend implementation would make server-side enforcement demonstrable but greatly expands scope. The user chose browser-simulated state. Adapt the plan's demonstration semantics without claiming its enforcement guarantees.

## Visual direction and layout

Visual reference: `.superpowers/brainstorm/1488-1792796794/content/house-dashboard-v3.html`. This is a throwaway preview, not source to continue as the application. Only its current arrangement is accepted; the house model remains explicitly provisional.

The builder's visual direction is an architectural workspace: pale blue-grey application frame, white work surface, muted warm wood and sage furnishings, readable dark text, and restrained semantic colour. Typography uses IBM Plex Sans; small descriptive metadata uses a real serif italic in sentence case, with no tracking, following ouu-shiit's label rule. Avoid gradients, decorative glass, security-themed terminal styling, and ambient visual effects.

The effect's job: a React Three Fiber house lets users locate devices, operate them, and compare simulated physical state with reported claims. This is a dedicated interactive work area, not a decorative dashboard background. Native scrolling remains the sole scroll owner.

### Overview

1. A quiet sidebar identifies the product and the five destinations.
2. A short title and plain-language instruction introduce the task. The primary scenario entry opens Demo Lab.
3. A centered room selector contains All rooms, Living room, Bedroom, and Entry.
4. A large, initially full-width house viewport includes accessible zoom, reset-view, and show/hide-roof controls. Do not crop the home at the default camera position.
5. A compact selected-device row identifies the device, its location, a short current state, and Inspect device. A device list/select provides access independent of the canvas.
6. Inspect device reveals an inline right-hand panel on wide screens. It becomes an inline section or drawer below the viewport on phones. It has a clear close action and returns focus to its opener. Selection alone updates the summary; it does not flood the screen with evidence.
7. Three compact trust-summary rows link to ALIBI, Ghost Access, and Habit Guard.
8. Recent activity is collapsed initially and opens a shared event list. Do not show a full audit table by default.

On phones, collapse the sidebar behind a labelled menu, fit the entire default house in its viewport, stack summary/details sections, and avoid horizontal page scrolling. Use comfortable tap targets and text sizes.

## House and interactions

Builder-selected rooms are a living room, kitchen area, bedroom, and entry. Only the four agreed devices are simulated: front-door lock, bolt-position witness, door-contact witness, and living-room light. Furnishings and other rooms are scenery, not extra controllable devices.

Build original scene geometry in code. Improve beyond the CSS preview with coherent dimensions, bevelled or rounded furniture where appropriate, aligned joinery, deliberate natural-looking light, distinguishable materials, soft bounded shadows, and a fitted camera. Keep assets local and avoid a runtime dependency on remote scene editors or environment presets.

- Orbit is bounded so the home remains upright and recoverable. Provide reset view.
- Zoom has sensible near/far limits and never loses the building.
- Room selection highlights that room and fits the camera to its bounds. All rooms restores the overview.
- Device selection highlights a device and updates the accessible DOM summary.
- Door opening and bolt extension remain independent properties. A bolt extended with the door open does not imply closure.
- Light commands change the simulated lamp and visible room illumination. Avoid full-scene flashing.
- Roof toggling reveals the plan; reduced motion uses immediate state changes.
- Mesh hit targets can be larger than visible device geometry. Markers must not overlap critical controls at default desktop/phone views.

The user has not approved a final model's artistic quality. Treat the finished model as a specific review requirement, not as something discharged by the layout mockup.

## State architecture

Use a central typed store or reducer plus pure domain functions. Keep physical simulation inputs, accepted device messages, derived verification results, grants, learning history, proposals, and UI selection separate. No verdict should be a hardcoded scenario flag.

Suggested records: Device, Principal, SimulatedCredential, Grant, Command, Observation, VerificationResult, LearningEvent, RoutineProposal, ApprovedRoutine, AuditEvent, ScheduledSimulationEvent, and persisted schema version. Stable IDs link an event's authorization, evidence, and learning decisions.

All simulated control attempts, including those in Demo Lab, go through the same browser command adapter. The adapter checks current simulated grant state and writes an allowed/denied event before changing simulated physical state. This is an architectural consistency rule, not an adversarial browser boundary.

### Demo clock and scheduling — builder decisions

Use one explicit simulation clock and a serializable queue of scheduled events. Default to a running clock while the visible page is active; offer pause, resume, and advance-time controls in Demo Lab. Pause while hidden and restore recorded simulated time on refresh; do not manufacture hours of background actions. Process due events in stable time/sequence order when time advances. All displayed times come from this clock.

Use Asia/Kolkata as the configured demo timezone. Demo Lab can replay seven local-calendar days immediately through ordered events; the user never waits seven real days. Persist clock time and queued event records rather than timer handles. Display simulation status clearly.

## ALIBI

Dedicated view: device claim, witness/contact readings, verdict, observation time, evidence expiry, and a concise chronological evidence list. Explain bolt extension separately from door closure.

Implement Pending, Supported, Contradicted, and Insufficient evidence. A displayed current verification becomes unverified after expiry or relevant physical-state change; preserve historical verdicts with their timestamps.

Port the plan's defaults into the browser simulator: two seconds of settling, a one-second fresh-observation deadline, and a five-second current-verdict lifetime. Commands receive unique IDs; witness requests receive command-bound single-use challenges. Simulated source identity, sequence, epoch, challenge, command linkage, receipt time, and witness availability decide message qualification. A pure verifier consumes qualified claims and observations; it does not inspect hidden physical truth or the scenario's expected result.

Demo modes: honest action, false report, replayed witness evidence, delayed witness evidence, unavailable witness, and bolt extended with door open. Invalid/stale evidence is rejected with a reason; after deadline, absence of qualified evidence becomes Insufficient evidence. A timely contradictory witness yields Contradicted. Ordinary failure does not label a source malicious.

Because a user controls the browser, simulated credentials and channel separation are explanatory representations, not secure identities or isolation.

## Ghost Access

Dedicated view: owner, one guest, and one integration; a readable access-path list; origin and beneficiary of each grant; resource/action scope; expiry/status; and removal controls.

Seed an owner-controlled light path, a direct guest light-control grant, and an independent owner-issued integration grant explicitly for that guest. Removing only the direct guest grant leaves the separate integration path usable. Full person removal disables the guest and guest-attributed paths while preserving unrelated owner authority.

A simulated credential can be reused through the shared command adapter to show allowed/denied outcomes before and after removal. Give visible access paths and their outcomes equal importance; a hidden account is not removal. Include a narrow shared-credential rotation example that invalidates the old simulated token.

Represent delegation ancestry and reject inactive ancestors/cycles through pure policy logic. Actual WebSocket sessions, remote enforcement, and command-dispatch race guarantees are outside this frontend scope; do not label them verified. Any session-like state shown is explicitly simulated.

## Habit Guard

Dedicated view: proposal comparison, contributing history, source counts, teaching permissions, approval state, and affected-routine review state.

Use the same seven-day history, timezone, 30-minute buckets, and three-distinct-day threshold for all comparisons. Duplicate events from one day count once. Seed an owner evening light pattern and an integration 2 a.m. pattern. Repeated integration commands can be authorized to act while remaining ineligible to teach.

The primary comparison is approval-only baseline versus source-filtered Habit Guard; both require owner approval and use identical proposal logic. No approvals means no activations in either. Optionally expose the plan's unrestricted auto-activation diagnostic in Demo Lab only, clearly isolated and labelled; this diagnostic is not required for the primary comparison.

Default eligible events are owner-confirmed manual actions. Integration/guest contributions need an explicit teaching grant. Automated executions do not retrain the learner. Rejected, pending, contradicted, or insufficiently evidenced events cannot contribute where qualified evidence is required. The light uses execution acknowledgement and source policy, with no claim of independent physical verification.

Changing teaching permission or excluding a source recomputes proposals deterministically from retained history. Affected approved routines become Needs review rather than silently disappearing or being silently disabled. Preserve provenance and keep approval distinct from activation.

### Approval and execution — builder decisions

The Habit Guard workspace exposes Approve and enable, Pause, Resume, and Review affected routine. Approval creates a named daily light routine at the contributing bucket's start time in the configured timezone. Its first scheduled execution is the next occurrence strictly after approval; it does not backfill missed days. Enabling records activation separately from execution. The simulation scheduler executes it through the shared command adapter, marking the event as automated so it cannot teach again. Pause cancels future pending executions for that routine; resume schedules its next future occurrence.

Only the main Habit Guard variant operates the house shown in Overview. The approval-only baseline has the same proposal and approval/enable workflow but runs in an explicitly labelled comparison sandbox with its own virtual light and routine state; its executions never alter the Overview house or train either learner. Both use the same clock, schedule rules, command-policy rules, and isolated copies of identical starting light state. Report proposal, activation, and execution counts separately by variant. The optional unrestricted diagnostic, if included, uses a third sandbox.

A Needs review flag does not silently change an existing routine's enabled/paused state. Display that state alongside the flag and offer explicit Pause or Approve revised evidence. Until the owner acts, an enabled routine continues on its recorded schedule. Source exclusion alone does not revoke an already-approved routine. Reset clears routines and queued executions in every variant. This is a narrow daily-light scheduler, not a general automation editor.

## Demo Lab

Keep scenario/attack controls out of the normal resident controls. Provide guided presets for all three modules and editable inputs for source, lock reporting, witness availability/delay/replay, access grant status, teaching permission, and history replay.

Presets change simulated inputs and events, never directly assign a desired verdict. Provide concise instructions, current step, expected phenomenon in plain language, observed result, reset scenario, and global Reset demo. Reset cancels scheduled events, restores initial devices/grants/history, clears prior local demo state, and starts a fresh run. Confirm global reset through a small standard confirmation because it discards the current local run.

Start the real app in a clean normal-home state. The mockup's illustrative simultaneous incidents are a layout fixture, not a required default. Scenario resets create deterministic starting states so demonstrations can be repeated.

## Persistence, fallback, and accessibility

Store a versioned state snapshot locally, including the simulation clock, queue, events, grants, and learning records. Recompute derived views after restore; validate the snapshot. An incompatible/corrupt/unavailable store falls back to a clean usable session with a clear recovery notice. Do not store real secrets or request credentials.

Lazy-load one WebGL canvas. Cap DPR around 1.5 on desktop and lower on phones. Render on demand outside active transitions; suspend work while offscreen/hidden. Keep geometry, materials, light/shadow counts, and per-frame work bounded; dispose resources and listeners on unmount.

Ship a static home composition/loading state and a usable DOM device list when WebGL is absent or fails. All meaningful device actions and evidence exist in DOM controls. Honour reduced motion, keyboard navigation, focus return, semantic buttons, status text, and sufficient contrast. Colour accompanies text/icons and is never the sole state indicator.

## Acceptance and verification

- A clean install can run locally; TypeScript checks and the production build pass.
- Overview follows the accepted centered-selector, sidebar, full-width-house layout and hides detailed evidence/history by default.
- All five navigation destinations expose working views.
- Orbit, zoom, reset camera, room focus, roof, selection, door/bolt/light changes, inspector open/close, and fallback controls work.
- House appearance is materially better than the CSS preview and is visually reviewed on desktop and phone.
- Honest, contradictory, replayed, delayed, missing-witness, expiry, and door-open cases produce the specified ALIBI states without feeding physical truth into the verifier.
- Direct removal preserves the separately issued integration path; full removal blocks affected simulated control attempts and preserves owner operation; old shared credentials fail after rotation.
- Identical history yields the same unfiltered proposals across approval policies; source filtering excludes the integration pattern and retains the owner pattern; activation requires approval.
- Local refresh restores a coherent run; reset removes the current run; scheduled work cannot leak across resets.
- Check critical pure domain behaviour with focused automated tests. Do not unit-test every presentational detail.
- Batch browser checks at desktop and phone sizes, including keyboard interactions, reduced motion, WebGL fallback, overflow, and key scenarios. Capture screenshots, fix findings, and confirm once unless new evidence requires further changes.

## Builder discretion and remaining review

The user delegated fine visual choices. The builder selects exact dimensions, furniture construction, camera/light values, component structure, icon set, navigation routing mechanism, and a lightweight state-management implementation within this design. These are not new user requirements. Clock behaviour, the initial clean-home state, and the narrow daily-routine execution/comparison rules above are proposed builder decisions for the user to check during design approval.

Use locally served fonts and assets in the real build. No externally supplied model is required. A small amount of procedural surface detail is acceptable if it helps the house rather than decorating the dashboard.

The remaining gate is approval of this written design and shared understanding. After approval, write the implementation plan before scaffolding or product code. Keep the throwaway mockup separate from the production app.
