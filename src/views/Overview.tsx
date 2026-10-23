import { lazy, memo, Suspense, useCallback, useMemo, useRef, useState, type Dispatch } from 'react'
import { ArrowRight, ChevronDown, FlaskConical, Minus, Plus, RotateCcw, House, PanelRightClose, Square, Layers2 } from 'lucide-react'
import type { DeviceId, RoomId, SimAction, SimState } from '../sim/types'
import { getProposals } from '../sim/engine'
import { Activity } from '../components/Activity'
import { DeviceInspector, deviceInfo, verificationSummary } from '../components/DeviceInspector'
import { HomeFallback } from '../components/HomeFallback'
import { SceneBoundary } from '../components/SceneBoundary'
import { Button } from '../components/ui'

const HouseScene = memo(lazy(() => import('../house/HouseScene')))
const rooms: { id: RoomId; label: string }[] = [{ id: 'all', label: 'All rooms' }, { id: 'living', label: 'Living room' }, { id: 'bedroom', label: 'Bedroom' }, { id: 'entry', label: 'Entry' }]

export function Overview({ state, dispatch, reducedMotion, navigate }: { state: SimState; dispatch: Dispatch<SimAction>; reducedMotion: boolean; navigate(view: string): void }) {
  const [room, setRoom] = useState<RoomId>('all')
  const [selected, setSelected] = useState<DeviceId>('lock')
  const [roofVisible, setRoofVisible] = useState(false)
  const [inspecting, setInspecting] = useState(false)
  const [sceneFailed, setSceneFailed] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [viewCommand, setViewCommand] = useState<{ kind: 'reset' | 'zoom-in' | 'zoom-out'; serial: number }>({ kind: 'reset', serial: 0 })
  const inspectButton = useRef<HTMLButtonElement>(null)
  const home = useMemo(() => ({ doorOpen: state.home.doorOpen, boltExtended: state.home.boltExtended, lightOn: state.home.lightOn }), [state.home.doorOpen, state.home.boltExtended, state.home.lightOn])
  const selectDevice = useCallback((device: DeviceId) => { setSelected(device) }, [])
  const selectRoom = useCallback((next: RoomId) => setRoom(next), [])
  const onReady = useCallback(() => setSceneReady(true), [])
  const onError = useCallback(() => { setSceneReady(false); setSceneFailed(true) }, [])
  const controlView = (kind: 'reset' | 'zoom-in' | 'zoom-out') => setViewCommand(last => ({ kind, serial: last.serial + 1 }))
  const info = deviceInfo[selected]
  const summary = verificationSummary(state)
  const baselineProposals = getProposals(state, 'baseline')
  const guardProposals = getProposals(state, 'guard')
  const excludedCount = Math.max(0, baselineProposals.length - guardProposals.length)
  const guestPaths = state.grants.filter(g => g.active && g.beneficiary === 'guest' && (g.expiresAt === null || g.expiresAt > state.clock.now)).length
  const guestActive = state.principals.find(p => p.id === 'guest')?.active
  const currentText = selected === 'light' ? `Light is ${home.lightOn ? 'on' : 'off'}` : selected === 'door-contact' ? `Door is ${home.doorOpen ? 'open' : 'closed'}` : summary.label
  const closeInspector = () => { setInspecting(false); inspectButton.current?.focus() }

  return <>
    <div className="page-heading"><div><h1>Home overview</h1><p>Choose a room. Select a device. See what needs your attention.</p></div><Button variant="primary" onClick={() => navigate('lab')}><FlaskConical size={16} /><span>Try a scenario</span></Button></div>
    <div className={`home-layout ${inspecting ? 'home-layout--inspecting' : ''}`}>
      <section className="home-workspace" aria-labelledby="house-title"><h2 id="house-title" className="sr-only">Interactive home</h2>
        <div className="room-selector" role="group" aria-label="Choose a room">{rooms.map(item => <button key={item.id} aria-pressed={room === item.id} onClick={() => setRoom(item.id)}>{item.label}</button>)}</div>
        <div className="house-viewport">
          {!sceneFailed && <div className="viewport-heading"><span>Ground floor</span><em>{room === 'bedroom' ? 'No connected devices in this room' : '4 connected devices'}</em></div>}
          {sceneReady && !sceneFailed && <div className="view-controls" role="group" aria-label="House view controls"><Button className="icon-button" aria-label="Zoom out" title="Zoom out" onClick={() => controlView('zoom-out')}><Minus size={16} /></Button><Button className="icon-button" aria-label="Zoom in" title="Zoom in" onClick={() => controlView('zoom-in')}><Plus size={16} /></Button><Button className="icon-button" aria-label="Reset house view" title="Reset view" onClick={() => controlView('reset')}><RotateCcw size={15} /></Button></div>}
          <div className="scene-holder" data-testid="house-scene">
            {sceneFailed ? <HomeFallback onSelect={selectDevice} /> : <SceneBoundary onError={onError} fallback={<HomeFallback onSelect={selectDevice} />}><Suspense fallback={<HomeFallback onSelect={selectDevice} loading />}><HouseScene room={room} selectedDevice={selected} home={home} roofVisible={roofVisible} onSelectDevice={selectDevice} onSelectRoom={selectRoom} viewCommand={viewCommand} reducedMotion={reducedMotion} onReady={onReady} onError={onError} /></Suspense></SceneBoundary>}
          </div>
          <div className="viewport-footer"><p>{sceneFailed ? 'Select a device below to use its controls.' : !sceneReady ? 'Preparing the interactive home…' : <><span>Drag to orbit · Use + / − to zoom</span><span className="hint-separator">·</span>Select a device to inspect it</>}</p>{sceneReady && !sceneFailed && <Button onClick={() => setRoofVisible(v => !v)} aria-pressed={roofVisible}><Layers2 size={14} />{roofVisible ? 'Hide' : 'Show'} roof</Button>}</div>
          <span className="sr-only" role="status">{sceneFailed ? 'Using accessible home plan.' : sceneReady ? 'Interactive home ready.' : 'Preparing the interactive home.'}</span>
        </div>
        <div className="selected-device-row"><div className="selected-device"><info.Icon size={21} strokeWidth={1.5} /><div><label className="device-picker"><span className="sr-only">Choose a device</span><select aria-label="Choose a device" value={selected} onChange={e => setSelected(e.target.value as DeviceId)}>{Object.entries(deviceInfo).map(([id, item]) => <option key={id} value={id}>{item.name}</option>)}</select><ChevronDown size={13} /></label><p>{info.location}<span aria-hidden="true"> · </span>{currentText}</p></div></div><div className="selected-actions"><Button variant="primary" ref={inspectButton} aria-expanded={inspecting} aria-controls={inspecting ? 'device-inspector' : undefined} onClick={() => setInspecting(v => !v)}>{inspecting ? <PanelRightClose size={15} /> : null}<span>{inspecting ? 'Hide details' : 'Inspect device'}</span>{!inspecting && <ArrowRight size={15} />}</Button></div></div>
      </section>
      {inspecting && <DeviceInspector state={state} dispatch={dispatch} device={selected} onClose={closeInspector} />}
    </div>
    <section className="trust-overview" aria-labelledby="trust-heading"><div className="trust-intro"><h2 id="trust-heading">Trust overview</h2><p>Three separate checks</p></div><div className="trust-list">
      <button className="trust-row" onClick={() => navigate('alibi')}><span>ALIBI</span><span className={`trust-row-state tone-${summary.tone}`}><i />{summary.label}</span><ArrowRight size={16} /></button>
      <button className="trust-row" onClick={() => navigate('access')}><span>Ghost Access</span><span className={`trust-row-state ${!guestActive ? 'tone-positive' : 'tone-neutral'}`}><i />{guestPaths ? `${guestPaths} guest access ${guestPaths === 1 ? 'path' : 'paths'} to review` : 'Guest access removed'}</span><ArrowRight size={16} /></button>
      <button className="trust-row" onClick={() => navigate('habits')}><span>Habit Guard</span><span className={`trust-row-state ${excludedCount ? 'tone-positive' : 'tone-neutral'}`}><i />{excludedCount ? `${excludedCount} unapproved ${excludedCount === 1 ? 'pattern' : 'patterns'} excluded` : guardProposals.length ? `${guardProposals.length} ${guardProposals.length === 1 ? 'proposal' : 'proposals'} awaiting review` : 'No routine proposals yet'}</span><ArrowRight size={16} /></button>
    </div></section>
    <Activity events={state.activity} />
    <div className="overview-caption"><span><House size={12} />Browser simulation · No real devices connected</span><span><Square size={10} />Maple residence · Single-storey home</span></div>
    {state.scenario && <div className="scenario-context"><FlaskConical size={14} /><span>A demo scenario is active. Change inputs or reset in Demo Lab.</span><button onClick={() => navigate('lab')}>Open Demo Lab<ArrowRight size={13} /></button></div>}
  </>
}
