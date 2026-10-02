import { Button } from './ui/button'
import { db } from '@/db/schema'
import { generateId } from '@/lib/utils'
import type { Invoice } from '@/types'
import { FileText } from 'lucide-react'

interface ConvertDocumentProps {
  invoice: Invoice
  onConverted?: () => void
}

export default function ConvertDocument({ invoice, onConverted }: ConvertDocumentProps) {
  if (invoice.type !== 'quotation') return null

  const handleConvert = async () => {
    const settings = await db.settings.get(1)
    const newInvoice: Invoice = {
      ...invoice,
      id: generateId(),
      type: 'invoice',
      number: `${settings?.invoicePrefix || 'INV'}-${Date.now()}`,
      status: 'draft',
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await db.invoices.add(newInvoice)
    
    if (onConverted) onConverted()
    else window.location.href = `/invoices/${newInvoice.id}`
  }

  return (
    <Button onClick={handleConvert} variant="outline">
      <FileText size={16} className="mr-2" />
      Convert to Invoice
    </Button>
  )
}
