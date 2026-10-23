import type { AuditEvent, Command, Evidence, LearningEvent, PrincipalId, Proposal, Routine, ScheduledEvent, ScheduledPayload, SimAction, SimState, Variant, Verification } from './types';

export const TIME_ZONE = 'Asia/Kolkata';
export const SETTLING_MS = 2_000;
export const OBSERVATION_DEADLINE_MS = 1_000;
export const VERDICT_LIFETIME_MS = 5_000;
const DAY = 86_400_000;
const OFFSET = 19_800_000;
const INITIAL_TIME = Date.parse('2026-10-24T12:00:00+05:30');

function id(s: SimState, prefix: string) { return `${prefix}-${s.runId}-${++s.serial}`; }
function audit(s: SimState, module: AuditEvent['module'], title: string, detail: string, outcome?: AuditEvent['outcome']) {
  s.activity.unshift({ id: id(s, 'event'), at: s.clock.now, module, title, detail, outcome });
  s.activity = s.activity.slice(0, 500);
}
function schedule(s: SimState, dueAt: number, payload: ScheduledPayload) {
  s.queue.push({ ...payload, id: id(s, 'scheduled'), dueAt, sequenceOrder: s.serial } as ScheduledEvent);
  s.queue.sort((a, b) => a.dueAt - b.dueAt || a.sequenceOrder - b.sequenceOrder);
}
function localDayStart(at: number) { return Math.floor((at + OFFSET) / DAY) * DAY - OFFSET; }
export function formatSimTime(at: number, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('en-IN', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, ...options }).format(at);
}
export function createInitialState(): SimState {
  const state: SimState = {
    version: 1, runId: 1, serial: 0,
    clock: { now: INITIAL_TIME, running: true, timeZone: TIME_ZONE },
    home: { doorOpen: false, boltExtended: false, lightOn: false }, baseline: { lightOn: false },
    config: { source: 'owner', falseReport: false, witnessAvailable: true, witnessDelayMs: 0, replayWitness: false },
    principals: [{ id: 'owner', name: 'You · owner', active: true }, { id: 'guest', name: 'Alex · guest', active: true }, { id: 'integration', name: 'Home integration', active: true }],
    grants: [
      { id: 'owner-light', issuer: 'owner', principal: 'owner', beneficiary: 'owner', resource: 'light', action: 'control', active: true, expiresAt: null, parentId: null, label: 'Owner light authority' },
      { id: 'guest-direct', issuer: 'owner', principal: 'guest', beneficiary: 'guest', resource: 'light', action: 'control', active: true, expiresAt: null, parentId: null, label: 'Direct guest access' },
      { id: 'guest-integration', issuer: 'owner', principal: 'integration', beneficiary: 'guest', resource: 'light', action: 'control', active: true, expiresAt: null, parentId: null, label: 'Independent integration for Alex' },
    ],
    credentials: [
      { id: 'owner-key', principal: 'owner', token: 'sim-owner-v1', active: true, shared: false },
      { id: 'guest-key', principal: 'guest', token: 'sim-guest-v1', active: true, shared: false },
      { id: 'integration-key', principal: 'integration', token: 'sim-shared-v1', active: true, shared: true },
    ],
    verification: { current: null, history: [], evidence: [], epoch: 1, witnessSequence: 0, acceptedSequence: 0 },
    commands: [], learning: { history: [], teaching: { owner: true, guest: false, integration: false }, excluded: { owner: false, guest: false, integration: false } },
    routines: [], activity: [], queue: [], scenario: null,
  };
  seedHistory(state);
  audit(state, 'system', 'Demo ready', 'A browser simulation. No real devices or credentials are connected.');
  return state;
}

