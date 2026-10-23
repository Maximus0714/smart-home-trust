import { ChevronDown } from 'lucide-react'
import type { AuditEvent } from '../sim/types'
import { formatDemoTime } from './ui'

const names = { home: 'Home', alibi: 'ALIBI', access: 'Ghost Access', habits: 'Habit Guard', system: 'System' }
export function Activity({ events }: { events: AuditEvent[] }) {
  const sorted = [...events].sort((a, b) => b.at - a.at || b.id.localeCompare(a.id)).slice(0, 40)
  return <details className="activity"><summary><span>Recent activity</span><span className="activity-hint">{events.length} {events.length === 1 ? 'event' : 'events'}<ChevronDown size={16} /></span></summary><div className="activity-content">
    {sorted.length === 0 ? <p className="empty-inline">Your actions and their evidence will appear here. Start by selecting a device.</p> : sorted.map(event => <article className="event" key={event.id}><time dateTime={new Date(event.at).toISOString()}>{formatDemoTime(event.at)}</time><div><strong>{event.title}</strong><p>{event.detail}</p></div><span className="event-module">{names[event.module]}</span></article>)}
  </div></details>
}
