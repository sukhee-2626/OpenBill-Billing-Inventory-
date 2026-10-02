import { Button } from './ui/button'
import { MessageCircle, Mail, Share2 } from 'lucide-react'
import { shareInvoiceWhatsApp, shareInvoiceEmail, shareInvoiceLink } from '@/lib/share'
import type { Invoice, Customer, Settings } from '@/types'

interface ShareInvoiceProps {
  invoice: Invoice
  customer?: Customer
  settings?: Settings
}

export default function ShareInvoice({ invoice, customer, settings }: ShareInvoiceProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => shareInvoiceWhatsApp(invoice, customer, settings)}
        disabled={!customer?.phone}
        title={!customer?.phone ? 'Customer phone number required' : 'Share via WhatsApp'}
      >
        <MessageCircle size={16} className="mr-2" />
        WhatsApp
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => shareInvoiceEmail(invoice, customer, settings)}
        disabled={!customer?.email}
        title={!customer?.email ? 'Customer email required' : 'Share via Email'}
      >
        <Mail size={16} className="mr-2" />
        Email
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => shareInvoiceLink(invoice.id)}
      >
        <Share2 size={16} className="mr-2" />
        Share Link
      </Button>
    </div>
  )
}