function principalActive(s: SimState, principal: PrincipalId) { return s.principals.some(p => p.id === principal && p.active); }
export function grantIsActive(s: SimState, grantId: string, seen = new Set<string>()): boolean {
  if (seen.has(grantId)) return false;
  seen.add(grantId);
  const g = s.grants.find(x => x.id === grantId);
  return !!g && g.active && (g.expiresAt === null || g.expiresAt > s.clock.now) && principalActive(s, g.principal) && principalActive(s, g.beneficiary) && principalActive(s, g.issuer) && (!g.parentId || grantIsActive(s, g.parentId, seen));
}
export function canControl(s: SimState, principal: PrincipalId, credential?: string): { allowed: boolean; reason: string } {
  if (!principalActive(s, principal)) return { allowed: false, reason: 'Principal is disabled.' };
  const validCredential = s.credentials.some(c => c.principal === principal && c.active && (credential === undefined || c.token === credential));
  if (!validCredential) return { allowed: false, reason: 'Simulated credential is invalid or rotated.' };
  const grant = s.grants.find(g => g.principal === principal && g.resource === 'light' && g.action === 'control' && grantIsActive(s, g.id));
  return grant ? { allowed: true, reason: `Allowed through ${grant.label}.` } : { allowed: false, reason: 'No active light-control path remains.' };
}

/** This verifier sees only an accepted claim and a qualified observation, never home state. */
export function verifyClaim(claim: boolean, observation: boolean): 'supported' | 'contradicted' { return claim === observation ? 'supported' : 'contradicted'; }
export function qualifyObservation(s: SimState, v: Verification, e: Omit<Evidence, 'id' | 'accepted' | 'reason'>): { accepted: boolean; reason: string } {
  if (e.source !== 'bolt-witness') return { accepted: false, reason: 'Unexpected witness source.' };
  if (!s.config.witnessAvailable) return { accepted: false, reason: 'Witness channel is unavailable.' };
  if (e.at !== s.clock.now) return { accepted: false, reason: 'Receipt time does not match the simulation clock.' };
  if (e.epoch !== s.verification.epoch) return { accepted: false, reason: 'Witness epoch is stale.' };
  if (e.commandId !== v.commandId) return { accepted: false, reason: 'Observation belongs to another command.' };
  if (e.challenge !== v.challenge || v.challengeUsed) return { accepted: false, reason: 'Challenge is invalid or already used.' };
  if (e.sequence <= s.verification.acceptedSequence) return { accepted: false, reason: 'Witness sequence was already received.' };
  if (e.observedAt < v.settledAt || e.observedAt > e.at || e.at > v.deadline) return { accepted: false, reason: 'Observation is stale or arrived after its deadline.' };
  return { accepted: true, reason: 'Fresh command-bound witness observation accepted.' };
}
function archive(s: SimState, v: Verification) {
  const index = s.verification.history.findIndex(x => x.commandId === v.commandId);
  if (index >= 0) s.verification.history[index] = { ...v };
  else s.verification.history.unshift({ ...v });
  s.verification.history = s.verification.history.slice(0, 100);
}
function invalidate(s: SimState, reason: string) {
  const v = s.verification.current;
  if (v && v.current) {
    v.current = false;
    // Preserve the original result/rule in history before explaining why its badge is no longer current.
    archive(s, v);
    v.reason = reason;
  }
}
function executeCommand(s: SimState, input: { device: 'lock' | 'light'; value: boolean; principal: PrincipalId; credential?: string; variant?: Variant; automated?: boolean; routineId?: string; confirmed?: boolean }) {
  const variant = input.variant ?? 'guard';
  let policy = canControl(s, input.principal, input.credential);
  if (input.device === 'lock' && input.principal !== 'owner') policy = { allowed: false, reason: 'Only the owner has simulated lock control.' };
  const c: Command = { id: id(s, 'command'), at: s.clock.now, principal: input.principal, device: input.device, value: input.value, allowed: policy.allowed, reason: policy.reason, automated: input.automated ?? false, variant, ...(input.routineId ? { routineId: input.routineId } : {}) };
  s.commands.unshift(c); s.commands = s.commands.slice(0, 500);
  audit(s, input.device === 'lock' ? 'alibi' : 'access', `${policy.allowed ? 'Allowed' : 'Denied'} ${input.device} command`, `${input.principal}: ${input.value ? 'on / extend' : 'off / retract'}. ${policy.reason}${variant === 'baseline' ? ' Comparison sandbox.' : ''}`, policy.allowed ? 'allowed' : 'denied');
  if (!policy.allowed) return;
  if (input.device === 'light') {
    if (variant === 'baseline') s.baseline.lightOn = input.value; else s.home.lightOn = input.value;
    // Comparison executions and all automation are deliberately excluded from training.
    if (!c.automated && variant === 'guard') s.learning.history.push({ id: id(s, 'learning'), at: s.clock.now, source: input.principal, lightOn: input.value, manual: true, confirmed: input.confirmed ?? input.principal === 'owner', acknowledged: true, automated: false, evidence: 'acknowledged', commandId: c.id });
    return;
  }
  invalidate(s, 'A new lock command replaced this verification.');
  // Device behavior is an input to message generation; the verifier never reads it.
  s.home.boltExtended = s.config.falseReport ? !input.value : input.value;
  const v: Verification = { commandId: c.id, verdict: 'pending', claimedLocked: input.value, observedBolt: null, requestedAt: s.clock.now, settledAt: s.clock.now + SETTLING_MS, deadline: s.clock.now + SETTLING_MS + OBSERVATION_DEADLINE_MS, expiresAt: 0, challenge: id(s, 'challenge'), challengeUsed: false, current: true, reason: 'Waiting two seconds for settling, then one second for fresh evidence.' };
  s.verification.current = v;
  s.verification.evidence.unshift({ id: id(s, 'evidence'), at: s.clock.now, observedAt: s.clock.now, commandId: c.id, source: 'lock', epoch: s.verification.epoch, sequence: s.serial, challenge: v.challenge, value: input.value, accepted: true, reason: 'Claim accepted from the simulated lock source; awaiting independent witness.' });
  schedule(s, v.settledAt, { kind: 'sample', commandId: c.id });
  schedule(s, v.deadline, { kind: 'deadline', commandId: c.id });
}

