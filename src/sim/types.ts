export type DeviceId = 'lock' | 'bolt-witness' | 'door-contact' | 'light';
export type RoomId = 'all' | 'living' | 'bedroom' | 'entry';
export type PrincipalId = 'owner' | 'guest' | 'integration';
export type Variant = 'baseline' | 'guard';
export type Verdict = 'pending' | 'supported' | 'contradicted' | 'insufficient';
export type ScenarioId = 'honest' | 'false-report' | 'replay' | 'delayed' | 'unavailable' | 'door-open' | 'ghost-access' | 'habit-poisoning';
export interface HomeState { doorOpen: boolean; boltExtended: boolean; lightOn: boolean }
export interface DemoConfig { source: PrincipalId; falseReport: boolean; witnessAvailable: boolean; witnessDelayMs: number; replayWitness: boolean }
export interface Principal { id: PrincipalId; name: string; active: boolean }
export interface Grant { id: string; issuer: PrincipalId; principal: PrincipalId; beneficiary: PrincipalId; resource: 'light'; action: 'control'; active: boolean; expiresAt: number | null; parentId: string | null; label: string }
export interface Credential { id: string; principal: PrincipalId; token: string; active: boolean; shared: boolean }
export interface Command { id: string; at: number; principal: PrincipalId; device: 'lock' | 'light'; value: boolean; allowed: boolean; reason: string; automated: boolean; variant: Variant; routineId?: string }
export interface Evidence { id: string; at: number; observedAt: number; commandId: string; source: 'lock' | 'bolt-witness'; epoch: number; sequence: number; challenge: string; value: boolean; accepted: boolean; reason: string }
export interface Verification { commandId: string; verdict: Verdict; claimedLocked: boolean; observedBolt: boolean | null; requestedAt: number; deadline: number; settledAt: number; expiresAt: number; challenge: string; challengeUsed: boolean; reason: string; current: boolean }
export interface LearningEvent { id: string; at: number; source: PrincipalId; lightOn: boolean; manual: boolean; confirmed: boolean; acknowledged: boolean; automated: boolean; evidence: 'acknowledged' | 'supported' | 'pending' | 'contradicted' | 'insufficient' | 'rejected'; commandId?: string }
export interface Proposal { id: string; variant: Variant; bucket: number; time: string; lightOn: boolean; days: string[]; dayCount: number; eventIds: string[]; sourceCounts: Record<PrincipalId, number>; label: string }
export interface Routine { id: string; proposalId: string; variant: Variant; name: string; bucket: number; lightOn: boolean; approvedAt: number; enabled: boolean; needsReview: boolean; eventIds: string[]; sources: PrincipalId[]; nextRun: number | null; executions: number }
export interface AuditEvent { id: string; at: number; module: 'home' | 'alibi' | 'access' | 'habits' | 'system'; title: string; detail: string; outcome?: 'allowed' | 'denied' | 'info' }
export type ScheduledPayload = { kind: 'sample'; commandId: string } | { kind: 'witness'; commandId: string; observedAt: number; value: boolean; epoch: number; sequence: number; challenge: string; source: 'bolt-witness' } | { kind: 'deadline'; commandId: string } | { kind: 'routine'; routineId: string };
export type ScheduledEvent = ScheduledPayload & { id: string; dueAt: number; sequenceOrder: number };
export interface SimState {
  version: 1; runId: number; serial: number;
  clock: { now: number; running: boolean; timeZone: 'Asia/Kolkata' };
  home: HomeState; baseline: { lightOn: boolean }; config: DemoConfig;
  principals: Principal[]; grants: Grant[]; credentials: Credential[];
  verification: { current: Verification | null; history: Verification[]; evidence: Evidence[]; epoch: number; witnessSequence: number; acceptedSequence: number };
  commands: Command[]; learning: { history: LearningEvent[]; teaching: Record<PrincipalId, boolean>; excluded: Record<PrincipalId, boolean> };
  routines: Routine[]; activity: AuditEvent[]; queue: ScheduledEvent[]; scenario: ScenarioId | null;
}
export type SimAction =
  | { type: 'ADVANCE'; ms: number }
  | { type: 'SET_RUNNING'; running: boolean }
  | { type: 'COMMAND'; device: 'lock' | 'light'; value: boolean; principal?: PrincipalId; credential?: string; variant?: Variant; confirmed?: boolean }
  | { type: 'SET_DOOR'; open: boolean }
  | { type: 'SET_CONFIG'; config: Partial<DemoConfig> }
  | { type: 'SCENARIO'; scenario: ScenarioId }
  | { type: 'RESET' }
  | { type: 'REVOKE_DIRECT' }
  | { type: 'REMOVE_GUEST' }
  | { type: 'SET_GRANT'; grantId: string; active: boolean }
  | { type: 'ROTATE_CREDENTIAL' }
  | { type: 'SET_TEACHING'; principal: PrincipalId; allowed: boolean }
  | { type: 'SET_EXCLUDED'; principal: PrincipalId; excluded: boolean }
  | { type: 'REPLAY_HISTORY' }
  | { type: 'APPROVE'; proposalId: string; variant: Variant }
  | { type: 'SET_ROUTINE'; routineId: string; enabled: boolean }
  | { type: 'REVIEW_ROUTINE'; routineId: string };
