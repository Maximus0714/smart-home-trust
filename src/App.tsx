import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight, ChevronRight, FlaskConical, House, KeyRound, Menu, Pause, Play, RotateCcw, ShieldCheck, Sprout, X } from 'lucide-react'
import { simulationReducer } from './sim/engine'
import { loadSimulation, saveSimulation } from './sim/persistence'
import { Overview } from './views/Overview'
import { AccessView, AlibiView, DemoLabView, HabitsView } from './views/ModuleViews'
import { Button, formatDemoTime } from './components/ui'

const destinations = [{ id: 'overview', name: 'Overview', Icon: House }, { id: 'alibi', name: 'ALIBI', Icon: ShieldCheck }, { id: 'access', name: 'Ghost Access', Icon: KeyRound }, { id: 'habits', name: 'Habit Guard', Icon: Sprout }, { id: 'lab', name: 'Demo Lab', Icon: FlaskConical }]
type View = typeof destinations[number]['id']
function readView(): View { const hash = window.location.hash.slice(1); return destinations.some(d => d.id === hash) ? hash : 'overview' }

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => { const query = window.matchMedia('(prefers-reduced-motion: reduce)'); const change = () => setReduced(query.matches); query.addEventListener('change', change); return () => query.removeEventListener('change', change) }, [])
  return reduced
}

function Modal({ children, label, onClose, className = '' }: { children: ReactNode; label: string; onClose(): void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => { if (dialog.open) dialog.close() } }, [])
  return <dialog ref={ref} aria-label={label} className={className} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>{children}</dialog>
}