function runScheduled(s: SimState, event: ScheduledEvent) {
  if (event.kind === 'routine') {
    const routine = s.routines.find(r => r.id === event.routineId);
    if (!routine?.enabled || routine.nextRun !== event.dueAt) return;
    executeCommand(s, { device: 'light', value: routine.lightOn, principal: 'owner', automated: true, variant: routine.variant, routineId: routine.id });
    const succeeded = s.commands[0]?.allowed;
    if (succeeded) routine.executions++;
    audit(s, 'habits', `${routine.variant === 'baseline' ? 'Baseline sandbox' : 'Habit Guard'} routine ${succeeded ? 'executed' : 'denied'}`, `${routine.name}. Automated execution does not teach either learner.`);
    routine.nextRun = nextOccurrence(s.clock.now, routine.bucket);
    schedule(s, routine.nextRun, { kind: 'routine', routineId: routine.id });
    return;
  }
  const v = s.verification.current;
  if (!v || v.commandId !== event.commandId) return;
  if (event.kind === 'sample') {
    if (!s.config.witnessAvailable) { audit(s, 'alibi', 'Witness unavailable', 'No observation is supplied. Absence alone does not establish an attack.'); return; }
    const replay = s.config.replayWitness;
    schedule(s, s.clock.now + s.config.witnessDelayMs, { kind: 'witness', commandId: v.commandId, observedAt: replay ? s.clock.now - 10_000 : s.clock.now, value: s.home.boltExtended, epoch: replay ? s.verification.epoch - 1 : s.verification.epoch, sequence: ++s.verification.witnessSequence, challenge: replay ? 'old-consumed-challenge' : v.challenge, source: 'bolt-witness' });
  } else if (event.kind === 'witness') {
    const data = { at: s.clock.now, observedAt: event.observedAt, commandId: event.commandId, source: event.source, epoch: event.epoch, sequence: event.sequence, challenge: event.challenge, value: event.value };
    const qualification = qualifyObservation(s, v, data);
    s.verification.evidence.unshift({ ...data, ...qualification, id: id(s, 'evidence') });
    audit(s, 'alibi', qualification.accepted ? 'Witness accepted' : 'Witness rejected', qualification.reason);
    if (qualification.accepted) {
      s.verification.acceptedSequence = event.sequence; v.challengeUsed = true; v.observedBolt = event.value;
      v.verdict = verifyClaim(v.claimedLocked, event.value); v.expiresAt = s.clock.now + VERDICT_LIFETIME_MS;
      const resultReason = v.verdict === 'supported' ? 'The witness supports bolt position at this time. Door closure is a separate reading.' : 'The qualified witness contradicts the reported bolt position.';
      archive(s, { ...v, reason: resultReason });
      if (v.current) v.reason = resultReason;
    }
  } else if (v.verdict === 'pending') {
    v.verdict = 'insufficient'; v.expiresAt = s.clock.now + VERDICT_LIFETIME_MS;
    const resultReason = 'No qualified witness observation arrived before the deadline.';
    archive(s, { ...v, reason: resultReason });
    if (v.current) v.reason = resultReason;
    audit(s, 'alibi', 'Insufficient evidence', resultReason);
  }
}
function advance(s: SimState, ms: number) {
  const target = s.clock.now + Math.max(0, Number.isFinite(ms) ? ms : 0);
  while (s.queue.length && s.queue[0].dueAt <= target) {
    const event = s.queue.shift()!; s.clock.now = event.dueAt;
    if (s.verification.current?.current && s.verification.current.expiresAt && s.clock.now >= s.verification.current.expiresAt) invalidate(s, 'The five-second current-verdict lifetime has expired.');
    runScheduled(s, event);
  }
  s.clock.now = target;
  if (s.verification.current?.current && s.verification.current.expiresAt && target >= s.verification.current.expiresAt) invalidate(s, 'The five-second current-verdict lifetime has expired.');
}

