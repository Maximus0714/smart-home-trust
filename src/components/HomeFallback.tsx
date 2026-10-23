import { DoorClosed, Lamp, Radio, ScanLine } from 'lucide-react'
import type { DeviceId } from '../sim/types'

export function HomeFallback({ onSelect, loading = false }: { onSelect(id: DeviceId): void; loading?: boolean }) {
  return <div className="home-fallback" role="group" aria-label="Accessible home plan">
    <div className="fallback-caption"><strong>{loading ? 'Preparing your home' : 'Home plan'}</strong><span>{loading ? 'Loading the interactive 3D scene…' : '3D is unavailable. All device controls remain available.'}</span>{!loading && <button className="fallback-retry" onClick={() => window.location.reload()}>Reload the 3D view</button>}</div>
    <div className="floorplan">
      <div className="floorplan-room living"><span>Living room</span><button onClick={() => onSelect('light')}><Lamp size={18} />Living room light</button></div>
      <div className="floorplan-room bedroom"><span>Bedroom</span><div className="plan-bed" aria-hidden="true" /></div>
      <div className="floorplan-room kitchen"><span>Kitchen</span><div className="plan-counter" aria-hidden="true" /></div>
      <div className="floorplan-room entry"><span>Entry</span><button onClick={() => onSelect('lock')}><DoorClosed size={18} />Front door</button><div className="plan-sensors"><button onClick={() => onSelect('bolt-witness')} aria-label="Select bolt witness"><Radio size={15} /></button><button onClick={() => onSelect('door-contact')} aria-label="Select door contact"><ScanLine size={15} /></button></div></div>
    </div>
  </div>
}
