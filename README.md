# Smart Home Trust

A local frontend demonstration of three separate trust decisions in a smart home: **ALIBI** checks device claims, **Ghost Access** checks control paths, and **Habit Guard** checks whose activity may teach routines.

## Run

Node.js 22.12 or newer is required; this project was verified with Node.js 24.

```powershell
npm install
npm run dev
```

Open the local address printed by Vite, normally [http://127.0.0.1:5173](http://127.0.0.1:5173).

```powershell
npm run typecheck
npm test
npm run build
npm run preview
```

The production build is written to `dist/`. The preview command serves that build locally, normally on port 4173. No hosting account or external service is required.

## Explore

- **Overview:** rotate the furnished house, focus a room, use the zoom/reset controls, toggle the roof, and select any of four devices. The device chooser also works without using the canvas. Inspect device opens controls and evidence; recent activity opens on demand.
- **ALIBI:** extend or retract the bolt, move the simulated door independently, and inspect accepted/rejected witness messages. A supported bolt claim does not establish door closure or overall physical security.
- **Ghost Access:** remove a direct guest grant, show that the separate guest-attributed integration still controls the light, then remove the guest completely. Save and rotate a simulated credential to demonstrate denial of its old copy.
- **Habit Guard:** compare the same seven-day history under approval-only and source-filtered policies. Change teaching permission or source exclusion, inspect provenance, and approve/pause/resume routines. Baseline routines operate an isolated sandbox light; only Habit Guard routines operate the visible house.
- **Demo Lab:** run guided honest, false-report, replay, delayed, unavailable-witness, door-open, access-removal, and learning scenarios, or change inputs freely. Running a preset replaces the current local run.

The demo clock uses **Asia/Kolkata**. It runs only while the page is visible, can be paused in the top bar, and can be advanced in Demo Lab. ALIBI allows 2 seconds of settling, a further 1-second observation deadline, and a 5-second current-result lifetime. Advance 3 seconds after a lock preset to inspect its result, then another 10 seconds to see it become unverified. Historical evidence remains available.

Approved daily-light routines run at the next future occurrence of their 30-minute bucket. An affected routine marked Needs review retains its enabled/paused state until you explicitly act. Automated execution never trains either learner.

## Local state and reset

The simulation is saved in this browser's local storage under `smart-home-trust.simulation.v1`. A refresh restores the recorded clock and pending events without inventing background actions. An invalid snapshot starts a clean run with a recovery notice. If storage is unavailable, the current session still works.

**Reset demo** restores the initial devices, grants, seven-day sample history, routine approvals, and scheduled events. The sidebar reset asks for confirmation. Project files are not modified. Use a separate browser profile when you want an independent demo run.

The initial home is physically quiet. Its sample learning dataset contains seven owner evening actions and seven unapproved integration night actions so the comparison is available immediately. These are illustrative simulator inputs, not measured household data.

## What this demonstrates

This is entirely a **browser simulation**. Devices, identities, credentials, witness independence, access policies, and routine controls are represented locally. There is no backend, real device connection, real authentication, secure credential boundary, vendor integration, or deployment. The UI does not establish physical security or the server-side enforcement guarantees proposed in `plan.md`.

The verifier compares a claim only with qualified observations; it does not read the simulated physical home or a scenario's expected verdict. The simulator generates those observations from independent message inputs. The shared command adapter applies the same simulated access policy to resident and laboratory commands.

## Rendering and accessibility

The house is original procedural geometry with locally served fonts and no external model, texture, or HDRI download. React Three Fiber is loaded separately from the main UI. The measured initial scene is approximately **186 draw calls and 50,030 triangles** per rendered frame; it renders on demand and pauses when hidden or offscreen. DPR is capped at 1.5 on desktop and 1.2 on phones. These counts describe this scene, not a measured phone frame-rate guarantee.

The initial production build's house chunk is approximately **927 kB minified / 248 kB gzip**; the main application chunk is approximately 301 kB / 92 kB gzip. Exact filenames and sizes change between builds.

Keyboard-accessible DOM controls cover all device actions. A labelled home-plan alternative is shown if WebGL fails, with a reload action to retry the 3D view. Reduced motion removes transition choreography; a static usable frame remains. Small metadata uses a genuine serif italic in sentence case without tracking, following the approved ouu-shiit label rule.

## Project map

- `src/sim/`: typed records, deterministic simulation, policy/verification/learning, persistence, and focused tests.
- `src/house/`: furnished WebGL model and camera/lifecycle controls.
- `src/views/`: Overview and the four focused module workspaces.
- `src/components/`: shared controls, inspector, fallback, and activity.
- `docs/superpowers/`: approved design and implementation plan.
- `docs/verification.md`: validation evidence and limitations.

The `.superpowers/` directory contains throwaway design mockups and is ignored by Git. It is not required to run the app.

IBM Plex Sans and Libre Baskerville are provided by Fontsource under their supplied open font licenses. Copies are included in `public/licenses/` and in the production build.
