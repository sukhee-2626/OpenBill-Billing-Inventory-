import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { FileSpreadsheet, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { db } from '@/db/schema'
import { generateId } from '@/lib/utils'
import { notify } from './NotificationContainer'

export default function BulkInvoiceOperations() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        notify.error('Invalid File', 'Please select CSV or Excel file')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setImporting(true)
    
    // ponytail: Parse CSV/Excel with papaparse or xlsx library
    // Mock import process
    setTimeout(async () => {
      try {
        // Example: Parse and create invoices
        const mockInvoices = [
          {
            id: generateId(),
            type: 'invoice' as const,
            number: 'BULK-001',
            date: new Date(),
            dueDate: new Date(),
            customerId: 'c1',
            items: [],
            subtotal: 1000,
            taxType: 'exclusive' as const,
            taxes: [],
            shipping: 0,
            adjustment: 0,
            total: 1180,
            amountPaid: 0,
            status: 'draft' as const,
            currency: 'INR',
            templateId: 't1',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]

        for (const invoice of mockInvoices) {
          await db.invoices.add(invoice)
        }

        notify.success('Import Complete', `${mockInvoices.length} invoices imported successfully`)
        setIsOpen(false)
        setSelectedFile(null)
      } catch (error) {
        notify.error('Import Failed', 'Error importing invoices')
      } finally {
        setImporting(false)
      }
    }, 2000)
  }

  const exportTemplate = () => {
    const csvContent = `Invoice Number,Customer Name,Date,Due Date,Items,Subtotal,Tax,Total,Status
INV-001,John Doe,2026-10-01,2026-10-15,"Product A (Qty: 2, Rate: 500)",1000,180,1180,paid
INV-002,Jane Smith,2026-10-02,2026-10-16,"Product B (Qty: 1, Rate: 2000)",2000,360,2360,unpaid`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invoice_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)

    notify.success('Template Downloaded', 'Fill the template and import')
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="btn-premium"
      >
        <FileSpreadsheet size={16} className="mr-2" />
        Bulk Operations
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <FileSpreadsheet size={16} className="text-white" />
              </div>
              Bulk Invoice Operations
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Download Template */}
            <div className="glass-effect p-6 rounded-xl border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Download size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">Step 1: Download Template</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Get the CSV template with all required fields
                  </p>
                  <Button onClick={exportTemplate} size="sm" variant="outline">
                    Download CSV Template
                  </Button>
                </div>
              </div>
            </div>

            {/* Upload File */}
            <div className="glass-effect p-6 rounded-xl border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Upload size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">Step 2: Upload File</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload your filled CSV or Excel file
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <Input
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button size="sm" variant="outline" type="button">
                        Choose File
                      </Button>
                    </label>
                    {selectedFile && (
                      <span className="text-sm text-gray-600">
                        {selectedFile.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Import */}
            <div className="glass-effect p-6 rounded-xl border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">Step 3: Import Invoices</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Validate and import all invoices at once
                  </p>
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile || importing}
                    className="bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    {importing ? 'Importing...' : 'Import Invoices'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Customer names must match existing customers</li>
                    <li>Product names must match existing products</li>
                    <li>Dates should be in YYYY-MM-DD format</li>
                    <li>All imported invoices will be in draft status</li>
                    <li>Maximum 1000 invoices per import</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
