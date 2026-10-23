# Smart Home Trust

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

User selected React, TypeScript, Vite, and React Three Fiber. Local development and a production build are required; hosting is outside this version.

## Users

Hackathon/ideathon judges exploring a simulated smart home, with a resident-facing dashboard as the primary interface. The judge demonstration context comes from plan.md.

## Product Purpose

Make three smart-home trust questions understandable through an interactive house: whether a device's claim has supporting evidence, who retains control, and whose actions can influence learned routines.

## Positioning

ALIBI handles claim verification, Ghost Access handles access paths and removal, and Habit Guard handles learning provenance. Authorization, evidence, and teaching eligibility remain separate decisions.

## Operating Context

Desktop-first local browser demonstration, with usable phone layouts. Normal dashboard operation is separate from Demo Lab. Guided scenarios and free experimentation are both confirmed. Browser-local state persists across refreshes; Reset demo restores initial state.

## Capabilities and Constraints

- Frontend demonstration with browser-simulated state, not a backend or actual security enforcement.
- Furnished single-storey 3D cutaway house with removable roof, rotation, zoom, room/device selection, and a selected-device control/evidence panel.
- Animate door movement, bolt position, and light changes independently of device reports and evidence verdicts.
- Overview plus ALIBI, Ghost Access, Habit Guard, and Demo Lab workspaces.
- Overview contains the main house, module summaries, and shared timeline.
- Confirmed layout after mockup review: retain the sidebar arrangement, center the room selector above a full-width house, show device details only on request, use compact trust-summary rows, and collapse recent activity by default. The proposed top-navigation replacement was rejected.
- The CSS house is an unapproved rough spatial preview. Final WebGL geometry, lighting, materials, and furnishing quality must improve upon it.
- plan.md supplies the domain semantics and narrow MVP: one lock, independent bolt-position witness, door contact, one light; owner, guest, and integration.
- Keyboard-accessible device controls must also exist outside the canvas.

## Brand Commitments

Application name: Smart Home Trust. Module names: ALIBI, Ghost Access, Habit Guard. User delegated visual direction to the builder using ouu-shiit and its companion design guidance.

## Evidence on Hand

plan.md contains the proposed threat model and demonstration scenarios. There is no existing implementation or supplied 3D asset. No measured security or performance results are available.

## Product Principles

- Keep reported state, simulated physical state, and evidence verdicts distinct.
- Make interactions change a coherent simulation and traceable event history.
- Present this build honestly as a frontend simulation.
- Keep the home useful through accessible controls when 3D is unavailable.

## Accessibility & Inclusion

Phone support is confirmed. Builder requirements: keyboard controls, visible focus, text and icon status cues, reduced motion, and a non-WebGL alternative.
