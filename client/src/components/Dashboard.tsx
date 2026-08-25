import { ExportPanel } from './ExportPanel'
import { getEmotionMeta } from '../types/emotion'
import type { EmotionLog } from '../types/log'

interface DashboardProps {
  logs: EmotionLog[]
  onExport: (startDate: string, endDate: string) => void | Promise<void>
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function dayLabel(date: Date, today: Date) {
  if (isSameDay(date, today)) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (isSameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

/**
 * "Gentle scrollable history" -- day-grouped cards, muted emotion colors,
 * no charts, no numbers competing for attention. The goal is a calm
 * glance back, not a dashboard in the analytics-product sense.
 */
export function Dashboard({ logs, onExport }: DashboardProps) {
  const today = new Date()
  const todayLogs = logs.filter((log) => isSameDay(new Date(log.logged_at), today))

  // Group into the last 14 days, most recent first.
  const byDay = new Map<string, EmotionLog[]>()
  for (const log of logs) {
    const key = new Date(log.logged_at).toDateString()
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(log)
  }
  const days = Array.from(byDay.entries())
    .map(([key, dayLogs]) => ({ date: new Date(key), logs: dayLogs }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 14)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-surface p-5">
        <p className="text-sm text-text-muted">Today</p>
        <p className="mt-1 text-lg text-text">
          {todayLogs.length === 0
            ? 'No check-in yet — whenever you\u2019re ready.'
            : `${todayLogs.length} check-in${todayLogs.length > 1 ? 's' : ''} so far`}
        </p>
        {todayLogs.length > 0 && (
          <div className="mt-3 flex gap-2">
            {todayLogs.map((log) => {
              const meta = getEmotionMeta(log.emotion_type)
              const Icon = meta.icon
              return (
                <span
                  key={log.id}
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: meta.colorVar }}
                  title={meta.label}
                >
                  <Icon className="h-4.5 w-4.5 text-white" strokeWidth={1.75} />
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm text-text-muted">Last 14 days</p>
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {days.length === 0 && (
            <p className="py-6 text-center text-sm text-text-muted">
              Your history will show up here once you start checking in.
            </p>
          )}
          {days.map(({ date, logs: dayLogs }) => (
            <div
              key={date.toDateString()}
              className="flex items-center justify-between rounded-xl bg-surface px-4 py-3"
            >
              <span className="text-sm text-text">{dayLabel(date, today)}</span>
              <div className="flex gap-1.5">
                {dayLogs.map((log) => {
                  const meta = getEmotionMeta(log.emotion_type)
                  const Icon = meta.icon
                  return (
                    <span
                      key={log.id}
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ backgroundColor: meta.colorVar }}
                      title={meta.label}
                    >
                      <Icon className="h-3.5 w-3.5 text-white" strokeWidth={1.75} />
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ExportPanel onExport={onExport} />
    </div>
  )
}
