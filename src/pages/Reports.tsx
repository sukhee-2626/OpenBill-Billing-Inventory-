import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'

type ReportTab = 'sales' | 'tax' | 'product' | 'customer'

export default function Reports() {
  const [tab, setTab] = useState<ReportTab>('sales')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const invoices = useLiveQuery(() => db.invoices.toArray()) || []
  const products = useLiveQuery(() => db.products.toArray()) || []
  const customers = useLiveQuery(() => db.customers.toArray()) || []

  const filtered = useMemo(() => {
    let data = invoices
    if (startDate) data = data.filter(i => new Date(i.date) >= new Date(startDate))
    if (endDate) data = data.filter(i => new Date(i.date) <= new Date(endDate))
    return data
  }, [invoices, startDate, endDate])

  const salesReport = useMemo(() => {
    const total = filtered.reduce((sum, i) => sum + i.total, 0)
    const count = filtered.length
    const avg = count ? total / count : 0
    return { total, count, avg, invoices: filtered }
  }, [filtered])

  const taxReport = useMemo(() => {
    const taxMap = new Map<number, { rate: number; tax: number; base: number }>()
    filtered.forEach(inv => {
      inv.taxes.forEach(t => {
        const existing = taxMap.get(t.rate) || { rate: t.rate, tax: 0, base: 0 }
        existing.tax += t.amount
        existing.base += inv.subtotal
        taxMap.set(t.rate, existing)
      })
    })
    const totalTax = Array.from(taxMap.values()).reduce((sum, t) => sum + t.tax, 0)
    return { breakdown: Array.from(taxMap.values()), totalTax }
  }, [filtered])

  const productReport = useMemo(() => {
    const prodMap = new Map<string, { id: string; name: string; qty: number; revenue: number }>()
    filtered.forEach(inv => {
      inv.items.forEach(item => {
        const key = item.productId || item.name
        const existing = prodMap.get(key) || { id: key, name: item.name, qty: 0, revenue: 0 }
        existing.qty += item.quantity
        existing.revenue += item.amount
        prodMap.set(key, existing)
      })
    })
    const topProducts = Array.from(prodMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
    const stockValue = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0)
    return { topProducts, stockValue }
  }, [filtered, products])

  const customerReport = useMemo(() => {
    const custMap = new Map<string, { id: string; name: string; revenue: number; outstanding: number }>()
    filtered.forEach(inv => {
      const cust = customers.find(c => c.id === inv.customerId)
      const existing = custMap.get(inv.customerId) || { 
        id: inv.customerId, 
        name: cust?.name || 'Unknown', 
        revenue: 0, 
        outstanding: 0 
      }
      existing.revenue += inv.total
      existing.outstanding += inv.total - inv.amountPaid
      custMap.set(inv.customerId, existing)
    })
    const topCustomers = Array.from(custMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
    return { topCustomers }
  }, [filtered, customers])

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(','))
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Reports</h1>

      <div className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
        </div>
        <button 
          onClick={() => { setStartDate(''); setEndDate('') }}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      <div className="border-b mb-6">
        <div className="flex gap-6">
          {(['sales', 'tax', 'product', 'customer'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 px-1 font-medium border-b-2 transition ${
                tab === t 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'sales' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border">
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-3xl font-bold mt-2">₹{salesReport.total.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <p className="text-sm text-gray-600">Invoice Count</p>
              <p className="text-3xl font-bold mt-2">{salesReport.count}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <p className="text-sm text-gray-600">Average Value</p>
              <p className="text-3xl font-bold mt-2">₹{salesReport.avg.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Invoice List</h2>
              <button 
                onClick={() => exportCSV(
                  salesReport.invoices.map(i => ({
                    number: i.number,
                    date: new Date(i.date).toLocaleDateString(),
                    type: i.type,
                    status: i.status,
                    total: i.total
                  })),
                  'sales-report.csv'
                )}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Number</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReport.invoices.map(inv => (
                    <tr key={inv.id} className="border-t">
                      <td className="px-4 py-3">{inv.number}</td>
                      <td className="px-4 py-3">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 capitalize">{inv.type}</td>
                      <td className="px-4 py-3 capitalize">{inv.status}</td>
                      <td className="px-4 py-3 text-right">₹{inv.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'tax' && (
        <div>
          <div className="bg-white p-6 rounded-lg border mb-8">
            <p className="text-sm text-gray-600">Total Tax Collected</p>
            <p className="text-3xl font-bold mt-2">₹{taxReport.totalTax.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Tax Breakdown</h2>
              <button 
                onClick={() => exportCSV(
                  taxReport.breakdown.map(t => ({
                    rate: `${t.rate}%`,
                    base: t.base.toFixed(2),
                    tax: t.tax.toFixed(2)
                  })),
                  'tax-report.csv'
                )}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tax Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Base Amount</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Tax Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {taxReport.breakdown.map(tax => (
                    <tr key={tax.rate} className="border-t">
                      <td className="px-4 py-3">{tax.rate}%</td>
                      <td className="px-4 py-3 text-right">₹{tax.base.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">₹{tax.tax.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'product' && (
        <div>
          <div className="bg-white p-6 rounded-lg border mb-8">
            <p className="text-sm text-gray-600">Total Stock Value</p>
            <p className="text-3xl font-bold mt-2">₹{productReport.stockValue.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Top Selling Products</h2>
              <button 
                onClick={() => exportCSV(
                  productReport.topProducts.map(p => ({
                    name: p.name,
                    quantity: p.qty,
                    revenue: p.revenue.toFixed(2)
                  })),
                  'product-report.csv'
                )}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Quantity Sold</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {productReport.topProducts.map(prod => (
                    <tr key={prod.id} className="border-t">
                      <td className="px-4 py-3">{prod.name}</td>
                      <td className="px-4 py-3 text-right">{prod.qty}</td>
                      <td className="px-4 py-3 text-right">₹{prod.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'customer' && (
        <div>
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Top Customers by Revenue</h2>
              <button 
                onClick={() => exportCSV(
                  customerReport.topCustomers.map(c => ({
                    name: c.name,
                    revenue: c.revenue.toFixed(2),
                    outstanding: c.outstanding.toFixed(2)
                  })),
                  'customer-report.csv'
                )}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Revenue</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {customerReport.topCustomers.map(cust => (
                    <tr key={cust.id} className="border-t">
                      <td className="px-4 py-3">{cust.name}</td>
                      <td className="px-4 py-3 text-right">₹{cust.revenue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">₹{cust.outstanding.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
