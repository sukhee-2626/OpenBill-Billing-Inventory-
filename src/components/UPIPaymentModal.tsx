import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import QRCodeGenerator, { generateUPIQR } from './QRCodeGenerator'
import { CheckCircle, Loader2, QrCode } from 'lucide-react'
import type { Invoice, Settings } from '@/types'

interface UPIPaymentModalProps {
  invoice: Invoice
  settings: Settings
  isOpen: boolean
  onClose: () => void
  onPaymentReceived: (amount: number, upiRef: string) => void
}

export default function UPIPaymentModal({ 
  invoice, 
  settings, 
  isOpen, 
  onClose, 
  onPaymentReceived 
}: UPIPaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'received'>('pending')
  const [upiReference, setUpiReference] = useState('')
  const remainingAmount = invoice.total - invoice.amountPaid

  if (!settings.upiId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>UPI Not Configured</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Please add your UPI ID in Settings to accept UPI payments.
          </p>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    )
  }

  const upiString = generateUPIQR(
    settings.upiId,
    settings.businessName,
    remainingAmount,
    invoice.number
  )

  const handleVerifyPayment = async () => {
    setPaymentStatus('checking')
    
    // Simulate payment verification (in real app, integrate with UPI gateway)
    setTimeout(() => {
      setPaymentStatus('received')
      setTimeout(() => {
        onPaymentReceived(remainingAmount, upiReference)
        onClose()
      }, 1500)
    }, 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <QrCode size={18} className="text-white" />
            </div>
            UPI Payment
          </DialogTitle>
        </DialogHeader>

        {paymentStatus === 'pending' && (
          <div className="space-y-6">
            {/* QR Code */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <QRCodeGenerator value={upiString} size={200} />
              </div>
              <p className="text-sm text-gray-600 mt-4 text-center">
                Scan with any UPI app to pay
              </p>
            </div>

            {/* Amount */}
            <div className="text-center">
              <p className="text-sm text-gray-600">Amount to Pay</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ₹{remainingAmount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Invoice #{invoice.number}</p>
            </div>

            {/* UPI ID */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Pay to</p>
              <p className="text-sm font-mono font-semibold text-gray-800">{settings.upiId}</p>
              <p className="text-xs text-gray-500 mt-1">{settings.businessName}</p>
            </div>

            {/* Manual Verification */}
            <div className="space-y-3">
              <Label>Enter UPI Transaction ID (after payment)</Label>
              <Input
                placeholder="Enter 12-digit UPI reference"
                value={upiReference}
                onChange={(e) => setUpiReference(e.target.value)}
              />
              <Button 
                onClick={handleVerifyPayment}
                disabled={!upiReference || upiReference.length < 10}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Verify Payment
              </Button>
            </div>
          </div>
        )}

        {paymentStatus === 'checking' && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 size={48} className="animate-spin text-blue-600" />
            <p className="text-gray-600">Verifying payment...</p>
          </div>
        )}

        {paymentStatus === 'received' && (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-bounce">
              <CheckCircle size={32} className="text-white" />
            </div>
            <p className="text-xl font-semibold text-gray-800">Payment Received!</p>
            <p className="text-sm text-gray-600">₹{remainingAmount.toFixed(2)}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
