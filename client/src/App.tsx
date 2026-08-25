import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'
import { AuthGate } from './components/AuthGate'
import { LogFlow, type LogPayload } from './components/LogFlow'
import { Dashboard } from './components/Dashboard'
import { useLogsQuery, useCreateLog } from './hooks/useLogs'
import { useOfflineSync } from './hooks/useOfflineSync'
import { exportLogsCsv } from './lib/api-client'
import { requestPushPermission } from './lib/onesignal'

function AppShell() {
  useOfflineSync()
  const { data: logs = [] } = useLogsQuery()
  const createLog = useCreateLog()

  async function handleLog(payload: LogPayload) {
    await createLog.mutateAsync(payload)
    // First natural point of engagement -- not on page load. See
    // lib/onesignal.ts for the reasoning.
    void requestPushPermission()
  }

  async function handleExport(startDate: string, endDate: string) {
    const csv = await exportLogsCsv(startDate, endDate)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emotion-log-${startDate}-to-${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold text-text">How are you feeling?</h1>
      <LogFlow onSubmit={handleLog} />
      <div className="mt-8">
        <Dashboard logs={logs} onExport={handleExport} />
      </div>
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <AppShell />
      </AuthGate>
    </QueryClientProvider>
  )
}
