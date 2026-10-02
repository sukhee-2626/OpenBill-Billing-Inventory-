export interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country: string
}

export interface Tax {
  name: string
  rate: number
  amount: number
}

export interface Discount {
  type: 'percent' | 'flat'
  value: number
}

export interface InvoiceItem {
  id: string
  productId?: string
  name: string
  description?: string
  hsn?: string
  quantity: number
  unit: string
  rate: number
  discount?: Discount
  taxRate: number
  amount: number
}

export interface Invoice {
  id: string
  type: 'invoice' | 'quotation' | 'proforma' | 'challan' | 'credit_note' | 'debit_note' | 'purchase_order'
  number: string
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'unpaid' | 'cancelled'
  date: Date
  dueDate?: Date
  validUntil?: Date
  customerId: string
  items: InvoiceItem[]
  subtotal: number
  discount?: Discount
  taxType: 'inclusive' | 'exclusive'
  taxes: Tax[]
  shipping: number
  adjustment: number
  total: number
  amountPaid: number
  notes?: string
  terms?: string
  templateId: string
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  sku: string
  barcode?: string
  name: string
  description?: string
  category?: string
  unit: string
  hsn?: string
  purchasePrice: number
  sellingPrice: number
  stock: number
  lowStockThreshold: number
  taxRate: number
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  type: 'customer' | 'supplier'
  name: string
  email?: string
  phone?: string
  gstin?: string
  billingAddress?: Address
  shippingAddress?: Address
  balance: number
  createdAt: Date
  updatedAt: Date
}

export interface Payment {
  id: string
  invoiceId: string
  customerId: string
  amount: number
  method: 'cash' | 'upi' | 'card' | 'bank' | 'other'
  reference?: string
  date: Date
  notes?: string
  createdAt: Date
}

export interface StockMovement {
  id: string
  productId: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason?: string
  referenceId?: string
  date: Date
  createdAt: Date
}

export interface TemplateConfig {
  paperSize: 'A4' | 'A5' | 'A3' | 'Letter' | 'Legal' | 'Thermal58' | 'Thermal80' | 'Custom'
  customSize?: { width: number; height: number; unit: 'mm' | 'inch' }
  orientation?: 'portrait' | 'landscape'
  margins?: { top: number; right: number; bottom: number; left: number }
  colors?: { primary?: string; secondary?: string; text?: string; background?: string }
  fonts?: { family?: string; size?: number; headerSize?: number }
  logo?: { show: boolean; position: 'left' | 'center' | 'right'; maxWidth: number }
  header?: { layout: 'simple' | 'split' | 'centered' }
  footer?: { show: boolean; text?: string }
  fields?: { [key: string]: boolean }
  columns?: string[]
  watermark?: { text?: string; opacity?: number }
  qrCode?: { show: boolean; position: 'header' | 'footer' }
}

export interface Template {
  id: string
  name: string
  type: 'invoice' | 'quotation' | 'thermal' | 'receipt'
  config: TemplateConfig
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Settings {
  id: number
  businessName: string
  businessLogo?: string
  signatureImage?: string
  stampImage?: string
  businessAddress?: Address
  gstin?: string
  phone?: string
  email?: string
  website?: string
  upiId?: string
  currency: string
  taxSystem: 'GST' | 'VAT' | 'Sales Tax' | 'Custom'
  invoicePrefix: string
  invoiceNumbering: 'auto' | 'manual'
  invoiceAutoResetYearly: boolean
  locale: string
  timezone: string
  dateFormat: string
  defaultTemplateId?: string
  enablePIN: boolean
  pinHash?: string
  updatedAt: Date
}
