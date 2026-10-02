import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { db } from '@/db/schema'
import { generateId } from '@/lib/utils'
import type { Payment, Invoice } from '@/types'

interface PaymentModalProps {
  invoice: Invoice
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export default function PaymentModal({ invoice, isOpen, onClose, onSaved }: PaymentModalProps) {
  const remainingBalance = invoice.total - invoice.amountPaid
  
  const [formData, setFormData] = useState({
    amount: remainingBalance.toString(),
    method: 'cash' as Payment['method'],
    reference: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const payment: Payment = {
      id: generateId(),
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amount: Number(formData.amount),
      method: formData.method,
      reference: formData.reference,
      date: new Date(formData.date),
      notes: formData.notes,
      createdAt: new Date()
    }
    
    await db.payments.add(payment)
    
    const newAmountPaid = invoice.amountPaid + payment.amount
    let newStatus: Invoice['status'] = 'unpaid'
    
    if (newAmountPaid >= invoice.total) {
      newStatus = 'paid'
    } else if (newAmountPaid > 0) {
      newStatus = 'partial'
    }
    
    await db.invoices.update(invoice.id, {
      amountPaid: newAmountPaid,
      status: newStatus,
      updatedAt: new Date()
    })
    
    onSaved()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm text-gray-600">Invoice Total</p>
            <p className="text-2xl font-bold">₹{invoice.total.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-2">Already Paid: ₹{invoice.amountPaid.toFixed(2)}</p>
            <p className="text-sm font-medium">Remaining: ₹{remainingBalance.toFixed(2)}</p>
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select
              value={formData.method}
              onChange={e => setFormData({ ...formData, method: e.target.value as any })}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
              <option value="other">Other</option>
            </Select>
          </div>

          <div>
            <Label>Reference Number (Optional)</Label>
            <Input
              placeholder="Transaction ID, Cheque No, etc"
              value={formData.reference}
              onChange={e => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>

          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Payment notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Record Payment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
