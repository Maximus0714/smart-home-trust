import { useEffect, useRef } from 'react'
import { Check, CircleHelp, DoorClosed, Lamp, LockKeyhole, Radio, ScanLine, X } from 'lucide-react'
import type { Dispatch } from 'react'
import type { DeviceId, SimAction, SimState } from '../sim/types'
import { Button, Status, formatDemoTime } from './ui'

export const deviceInfo = {
  lock: { name: 'Front door', location: 'Entry', kind: 'Smart lock', Icon: LockKeyhole },
  'bolt-witness': { name: 'Bolt witness', location: 'Entry', kind: 'Independent bolt sensor', Icon: Radio },
  'door-contact': { name: 'Door contact', location: 'Entry', kind: 'Closure sensor', Icon: ScanLine },
  light: { name: 'Living room light', location: 'Living room', kind: 'Smart light', Icon: Lamp },
}

export function verificationSummary(state: SimState): { label: string; tone: 'neutral' | 'positive' | 'negative' | 'warning'; detail: string } {
  const verification = state.verification.current
  if (!verification) return { label: 'No claim checked yet', tone: 'neutral', detail: 'Request a lock action to compare its report with a fresh independent observation.' }
  if (!verification.current) return { label: 'Unverified', tone: 'neutral', detail: verification.reason }
  if (verification.verdict !== 'pending' && state.clock.now >= verification.expiresAt) return { label: 'Observation expired', tone: 'neutral', detail: 'The historical observation is preserved. Request a new action for fresh evidence.' }
  switch (verification.verdict) {
    case 'pending': return { label: 'Waiting for evidence', tone: 'warning', detail: 'Allowing the actuator to settle, then requesting a fresh bolt-witness sample.' }
    case 'supported': return { label: 'Bolt claim supported', tone: 'positive', detail: verification.reason }
    case 'contradicted': return { label: 'Claim contradicted', tone: 'negative', detail: verification.reason }
    case 'insufficient': return { label: 'Insufficient evidence', tone: 'warning', detail: verification.reason }
  }
}

export function DeviceInspector({ state, dispatch, device, onClose }: { state: SimState; dispatch: Dispatch<SimAction>; device: DeviceId; onClose(): void }) {
  const info = deviceInfo[device]
  const summary = verificationSummary(state)
  const panel = useRef<HTMLElement>(null)
  const witness = [...state.verification.evidence].filter(e => e.source === 'bolt-witness' && e.accepted).sort((a, b) => b.at - a.at)[0]
  const contact = device === 'door-contact'
  const light = device === 'light'
  useEffect(() => { panel.current?.focus({ preventScroll: true }); if (window.innerWidth < 1000) panel.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' }) }, [])

  return <aside className="device-inspector" id="device-inspector" aria-label={`${info.name} details`} ref={panel} tabIndex={-1} onKeyDown={event => { if (event.key === 'Escape') onClose() }}>
    <div className="inspector-top"><span>Device details</span><Button variant="quiet" className="icon-button" aria-label="Close device details" onClick={onClose}><X size={17} /></Button></div>
    <div className="device-heading"><div><h2>{info.name}</h2><p>{info.kind} · {info.location}</p></div><info.Icon size={26} strokeWidth={1.4} /></div>
    {light ? <>
      <div className="device-callout"><Status tone="neutral">{state.home.lightOn ? 'Light is on' : 'Light is off'}</Status><p>Commands are acknowledged in this simulation. This light has no independent physical witness.</p></div>
      <dl className="data-pairs"><div><dt>Control source</dt><dd>Homeowner</dd></div><div><dt>Teaching permission</dt><dd>{state.learning.teaching.owner ? 'Owner manual actions' : 'Not granted'}</dd></div><div><dt>Physical verification</dt><dd>Not available</dd></div></dl>
      <Button variant="primary" onClick={() => dispatch({ type: 'COMMAND', device: 'light', value: !state.home.lightOn, principal: 'owner', confirmed: true })}><Lamp size={16} />Turn light {state.home.lightOn ? 'off' : 'on'}</Button>
      <p className="helper-text">Your manual action is kept separate from automated routine executions.</p>
    </> : contact ? <>
      <div className="device-callout"><Status tone={state.home.doorOpen ? 'warning' : 'neutral'}>Door {state.home.doorOpen ? 'open' : 'closed'}</Status><p>Door contact describes closure. It does not establish bolt extension or secure engagement.</p></div>
      <dl className="data-pairs"><div><dt>Door contact</dt><dd>{state.home.doorOpen ? 'Open' : 'Closed'}</dd></div><div><dt>Simulated bolt</dt><dd>{state.home.boltExtended ? 'Extended' : 'Retracted'}</dd></div></dl>
      <Button onClick={() => dispatch({ type: 'SET_DOOR', open: !state.home.doorOpen })}><DoorClosed size={16} />{state.home.doorOpen ? 'Close' : 'Open'} simulated door</Button>
      <p className="helper-text">This moves the physical door in the simulator. Locking and door movement are separate actions.</p>
    </> : <>
      <div className={`device-callout device-callout--${summary.tone}`} aria-live="polite"><Status tone={summary.tone}>{summary.label}</Status><p>{summary.detail}</p></div>
      <dl className="data-pairs"><div><dt>Device claim</dt><dd>{state.verification.current ? `Bolt ${state.verification.current.claimedLocked ? 'extended' : 'retracted'}` : 'No command yet'}</dd></div><div><dt>Qualified bolt witness</dt><dd>{witness ? witness.value ? 'Extended' : 'Retracted' : 'No observation yet'}</dd></div><div><dt>Door contact</dt><dd>{state.home.doorOpen ? 'Open' : 'Closed'}</dd></div>{witness && <div><dt>Last observation</dt><dd>{formatDemoTime(witness.at)}</dd></div>}</dl>
      {device === 'lock' ? <div className="inspector-actions"><Button variant="primary" disabled={state.verification.current?.verdict === 'pending'} onClick={() => dispatch({ type: 'COMMAND', device: 'lock', value: !state.home.boltExtended, principal: 'owner', confirmed: true })}><LockKeyhole size={16} />{state.home.boltExtended ? 'Retract' : 'Extend'} bolt</Button><Button onClick={() => dispatch({ type: 'SET_DOOR', open: !state.home.doorOpen })}><DoorClosed size={16} />{state.home.doorOpen ? 'Close' : 'Open'} door</Button></div> : <p className="sensor-note"><Radio size={16} />Read-only witness. Select Front door to request a new lock action.</p>}
      <p className="helper-text"><CircleHelp size={14} />A supported bolt claim describes an observation at a time. It does not mean the home is secure.</p>
    </>}
    <div className="device-connection"><Check size={13} />Simulated device · No real connection</div>
  </aside>
}
