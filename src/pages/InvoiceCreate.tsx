import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { generateId } from '@/lib/utils'
import { calculateInvoiceTotals } from '@/lib/tax'
import { Printer, Save } from 'lucide-react'
import type { Invoice, InvoiceItem, Customer } from '@/types'
import InvoicePreview from '@/components/InvoicePreview'
import ShareInvoice from '@/components/ShareInvoice'
import { useReactToPrint } from 'react-to-print'

export default function InvoiceCreate() {
  const { id } = useParams()
  const navigate = useNavigate()
  const printRef = useRef<HTMLDivElement>(null)
  
  const customers = useLiveQuery(() => db.customers.toArray()) || []
  const products = useLiveQuery(() => db.products.toArray()) || []
  const templates = useLiveQuery(() => db.templates.toArray()) || []
  const settings = useLiveQuery(() => db.settings.get(1))

  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    type: 'invoice',
    status: 'draft',
    date: new Date(),
    items: [],
    subtotal: 0,
    taxType: 'exclusive',
    taxes: [],
    shipping: 0,
    adjustment: 0,
    total: 0,
    amountPaid: 0,
    currency: 'INR',
    templateId: 't1'
  })

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>()

  useEffect(() => {
    if (id) {
      db.invoices.get(id).then(inv => {
        if (inv) setInvoice(inv)
      })
    }
  }, [id])

  useEffect(() => {
    if (templates.length > 0 && !invoice.templateId) {
      const defaultTemplate = templates.find(t => t.isDefault) || templates[0]
      setInvoice(prev => ({ ...prev, templateId: defaultTemplate.id }))
    }
  }, [templates])

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: generateId(),
      name: '',
      quantity: 1,
      unit: 'pcs',
      rate: 0,
      taxRate: 18,
      amount: 0
    }
    setInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const items = [...(invoice.items || [])]
    items[index] = { ...items[index], [field]: value }
    
    if (field === 'quantity' || field === 'rate') {
      items[index].amount = items[index].quantity * items[index].rate
    }
    
    recalculateTotals({ ...invoice, items })
  }

  const removeItem = (index: number) => {
    const items = [...(invoice.items || [])]
    items.splice(index, 1)
    recalculateTotals({ ...invoice, items })
  }

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    
    updateItem(index, 'productId', product.id)
    updateItem(index, 'name', product.name)
    updateItem(index, 'rate', product.sellingPrice)
    updateItem(index, 'unit', product.unit)
    updateItem(index, 'taxRate', product.taxRate)
    updateItem(index, 'hsn', product.hsn)
  }

  const recalculateTotals = (invoiceData: Partial<Invoice>) => {
    const totals = calculateInvoiceTotals(
      invoiceData.items || [],
      invoiceData.taxType || 'exclusive',
      invoiceData.discount,
      invoiceData.shipping || 0,
      invoiceData.adjustment || 0
    )
    
    setInvoice({
      ...invoiceData,
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      total: totals.total
    })
  }

  const saveInvoice = async (status: 'draft' | 'unpaid' | 'paid') => {
    if (!invoice.customerId || !invoice.items?.length) {
      alert('Please select customer and add items')
      return
    }

    const invoiceNumber = invoice.number || `${settings?.invoicePrefix || 'INV'}-${Date.now()}`
    
    const invoiceData: Invoice = {
      id: invoice.id || generateId(),
      type: invoice.type as any,
      number: invoiceNumber,
      status,
      date: invoice.date!,
      customerId: invoice.customerId,
      items: invoice.items,
      subtotal: invoice.subtotal || 0,
      taxType: invoice.taxType || 'exclusive',
      taxes: invoice.taxes || [],
      shipping: invoice.shipping || 0,
      adjustment: invoice.adjustment || 0,
      total: invoice.total || 0,
      amountPaid: status === 'paid' ? invoice.total || 0 : 0,
      currency: invoice.currency || 'INR',
      templateId: invoice.templateId || 't1',
      notes: invoice.notes,
      terms: invoice.terms,
      createdAt: invoice.createdAt || new Date(),
      updatedAt: new Date()
    }

    if (id) {
      await db.invoices.put(invoiceData)
    } else {
      await db.invoices.add(invoiceData)
    }

    navigate('/invoices')
  }

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{id ? 'Edit Invoice' : 'New Invoice'}</h1>
        <div className="flex gap-2">
          {id && (
            <ShareInvoice 
              invoice={invoice as Invoice}
              customer={selectedCustomer}
              settings={settings}
            />
          )}
          <Button variant="outline" onClick={() => saveInvoice('draft')}>
            <Save size={16} className="mr-2" />
            Save Draft
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer size={16} className="mr-2" />
            Print
          </Button>
          <Button onClick={() => saveInvoice('unpaid')}>Save Invoice</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <Select
                  value={invoice.customerId}
                  onChange={e => {
                    setInvoice({ ...invoice, customerId: e.target.value })
                    setSelectedCustomer(customers.find(c => c.id === e.target.value))
                  }}
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Date</label>
                <Input
                  type="date"
                  value={invoice.date?.toISOString().split('T')[0]}
                  onChange={e => setInvoice({ ...invoice, date: new Date(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax Type</label>
                <Select
                  value={invoice.taxType}
                  onChange={e => recalculateTotals({ ...invoice, taxType: e.target.value as any })}
                >
                  <option value="exclusive">Tax Exclusive</option>
                  <option value="inclusive">Tax Inclusive</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Template</label>
                <Select
                  value={invoice.templateId}
                  onChange={e => setInvoice({ ...invoice, templateId: e.target.value })}
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Items</h2>
              <Button onClick={addItem} variant="outline">Add Item</Button>
            </div>
            
            <div className="space-y-3">
              {invoice.items?.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-start border-b pb-3">
                  <div className="col-span-4">
                    <Select
                      value={item.productId || ''}
                      onChange={e => selectProduct(index, e.target.value)}
                      className="mb-2"
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </Select>
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={e => updateItem(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={e => updateItem(index, 'rate', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Tax %"
                      value={item.taxRate}
                      onChange={e => updateItem(index, 'taxRate', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input value={item.amount.toFixed(2)} disabled />
                  </div>
                  <div className="col-span-1">
                    <Button variant="destructive" onClick={() => removeItem(index)} className="w-full">×</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Additional Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <Textarea
                  placeholder="Notes for customer"
                  value={invoice.notes || ''}
                  onChange={e => setInvoice({ ...invoice, notes: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Terms & Conditions</label>
                <Textarea
                  placeholder="Terms and conditions"
                  value={invoice.terms || ''}
                  onChange={e => setInvoice({ ...invoice, terms: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{invoice.subtotal?.toFixed(2)}</span>
              </div>
              {invoice.taxes?.map(tax => (
                <div key={tax.name} className="flex justify-between text-gray-600">
                  <span>{tax.name}:</span>
                  <span>₹{tax.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t font-bold text-lg">
                <span>Total:</span>
                <span>₹{invoice.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="hidden">
            <div ref={printRef}>
              <InvoicePreview
                invoice={invoice as Invoice}
                customer={selectedCustomer}
                settings={settings}
                template={templates.find(t => t.id === invoice.templateId)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
