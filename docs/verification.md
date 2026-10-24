# Verification — 24 October 2026

## Automated checks

- TypeScript strict checks pass: `npm run typecheck`.
- 27 focused Vitest tests pass: `npm test`.
- Production build passes: `npm run build`.
- Dependency installation reported zero known vulnerabilities at installation time.
- Impeccable's mechanical UI detector reported no findings in `src/` on its single completed pass.

The domain tests cover fresh/contradictory/stale/replayed/delayed/unavailable evidence; receipt, challenge, command, epoch, and sequence checks; expiry and history preservation; independent door/bolt state; access removal, credential rotation and ancestry; learning provenance and day deduplication; approval and isolated routine scheduling; reset; and snapshot recovery.

## Browser flows checked

Real Chrome sessions against the local app, with 1440px desktop and 390px phone viewports:

| Flow | Observed result |
| --- | --- |
| Honest bolt action | Pending becomes Supported after qualified fresh observation. |
| False lock report | Contradicted after a timely conflicting witness. |
| Replayed witness | Rejected; Insufficient evidence after deadline. |
| Delayed or unavailable witness | Insufficient evidence; ordinary absence is not labelled an attack. |
| Bolt extended with door open | Bolt claim Supported while door remains Open. |
| Five-second lifetime | Current badge becomes Unverified; historical verdict persists. |
| Direct guest removal | Guest request denied; independently issued integration request still allowed. |
| Shared-token rotation | Saved old token denied by the shared command adapter. |
| Full person removal | Guest-attributed integration denied; owner request still allowed. |
| Learning comparison | Baseline has owner evening + integration night proposals; default Habit Guard keeps owner evening only. |
| Approval and clock advance | Approved routines execute once at the next future daily time; baseline changes its sandbox, guard changes the house. |
| Device inspector | Opens on request; close restores focus to the opener. |
| 3D interactions | Room focus, orbit, zoom/reset, roof, and state changes operate. |
| Phone | All five views fit 390px without horizontal page overflow; navigation is modal and dismissible. |
| Reduced motion | Media emulation enabled; scene remains visible and actions remain usable. |
| WebGL context loss | Tested deliberate context-loss event; DOM home plan/device controls remain, reload recovers 3D. |
| Reset | Confirmation restores starting devices and clears active evidence/routines/queues. |

All five desktop views had zero axe violations after contrast corrections. Phone Overview also had zero violations. A text-over-canvas contrast check initially required manual confirmation; the hint and metadata now have opaque, contrasting backing. The DOM fallback was also inspected. Automated accessibility checks do not replace assistive-technology testing.

Scene readiness is signalled only after an actual frame; screenshots of loading/fallback were not counted as final 3D captures. Measured initial render: 186 draw calls, 50,030 triangles; idle render loop is on-demand. No sustained phone FPS claim is made.

## Evidence and limits

Local review screenshots are in `.impeccable/review/` (ignored by Git). Authoritative Overview captures are `desktop-normal.png` and `phone-normal.png`, taken at actual desktop/phone viewport sizes. The headless browser tool's full-page capture can distort or blank a demand-rendered WebGL framebuffer while it changes viewport/scroll; those `*-final.png` Overview full-page captures are not valid evidence. Focused workspaces use full-page DOM captures. The CSS preview is retained separately as a layout reference, not as implementation.

The app-screen inspector found no failures at desktop, tablet, and phone widths, with one warning about text under 13px on phones. Primary phone controls and trust rows were raised to 13px; remaining 11–12px text is subordinate metadata and captions. No font-loading, overflow, contrast, card-layout, gradient, or console-error finding was reported by that inspector.

The production build was served separately on port 4173. A real browser loaded the lazy WebGL scene, obtained a Supported lock result, toggled the light, and restored light/bolt state plus the paused clock after a full reload, without runtime errors.

This verification concerns the frontend's simulated behaviour. It does not test real devices, a server, secure process isolation, real access revocation, browser/OS compromise resistance, or vendor services.

## Independent review

The reviewer initially required corrections for the desktop house framing, fallback overlay overlap, and a redundant scenario eyebrow. After repair and valid viewport recaptures, the reviewer scored all three original fixes **resolved**, with disposition **ship** for that fix list and no regressions observed in the scored changes. External QUALITY BAR/image-comp comparison was not scored because none was selected. This is a scoped review result, not a claim of a full external-gallery certification.

The implementation was initially verified and saved locally. Repository publication is a separate user-requested step; see README for the repository and CI details. No website deployment is part of this build.
