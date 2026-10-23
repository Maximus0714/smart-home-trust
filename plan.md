# Smart Home Trust Platform — Project Plan

Status: Proposed software-only ideathon/hackathon prototype. Revised with red-team fixes; controls are planned, not implemented or proven.

## 1. Concept

One application protects three distinct types of trust in a smart home.

| Module | Problem | Question |
| --- | --- | --- |
| ALIBI | Devices can lie about their state. | Is the device telling the truth? |
| Ghost Access | Unwanted access can survive account removal. | Who can still control the home? |
| Habit Guard | Untrusted activity can influence learned routines. | Who is teaching the home what is normal? |

**Pitch:** Verify what devices say, remove access that should have ended, and control what the home learns.

Domain: Cybersecurity in smart homes. Protect device communication, information sharing, and automated responses while preserving everyday convenience.

## 2. Scope and explicit threat model

ALIBI is the main technical demonstration. Ghost Access and Habit Guard remain two distinct, deliberately narrow companion features.

MVP devices: one lock, one independently authenticated bolt-position witness, a door-contact witness, and one light. MVP identities: owner, one guest/roommate, and one integration. Defer motion sensing, camera replay detection, technician roles, and complex access visualization.

### Trusted foundation

- The local gateway, owner authentication, authorization store, verifier, and audit store remain trusted.
- The attacker may control one lock/device OR one integration, including its own messages and valid credentials. The attacker may replay, delay, suppress, duplicate, or reorder its messages.
- The independent witness has separate credentials and permissions. A compromised lock cannot publish witness readings, change grants, mark events as owner-confirmed, or edit history.
- The gateway establishes source identity from authenticated connections or tokens; it never trusts source identity, verification status, or learning eligibility supplied in a message body.
- Physical sensors have a documented measurement meaning. Separate software processes alone do not prove real-world independence.

Gateway compromise, stolen owner credentials, witness compromise/collusion, bypass network paths, physical tampering, and vendor-cloud access outside supported integrations remain outside the MVP guarantee. Show these limits in the pitch when relevant.

All simulated control paths must pass through the gateway. Simulator administration is isolated from device credentials. The attack panel is a privileged laboratory tool, not an ordinary resident endpoint.

### Scoped promise

Under these assumptions, reject impersonation and stale evidence, detect specified contradictions, enforce revocation on mediated actions, and prevent unapproved sources from influencing protected routine proposals. Do not promise complete protection or guaranteed physical security.

## 3. ALIBI - Verify specific device claims

### Problem and evidence meaning

A compromised lock may report bolt extension without performing it. Verify that precise claim using independent observations.

Door closed, bolt extended, and lock securely engaged are different properties. Door-contact evidence only establishes closure. A bolt-position witness supports extension at a time, not resistance to forced entry or correct strike engagement.

### Evidence protocol

1. Authenticate the reporting principal at the gateway. Reject identity overrides and cross-device writes.
2. Assign each gateway command a unique command ID. Claims reference that ID, but a caller-supplied reference alone is not proof of causality.
3. Track each source's credential-bound sequence and session epoch. Reject duplicate or older sequence values. A new session epoch requires authenticated negotiation and invalidates the old session.
4. Record gateway monotonic receipt time as the timing authority; retain device timestamps only as context.
5. After the actuator settling period, request a fresh witness sample with a single-use random challenge bound to the command. Accept only the authenticated assigned witness, matching challenge, expected epoch, and timely response.
6. Evaluate the lock claim and witness observation. Keep claim and witness channels independent. A challenge proves response freshness under the trusted-witness assumption, not physical integrity of a compromised witness.
7. Store evidence references, verdict time, expiry, and the rule applied. The verifier cannot read hidden simulator truth.

Proposed simulator defaults: allow two seconds for actuator settling, one further second for the challenged observation, and expire the displayed current verification after five seconds or on a relevant state change, whichever occurs first. Parameters are demo defaults, not measured real-device guarantees. Use the same injected monotonic clock for replay tests.

### Verdicts

| Verdict | Meaning |
| --- | --- |
| Pending | The observation window has not finished. |
| Supported | Fresh qualified evidence supports the specified claim at the stated time. |
| Contradicted | Fresh qualified evidence conflicts with the claim. |
| Insufficient evidence | Evidence is missing, stale, invalid, or ambiguous after the deadline. |

