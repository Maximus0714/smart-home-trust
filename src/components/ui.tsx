import type { ComponentProps, ReactNode } from 'react'

export function Button({ variant = 'secondary', className = '', type = 'button', ...props }: ComponentProps<'button'> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger' }) {
  return <button type={type} className={`button button--${variant} ${className}`} {...props} />
}

export function Status({ tone = 'neutral', children }: { tone?: 'neutral' | 'positive' | 'negative' | 'warning'; children: ReactNode }) {
  return <span className={`status status--${tone}`}><i aria-hidden="true" />{children}</span>
}

const timeFormatter = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
const dateFormatter = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })
export function formatDemoTime(timestamp: number) { return timeFormatter.format(timestamp) }
export function formatDemoDate(timestamp: number) { return dateFormatter.format(timestamp) }
