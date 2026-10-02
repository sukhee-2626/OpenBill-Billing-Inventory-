import type { Invoice, Customer, Settings, Template } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { amountToWords } from '@/lib/currency'
import QRCodeGenerator, { generateUPIQR } from './QRCodeGenerator'

interface InvoicePreviewProps {
  invoice: Invoice
  customer?: Customer
  settings?: Settings
  template?: Template
}

export default function InvoicePreview({ invoice, customer, settings, template }: InvoicePreviewProps) {
  if (!template || !settings) return null

  const config = template.config
  const isThermal = config.paperSize === 'Thermal58' || config.paperSize === 'Thermal80'

  const containerClass = isThermal
    ? config.paperSize === 'Thermal58' ? 'thermal-58mm' : 'thermal-80mm'
    : 'w-[210mm] min-h-[297mm]' // A4

  const styles = {
    color: config.colors?.text || '#000',
    fontFamily: config.fonts?.family || 'Arial, sans-serif',
    fontSize: `${config.fonts?.size || 10}pt`,
  }

  const headerStyles = {
    fontSize: `${config.fonts?.headerSize || 24}pt`,
    color: config.colors?.primary || '#2563eb',
  }

  return (
    <div className={`${containerClass} bg-white p-8 mx-auto`} style={styles}>
      {/* Header */}
      <div className="mb-6">
        {config.header?.layout === 'centered' ? (
          <div className="text-center">
            <h1 className="font-bold mb-2" style={headerStyles}>{settings.businessName}</h1>
            {settings.businessAddress && (
              <div className="text-xs">
                <p>{settings.businessAddress.line1}</p>
                <p>{settings.businessAddress.city}, {settings.businessAddress.state} {settings.businessAddress.pincode}</p>
              </div>
            )}
            {settings.phone && <p className="text-xs">{settings.phone}</p>}
            {settings.gstin && <p className="text-xs">GSTIN: {settings.gstin}</p>}
          </div>
        ) : (
          <div className="flex justify-between">
            <div>
              <h1 className="font-bold mb-2" style={headerStyles}>{settings.businessName}</h1>
              {settings.businessAddress && (
                <div className="text-xs">
                  <p>{settings.businessAddress.line1}</p>
                  <p>{settings.businessAddress.city}, {settings.businessAddress.state}</p>
                  {settings.phone && <p>{settings.phone}</p>}
                </div>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold" style={{ color: config.colors?.primary }}>INVOICE</h2>
              <p className="text-sm mt-1">#{invoice.number}</p>
              <p className="text-xs">{formatDate(invoice.date)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details */}
      {config.fields?.customerDetails && customer && (
        <div className="mb-6 pb-4 border-b">
          <h3 className="font-semibold text-sm mb-2">Bill To:</h3>
          <div className="text-sm">
            <p className="font-medium">{customer.name}</p>
            {customer.phone && <p className="text-xs">{customer.phone}</p>}
            {customer.email && <p className="text-xs">{customer.email}</p>}
            {customer.gstin && <p className="text-xs">GSTIN: {customer.gstin}</p>}
            {customer.billingAddress && (
              <div className="text-xs mt-1">
                <p>{customer.billingAddress.line1}</p>
                <p>{customer.billingAddress.city}, {customer.billingAddress.state} {customer.billingAddress.pincode}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Items Table */}
      <table className="w-full mb-6 text-sm">
        <thead>
          <tr className="border-b-2" style={{ borderColor: config.colors?.primary }}>
            <th className="text-left py-2">#</th>
            <th className="text-left py-2">Item</th>
            {config.fields?.hsn && <th className="text-left py-2">HSN</th>}
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Rate</th>
            {config.fields?.tax && <th className="text-right py-2">Tax</th>}
            <th className="text-right py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">{index + 1}</td>
              <td className="py-2">
                <div className="font-medium">{item.name}</div>
                {config.fields?.itemDescription && item.description && (
                  <div className="text-xs text-gray-600">{item.description}</div>
                )}
              </td>
              {config.fields?.hsn && <td className="py-2">{item.hsn}</td>}
              <td className="text-right py-2">{item.quantity} {item.unit}</td>
              <td className="text-right py-2">{formatCurrency(item.rate, invoice.currency)}</td>
              {config.fields?.tax && <td className="text-right py-2">{item.taxRate}%</td>}
              <td className="text-right py-2">{formatCurrency(item.amount, invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="flex justify-between py-1 text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          {invoice.taxes.map(tax => (
            <div key={tax.name} className="flex justify-between py-1 text-sm text-gray-600">
              <span>{tax.name}:</span>
              <span>{formatCurrency(tax.amount, invoice.currency)}</span>
            </div>
          ))}
          {invoice.shipping > 0 && (
            <div className="flex justify-between py-1 text-sm">
              <span>Shipping:</span>
              <span>{formatCurrency(invoice.shipping, invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t-2 font-bold text-base" style={{ borderColor: config.colors?.primary }}>
            <span>Total:</span>
            <span>{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="mb-6 text-sm">
        <span className="font-semibold">Amount in Words: </span>
        <span className="italic">{amountToWords(invoice.total, invoice.currency)}</span>
      </div>

      {/* Notes */}
      {config.fields?.notes && invoice.notes && (
        <div className="mb-4">
          <h3 className="font-semibold text-sm mb-1">Notes:</h3>
          <p className="text-xs text-gray-700">{invoice.notes}</p>
        </div>
      )}

      {/* Terms */}
      {config.fields?.terms && invoice.terms && (
        <div className="mb-4">
          <h3 className="font-semibold text-sm mb-1">Terms & Conditions:</h3>
          <p className="text-xs text-gray-700">{invoice.terms}</p>
        </div>
      )}

      {/* Footer */}
      {config.footer?.show && (
        <div className="mt-8 pt-4 border-t">
          <div className="flex justify-between items-end mb-4">
            {/* Stamp */}
            {settings.stampImage && (
              <div className="text-center">
                <img src={settings.stampImage} alt="Stamp" className="h-16 object-contain mb-1" />
                <p className="text-xs">Company Seal</p>
              </div>
            )}
            
            <div className="flex-1"></div>
            
            {/* Signature */}
            {settings.signatureImage && (
              <div className="text-center">
                <img src={settings.signatureImage} alt="Signature" className="h-16 object-contain mb-1" />
                <p className="text-xs border-t border-gray-400 pt-1">Authorized Signatory</p>
              </div>
            )}
          </div>
          
          <div className="text-center text-xs text-gray-600">
            {config.footer.text || 'Thank you for your business!'}
          </div>
          
          {/* QR Code */}
          {config.qrCode?.show && settings.upiId && (
            <div className="mt-4 flex justify-center">
              <div className="text-center">
                <QRCodeGenerator 
                  value={generateUPIQR(settings.upiId, settings.businessName, invoice.total, invoice.number)}
                  size={120}
                />
                <p className="text-xs mt-1">Scan to Pay</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
