import { afterEach, describe, expect, it, vi } from 'vitest';
import { canControl, createInitialState, getProposals, grantIsActive, nextOccurrence, qualifyObservation, simulationReducer, verifyClaim } from './engine';
import { isValidSnapshot, loadSimulation, saveSimulation, STORAGE_KEY } from './persistence';
import type { Evidence, ScenarioId, SimState } from './types';

const advance = (state: SimState, ms: number) => simulationReducer(state, { type: 'ADVANCE', ms });
const scenario = (name: ScenarioId) => simulationReducer(createInitialState(), { type: 'SCENARIO', scenario: name });
function approveFirst(s: SimState, variant: 'baseline' | 'guard') {
  return simulationReducer(s, { type: 'APPROVE', variant, proposalId: getProposals(s, variant)[0].id });
}

describe('qualified ALIBI observations', () => {
  it('settles before supporting an honest claim and expires the current badge after five seconds', () => {
    let s = scenario('honest');
    expect(s.verification.current?.verdict).toBe('pending');
    s = advance(s, 1999); expect(s.verification.current?.verdict).toBe('pending');
    s = advance(s, 1); expect(s.verification.current?.verdict).toBe('supported');
    expect(s.verification.current?.current).toBe(true);
    s = advance(s, 4999); expect(s.verification.current?.current).toBe(true);
    s = advance(s, 1); expect(s.verification.current?.current).toBe(false);
    expect(s.verification.history[0].verdict).toBe('supported');
    expect(s.verification.history[0].reason).toContain('The witness supports bolt position');
    expect(s.verification.current?.reason).toContain('expired');
  });
  it('contradicts a false report using qualified evidence rather than the scenario label', () => {
    const s = advance(scenario('false-report'), 3000);
    expect(s.home.boltExtended).toBe(false);
    expect(s.verification.current?.claimedLocked).toBe(true);
    expect(s.verification.current?.observedBolt).toBe(false);
    expect(s.verification.current?.verdict).toBe('contradicted');
    expect(verifyClaim(true, false)).toBe('contradicted');
    expect(verifyClaim(false, false)).toBe('supported');
  });
  it.each(['replay', 'delayed', 'unavailable'] as const)('%s gives insufficient evidence after the deadline', name => {
    const s = advance(scenario(name), 5000);
    expect(s.verification.current?.verdict).toBe('insufficient');
    expect(s.verification.current?.observedBolt).toBeNull();
    if (name !== 'unavailable') expect(s.verification.evidence.some(e => !e.accepted)).toBe(true);
    expect(s.activity.some(e => /malicious|attacker/i.test(e.title))).toBe(false);
  });
  it('keeps an open door separate from a supported extended bolt', () => {
    const s = advance(scenario('door-open'), 3000);
    expect(s.home).toMatchObject({ doorOpen: true, boltExtended: true });
    expect(s.verification.current?.verdict).toBe('supported');
    expect(s.verification.current?.reason).toContain('Door closure is a separate reading');
  });
  it('invalidates a current verification after a relevant physical input changes', () => {
    const s = simulationReducer(advance(scenario('honest'), 2000), { type: 'SET_DOOR', open: true });
    expect(s.verification.current?.current).toBe(false);
    expect(s.verification.current?.reason).toContain('door position changed');
    expect(s.verification.history[0].reason).toContain('The witness supports bolt position');
  });
  it('allows a pending command-bound response to finish only as historical evidence after invalidation', () => {
    let s = simulationReducer(scenario('honest'), { type: 'SET_DOOR', open: true });
    s = advance(s, 3000);
    expect(s.verification.current?.current).toBe(false);
    expect(s.verification.current?.reason).toContain('door position changed');
    expect(s.verification.history[0].verdict).toBe('supported');
    expect(s.verification.history[0].reason).toContain('The witness supports bolt position');
  });
  it('rejects wrong source, receipt time, epoch, linkage, challenge, sequence, and observation times independently', () => {
    const s = scenario('honest'); s.clock.now += 2000;
    const v = s.verification.current!;
    const valid: Omit<Evidence, 'id' | 'accepted' | 'reason'> = { at: s.clock.now, observedAt: s.clock.now, commandId: v.commandId, source: 'bolt-witness', epoch: s.verification.epoch, sequence: 1, challenge: v.challenge, value: true };
    expect(qualifyObservation(s, v, valid).accepted).toBe(true);
    for (const patch of [{ source: 'lock' as const }, { at: s.clock.now + 1 }, { epoch: 0 }, { commandId: 'other' }, { challenge: 'old' }, { sequence: 0 }, { observedAt: v.settledAt - 1 }, { observedAt: s.clock.now + 1 }]) expect(qualifyObservation(s, v, { ...valid, ...patch }).accepted).toBe(false);
    expect(qualifyObservation(s, { ...v, challengeUsed: true }, valid).accepted).toBe(false);
    s.config.witnessAvailable = false; expect(qualifyObservation(s, v, valid).accepted).toBe(false);
  });
  it('uses command IDs to prevent an older delayed response replacing a newer command', () => {
    let s = scenario('delayed'); const previous = s.verification.current!.commandId;
    s = advance(s, 2500);
    s = simulationReducer(s, { type: 'SET_CONFIG', config: { witnessDelayMs: 0 } });
    s = simulationReducer(s, { type: 'COMMAND', device: 'lock', value: false, principal: 'owner' });
    s = advance(s, 3000);
    expect(s.verification.current?.commandId).not.toBe(previous);
    expect(s.verification.current?.verdict).toBe('supported');
    expect(s.verification.current?.claimedLocked).toBe(false);
  });
});

