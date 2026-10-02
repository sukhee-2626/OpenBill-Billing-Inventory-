import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useState } from 'react'
import { recordStockMovement } from '@/lib/stock'
import { formatDate } from '@/lib/utils'

export default function StockMovements() {
  const movements = useLiveQuery(() => db.stockMovements.orderBy('date').reverse().toArray()) || []
  const products = useLiveQuery(() => db.products.toArray()) || []
  
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    productId: '',
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: '',
    reason: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await recordStockMovement(
      formData.productId,
      Number(formData.quantity),
      formData.type,
      formData.reason
    )
    setShowForm(false)
    setFormData({ productId: '', type: 'in', quantity: '', reason: '' })
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Stock Movements</h1>
        <Button onClick={() => setShowForm(!showForm)}>Record Movement</Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border mb-6">
          <h2 className="text-xl font-semibold mb-4">New Stock Movement</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <Select
              value={formData.productId}
              onChange={e => setFormData({ ...formData, productId: e.target.value })}
              required
            >
              <option value="">Select Product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Current: {p.stock})</option>
              ))}
            </Select>
            <Select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="in">Stock In (+)</option>
              <option value="out">Stock Out (-)</option>
              <option value="adjustment">Adjustment (Set)</option>
            </Select>
            <Input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
            <Input
              placeholder="Reason"
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
            />
            <div className="col-span-2 flex gap-2">
              <Button type="submit">Record</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movements.map(movement => {
              const product = products.find(p => p.id === movement.productId)
              return (
                <tr key={movement.id}>
                  <td className="px-6 py-4 text-sm">{formatDate(movement.date)}</td>
                  <td className="px-6 py-4 text-sm font-medium">{product?.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      movement.type === 'in' ? 'bg-green-100 text-green-800' :
                      movement.type === 'out' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {movement.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{movement.quantity}</td>
                  <td className="px-6 py-4 text-sm">{movement.reason}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