A historical supported verdict stays in the timeline, but the current badge becomes unverified after expiry. Never translate supported into "home secure." Missing messages and ordinary faults do not establish an attack or identify the guilty source.

### Interface and judge demo

Show reported state separately from a precise evidence verdict, such as "Bolt-extension claim supported at 10:03:05." Explain conflicting observations on a timeline.

Demonstrate an honest action, a false report, replayed evidence, delayed evidence, and an unavailable witness. Include bolt extended while the door is open: extension may be supported while the door remains visibly open.

## 4. Ghost Access - Find and revoke lingering control

### Problem

Removing a direct grant may leave a guest-specific integration credential or existing session with authority. The prototype demonstrates permission removal, rather than pretending that hiding an account deletes all credentials.

### Authorization records and rules

Each grant records: grant ID, grantor, subject, beneficiary where explicitly recorded, resource, permitted actions, delegation parent, expiry, status, and linked credential/session IDs.

- A delegated grant can only narrow its parent's resources, actions, and lifetime.
- Reject delegation cycles. Check that every ancestor remains active at execution time.
- Distinguish owner-created integration access for a named guest from access delegated by that guest. Show the origin instead of inferring attribution from activity.
- Full person removal disables that principal and revokes grants to them, descendants of their authority, and explicitly attributed guest-specific integration grants.
- Unrelated owner grants remain intact. Preview any shared dependencies before applying removal.
- Shared credentials cannot reliably identify individual holders. Mark them as requiring rotation; invalidate the old credential and reconnect legitimate users with separate credentials. Do not claim individual removal while a copied shared credential still works.

### Enforcement and revocation timing

Enforce authorization server-side at the actual device-control endpoint on every request and again before executing queued commands. Use the trusted gateway to serialize revocation commits and command dispatch so the ordering is explicit.

A committed revocation blocks subsequent dispatches through affected grants. Reject affected commands still queued at commit. An action already dispatched may finish and cannot be undone; log it as preceding revocation.

Invalidate associated sessions, terminate affected persistent streams, and reauthorize each WebSocket command and stream delivery. Check authoritative grant state instead of retaining stale authorization caches. A revocation result is complete only after affected mediated sessions and streams are closed; report partial completion honestly.

### Judge demo and interface

Show a small access-path list first; a graph is optional. Give the guest a direct light-control grant and an independently owner-issued integration grant explicitly designated for that guest. Remove only the direct grant and show the surviving integration path.

Then perform full person removal. Reuse the same token against the real command endpoint, including a previously opened connection. Show denial and continued owner operation. Demonstrate shared-token rotation as a separate boundary case.

Verify every supported route through its actual control adapter, not solely through a separate permission-check API. Unsupported vendor routes are unresolved, not verified as removed.

## 5. Habit Guard - Learning provenance and contamination control

### Problem

Repeated integration or guest activity can contaminate a routine learner even when it is authorized to control the device. Permission to act is not permission to teach.

### Learning policy and simple learner

The gateway labels event origin from authenticated identity and command history. Clients cannot self-declare owner confirmation. Record whether an action was manual or automated and preserve links to any relevant ALIBI result.

Default teaching eligibility: authenticated owner-confirmed manual actions. Guest/integration sources require an explicit owner-issued teaching grant. Unknown, automated, rejected, pending, or contradicted events are not eligible. If ALIBI evidence is required for the device action, missing or expired evidence prevents eligibility; the light-only MVP uses acknowledged execution and source policy without claiming independent physical verification.

For the MVP, learn one pattern: light-on or light-off at a recurring time. Over seven simulated local-calendar days, propose a routine when the same device/action occurs in the same 30-minute time bucket on at least three distinct days. Collapse duplicate same-day contributions. Store contributing event IDs and source counts. Use the same configured timezone, time buckets, and thresholds for all comparisons.

Never feed executed learned routines back into training as fresh manual preferences.

### Fair evaluation: isolate the benefit beyond approval

| Variant | Training data | Activation |
| --- | --- | --- |
| A. Unrestricted diagnostic baseline | All accepted action events | Automatic activation in the isolated simulator only |
| B. Approval-only baseline | Same events as A | Owner approval required |
| C. Habit Guard | Only teaching-eligible events | Owner approval required |

