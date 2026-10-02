import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, AlertTriangle, Package } from 'lucide-react'
import { db } from '@/db/schema'
import { generateId } from '@/lib/utils'
import { notify } from '@/components/NotificationContainer'
import BarcodeGenerator from '@/components/BarcodeGenerator'
import type { Product } from '@/types'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [stock, setStock] = useState('')
  const [unit, setUnit] = useState('pcs')
  const [taxRate, setTaxRate] = useState('18')
  const [lowStockThreshold, setLowStockThreshold] = useState('10')
  const [scanning, setScanning] = useState(false)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  const startScanning = useCallback(() => {
    const reader = new BrowserMultiFormatReader()
    codeReaderRef.current = reader
    setScanning(true)
    reader.decodeFromVideoDevice(null, 'barcode-video', (result, err) => {
      if (result) {
        setBarcode(result.getText())
        reader.reset()
        codeReaderRef.current = null
        setScanning(false)
        notify.success('Barcode Scanned', result.getText())
      }
      if (err && !(err instanceof NotFoundException)) {
        console.error(err)
      }
    })
  }, [])

  const stopScanning = useCallback(() => {
    codeReaderRef.current?.reset()
    codeReaderRef.current = null
    setScanning(false)
  }, [])

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const allProducts = await db.products.toArray()
    setProducts(allProducts)
  }

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setName(product.name)
      setSku(product.sku || '')
      setBarcode(product.barcode || '')
      setSellingPrice(product.sellingPrice.toString())
      setPurchasePrice(product.purchasePrice?.toString() || '')
      setStock(product.stock.toString())
      setUnit(product.unit)
      setTaxRate(product.taxRate?.toString() || '18')
      setLowStockThreshold(product.lowStockThreshold?.toString() || '10')
    } else {
      setEditingProduct(null)
      setName('')
      setSku('')
      setBarcode('')
      setSellingPrice('')
      setPurchasePrice('')
      setStock('')
      setUnit('pcs')
      setTaxRate('18')
      setLowStockThreshold('10')
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!name || !sellingPrice) {
      notify.error('Validation Error', 'Name and selling price are required')
      return
    }

    const productData: Product = {
      id: editingProduct?.id || generateId(),
      name,
      sku: sku || '',
      barcode: barcode || undefined,
      sellingPrice: parseFloat(sellingPrice),
      purchasePrice: parseFloat(purchasePrice) || 0,
      stock: parseFloat(stock) || 0,
      unit,
      taxRate: parseFloat(taxRate) || 18,
      lowStockThreshold: parseFloat(lowStockThreshold) || 10,
      createdAt: editingProduct?.createdAt || new Date(),
      updatedAt: new Date()
    }

    if (editingProduct) {
      await db.products.put(productData)
      notify.success('Product Updated', `${name} updated successfully`)
    } else {
      await db.products.add(productData)
      notify.success('Product Added', `${name} added to catalog`)
    }

    setIsModalOpen(false)
    loadProducts()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this product?')) {
      await db.products.delete(id)
      notify.success('Product Deleted', 'Product removed from catalog')
      loadProducts()
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus size={16} className="mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search products by name, SKU, or barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const isLowStock = product.stock <= (product.lowStockThreshold || 10)
          return (
            <div key={product.id} className="glass-effect p-4 rounded-xl border border-white/20 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  {product.sku && (
                    <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openModal(product)}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil size={14} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} className="text-red-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-green-600">₹{product.sellingPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stock:</span>
                  <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>
                    {product.stock} {product.unit}
                    {isLowStock && <AlertTriangle size={14} className="inline ml-1" />}
                  </span>
                </div>
              </div>

              {product.barcode && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <BarcodeGenerator value={product.barcode} height={30} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No products found</p>
          <Button onClick={() => openModal()} className="mt-4" variant="outline">
            <Plus size={16} className="mr-2" />
            Add Your First Product
          </Button>
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Package size={16} className="text-white" />
              </div>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="PROD-001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="123456789"
                  />
                  <Button type="button" variant="outline" onClick={scanning ? stopScanning : startScanning} className="shrink-0">
                    {scanning ? 'Stop' : '📷 Scan'}
                  </Button>
                </div>
                {scanning && (
                  <div className="mt-2 rounded overflow-hidden border border-gray-300">
                    <video id="barcode-video" className="w-full h-40 object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sellingPrice">Selling Price *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="18"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="pcs"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="threshold">Low Stock Alert</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  placeholder="10"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setIsModalOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                {editingProduct ? 'Update' : 'Add'} Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
