import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Label } from './ui/label'
import { Filter, X, Search } from 'lucide-react'

interface AdvancedFiltersProps {
  onFilterChange: (filters: InvoiceFilters) => void
}

export interface InvoiceFilters {
  search: string
  status: string
  type: string
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  customer: string
  paymentMethod: string
}

export default function AdvancedFilters({ onFilterChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<InvoiceFilters>({
    search: '',
    status: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    customer: '',
    paymentMethod: ''
  })

  const handleChange = (key: keyof InvoiceFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters: InvoiceFilters = {
      search: '',
      status: '',
      type: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      customer: '',
      paymentMethod: ''
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search invoices by number, customer..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="pl-10 glass-effect border-white/30"
          />
        </div>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          className="btn-premium relative"
        >
          <Filter size={16} className="mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button onClick={clearFilters} variant="outline" size="sm">
            <X size={16} className="mr-1" />
            Clear
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="glass-effect p-6 rounded-2xl border border-white/20 shadow-premium animate-slide-in-up">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Filter size={18} />
            Advanced Filters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="mt-1"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>

            {/* Type */}
            <div>
              <Label>Document Type</Label>
              <Select
                value={filters.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="mt-1"
              >
                <option value="">All Types</option>
                <option value="invoice">Invoice</option>
                <option value="quotation">Quotation</option>
                <option value="proforma">Proforma</option>
                <option value="challan">Delivery Challan</option>
                <option value="credit_note">Credit Note</option>
                <option value="debit_note">Debit Note</option>
              </Select>
            </div>

            {/* Payment Method */}
            <div>
              <Label>Payment Method</Label>
              <Select
                value={filters.paymentMethod}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
                className="mt-1"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="other">Other</option>
              </Select>
            </div>

            {/* Date From */}
            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Date To */}
            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleChange('dateTo', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Amount Min */}
            <div>
              <Label>Min Amount</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.amountMin}
                onChange={(e) => handleChange('amountMin', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Amount Max */}
            <div>
              <Label>Max Amount</Label>
              <Input
                type="number"
                placeholder="∞"
                value={filters.amountMax}
                onChange={(e) => handleChange('amountMax', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <span className="font-medium">{activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}</span>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-blue-600 hover:text-blue-700">
                  Clear all
                </button>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