A and B share training data and proposal logic; their proposal sets should match. A illustrates the risk of unattended learning in an isolated simulation and is not the fair baseline for claiming Habit Guard adds value. The primary security comparison is B versus C under the same approval workflow; do not claim superior protection merely because C asks permission.

Measure contaminated proposals, legitimate proposal retention, number of proposals requiring review, and reproducibility of source exclusion. Count activations separately. With no approvals, B and C must have zero activations; A may activate proposals only inside its isolated diagnostic simulation.

### Workflow and judge demo

Replay one clean owner pattern and one repeated 2 a.m. integration pattern. Show the proposal sets and their provenance. Integration events are allowed actions but have no teaching permission, so Habit Guard excludes their pattern from actionable proposals while retaining the legitimate owner pattern.

Offer an optional explicit teaching grant, then revoke eligibility or exclude that source and recompute the proposal. Preserve historical evidence rather than silently deleting it. Mark previously approved routines affected by the excluded evidence as needing owner review; rebuilding proposals alone does not disable an existing routine.

### Limits

Describe the result as source-based learning control, not malicious-intent detection or protection against all poisoning. A compromised source with teaching permission remains a risk. Exclusion affects local learning only and does not erase vendor-held data. Use deterministic recomputation, not claims of advanced machine unlearning.

## 6. Shared workflow

A single event can receive three separate decisions:

| Decision | Responsible module |
| --- | --- |
| Was this source allowed to issue the action? | Ghost Access |
| Is the resulting device claim supported? | ALIBI |
| May this event influence a learned routine? | Habit Guard |

Authorization does not prove physical success. A supported physical event does not automatically establish consent to learn from it.

Revoking access blocks future requests. Historical learning contributions remain available for separate review. Contradicted events can be withheld from learning without automatically revoking their sources.

## 7. Proposed architecture and enforcement boundaries

Implementation recommendations: reuse the existing frontend, use Python FastAPI if compatible with the project, SQLite for records, HTTP for commands, and WebSockets for updates. Inspect the current project before choosing dependencies.

Keep the first UI to one overview with three module panels and a shared timeline. Defer elaborate graphs and additional visualizations.

Separate responsibilities:

- Gateway: authenticated principals, authorization, sequencing, command dispatch, and trusted event ingestion.
- Device simulators: separate credentials and narrowly permitted claim/observation endpoints.
- ALIBI: receives qualified messages, never simulator ground truth or attack labels.
- Ghost Access: manages grants and validates removal through actual control routes.
- Habit Guard: reads source-labelled events and server-computed learning policy.
- Evaluation service: reads hidden simulator physical state for scoring only; its results never feed detection.
- Judge controller: privileged scenario setup and reset; isolated from normal credentials.

For credible isolation, use separate processes and access-controlled interfaces; use OS or container isolation before claiming adversarial process isolation. If running all components under one local user, disclose that the demo tests API-level compromise, not arbitrary host execution.

Shared records: Device, Identity, Credential, Grant, Session, Command, Observation, VerificationResult, LearningEvent, RoutineProposal, ApprovedRoutine, and AuditEvent.

Audit security decisions and revocation boundaries without storing raw credentials. Simulator reset rotates session epochs and demo credentials, cancels queued commands, clears learned state, and preserves or exports the previous run's evaluation separately.

## 8. Application views

1. Home overview: virtual home, device states, and recent incidents.
2. ALIBI: claims and evidence.
3. Ghost Access: access map and verified removal.
4. Habit Guard: routine proposals and learning review.
5. Judge controls: attack selection, time acceleration, evaluation, and reset.

Suggested visual direction: dark neutral colours, no gradients, clear state labels, restrained motion. Keep attack controls outside the resident’s normal workflow.

Prefer concrete module statuses over an unexplained overall security score.

## 9. Narrow build order and acceptance gates

| Phase | Deliverable | Required evidence |
| --- | --- | --- |
| 1 | Trusted gateway, identities, scoped credentials, event store | A lock cannot submit witness or owner events; commands cannot bypass authorization. |
| 2 | ALIBI centerpiece | Honest, contradictory, stale, replayed, delayed, and missing-evidence scenarios produce defined outcomes. |
| 3 | Ghost Access companion | Guest-specific delegated routes and open sessions fail after completed removal; owner access survives. |
| 4 | Habit Guard companion | Same replay and approval rules show the added effect of eligibility filtering on proposals. |
| 5 | Shared overview and timeline | Separate authorization, verification, and learning decisions are visible for an event. |
| 6 | Independent demo evaluation | Judge variations work without giving ground truth or attack flags to detection services. |