function seedHistory(s: SimState) {
  const start = localDayStart(s.clock.now);
  s.learning.history = [];
  for (let day = 7; day >= 1; day--) {
    for (const source of ['owner', 'integration'] as const) {
      s.learning.history.push({ id: id(s, 'seed'), at: start - day * DAY + (source === 'owner' ? 19 * 60 + 0 : 2 * 60) * 60_000, source, lightOn: true, manual: source === 'owner', confirmed: source === 'owner', acknowledged: true, automated: false, evidence: 'acknowledged' });
    }
  }
}
export function getProposals(s: SimState, variant: Variant): Proposal[] {
  const groups = new Map<string, { bucket: number; lightOn: boolean; days: Set<string>; events: LearningEvent[] }>();
  const earliest = localDayStart(s.clock.now) - 7 * DAY;
  for (const event of s.learning.history) {
    if (event.at < earliest || event.at > s.clock.now || event.automated || !event.acknowledged || !['acknowledged', 'supported'].includes(event.evidence)) continue;
    if (variant === 'guard' && (s.learning.excluded[event.source] || !s.learning.teaching[event.source] || (event.source === 'owner' && (!event.manual || !event.confirmed)))) continue;
    const local = new Date(event.at + OFFSET);
    const bucket = Math.floor((local.getUTCHours() * 60 + local.getUTCMinutes()) / 30);
    const key = `${bucket}-${event.lightOn}`;
    const group = groups.get(key) ?? { bucket, lightOn: event.lightOn, days: new Set<string>(), events: [] };
    group.days.add(local.toISOString().slice(0, 10)); group.events.push(event); groups.set(key, group);
  }
  return [...groups.values()].filter(g => g.days.size >= 3).sort((a, b) => a.bucket - b.bucket).map(g => {
    const time = `${String(Math.floor(g.bucket / 2)).padStart(2, '0')}:${g.bucket % 2 ? '30' : '00'}`;
    return { id: `${variant}-${g.bucket}-${g.lightOn ? 'on' : 'off'}`, variant, bucket: g.bucket, time, lightOn: g.lightOn, days: [...g.days].sort(), dayCount: g.days.size, eventIds: g.events.map(e => e.id), sourceCounts: { owner: g.events.filter(e => e.source === 'owner').length, guest: g.events.filter(e => e.source === 'guest').length, integration: g.events.filter(e => e.source === 'integration').length }, label: `Living room light ${g.lightOn ? 'on' : 'off'} at ${time}` };
  });
}
export function nextOccurrence(now: number, bucket: number) {
  const today = localDayStart(now) + bucket * 30 * 60_000;
  return today > now ? today : today + DAY;
}
function refreshRoutineReview(s: SimState) {
  for (const routine of s.routines) {
    const proposal = getProposals(s, routine.variant).find(p => p.id === routine.proposalId);
    if (!proposal || routine.eventIds.some(eventId => !proposal.eventIds.includes(eventId))) routine.needsReview = true;
  }
}
function approve(s: SimState, variant: Variant, proposalId: string) {
  const p = getProposals(s, variant).find(x => x.id === proposalId); if (!p) return;
  const existing = s.routines.find(r => r.variant === variant && r.proposalId === p.id);
  if (existing) { existing.needsReview = false; existing.eventIds = [...p.eventIds]; existing.sources = (Object.keys(p.sourceCounts) as PrincipalId[]).filter(source => p.sourceCounts[source] > 0); return; }
  const routine: Routine = { id: id(s, 'routine'), proposalId, variant, name: p.label, bucket: p.bucket, lightOn: p.lightOn, approvedAt: s.clock.now, enabled: true, needsReview: false, eventIds: [...p.eventIds], sources: (Object.keys(p.sourceCounts) as PrincipalId[]).filter(source => p.sourceCounts[source] > 0), nextRun: nextOccurrence(s.clock.now, p.bucket), executions: 0 };
  s.routines.push(routine); schedule(s, routine.nextRun!, { kind: 'routine', routineId: routine.id });
  audit(s, 'habits', 'Routine approved and enabled', `${p.label}. ${variant === 'baseline' ? 'Runs only in the comparison sandbox.' : 'Runs in the main home.'} First execution is the next future occurrence.`);
}

