# Ghost Access — repeatable access lifecycle

Status: proposed for approval after the user's seven interview decisions.

## Intent and scope

Make Ghost Access a reusable simulation workspace. The user must be able to add people, grant and revoke permissions, remove people, and add them back without resetting the home or its timeline. Implement this in the shared simulation so command authorization, the 3D home's physical state, learning provenance, audit history, and local persistence remain consistent.

This is an expansion of the existing frontend prototype, not a backend or real security boundary. Retain the existing application name, architectural visual direction, sidebar, five workspaces, and four simulated devices. No new GPU effect is warranted for access-management forms. Reuse the existing typography, semantic state colours, and serif-italic sentence-case metadata rule.

## Confirmed user decisions

1. Support multiple named simulated guests and integrations, each manageable independently.
2. Configure grants for the existing lock or light, permitted actions, optional expiry, and direct or integration paths. Witness sensors remain read-only.
3. Re-added people receive fresh credentials and explicitly selected new grants. Their old credentials remain invalid. Preserve the timeline.
4. Each guest has separate integration identities; do not share a single integration identity across guests.
5. Allow constrained delegation: the issuer must hold the permissions, and children cannot exceed the parent's actions or lifetime. Revoking a parent blocks descendants.
6. Full removal revokes teaching permission, retains history, and marks affected approved routines for review while preserving each routine's explicit enabled/paused state. Re-added people start without teaching permission.
7. Each re-grant creates a new grant record. Retain revoked records and do not revive old delegated paths.

## Goals, non-goals, and anti-goals

Goals: repeatable add/grant/revoke/remove/re-add cycles; inspectable authorization reasons; precise separation of access and teaching; retained historical evidence; preserved valid existing runs; clean controls on desktop and phone.

Non-goals: a new visual arrangement for the application, additional devices, writable witness sensors, a general policy language, real invitations/accounts, external integrations, backend enforcement, or a shared integration identity serving multiple guests.

Anti-goals: requiring Reset demo to add access back; reactivating old credentials or descendant grants as a side effect; silently granting teaching permission; erasing prior results; granting broader delegated rights than the issuer holds; claiming coverage of every conceivable security threat.

## Approaches

### Selected: new grant records with retained history

Every new grant/re-grant receives a new ID. Revoked paths stay revoked, and their descendants remain linked to those historical paths. This makes repeated experiments and parent-revocation consequences explicit. The user selected this approach.

### Considered: reusable permission rows with versions

One row would hold successive grant versions and hide earlier cycles in version history. It is more compact for long runs, but makes separate access cycles less visible. Not selected.

Both approaches could use fresh credentials on re-addition; the chosen approach also makes the access-path history directly readable.

## Current implementation and affected boundaries

Current `PrincipalId` and teaching/source-count maps assume owner, guest, and integration. Full removal disables the guest and its credential, but there is no add/reactivate action. Existing `SET_GRANT` cannot reactivate a disabled principal. Ghost Access offers revoke/remove controls; Demo Lab can toggle grant state, but cannot restore removed identities. Persistence v1 requires exactly three fixed identities.

Update the domain types, authorization/learning engine, saved-state validation/migration, focused tests, Ghost Access view, Demo Lab controls, Habit Guard source selectors, and any Overview/inspector summaries that assume the fixed guest. Keep scene geometry and ALIBI message qualification unchanged. ALIBI's command authorization must use the new device/action grant policy.

## Identity and credential lifecycle

Retain one trusted owner/admin. Add dynamic guest and integration identities with stable IDs, display names, kind, active state, and a lifecycle generation. History references stable IDs even after removal.

Builder decisions for review:

- A guest can have several integrations; each integration is permanently linked to exactly one guest. Create an integration only for an active guest.
- Reject blank names, enforce a reasonable 80-character maximum, and reject duplicate names within an identity kind. Direct the user to Re-add when a matching removed identity already exists.
- Add guest/integration creates an active identity and a fresh simulated credential, with no device grants and no teaching permission. The owner grants access explicitly.
- Full guest removal also removes its linked integration identities. Removing an integration separately leaves the guest and other integrations active.
- Re-add keeps the person's stable ID, advances its lifecycle generation, issues a new credential, and starts with no new grants or teaching permission. Linked integrations are not automatically restored; re-add them separately after their guest is active.
- Removed identities remain visible and have an obvious Re-add action. If a linked guest is removed, explain why its integration cannot yet be re-added.
- Owner removal and writable witness permissions remain outside the supported model.