describe('shared simulated command policy', () => {
  it('preserves the separate integration path after removing only the direct guest grant', () => {
    let s = simulationReducer(createInitialState(), { type: 'REVOKE_DIRECT' });
    expect(canControl(s, 'guest').allowed).toBe(false);
    expect(canControl(s, 'integration').allowed).toBe(true);
    s = simulationReducer(s, { type: 'COMMAND', device: 'light', value: true, principal: 'integration' });
    expect(s.home.lightOn).toBe(true);
    s = simulationReducer(s, { type: 'COMMAND', device: 'light', value: false, principal: 'guest' });
    expect(s.home.lightOn).toBe(true); expect(s.commands[0].allowed).toBe(false);
  });
  it('full guest removal blocks guest-attributed integration and preserves owner control', () => {
    const s = simulationReducer(createInitialState(), { type: 'REMOVE_GUEST' });
    expect(canControl(s, 'guest').allowed).toBe(false);
    expect(canControl(s, 'integration').allowed).toBe(false);
    expect(canControl(s, 'owner').allowed).toBe(true);
  });
  it('rotation invalidates the old shared token while the new token remains usable', () => {
    const initial = createInitialState(); const oldToken = initial.credentials.find(c => c.shared)!.token;
    const s = simulationReducer(initial, { type: 'ROTATE_CREDENTIAL' });
    expect(canControl(s, 'integration', oldToken).allowed).toBe(false);
    expect(canControl(s, 'integration', s.credentials.find(c => c.shared)!.token).allowed).toBe(true);
  });
  it('rejects missing, expired, inactive, and cyclic delegation ancestry', () => {
    const s = createInitialState(); const direct = s.grants.find(g => g.id === 'guest-direct')!;
    direct.parentId = 'missing'; expect(grantIsActive(s, direct.id)).toBe(false);
    direct.parentId = null; direct.expiresAt = s.clock.now; expect(grantIsActive(s, direct.id)).toBe(false);
    direct.expiresAt = null; direct.parentId = 'guest-integration';
    s.grants.find(g => g.id === 'guest-integration')!.parentId = 'guest-direct';
    expect(grantIsActive(s, direct.id)).toBe(false);
    s.grants.find(g => g.id === 'guest-integration')!.parentId = null;
    s.grants.find(g => g.id === 'guest-integration')!.active = false;
    expect(grantIsActive(s, direct.id)).toBe(false);
  });
  it('denies non-owner lock commands through the same adapter without changing physical state', () => {
    const s = simulationReducer(createInitialState(), { type: 'COMMAND', device: 'lock', value: true, principal: 'integration' });
    expect(s.home.boltExtended).toBe(false); expect(s.verification.current).toBeNull(); expect(s.commands[0].allowed).toBe(false);
  });
});

