import { useParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { getCustomerTransactions, calculateCustomerBalance } from '@/lib/customer'
import PaymentReminder from '@/components/PaymentReminder'

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>()
  const customer = useLiveQuery(() => id ? db.customers.get(id) : undefined, [id])
  const [transactions, setTransactions] = useState<any[]>([])
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    if (id) {
      getCustomerTransactions(id).then(setTransactions)
      calculateCustomerBalance(id).then(setBalance)
    }
  }, [id])

  if (!customer) return <div className="p-8">Loading...</div>

  const totalPurchases = transactions
    .filter(t => t.type === 'invoice')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="p-8">
      <Link to="/customers">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to Customers
        </Button>
      </Link>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-white p-6 rounded-lg border">
          <h1 className="text-2xl font-bold mb-4">{customer.name}</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Phone</p>
              <p className="font-medium">{customer.phone || '-'}</p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-medium">{customer.email || '-'}</p>
            </div>
            <div>
              <p className="text-gray-600">GSTIN</p>
              <p className="font-medium">{customer.gstin || '-'}</p>
            </div>
            <div>
              <p className="text-gray-600">Type</p>
              <p className="font-medium capitalize">{customer.type}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-gray-600 mb-2">Outstanding Balance</p>
          <p className={`text-4xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(balance)}
          </p>
          <p className="text-sm text-gray-600 mt-4">Total Purchases</p>
          <p className="text-2xl font-semibold">{formatCurrency(totalPurchases)}</p>
          
          {balance > 0 && (
            <div className="mt-4">
              <PaymentReminder customer={customer} balance={balance} />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Transaction History</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td className="px-6 py-4 text-sm">{formatDate(tx.date)}</td>
                <td className="px-6 py-4 text-sm capitalize">{tx.type}</td>
                <td className="px-6 py-4 text-sm">
                  {tx.type === 'invoice' ? (
                    <Link to={`/invoices/${tx.id}`} className="text-blue-600 hover:underline">
                      {tx.invoiceNumber}
                    </Link>
                  ) : (
                    tx.method
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {tx.type === 'invoice' ? formatCurrency(tx.paid) : '-'}
                </td>
                <td className="px-6 py-4 text-sm">
                  {tx.type === 'invoice' ? formatCurrency(tx.balance) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