Keep revoked/rotated credentials as inactive simulation records for explanation and replay. An explicit token must match the requested identity, current generation, and an active credential. A missing explicit token in the ordinary test controls uses that identity's current active credential. No stale token becomes valid because its person or permissions were later added back.

Rotation issues a fresh credential for the selected identity and invalidates its previous active credential. Separate integration identities ensure that rotating/removing one guest's integration does not affect another guest's integration.

## Grant records and authorization

Each grant records its ID, issuer, recipient, beneficiary, participant lifecycle generations, one resource, allowed actions, creation/expiry times, optional delegation parent, revocation state/time, and origin label.

Resources/actions:

| Resource | Actions |
| --- | --- |
| Front-door lock | Extend bolt, retract bolt |
| Living-room light | Turn on, turn off |

For a direct guest grant, recipient and beneficiary are the guest. For an integration grant, recipient is that integration and beneficiary is its linked guest. Owner-issued integration access remains independent of the guest's direct grant unless an explicit delegation parent is chosen.

The owner can issue root grants. A guest or integration may issue a delegated grant only through one selected currently effective parent that it holds. Require identical resource, a nonempty subset of the parent's actions, and an expiry no later than the parent's. A finite parent cannot produce an indefinite child. Reject missing/inactive/expired parents, removed or old-generation participants, self/ancestral delegation cycles, unsupported actions, and expiries at or before the current demo time. Show validation reasons rather than silently broadening or trimming permissions.

At every command attempt, map the requested device/value to its exact action and validate the credential and the full grant ancestry. A live grant is insufficient when any ancestor is revoked/expired or a participant's generation has changed. Return a concrete allowed/denied reason and the effective path used. The owner retains initial authority over both devices.

Revoking a path immediately blocks that path and its descendants; it does not remove unrelated paths for the same identity. Keep their historical records. A Re-grant action prefills a new grant form and creates a new ID after current authorization checks. It never changes the old revoked path back to active.

Full removal disables the selected identity, invalidates its credentials, and revokes affected grants, including its beneficiary-specific integration paths and delegated descendants. Other guests, their integrations, and unrelated owner grants remain effective. Re-adding a removed issuer does not revive its old delegated grants.

Expiry uses the existing simulation clock and configured timezone. Expired grants remain inspectable but ineffective. A fresh grant needs a new future expiry or an authorized no-expiry setting; old expiries are not silently extended.

## Ghost Access interface

Extend the current workspace rather than replacing the application's navigation or visual world.

- Obvious Add guest and Add integration actions open small inline forms. Integration creation requires selecting its guest.
- A readable people list shows name, kind, active/removed state, and relationship. Selecting a person scopes its access paths and test controls. Provide Grant access and Remove person for active rows, Re-add for removed rows, and a visible way to include removed identities.
- The grant composer selects granting identity, recipient/path, resource, permitted actions, optional expiry, and a required parent for delegated grants. Show who benefits and whether the path is independent or delegated before creation.
- Each live path has Revoke. Historical paths offer Re-grant, which creates a fresh record. Put longer revoked/expired histories behind a disclosure, with counts and clear parent/child references.
- A control-request tester selects any identity, including a removed one for denial tests, device/action, and current credential or a saved token copy. It shows the last actual command adapter result and reason.
- Save token and Rotate credential apply to the selected identity. Saved copies show which person/generation they belonged to and can be retried after removal/re-addition. Persist these simulator copies across workspace navigation and refresh.
- Keep the direct-removal versus independent-integration example easy to run. Existing guided scenarios use the initial guest/integration pair but are not the only available identities.
- Preserve keyboard focus, labelled controls, responsive stacking, and visible success/validation feedback. No new decorative animation or canvas is needed.

## Teaching and routine interaction

Make teaching/exclusion/source-count handling work for dynamic identities. Preserve old person records so historical contributions always have a name and source ID. New guests and integrations default to teaching disabled.