describe('learning provenance and narrow daily schedules', () => {
  it('compares identical history and filters integration act permission separately from teaching', () => {
    const s = createInitialState();
    expect(canControl(s, 'integration').allowed).toBe(true);
    expect(getProposals(s, 'baseline').map(p => p.time)).toEqual(['02:00', '19:00']);
    expect(getProposals(s, 'guard').map(p => p.time)).toEqual(['19:00']);
    expect(getProposals(s, 'guard')[0].dayCount).toBe(7);
    const teaching = simulationReducer(s, { type: 'SET_TEACHING', principal: 'integration', allowed: true });
    expect(getProposals(teaching, 'guard').map(p => p.time)).toEqual(['02:00', '19:00']);
    expect(s.routines).toHaveLength(0); expect(s.queue).toHaveLength(0);
  });
  it('counts distinct local days rather than duplicate commands and requires three days', () => {
    const s = createInitialState(); const owner = s.learning.history.filter(e => e.source === 'owner');
    s.learning.history = [owner[0], { ...owner[0], id: 'duplicate-1' }, { ...owner[0], id: 'duplicate-2' }, owner[1]];
    expect(getProposals(s, 'guard')).toHaveLength(0);
    s.learning.history.push(owner[2]); expect(getProposals(s, 'guard')[0].dayCount).toBe(3);
  });
  it('excludes failed evidence and automation from both proposal learners', () => {
    const s = createInitialState();
    for (const event of s.learning.history) { event.evidence = 'contradicted'; }
    expect(getProposals(s, 'baseline')).toHaveLength(0);
    for (const event of s.learning.history) { event.evidence = 'acknowledged'; event.automated = true; }
    expect(getProposals(s, 'guard')).toHaveLength(0); expect(getProposals(s, 'baseline')).toHaveLength(0);
  });
  it('schedules the next future local-time occurrence without backfill and does not train on execution', () => {
    let s = approveFirst(createInitialState(), 'guard');
    const routine = s.routines[0]; const historyCount = s.learning.history.length;
    expect(routine.nextRun).toBeGreaterThan(s.clock.now);
    s = advance(s, routine.nextRun! - s.clock.now);
    expect(s.home.lightOn).toBe(true); expect(s.routines[0].executions).toBe(1);
    expect(s.learning.history).toHaveLength(historyCount); expect(s.commands[0].automated).toBe(true);
    expect(s.routines[0].nextRun).toBe(routine.nextRun! + 86_400_000);
    expect(nextOccurrence(routine.nextRun!, routine.bucket)).toBe(routine.nextRun! + 86_400_000);
  });
  it('baseline routine execution affects only its comparison light', () => {
    let s = approveFirst(createInitialState(), 'baseline');
    const count = s.learning.history.length;
    s = advance(s, s.routines[0].nextRun! - s.clock.now);
    expect(s.baseline.lightOn).toBe(true); expect(s.home.lightOn).toBe(false);
    expect(s.routines[0].executions).toBe(1); expect(s.learning.history).toHaveLength(count);
  });
  it('pause cancels pending executions and resume picks a strictly future occurrence', () => {
    let s = approveFirst(createInitialState(), 'guard'); const routineId = s.routines[0].id;
    s = simulationReducer(s, { type: 'SET_ROUTINE', routineId, enabled: false });
    expect(s.queue).toHaveLength(0); expect(s.routines[0].nextRun).toBeNull();
    s = advance(s, 86_400_000); expect(s.routines[0].executions).toBe(0);
    s = simulationReducer(s, { type: 'SET_ROUTINE', routineId, enabled: true });
    expect(s.routines[0].nextRun).toBeGreaterThan(s.clock.now);
  });
  it('source exclusion marks approved routines for review without silently pausing them', () => {
    let s = approveFirst(createInitialState(), 'guard'); const run = s.routines[0].nextRun;
    s = simulationReducer(s, { type: 'SET_EXCLUDED', principal: 'owner', excluded: true });
    expect(getProposals(s, 'guard')).toHaveLength(0); expect(getProposals(s, 'baseline')).toHaveLength(2);
    expect(s.routines[0]).toMatchObject({ needsReview: true, enabled: true, nextRun: run });
    s = advance(s, run! - s.clock.now); expect(s.routines[0].executions).toBe(1);
  });
  it('reset clears routines and scheduled events, with no scheduled work leaking into a fresh run', () => {
    let s = approveFirst(scenario('delayed'), 'baseline');
    expect(s.queue.length).toBeGreaterThan(0);
    s = simulationReducer(s, { type: 'RESET' }); expect(s.queue).toHaveLength(0); expect(s.routines).toHaveLength(0);
    s = advance(s, 86_400_000); expect(s.home.lightOn).toBe(false); expect(s.verification.current).toBeNull();
  });
  it('processes ordered events identically in one advance or many increments and never mutates input', () => {
    const initial = scenario('honest'); const snapshot = JSON.stringify(initial);
    const one = advance(initial, 4000);
    const many = advance(advance(advance(initial, 1000), 1000), 2000);
    expect(one).toEqual(many); expect(JSON.stringify(initial)).toBe(snapshot);
  });
});

describe('versioned browser-local persistence', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('restores the recorded time and serializable queue without manufacturing background time', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
    const s = scenario('delayed'); expect(saveSimulation(s)).toBe(true);
    const restored = loadSimulation(); expect(restored.notice).toBeUndefined(); expect(restored.state).toEqual(s);
    expect(advance(restored.state, 5000).verification.current?.verdict).toBe('insufficient');
  });
  it('recovers cleanly from incompatible, structurally corrupt, invalid JSON, and unavailable storage', () => {
    for (const raw of ['{"version":99}', '{"version":1}', 'not JSON']) {
      vi.stubGlobal('localStorage', { getItem: () => raw });
      const recovered = loadSimulation(); expect(recovered.notice).toBeTruthy(); expect(recovered.state.home.lightOn).toBe(false);
    }
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(loadSimulation().notice).toBeTruthy(); expect(saveSimulation(createInitialState())).toBe(false);
  });
  it('validates nested records rather than accepting an arbitrary version number', () => {
    const s = createInitialState(); expect(isValidSnapshot(s)).toBe(true);
    const corrupt = structuredClone(s); (corrupt.learning.history[0] as unknown as { acknowledged: string }).acknowledged = 'yes';
    expect(isValidSnapshot(corrupt)).toBe(false);
    expect(STORAGE_KEY).toContain('v1');
  });
});