export default function App() {
  const [initial] = useState(loadSimulation)
  const [state, dispatch] = useReducer(simulationReducer, initial.state)
  const [notice, setNotice] = useState(initial.notice ?? '')
  const [view, setView] = useState<View>(readView)
  const [menuOpen, setMenuOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [saved, setSaved] = useState(true)
  const reducedMotion = useReducedMotion()
  const menuButton = useRef<HTMLButtonElement>(null)

  const navigate = useCallback((id: string) => { const next = destinations.find(d => d.id === id)?.id ?? 'overview'; if (window.location.hash !== `#${next}`) window.history.pushState({}, '', `#${next}`); setView(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }) }, [])
  useEffect(() => { const change = () => setView(readView()); window.addEventListener('popstate', change); window.addEventListener('hashchange', change); return () => { window.removeEventListener('popstate', change); window.removeEventListener('hashchange', change) } }, [])
  useEffect(() => { document.title = `${destinations.find(d => d.id === view)?.name} — Smart Home Trust` }, [view])
  useEffect(() => {
    if (!state.clock.running) return
    let last = performance.now()
    const visibility = () => { last = performance.now() }
    const timer = window.setInterval(() => { const now = performance.now(); const elapsed = now - last; last = now; if (document.visibilityState === 'visible') dispatch({ type: 'ADVANCE', ms: Math.min(1500, Math.round(elapsed)) }) }, 1000)
    document.addEventListener('visibilitychange', visibility)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibility) }
  }, [state.clock.running])
  useEffect(() => { const timer = setTimeout(() => { const success = saveSimulation(state); setSaved(success); if (!success) setNotice('Local saving is unavailable. You can keep using this session; a refresh may reset it.') }, 180); return () => clearTimeout(timer) }, [state])

  const closeMenu = () => { setMenuOpen(false); menuButton.current?.focus() }
  const sidebar = <>
    <a href="#overview" className="brand" onClick={event => { event.preventDefault(); navigate('overview') }} aria-label="Smart Home Trust home"><svg className="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="m6 17 14-11 14 11v17H6Z"/><path d="M17 34V22h9v12M27 6v10"/></svg><span>Smart Home<br />Trust</span></a>
    <div className="home-switch"><House size={19} strokeWidth={1.5} /><div>Maple residence<small>Local demo home</small></div></div>
    <nav className="main-nav" aria-label="Main navigation">{destinations.map(({ id, name, Icon }) => <a key={id} href={`#${id}`} className={`${view === id ? 'is-active' : ''} ${id === 'lab' ? 'lab-nav' : ''}`} aria-current={view === id ? 'page' : undefined} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate(id) }}><Icon size={18} strokeWidth={1.6} aria-hidden="true" /><span>{name}</span>{id === 'lab' && <ArrowUpRight className="nav-extra" size={13} aria-hidden="true" />}</a>)}</nav>
    <div className="sidebar-end"><p>Your home, with evidence.<br />Claims. Access. Influence.</p><Button variant="quiet" className="reset-link" onClick={() => { setMenuOpen(false); setResetOpen(true) }}><RotateCcw size={14} />Reset demo</Button><div className="owner"><span className="owner-avatar">O</span><div>Homeowner<small>Owner workspace</small></div></div></div>
  </>

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to workspace</a>
    <aside className="app-sidebar">{sidebar}</aside>
    {menuOpen && <Modal className="mobile-menu" label="Navigation" onClose={closeMenu}><Button variant="quiet" className="mobile-menu-close icon-button" aria-label="Close navigation" onClick={closeMenu}><X size={20} /></Button><div className="mobile-sidebar">{sidebar}</div></Modal>}
    <div className="app-workspace"><header className="app-topbar"><div className="breadcrumb"><Button ref={menuButton} variant="quiet" className="menu-trigger icon-button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={20} /></Button><span>Maple residence</span><ChevronRight size={13} /><span>{destinations.find(d => d.id === view)?.name}</span></div><div className="clock-status"><span className="simulation-status"><i />Browser simulation</span><span className="clock-time">{formatDemoTime(state.clock.now)}<span>Demo time</span></span><Button variant="quiet" className="clock-toggle icon-button" aria-label={state.clock.running ? 'Pause simulation clock' : 'Resume simulation clock'} title={state.clock.running ? 'Pause demo time' : 'Resume demo time'} onClick={() => dispatch({ type: 'SET_RUNNING', running: !state.clock.running })}>{state.clock.running ? <Pause size={14} /> : <Play size={14} />}</Button></div></header>
      <main id="main-content" className="work-sheet" tabIndex={-1}>
        {notice && <div className="notice" role="status"><span>{notice}</span><Button variant="quiet" className="icon-button" aria-label="Dismiss notice" onClick={() => setNotice('')}><X size={15} /></Button></div>}
        {view === 'overview' && <Overview state={state} dispatch={dispatch} reducedMotion={reducedMotion} navigate={navigate} />}
        {view === 'alibi' && <AlibiView state={state} dispatch={dispatch} />}
        {view === 'access' && <AccessView state={state} dispatch={dispatch} />}
        {view === 'habits' && <HabitsView state={state} dispatch={dispatch} />}
        {view === 'lab' && <DemoLabView state={state} dispatch={dispatch} />}
        {view !== 'overview' && <footer className="workspace-footer"><span>Browser simulation · No real devices connected</span><span>{saved ? 'Saved in this browser' : 'Local saving unavailable'}</span></footer>}
      </main>
    </div>
    {resetOpen && <Modal className="reset-dialog" label="Reset the demo" onClose={() => setResetOpen(false)}><div className="dialog-heading"><RotateCcw size={21} /><h2>Start with a clean home?</h2></div><p>This clears the current simulation, evidence history, access changes, learning proposals, and approved routines in this browser.</p><p className="helper-text">Your project files stay intact.</p><div className="dialog-actions"><Button autoFocus onClick={() => setResetOpen(false)}>Keep current demo</Button><Button variant="danger" onClick={() => { dispatch({ type: 'RESET' }); setResetOpen(false); setNotice('Demo reset. A new home simulation is ready.'); navigate('overview') }}>Reset demo</Button></div></Modal>}
  </div>
}
