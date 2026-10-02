import { Button } from './ui/button'
import { MessageCircle } from 'lucide-react'
import { sharePaymentReminderWhatsApp } from '@/lib/share'
import type { Customer } from '@/types'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'

interface PaymentReminderProps {
  customer: Customer
  balance: number
}

export default function PaymentReminder({ customer, balance }: PaymentReminderProps) {
  const settings = useLiveQuery(() => db.settings.get(1))

  if (balance <= 0) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => sharePaymentReminderWhatsApp(customer, balance, settings)}
      disabled={!customer.phone}
      className="text-orange-600 border-orange-300 hover:bg-orange-50"
    >
      <MessageCircle size={16} className="mr-2" />
      Send Payment Reminder
    </Button>
  )
}
