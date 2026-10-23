import { createInitialState, simulationReducer } from './engine';
import type { SimState } from './types';

export const STORAGE_KEY = 'smart-home-trust.simulation.v1';
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
const principals = new Set(['owner', 'guest', 'integration']);

/** Reject incompatible/corrupt state rather than restoring a partially coherent run. */
export function isValidSnapshot(value: unknown): value is SimState {
  if (!isRecord(value) || value.version !== 1 || !Number.isSafeInteger(value.runId) || Number(value.runId) < 1 || !Number.isSafeInteger(value.serial) || Number(value.serial) < 0) return false;
  const { clock, home, baseline, config, verification, learning } = value;
  if (!isRecord(clock) || !finite(clock.now) || Number(clock.now) < 0 || Number(clock.now) > 8_000_000_000_000_000 || typeof clock.running !== 'boolean' || clock.timeZone !== 'Asia/Kolkata') return false;
  if (!isRecord(home) || !['doorOpen', 'boltExtended', 'lightOn'].every(key => typeof home[key] === 'boolean') || !isRecord(baseline) || typeof baseline.lightOn !== 'boolean') return false;
  if (!isRecord(config) || !principals.has(String(config.source)) || !['falseReport', 'witnessAvailable', 'replayWitness'].every(key => typeof config[key] === 'boolean') || !finite(config.witnessDelayMs)) return false;
  if (!isRecord(verification) || !Array.isArray(verification.history) || !Array.isArray(verification.evidence) || !finite(verification.epoch) || !finite(verification.witnessSequence) || !finite(verification.acceptedSequence)) return false;
  const validVerification = (v: unknown) => isRecord(v) && typeof v.commandId === 'string' && ['pending', 'supported', 'contradicted', 'insufficient'].includes(String(v.verdict)) && typeof v.current === 'boolean' && typeof v.claimedLocked === 'boolean' && (v.observedBolt === null || typeof v.observedBolt === 'boolean') && ['requestedAt', 'deadline', 'settledAt', 'expiresAt'].every(key => finite(v[key])) && typeof v.challenge === 'string' && typeof v.challengeUsed === 'boolean' && typeof v.reason === 'string';
  if (verification.current !== null && !validVerification(verification.current)) return false;
  if (!verification.history.every(validVerification) || !verification.evidence.every(e => isRecord(e) && typeof e.id === 'string' && finite(e.at) && finite(e.observedAt) && typeof e.commandId === 'string' && ['lock', 'bolt-witness'].includes(String(e.source)) && finite(e.sequence) && finite(e.epoch) && typeof e.challenge === 'string' && typeof e.accepted === 'boolean' && typeof e.value === 'boolean' && typeof e.reason === 'string')) return false;
  if (!isRecord(learning) || !Array.isArray(learning.history) || !isRecord(learning.teaching) || !isRecord(learning.excluded)) return false;
  if (![...principals].every(p => typeof (learning.teaching as Record<string, unknown>)[p] === 'boolean' && typeof (learning.excluded as Record<string, unknown>)[p] === 'boolean')) return false;
  if (!learning.history.every(e => isRecord(e) && typeof e.id === 'string' && finite(e.at) && principals.has(String(e.source)) && ['manual', 'confirmed', 'acknowledged', 'automated', 'lightOn'].every(key => typeof e[key] === 'boolean') && ['acknowledged', 'supported', 'pending', 'contradicted', 'insufficient', 'rejected'].includes(String(e.evidence)))) return false;
  for (const key of ['principals', 'grants', 'credentials', 'commands', 'routines', 'activity', 'queue'] as const) if (!Array.isArray(value[key])) return false;
  const records = (key: string, check: (r: Record<string, unknown>) => boolean) => (value[key] as unknown[]).every(v => isRecord(v) && check(v));
  if (!records('principals', p => principals.has(String(p.id)) && typeof p.name === 'string' && typeof p.active === 'boolean') || (value.principals as unknown[]).length !== 3 || new Set((value.principals as Record<string, unknown>[]).map(p => p.id)).size !== 3) return false;
  if (!records('grants', g => typeof g.id === 'string' && typeof g.label === 'string' && principals.has(String(g.issuer)) && principals.has(String(g.principal)) && principals.has(String(g.beneficiary)) && g.resource === 'light' && g.action === 'control' && typeof g.active === 'boolean' && (g.expiresAt === null || finite(g.expiresAt)) && (g.parentId === null || typeof g.parentId === 'string'))) return false;
  if (!['owner-light', 'guest-direct', 'guest-integration'].every(id => (value.grants as Record<string, unknown>[]).some(g => g.id === id))) return false;
  if (!records('credentials', c => typeof c.id === 'string' && principals.has(String(c.principal)) && typeof c.token === 'string' && typeof c.active === 'boolean' && typeof c.shared === 'boolean') || !(value.credentials as Record<string, unknown>[]).some(c => c.shared)) return false;
  if (!records('commands', c => typeof c.id === 'string' && finite(c.at) && principals.has(String(c.principal)) && ['lock', 'light'].includes(String(c.device)) && ['baseline', 'guard'].includes(String(c.variant)) && ['allowed', 'automated', 'value'].every(key => typeof c[key] === 'boolean') && typeof c.reason === 'string')) return false;
  if (!records('routines', r => typeof r.id === 'string' && typeof r.proposalId === 'string' && typeof r.name === 'string' && ['baseline', 'guard'].includes(String(r.variant)) && finite(r.bucket) && Number(r.bucket) >= 0 && Number(r.bucket) <= 47 && finite(r.approvedAt) && finite(r.executions) && ['enabled', 'needsReview', 'lightOn'].every(key => typeof r[key] === 'boolean') && (r.nextRun === null || finite(r.nextRun)) && Array.isArray(r.eventIds) && r.eventIds.every(id => typeof id === 'string') && Array.isArray(r.sources) && r.sources.every(p => principals.has(String(p))))) return false;
  if (!records('activity', a => typeof a.id === 'string' && finite(a.at) && ['home', 'alibi', 'access', 'habits', 'system'].includes(String(a.module)) && typeof a.title === 'string' && typeof a.detail === 'string')) return false;
  if (!records('queue', q => typeof q.id === 'string' && finite(q.dueAt) && Number(q.dueAt) >= Number(clock.now) && finite(q.sequenceOrder) && (q.kind === 'routine' ? typeof q.routineId === 'string' : q.kind === 'sample' || q.kind === 'deadline' ? typeof q.commandId === 'string' : q.kind === 'witness' && typeof q.commandId === 'string' && finite(q.observedAt) && typeof q.value === 'boolean' && finite(q.epoch) && finite(q.sequence) && typeof q.challenge === 'string' && q.source === 'bolt-witness'))) return false;
  const queue = value.queue as Record<string, unknown>[];
  if (queue.some((event, index) => index > 0 && (Number(event.dueAt) < Number(queue[index - 1].dueAt) || (event.dueAt === queue[index - 1].dueAt && Number(event.sequenceOrder) <= Number(queue[index - 1].sequenceOrder))))) return false;
  return value.scenario === null || ['honest', 'false-report', 'replay', 'delayed', 'unavailable', 'door-open', 'ghost-access', 'habit-poisoning'].includes(String(value.scenario));
}

export function loadSimulation(): { state: SimState; notice?: string } {
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { state: createInitialState() };
    const value: unknown = JSON.parse(raw);
    if (!isValidSnapshot(value)) return { state: createInitialState(), notice: 'Saved demo data was incompatible or incomplete. A fresh local run has started.' };
    // Restore recorded simulation time; never advance for elapsed background time.
    return { state: simulationReducer(value, { type: 'ADVANCE', ms: 0 }) };
  } catch {
    return { state: createInitialState(), notice: 'Saved demo data could not be read. This session is ready; browser storage may be unavailable.' };
  }
}
export function saveSimulation(state: SimState): boolean {
  try { globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