Full removal turns off teaching for the removed identities and linked integrations; recompute filtered proposals from retained history and mark approved routines using those sources as Needs review. Do not silently pause, resume, delete, or unapprove those routines. Display enabled/paused and review state together, with explicit Pause and Review actions.

Revoking only a device grant does not silently revoke teaching permission. Access and learning are separate decisions. Re-addition grants neither device authority nor teaching permission. An owner can explicitly change teaching permissions in Habit Guard for an active identity.

Retain the existing source-based recomputation semantics: explicitly granting teaching permission again can make that person's retained qualified history eligible again. Explain that beside teaching controls and retain event-level provenance; restoring device access alone never does this. Inactive identities cannot be newly granted teaching permission, but their historical sources can still be excluded from learning.

Routine execution still uses the approved owner's authority and cannot feed either learner. Baseline and Habit Guard continue to use the same history and approval/scheduling rules, with the baseline light isolated.

## Saved-state continuity

Introduce a versioned dynamic-identity snapshot and intentionally migrate valid v1 data. Preserve recorded clock, home state, commands, evidence, audit timeline, learning history, teaching/exclusion choices, routines, queued events, and old identity/grant/credential IDs wherever possible.

Map the original three identities to owner/guest/integration kinds and link the original integration to the original guest. Convert legacy light-control scope into both light actions. Represent the owner's existing implicit lock authority as explicit initial owner authority. Disabled people, revoked grants, expired grants, and inactive credentials must stay disabled/revoked/expired/inactive through migration.

Apply the new removal invariants to an already-removed legacy guest: disable its linked integration and old credentials, turn off teaching for those removed identities, and flag affected routines for review without changing their enabled/paused state. Preserve teaching choices for active people and all historical records. This prevents a legacy integration token left active by v1 from becoming useful again after the guest returns.

Validate the migrated snapshot before saving. Keep a recovery copy of the old snapshot, and never automatically load that recovery copy after a deliberate reset. Successful migration must not start a new scenario or change run ID/time. If local storage is unavailable, preserve the run in memory and show a useful notice. Invalid/unsupported data must not be silently described as successfully migrated.

Dynamic IDs and name lookup must work throughout Overview, ALIBI command attribution, Ghost Access, Habit Guard, Demo Lab, and activity history. Reset still creates the initial demo identities and sample history; ordinary add/revoke/re-add never resets unrelated state.

## Acceptance and verification

- Add two named guests with separate integration identities; grant different permissions to each and test allowed/denied actions.
- Exercise direct removal, re-grant, full removal, and re-addition without resetting time, physical state, history, or another person's permissions.
- Save an old guest/integration token, remove/re-add the identity, grant new access, and prove the saved token remains denied while the new token works.
- Revoke one direct path and demonstrate an independently owner-issued integration path still working; full removal then blocks both.
- Permit a guest lock command only with an effective grant for that precise action; the opposite action and light actions remain independently scoped.
- Advance the clock across expiry and prove parent/child actions stop at the boundary.
- Create a valid delegated subset; reject wider action sets, wider expiry, cycles, removed issuers, and ineffective parents. Revoke the parent and prove descendants stay blocked after new parent grants or issuer re-addition.
- Remove one guest and prove another guest/integration and the owner continue to work.
- Confirm full removal disables teaching, preserves source history, recomputes proposals, and flags affected routines while retaining their explicit enabled/paused state.
- Migrate representative active and removed v1 runs, then reload v2 and compare time, records, queued work, and effective permissions. Verify old tokens cannot revive through migration or re-addition.
- Test source attribution and teaching/proposal rendering with more than the original three identities.
- Run focused domain/persistence regression tests, TypeScript checks, and a production build. Batch desktop/phone browser checks of the add/grant/revoke/remove/re-add/token flow and delegated expiry. No house-art review is required because the scene is unchanged.

## Builder discretion and next gate

The builder chooses exact component boundaries, ID generation, schema field names, validation implementation, and inline-form layout within the established design system. The lifecycle rules, scope, and user-visible outcomes above are not left implicit.

After approval, write the implementation plan before modifying product code. This document expands the original Smart Home Trust design only where stated; the original simulation limitations and real-device exclusions still apply.