export function simulationReducer(state: SimState, action: SimAction): SimState {
  if (action.type === 'RESET' || action.type === 'SCENARIO') {
    const fresh = createInitialState(); fresh.runId = state.runId + 1;
    if (action.type === 'RESET') return fresh;
    fresh.scenario = action.scenario;
    if (action.scenario === 'ghost-access') { audit(fresh, 'access', 'Ghost Access scenario', 'Remove the direct guest path, then try the independent integration path.'); return fresh; }
    if (action.scenario === 'habit-poisoning') { audit(fresh, 'habits', 'Seven-day history loaded', 'Compare the same owner evening and integration 02:00 history with source filtering.'); return fresh; }
    fresh.config.falseReport = action.scenario === 'false-report'; fresh.config.replayWitness = action.scenario === 'replay'; fresh.config.witnessDelayMs = action.scenario === 'delayed' ? 2_000 : 0; fresh.config.witnessAvailable = action.scenario !== 'unavailable'; fresh.home.doorOpen = action.scenario === 'door-open';
    executeCommand(fresh, { device: 'lock', value: true, principal: 'owner' }); return fresh;
  }
  const s = structuredClone(state);
  switch (action.type) {
    case 'ADVANCE': advance(s, action.ms); break;
    case 'SET_RUNNING': s.clock.running = action.running; break;
    case 'COMMAND': executeCommand(s, { ...action, principal: action.principal ?? s.config.source }); break;
    case 'SET_DOOR': s.home.doorOpen = action.open; invalidate(s, 'The door position changed; inspect current readings again.'); audit(s, 'home', action.open ? 'Door opened' : 'Door closed', 'Door contact is independent of bolt position.'); break;
    case 'SET_CONFIG': s.config = { ...s.config, ...action.config, witnessDelayMs: Math.max(0, Math.min(60_000, action.config.witnessDelayMs ?? s.config.witnessDelayMs)) }; break;
    case 'REVOKE_DIRECT': s.grants.find(g => g.id === 'guest-direct')!.active = false; audit(s, 'access', 'Direct guest grant removed', 'The independent owner-issued integration path remains separately authorized.'); break;
    case 'REMOVE_GUEST': s.principals.find(p => p.id === 'guest')!.active = false; s.grants.filter(g => g.beneficiary === 'guest' || g.principal === 'guest').forEach(g => { g.active = false; }); s.credentials.filter(c => c.principal === 'guest').forEach(c => { c.active = false; }); audit(s, 'access', 'Guest and attributed paths removed', 'Guest direct and guest-benefiting integration paths are disabled. Owner authority remains.'); break;
    case 'SET_GRANT': { const grant = s.grants.find(g => g.id === action.grantId); if (grant) grant.active = action.active; audit(s, 'access', 'Grant updated', `${action.grantId}: ${action.active ? 'active' : 'inactive'}.`); break; }
    case 'ROTATE_CREDENTIAL': { const credential = s.credentials.find(c => c.shared)!; credential.token = `sim-shared-v${++s.serial}`; audit(s, 'access', 'Shared simulated credential rotated', 'The old token can no longer be reused through the command adapter.'); break; }
    case 'SET_TEACHING': s.learning.teaching[action.principal] = action.allowed; refreshRoutineReview(s); audit(s, 'habits', 'Teaching permission updated', `${action.principal} ${action.allowed ? 'may' : 'may not'} contribute to Habit Guard. Approved routines retain their enabled state and may need review.`); break;
    case 'SET_EXCLUDED': s.learning.excluded[action.principal] = action.excluded; refreshRoutineReview(s); audit(s, 'habits', 'Source policy updated', `${action.principal} ${action.excluded ? 'excluded' : 'included'} in Habit Guard proposals.`); break;
    case 'REPLAY_HISTORY': seedHistory(s); refreshRoutineReview(s); audit(s, 'habits', 'Seven local-calendar days replayed', 'Identical retained owner 19:00 and integration 02:00 events feed both comparisons.'); break;
    case 'APPROVE': approve(s, action.variant, action.proposalId); break;
    case 'SET_ROUTINE': { const routine = s.routines.find(r => r.id === action.routineId); if (!routine) break; routine.enabled = action.enabled; s.queue = s.queue.filter(e => e.kind !== 'routine' || e.routineId !== routine.id); routine.nextRun = action.enabled ? nextOccurrence(s.clock.now, routine.bucket) : null; if (routine.nextRun) schedule(s, routine.nextRun, { kind: 'routine', routineId: routine.id }); audit(s, 'habits', `Routine ${action.enabled ? 'resumed' : 'paused'}`, routine.name); break; }
    case 'REVIEW_ROUTINE': { const routine = s.routines.find(r => r.id === action.routineId); if (routine) { const p = getProposals(s, routine.variant).find(p => p.id === routine.proposalId); if (p) { routine.eventIds = [...p.eventIds]; routine.sources = (Object.keys(p.sourceCounts) as PrincipalId[]).filter(source => p.sourceCounts[source] > 0); routine.needsReview = false; audit(s, 'habits', 'Revised evidence approved', routine.name); } else audit(s, 'habits', 'Review has no eligible proposal', 'Pause the routine explicitly or restore qualifying teaching evidence.'); } break; }
  }
  return s;
}
