import { useState, useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Search, CreditCard, Banknote, QrCode, Trash2 } from 'lucide-react'
import { generateId, formatCurrency } from '@/lib/utils'
import { calculateInvoiceTotals } from '@/lib/tax'
import type { Product, Customer, Invoice, InvoiceItem } from '@/types'
import UPIPaymentModal from '@/components/UPIPaymentModal'

export default function POS() {
  const products = useLiveQuery(() => db.products.toArray()) || []
  const customers = useLiveQuery(() => db.customers.toArray()) || []
  const settings = useLiveQuery(() => db.settings.get(1))
  
  const [cart, setCart] = useState<InvoiceItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUPIModal, setShowUPIModal] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const addToCart = (product: Product) => {
    const existing = cart.findIndex(item => item.productId === product.id)
    
    if (existing >= 0) {
      const newCart = [...cart]
      newCart[existing].quantity += 1
      newCart[existing].amount = newCart[existing].quantity * newCart[existing].rate
      setCart(newCart)
    } else {
      setCart([...cart, {
        id: generateId(),
        productId: product.id,
        name: product.name,
        quantity: 1,
        unit: product.unit || 'pcs',
        rate: product.sellingPrice,
        taxRate: product.taxRate || 0,
        hsn: product.hsn,
        amount: product.sellingPrice
      }])
    }
    
    setSearchQuery('')
    searchRef.current?.focus()
  }

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index)
      return
    }
    
    const newCart = [...cart]
    newCart[index].quantity = newQty
    newCart[index].amount = newCart[index].quantity * newCart[index].rate
    setCart(newCart)
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const clearCart = () => {
    setCart([])
    searchRef.current?.focus()
  }

  const totals = cart.length > 0 
    ? calculateInvoiceTotals(cart, 'exclusive', undefined, 0, 0) 
    : { subtotal: 0, taxTotal: 0, total: 0, taxes: [] }

  const completeSale = async (paymentMethod: 'cash' | 'upi' | 'card') => {
    if (cart.length === 0) {
      alert('Cart is empty!')
      return
    }

    const invoice: Invoice = {
      id: generateId(),
      type: 'invoice',
      number: `POS-${Date.now()}`,
      date: new Date(),
      dueDate: new Date(),
      customerId: selectedCustomer?.id || '',
      items: cart,
      subtotal: totals.subtotal,
      taxType: 'exclusive',
      taxes: totals.taxes,
      shipping: 0,
      adjustment: 0,
      total: totals.total,
      amountPaid: paymentMethod === 'upi' ? 0 : totals.total,
      status: paymentMethod === 'upi' ? 'unpaid' : 'paid',
      notes: `POS Sale - ${paymentMethod.toUpperCase()}`,
      currency: 'INR',
      templateId: settings?.defaultTemplateId || 't3',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (paymentMethod === 'upi') {
      setCurrentInvoice(invoice)
      setShowUPIModal(true)
      return
    }

    await db.invoices.add(invoice)
    
    for (const item of cart) {
      if (item.productId) {
        const product = products.find(p => p.id === item.productId)
        if (product) {
          await db.products.update(item.productId, { 
            stock: product.stock - item.quantity 
          })
        }
        
        await db.stockMovements.add({
          id: generateId(),
          productId: item.productId,
          type: 'out',
          quantity: item.quantity,
          referenceId: invoice.id,
          date: new Date(),
          createdAt: new Date()
        })
      }
    }

    await db.payments.add({
      id: generateId(),
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amount: totals.total,
      method: paymentMethod,
      date: new Date(),
      createdAt: new Date()
    })

    setCart([])
    alert('✅ Sale completed successfully!')
  }

  const handleUPIPaymentReceived = async (amount: number, upiRef: string) => {
    if (!currentInvoice) return

    currentInvoice.amountPaid = amount
    currentInvoice.status = amount >= currentInvoice.total ? 'paid' : 'partial'
    
    await db.invoices.add(currentInvoice)
    
    for (const item of cart) {
      if (item.productId) {
        const product = products.find(p => p.id === item.productId)
        if (product) {
          await db.products.update(item.productId, { 
            stock: product.stock - item.quantity 
          })
        }
        
        await db.stockMovements.add({
          id: generateId(),
          productId: item.productId,
          type: 'out',
          quantity: item.quantity,
          referenceId: currentInvoice.id,
          date: new Date(),
          createdAt: new Date()
        })
      }
    }

    await db.payments.add({
      id: generateId(),
      invoiceId: currentInvoice.id,
      customerId: currentInvoice.customerId,
      amount: amount,
      method: 'upi',
      reference: upiRef,
      date: new Date(),
      notes: 'UPI Payment',
      createdAt: new Date()
    })

    setCart([])
    setCurrentInvoice(null)
    alert('✅ UPI Payment received successfully!')
  }

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        clearCart()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        clearCart()
      }
    }
    
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [])

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  return (
    <>
      <div className="h-screen flex">
        {/* Products Section */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Point of Sale 🏪
            </h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                ref={searchRef}
                placeholder="Search products by name, SKU, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg glass-effect border-white/30 shadow-premium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className="glass-effect p-4 rounded-xl text-left transition-all duration-200 card-premium border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-gray-800 line-clamp-2 text-sm">{product.name}</p>
                  {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                      Low
                    </span>
                  )}
                  {product.stock === 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                      Out
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(product.sellingPrice)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Stock: {product.stock}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-[420px] glass-effect border-l border-white/20 flex flex-col shadow-premium-lg">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🛒</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Cart ({cart.length})</h2>
              </div>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>

            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value))}
              className="w-full p-3 rounded-lg border border-gray-200 bg-white/80 text-sm"
            >
              <option value="">Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-6xl mb-4">🛒</span>
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Add products to start billing</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={item.id} className="bg-white/60 p-3 rounded-lg border border-white/50 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.rate)} each</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-bold text-gray-800">{formatCurrency(item.amount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-white/20 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatCurrency(totals.taxTotal)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Total</span>
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => completeSale('cash')}
                disabled={cart.length === 0}
                className="flex flex-col items-center gap-1 h-auto py-3 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg btn-premium"
              >
                <Banknote size={20} />
                <span className="text-xs">Cash</span>
              </Button>
              
              <Button
                onClick={() => completeSale('upi')}
                disabled={cart.length === 0 || !settings?.upiId}
                className="flex flex-col items-center gap-1 h-auto py-3 bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg btn-premium"
              >
                <QrCode size={20} />
                <span className="text-xs">UPI</span>
              </Button>
              
              <Button
                onClick={() => completeSale('card')}
                disabled={cart.length === 0}
                className="flex flex-col items-center gap-1 h-auto py-3 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg btn-premium"
              >
                <CreditCard size={20} />
                <span className="text-xs">Card</span>
              </Button>
            </div>

            <div className="text-xs text-center text-gray-500">
              Press <kbd className="px-2 py-1 bg-gray-100 rounded">F2</kbd> or <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> to clear
            </div>
          </div>
        </div>
      </div>

      {/* UPI Payment Modal */}
      {currentInvoice && settings && (
        <UPIPaymentModal
          invoice={currentInvoice}
          settings={settings}
          isOpen={showUPIModal}
          onClose={() => {
            setShowUPIModal(false)
            setCurrentInvoice(null)
          }}
          onPaymentReceived={handleUPIPaymentReceived}
        />
      )}
    </>
  )
}
