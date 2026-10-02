import { db } from '@/db/schema'

export async function calculateCustomerBalance(customerId: string): Promise<number> {
  const invoices = await db.invoices.where('customerId').equals(customerId).toArray()
  const payments = await db.payments.where('customerId').equals(customerId).toArray()
  
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0)
  
  return totalInvoiced - totalPaid
}

export async function getCustomerTransactions(customerId: string) {
  const invoices = await db.invoices.where('customerId').equals(customerId).toArray()
  const payments = await db.payments.where('customerId').equals(customerId).toArray()
  
  const transactions = [
    ...invoices.map(inv => ({
      type: 'invoice' as const,
      date: inv.date,
      invoiceNumber: inv.number,
      amount: inv.total,
      paid: inv.amountPaid,
      balance: inv.total - inv.amountPaid,
      id: inv.id
    })),
    ...payments.map(pay => ({
      type: 'payment' as const,
      date: pay.date,
      amount: pay.amount,
      method: pay.method,
      reference: pay.reference,
      id: pay.id
    }))
  ]
  
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export async function updateCustomerBalance(customerId: string) {
  const balance = await calculateCustomerBalance(customerId)
  await db.customers.update(customerId, { balance })
}
