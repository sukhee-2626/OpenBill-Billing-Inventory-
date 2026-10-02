import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Bell, Repeat, Send } from 'lucide-react'
import { notify } from './NotificationContainer'
import type { Invoice } from '@/types'

interface RecurringInvoiceModalProps {
  invoice: Invoice
  isOpen: boolean
  onClose: () => void
}

export default function RecurringInvoiceModal({ isOpen, onClose }: RecurringInvoiceModalProps) {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [autoSend, setAutoSend] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')

  const handleCreate = async () => {
    // ponytail: Store in recurring_invoices table
    notify.success('Recurring Invoice Created', `Will generate ${frequency}ly starting ${startDate}`)
    onClose()
  }

  const calculateNextDate = (start: Date, freq: string): Date => {
    const next = new Date(start)
    switch (freq) {
      case 'daily': next.setDate(next.getDate() + 1); break
      case 'weekly': next.setDate(next.getDate() + 7); break
      case 'monthly': next.setMonth(next.getMonth() + 1); break
      case 'yearly': next.setFullYear(next.getFullYear() + 1); break
    }
    return next
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Repeat size={16} className="text-white" />
            </div>
            Create Recurring Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Frequency */}
          <div>
            <Label>Frequency</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    frequency === freq
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          {/* Auto Send */}
          <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              id="autoSend"
              checked={autoSend}
              onChange={(e) => setAutoSend(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="autoSend" className="cursor-pointer flex items-center gap-2">
              <Send size={16} className="text-blue-600" />
              <div>
                <p className="font-medium text-sm">Auto-send invoices</p>
                <p className="text-xs text-gray-600">Automatically email to customer</p>
              </div>
            </Label>
          </div>

          {/* Email */}
          {autoSend && (
            <div>
              <Label htmlFor="email">Recipient Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          {/* Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Bell size={20} className="text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-800 mb-1">Summary</p>
                <p className="text-gray-600">
                  Invoice will be generated <strong>{frequency}</strong> starting from{' '}
                  <strong>{new Date(startDate).toLocaleDateString()}</strong>
                  {endDate && (
                    <> until <strong>{new Date(endDate).toLocaleDateString()}</strong></>
                  )}
                </p>
                <p className="text-gray-600 mt-1">
                  Next invoice: <strong>{calculateNextDate(new Date(startDate), frequency).toLocaleDateString()}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Create Recurring Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
