import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { generateId } from '@/lib/utils'
import type { Customer } from '@/types'
import { Link } from 'react-router-dom'

export default function Customers() {
  const customers = useLiveQuery(() => db.customers.toArray()) || []
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const customer: Customer = {
      id: generateId(),
      type: 'customer',
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      gstin: formData.gstin,
      balance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.customers.add(customer)
    setShowForm(false)
    setFormData({ name: '', phone: '', email: '', gstin: '' })
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-2" />
          Add Customer
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold mb-4">New Customer</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <Input placeholder="Customer Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Input placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <Input placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <Input placeholder="GSTIN" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
            <div className="col-span-2 flex gap-2">
              <Button type="submit">Save Customer</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GSTIN</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map(customer => (
              <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 text-sm font-medium">
                  <Link to={`/customers/${customer.id}`} className="text-blue-600 hover:underline">
                    {customer.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm">{customer.phone}</td>
                <td className="px-6 py-4 text-sm">{customer.email}</td>
                <td className="px-6 py-4 text-sm">{customer.gstin}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={customer.balance > 0 ? 'text-red-600 font-medium' : ''}>
                    ₹{customer.balance.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
