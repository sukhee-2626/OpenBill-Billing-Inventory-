import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Plus, Trash2, Calculator } from 'lucide-react'
import { generateId } from '@/lib/utils'

interface InvoiceGeneratorProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (invoiceData: any) => void
}

interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export default function InvoiceGenerator({ isOpen, onClose, onGenerate }: InvoiceGeneratorProps) {
  // From details
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [fromAddress, setFromAddress] = useState('')
  const [fromPhone, setFromPhone] = useState('')
  
  // To details
  const [toName, setToName] = useState('')
  const [toEmail, setToEmail] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [toPhone, setToPhone] = useState('')
  
  // Invoice details
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`)
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [currency, setCurrency] = useState('USD')
  
  // Line items
  const [items, setItems] = useState<LineItem[]>([
    { id: generateId(), description: '', quantity: 1, rate: 0, amount: 0 }
  ])
  
  // Additional charges
  const [taxPercent, setTaxPercent] = useState(0)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [shippingCost, setShippingCost] = useState(0)
  
  // Notes
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')

  const addItem = () => {
    setItems([...items, { id: generateId(), description: '', quantity: 1, rate: 0, amount: 0 }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate
        }
        return updated
      }
      return item
    }))
  }

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const discountAmount = (subtotal * discountPercent) / 100
  const taxableAmount = subtotal - discountAmount
  const taxAmount = (taxableAmount * taxPercent) / 100
  const total = taxableAmount + taxAmount + shippingCost

  const handleGenerate = () => {
    const invoiceData = {
      from: { name: fromName, email: fromEmail, address: fromAddress, phone: fromPhone },
      to: { name: toName, email: toEmail, address: toAddress, phone: toPhone },
      invoiceNumber,
      invoiceDate,
      dueDate,
      currency,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      })),
      subtotal,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
      shippingCost,
      total,
      notes,
      terms
    }
    
    onGenerate(invoiceData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Calculator size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Invoice Generator</h2>
              <p className="text-xs text-gray-500">Create professional invoice from scratch</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* From Section */}
          <div className="glass-effect p-4 rounded-xl border border-white/20">
            <h3 className="font-semibold text-gray-800 mb-3">From (Your Details)</h3>
            <div className="space-y-3">
              <div>
                <Label>Name/Business Name</Label>
                <Input
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Your Company Ltd"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="company@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP"
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={fromPhone}
                  onChange={(e) => setFromPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* To Section */}
          <div className="glass-effect p-4 rounded-xl border border-white/20">
            <h3 className="font-semibold text-gray-800 mb-3">Bill To (Client Details)</h3>
            <div className="space-y-3">
              <div>
                <Label>Client Name</Label>
                <Input
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                  placeholder="Client Name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP"
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={toPhone}
                  onChange={(e) => setToPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="glass-effect p-4 rounded-xl border border-white/20">
          <h3 className="font-semibold text-gray-800 mb-3">Invoice Details</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Invoice Number</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="glass-effect p-4 rounded-xl border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Items</h3>
            <Button onClick={addItem} size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500">
              <Plus size={16} className="mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Item description"
                    className="mt-1"
                  />
                </div>
                <div className="w-24">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div className="w-32">
                  <Label className="text-xs">Rate</Label>
                  <Input
                    type="number"
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div className="w-32">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    value={item.amount.toFixed(2)}
                    readOnly
                    className="mt-1 bg-gray-50"
                  />
                </div>
                <Button
                  onClick={() => removeItem(item.id)}
                  variant="outline"
                  size="sm"
                  disabled={items.length === 1}
                  className="text-red-600"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Totals & Adjustments */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Notes */}
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thank you for your business!"
                className="mt-1"
                rows={3}
              />
            </div>
            {/* Terms */}
            <div>
              <Label>Terms & Conditions (Optional)</Label>
              <Textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms, late fees, etc."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <div className="glass-effect p-4 rounded-xl border border-white/20">
            <h3 className="font-semibold text-gray-800 mb-3">Totals</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{currency} {subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Discount:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    className="w-20 h-8 text-sm"
                    placeholder="0"
                  />
                  <span className="text-gray-500">%</span>
                  <span className="font-medium w-24 text-right">-{currency} {discountAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Tax:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                    className="w-20 h-8 text-sm"
                    placeholder="0"
                  />
                  <span className="text-gray-500">%</span>
                  <span className="font-medium w-24 text-right">+{currency} {taxAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Shipping:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    className="w-32 h-8 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-300 flex justify-between text-lg font-bold">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Total:</span>
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {currency} {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!fromName || !toName || items.some(i => !i.description)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            Generate Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
