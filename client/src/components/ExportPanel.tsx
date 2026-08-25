import { useState } from 'react'
import { CalendarDays, Download } from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'

interface ExportPanelProps {
  onExport: (startDate: string, endDate: string) => void | Promise<void>
}

export function ExportPanel({ onExport }: ExportPanelProps) {
  const [range, setRange] = useState<DateRange | undefined>(undefined)
  const [exporting, setExporting] = useState(false)

  const canExport = Boolean(range?.from && range?.to)

  async function handleExport() {
    if (!range?.from || !range?.to) return
    setExporting(true)
    try {
      await onExport(format(range.from, 'yyyy-MM-dd'), format(range.to, 'yyyy-MM-dd'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="rounded-2xl bg-surface p-5">
      <p className="mb-3 text-sm text-text-muted">Export your history</p>
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
              {range?.from && range?.to
                ? `${format(range.from, 'MMM d')} \u2013 ${format(range.to, 'MMM d')}`
                : 'Choose a date range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={1} />
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          size="sm"
          disabled={!canExport || exporting}
          onClick={handleExport}
        >
          <Download className="h-4 w-4" strokeWidth={1.75} />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>
    </div>
  )
}
