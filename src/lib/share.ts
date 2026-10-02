import { Invoice, Customer, Settings } from '@/types'

export function shareInvoiceWhatsApp(invoice: Invoice, customer?: Customer, settings?: Settings) {
  const message = `
Hello ${customer?.name || 'Customer'},

Invoice from ${settings?.businessName || 'Our Business'}
Invoice #: ${invoice.number}
Date: ${new Date(invoice.date).toLocaleDateString()}
Amount: ₹${invoice.total.toFixed(2)}

${invoice.status === 'unpaid' ? '⚠️ Payment Pending' : '✅ Paid'}

${settings?.phone ? `Contact: ${settings.phone}` : ''}

Thank you for your business!
  `.trim()

  const phone = customer?.phone?.replace(/\D/g, '') || ''
  const whatsappURL = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  
  window.open(whatsappURL, '_blank')
}

export function sharePaymentReminderWhatsApp(customer: Customer, balance: number, settings?: Settings) {
  const message = `
Hello ${customer.name},

This is a friendly reminder about your pending payment.

Outstanding Balance: ₹${balance.toFixed(2)}

Please make the payment at your earliest convenience.

${settings?.upiId ? `\nUPI: ${settings.upiId}` : ''}
${settings?.phone ? `Contact: ${settings.phone}` : ''}

Thank you!
${settings?.businessName || 'Our Business'}
  `.trim()

  const phone = customer.phone?.replace(/\D/g, '') || ''
  const whatsappURL = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  
  window.open(whatsappURL, '_blank')
}

export function shareInvoiceEmail(invoice: Invoice, customer?: Customer, settings?: Settings) {
  const subject = `Invoice ${invoice.number} from ${settings?.businessName || 'Our Business'}`
  const body = `
Dear ${customer?.name || 'Customer'},

Please find your invoice details below:

Invoice Number: ${invoice.number}
Date: ${new Date(invoice.date).toLocaleDateString()}
Amount: ₹${invoice.total.toFixed(2)}
Status: ${invoice.status.toUpperCase()}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

${settings?.businessName || 'Our Business'}
${settings?.phone || ''}
${settings?.email || ''}
  `.trim()

  const mailtoURL = `mailto:${customer?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoURL, '_blank')
}

export function shareInvoiceLink(invoiceId: string) {
  const url = `${window.location.origin}/invoices/${invoiceId}`
  
  if (navigator.share) {
    navigator.share({
      title: 'Invoice',
      text: 'View your invoice',
      url: url
    })
  } else {
    navigator.clipboard.writeText(url)
    alert('Invoice link copied to clipboard!')
  }
}
