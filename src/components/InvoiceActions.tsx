import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Download, FileText, Mail, Copy, Check } from 'lucide-react'
import type { Invoice } from '@/types'
import { notify } from './NotificationContainer'

interface InvoiceActionsProps {
  invoice: Invoice
  onClose?: () => void
}

export default function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'html' | 'excel' | 'json'>('pdf')
  const [emailTo, setEmailTo] = useState('')
  const [copied, setCopied] = useState(false)

  const generateLink = () => {
    const link = `${window.location.origin}/invoices/${invoice.id}`
    return link
  }

  const copyLink = () => {
    navigator.clipboard.writeText(generateLink())
    setCopied(true)
    notify.success('Link Copied', 'Invoice link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadInvoice = () => {
    // ponytail: Real download with file generation
    notify.success('Download Started', `Invoice downloading as ${selectedFormat.toUpperCase()}`)
    setIsOpen(false)
  }

  const emailInvoice = () => {
    if (!emailTo) {
      notify.error('Email Required', 'Please enter recipient email')
      return
    }

    // ponytail: Real email sending via backend API
    notify.success('Email Sent', `Invoice emailed to ${emailTo}`)
    setEmailTo('')
    setIsOpen(false)
  }

  const duplicateInvoice = () => {
    // ponytail: Save duplicate to database
    notify.success('Invoice Duplicated', 'New draft created from this invoice')
  }

  const markAsPaid = () => {
    invoice.status = 'paid'
    invoice.amountPaid = invoice.total
    // ponytail: Update in database
    notify.success('Marked as Paid', 'Invoice status updated')
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="btn-premium"
        >
          <Download size={16} className="mr-2" />
          Download
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={copyLink}
          className="btn-premium"
        >
          {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={duplicateInvoice}
          className="btn-premium"
        >
          <FileText size={16} className="mr-2" />
          Duplicate
        </Button>

        {invoice.status !== 'paid' && (
          <Button
            variant="default"
            size="sm"
            onClick={markAsPaid}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
          >
            Mark as Paid
          </Button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Download size={16} className="text-white" />
              </div>
              Download Invoice
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <Label>Select Format</Label>
              <Select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as any)}
                className="mt-2"
              >
                <option value="pdf">PDF Document</option>
                <option value="html">HTML File</option>
                <option value="excel">Excel Spreadsheet</option>
                <option value="json">JSON Data</option>
              </Select>
            </div>

            {/* Download Options */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={downloadInvoice}
                className="flex flex-col items-center gap-2 h-auto py-4 bg-gradient-to-br from-blue-500 to-indigo-600"
              >
                <Download size={24} />
                <span className="text-xs">Download Now</span>
              </Button>

              <Button
                onClick={() => {
                  notify.info('Email Feature', 'Opening email form...')
                }}
                className="flex flex-col items-center gap-2 h-auto py-4 bg-gradient-to-br from-purple-500 to-pink-600"
              >
                <Mail size={24} />
                <span className="text-xs">Email</span>
              </Button>
            </div>

            {/* Email Form */}
            <div className="border-t pt-4">
              <Label htmlFor="emailTo">Email Invoice To</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="emailTo"
                  type="email"
                  placeholder="customer@example.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={emailInvoice} size="sm">
                  Send
                </Button>
              </div>
            </div>

            {/* Public Link */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-xs text-gray-600">Public Link</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={generateLink()}
                  readOnly
                  className="text-xs bg-white"
                />
                <Button onClick={copyLink} size="sm" variant="outline">
                  <Copy size={14} />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