Resolve the first two phases before polishing UI. If time runs short, keep one deep ALIBI scenario and one narrow working example for each companion. Defer camera replay, additional sensor types, complex permission graphs, advanced machine learning, and real-vendor integrations.

## 10. Five-minute judge walkthrough

1. Lead with ALIBI: "The lock says the bolt extended. What evidence supports that claim?"
2. Let the judge falsify the report or replay an old observation. Show the computed outcome and its evidence, including expiry.
3. Show Ghost Access: a direct grant is removed but a separate guest-specific integration grant still works. Complete removal, repeat the actual request with the old token and session, and show denial.
4. Show Habit Guard: compare approval-only and provenance-filtered proposals from identical history. Preserve the clean owner pattern and exclude the integration-generated pattern.
5. Close with the three trust questions, measured results, and the trusted-gateway/witness assumptions.

Use direct API requests as well as interface actions. Let judges vary timing, identities, witness availability, or replay data. Held-out scenario settings must not be available to detection logic.

The demonstration establishes the behaviour of this implementation under its threat model, not reliability across commercial hardware.

## 11. Verification, outcomes, and residual risk

| Area | Acceptance checks |
| --- | --- |
| Identity | Reject forged source IDs, cross-device writes, unauthorized judge access, and caller-set teaching/verification status. |
| Evidence | Reject old challenges, duplicate/out-of-order sequences, invalid epochs, pre-command samples, late samples, and mismatched command IDs. Expire current badges. |
| Ordinary operation | Do not treat actuator settling, missing observations, sensor failure, or clock uncertainty as proof of an attacker. |
| Revocation | Exercise direct grants, delegated descendants, separately guest-attributed integration grants, shared-token rotation, existing connections, reconnects, queued commands, and unrelated owner access. |
| Race handling | Demonstrate command dispatch before versus after the recorded revocation commit. Already-dispatched physical actions cannot be reversed by credential removal. |
| Learning | Same history, timezone, thresholds, and approval policy across variants; measure proposal contamination and legitimate retention separately from activation. Test trusted-source contamination as a stated limit. |
| Simulation validity | Detection cannot read ground truth, expected verdicts, attack switches, or evaluation files. Attack controls change messages, state, or grants instead of directly changing verdicts. |
| Integration | Distinct decisions remain distinct; reset invalidates previous tokens, epochs, pending commands, and routine state. |

For ALIBI, report verdicts per scenario, latency, false alerts, and insufficient-evidence outcomes. For Ghost Access, report actual successful or denied requests and unresolved routes. For Habit Guard, report contaminated proposals, clean proposal retention, review burden, and recomputation results.

These checks validate specific controls, not zero risk. Remaining risks include compromised trusted components, collusion, shared/external credentials outside integration coverage, already executed actions, and imperfect witness measurements.

Publish results only after measurement. Never invent accuracy or performance figures.

## 12. Research and differentiation

The underlying areas already have research. Position the project around the integration of three understandable trust decisions, explainable evidence, enforceable controls, and an interactive demo. Do not claim worldwide novelty.

- Physical event verification: [Peeves](https://ora.ox.ac.uk/objects/uuid%3A75726ff7-fee1-420d-8a17-de9572324c7d).
- Verification with compromised sensors: [Haunted House](https://ora.ox.ac.uk/objects/uuid%3Ac3aaa48e-b170-435c-962e-0764e5a98dcb).
- Lingering authorization: [Authorisation inconsistency in IoT third-party integration](https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/ise2.12043).
- Sharing risks: [Characterizing Security and Privacy Risks in Smart Home IoT Device Access Sharing](https://doi.org/10.1145/3774906.3802795).
- Related poisoning research, focused on consumption prediction rather than the proposed routine feature: [Bi-Level Poisoning Attack Model and Countermeasure for Appliance Consumption Data of Smart Homes](https://www.mdpi.com/1996-1073/14/13/3887).

## 13. Final story

**ALIBI checks the truth. Ghost Access checks control. Habit Guard checks influence.**

Residents can understand what their home claims, who can affect it, and whose activity shapes its future behaviour.



