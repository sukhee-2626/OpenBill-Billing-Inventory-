import { useState, useEffect, useRef, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Input } from '@/components/ui/input'
import { X, Search, CreditCard, Banknote, QrCode, Trash2, Printer, Receipt, Tag } from 'lucide-react'
import { generateId, formatCurrency } from '@/lib/utils'
import { calculateInvoiceTotals } from '@/lib/tax'
import type { Product, Customer, Invoice, InvoiceItem } from '@/types'
import UPIPaymentModal from '@/components/UPIPaymentModal'
import { notify } from '@/components/NotificationContainer'

export default function POS() {
  const products = useLiveQuery(() => db.products.toArray()) || []
  const customers = useLiveQuery(() => db.customers.toArray()) || []
  const settings = useLiveQuery(() => db.settings.get(1))

  const [cart, setCart] = useState<InvoiceItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showUPIModal, setShowUPIModal] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  const [discount, setDiscount] = useState(0)
  const [note, setNote] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))]

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory
    return matchSearch && matchCat
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setCart([]); searchRef.current?.focus() }
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const addToCart = (product: Product) => {
    if (product.stock <= 0) { notify.error('Out of stock', `${product.name} is out of stock`); return }
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === product.id)
      if (idx >= 0) {
        return prev.map((item, i) => i === idx ? { ...item, quantity: item.quantity + 1, amount: (item.quantity + 1) * item.rate } : item)
      }
      return [...prev, { id: generateId(), productId: product.id, name: product.name, quantity: 1, unit: product.unit || 'pcs', rate: product.sellingPrice, taxRate: product.taxRate || 0, hsn: product.hsn, amount: product.sellingPrice }]
    })
    setSearchQuery('')
    searchRef.current?.focus()
  }

  const updateQty = (idx: number, qty: number) => {
    if (qty <= 0) { setCart(c => c.filter((_, i) => i !== idx)); return }
    setCart(c => c.map((item, i) => i === idx ? { ...item, quantity: qty, amount: qty * item.rate } : item))
  }

  const totals = cart.length > 0
    ? calculateInvoiceTotals(cart, 'exclusive', discount > 0 ? { type: 'percent', value: discount } : undefined, 0, 0)
    : { subtotal: 0, taxTotal: 0, total: 0, taxes: [] }

  const printThermalReceipt = useCallback((invoice: Invoice, method: string) => {
    const biz = settings?.businessName || 'My Shop'
    const addr = settings?.businessAddress
    const addrStr = addr ? [addr.line1, addr.line2, addr.city].filter(Boolean).join(', ') : ''
    const sym = (settings?.currency || 'INR') === 'INR' ? '₹' : (settings?.currency || 'INR') === 'USD' ? '$' : (settings?.currency || 'INR') === 'EUR' ? '€' : settings?.currency || ''
    const dateStr = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })

    const html = `<!DOCTYPE html><html><head><title>Receipt</title>
<style>
@page{size:80mm auto;margin:2mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:12px;width:80mm;padding:3mm;background:#fff;color:#000;line-height:1.5}
.c{text-align:center}.b{font-weight:900}.big{font-size:17px;font-weight:900}
.sm{font-size:10px}.line{border-top:1px dashed #000;margin:5px 0}.dline{border-top:2px solid #000;margin:5px 0}
.row{display:flex;justify-content:space-between;font-size:11px;padding:1px 0}
.total{display:flex;justify-content:space-between;font-weight:900;font-size:15px;padding:4px 0}
table{width:100%;border-collapse:collapse}
th,td{font-size:11px;padding:2px 1px;vertical-align:top}
th{font-weight:900;border-bottom:1px solid #000}
.r{text-align:right}.cn{text-align:center}
</style></head><body>
<div class="c big">${biz}</div>
${addrStr ? `<div class="c sm">${addrStr}</div>` : ''}
${settings?.phone ? `<div class="c sm">📞 ${settings.phone}</div>` : ''}
${settings?.gstin ? `<div class="c sm">GSTIN: ${settings.gstin}</div>` : ''}
<div class="dline"></div>
<div class="row"><span class="b">RECEIPT</span><span>${dateStr}</span></div>
<div class="row"><span class="sm">#${invoice.number}</span><span class="sm">Paid via ${method.toUpperCase()}</span></div>
${selectedCustomer ? `<div class="row sm"><span>Customer:</span><span>${selectedCustomer.name}${selectedCustomer.phone ? ' | ' + selectedCustomer.phone : ''}</span></div>` : `<div class="sm c">Walk-in Customer</div>`}
<div class="line"></div>
<table>
<thead><tr><th style="width:45%">Item</th><th class="cn" style="width:15%">Qty</th><th class="r" style="width:20%">Rate</th><th class="r" style="width:20%">Amt</th></tr></thead>
<tbody>
${invoice.items.map(it => `<tr><td>${it.name}</td><td class="cn">${it.quantity}</td><td class="r">${sym}${it.rate.toFixed(2)}</td><td class="r b">${sym}${it.amount.toFixed(2)}</td></tr>`).join('')}
</tbody></table>
<div class="line"></div>
<div class="row"><span>Subtotal</span><span>${sym}${invoice.subtotal.toFixed(2)}</span></div>
${invoice.taxes.map(t => `<div class="row"><span>${t.name}</span><span>+${sym}${t.amount.toFixed(2)}</span></div>`).join('')}
${discount > 0 ? `<div class="row" style="color:green"><span>Discount (${discount}%)</span><span>-${sym}${(invoice.subtotal * discount / 100).toFixed(2)}</span></div>` : ''}
<div class="dline"></div>
<div class="total"><span>TOTAL</span><span>${sym}${invoice.total.toFixed(2)}</span></div>
<div class="dline"></div>
${settings?.upiId ? `<div class="c sm" style="margin:5px 0">💳 UPI: <b>${settings.upiId}</b></div>` : ''}
${note ? `<div class="sm" style="margin:4px 0">📝 ${note}</div>` : ''}
<div class="line"></div>
<div class="c b" style="margin:6px 0">Thank you! Please visit again 🙏</div>
<div class="c sm">Powered by OpenBill</div>
<div style="height:20mm"></div>
</body></html>`

    const win = window.open('', '_blank', 'width=340,height=650,toolbar=0,menubar=0,scrollbars=1')
    if (!win) { notify.error('Popup blocked', 'Allow popups to print receipt'); return }
    win.document.write(html)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 500)
  }, [settings, selectedCustomer, discount, note])

  const completeSale = async (method: 'cash' | 'upi' | 'card') => {
    if (cart.length === 0) { notify.error('Empty cart', 'Add products first'); return }
    const invoice: Invoice = {
      id: generateId(), type: 'invoice',
      number: `POS-${Date.now().toString().slice(-8)}`,
      status: 'paid', date: new Date(), dueDate: new Date(),
      customerId: selectedCustomer?.id || 'walkin',
      items: cart, subtotal: totals.subtotal, taxType: 'exclusive',
      taxes: totals.taxes, shipping: 0, adjustment: 0, total: totals.total,
      amountPaid: totals.total, currency: settings?.currency || 'INR',
      notes: note, templateId: 't1', createdAt: new Date(), updatedAt: new Date(),
    }
    await db.invoices.add(invoice)
    for (const item of cart) {
      if (item.productId) {
        const p = await db.products.get(item.productId)
        if (p) await db.products.update(item.productId, { stock: Math.max(0, p.stock - item.quantity), updatedAt: new Date() })
      }
    }
    if (method === 'upi') {
      setCurrentInvoice(invoice); setShowUPIModal(true)
    } else {
      printThermalReceipt(invoice, method)
      setCart([]); setDiscount(0); setNote(''); setSelectedCustomer(undefined)
      notify.success('Sale Complete', `${formatCurrency(totals.total)} collected via ${method}`)
      searchRef.current?.focus()
    }
  }

  const handleUPIPaymentReceived = async () => {
    if (currentInvoice) printThermalReceipt(currentInvoice, 'upi')
    setShowUPIModal(false); setCurrentInvoice(null)
    setCart([]); setDiscount(0); setNote(''); setSelectedCustomer(undefined)
    notify.success('Sale Complete', 'UPI payment confirmed')
    searchRef.current?.focus()
  }

  return (
    <>
      <div className="h-screen flex overflow-hidden">
        {/* Products panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 bg-white/80 backdrop-blur border-b border-gray-200/50 shadow-sm shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">POS 🏪</h1>
              {settings?.businessName && <span className="text-sm text-gray-400 font-medium">{settings.businessName}</span>}
              <button onClick={async () => { const last = await db.invoices.orderBy('createdAt').last(); if (last) printThermalReceipt(last, 'cash'); else notify.error('No receipt','No previous sale') }}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium hover:bg-gray-50 transition">
                <Receipt size={13}/> Reprint Last
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
              <Input ref={searchRef} placeholder="Search by name, SKU, barcode… (F2 to focus)"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-base glass-effect border-white/30"/>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 px-4 py-2 overflow-x-auto bg-white/60 backdrop-blur border-b border-gray-100 shrink-0">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${selectedCategory === cat ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <Tag size={10}/>{cat === 'all' ? 'All Products' : cat}
                <span className={`ml-1 px-1.5 rounded-full text-xs ${selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {cat === 'all' ? products.length : products.filter(p => p.category === cat).length}
                </span>
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredProducts.map(product => (
                <button key={product.id} onClick={() => addToCart(product)} disabled={product.stock <= 0}
                  className="glass-effect p-3 rounded-xl text-left transition-all border border-white/20 hover:shadow-lg hover:scale-[1.03] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
                  {product.category && <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold mb-1 inline-block">{product.category}</span>}
                  <p className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight mb-1">{product.name}</p>
                  <p className="text-xs text-gray-400 mb-1">{product.sku}</p>
                  <p className="text-lg font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent leading-none">{formatCurrency(product.sellingPrice)}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-gray-400">Stock: {product.stock}</p>
                    {product.stock <= product.lowStockThreshold && product.stock > 0 && <span className="text-xs px-1 rounded bg-orange-100 text-orange-600 font-bold">Low</span>}
                    {product.stock === 0 && <span className="text-xs px-1 rounded bg-red-100 text-red-600 font-bold">Out</span>}
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-20 text-gray-400">
                  <p className="text-5xl mb-3">📦</p>
                  <p className="font-bold text-gray-500">No products found</p>
                  <p className="text-sm mt-1">Try a different search or category</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart panel */}
        <div className="w-[380px] shrink-0 flex flex-col bg-white/90 backdrop-blur-xl border-l border-gray-200/60 shadow-2xl">
          <div className="p-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                🛒 Cart
                {cart.length > 0 && <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black">{cart.reduce((s,i)=>s+i.quantity,0)}</span>}
              </h2>
              {cart.length > 0 && <button onClick={() => setCart([])} className="text-red-400 hover:text-red-600 transition p-1"><Trash2 size={15}/></button>}
            </div>
            <select value={selectedCustomer?.id || ''} onChange={e => setSelectedCustomer(customers.find(c => c.id === e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium">
              <option value="">👤 Walk-in Customer</option>
              {customers.filter(c => c.type === 'customer').map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-2 min-h-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 py-10">
                <span className="text-5xl mb-3">🛒</span>
                <p className="font-medium text-gray-400">Cart is empty</p>
                <p className="text-xs mt-1">Click products to add</p>
              </div>
            ) : cart.map((item, i) => (
              <div key={item.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-1.5">
                  <p className="font-bold text-sm text-gray-800 flex-1 mr-2 leading-tight">{item.name}</p>
                  <button onClick={() => setCart(c => c.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600 shrink-0"><X size={13}/></button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(i, item.quantity-1)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 font-black text-sm flex items-center justify-center">−</button>
                    <input type="number" value={item.quantity} min={1} onChange={e => updateQty(i, parseInt(e.target.value)||1)}
                      className="w-12 text-center text-sm font-bold border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"/>
                    <button onClick={() => updateQty(i, item.quantity+1)} className="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-black text-sm flex items-center justify-center">+</button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{formatCurrency(item.rate)} each</p>
                    <p className="font-black text-gray-900">{formatCurrency(item.amount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 space-y-3 shrink-0">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <label className="font-bold text-gray-500 shrink-0">Discount%</label>
                <input type="number" value={discount} min={0} max={100} onChange={e => setDiscount(Number(e.target.value))}
                  className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-center font-bold text-sm"/>
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold text-gray-500 shrink-0">Note</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="optional"
                  className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-sm"/>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
              {totals.taxes?.map((t,i) => <div key={i} className="flex justify-between text-gray-400 text-xs"><span>{t.name}</span><span>+{formatCurrency(t.amount)}</span></div>)}
              {discount > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Discount ({discount}%)</span><span>−{formatCurrency(totals.subtotal * discount / 100)}</span></div>}
              <div className="flex justify-between font-black text-xl pt-2 border-t border-gray-200">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Total</span>
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{formatCurrency(totals.total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { method: 'cash' as const, icon: <Banknote size={18}/>, label: 'Cash', cls: 'from-green-500 to-emerald-600' },
                { method: 'upi' as const, icon: <QrCode size={18}/>, label: 'UPI', cls: 'from-purple-500 to-pink-600' },
                { method: 'card' as const, icon: <CreditCard size={18}/>, label: 'Card', cls: 'from-blue-500 to-indigo-600' },
              ].map(({ method, icon, label, cls }) => (
                <button key={method} onClick={() => completeSale(method)} disabled={cart.length === 0}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl bg-gradient-to-br ${cls} text-white font-bold text-xs shadow-md disabled:opacity-40 hover:opacity-90 transition active:scale-95`}>
                  {icon}{label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Printer size={12}/>
              <span>Receipt auto-prints after each sale</span>
              <span className="ml-auto"><kbd className="px-1 bg-gray-100 rounded text-gray-500">Esc</kbd> clear</span>
            </div>
          </div>
        </div>
      </div>

      {currentInvoice && settings && (
        <UPIPaymentModal invoice={currentInvoice} settings={settings} isOpen={showUPIModal}
          onClose={() => { setShowUPIModal(false); setCurrentInvoice(null) }}
          onPaymentReceived={handleUPIPaymentReceived}/>
      )}
    </>
  )
}
