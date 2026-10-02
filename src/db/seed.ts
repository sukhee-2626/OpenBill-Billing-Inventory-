import { db } from './schema'
import type { Customer, Product, Template, Settings } from '../types'

export async function seedDatabase() {
  const hasData = await db.settings.count()
  if (hasData > 0) return

  // Settings
  const settings: Settings = {
    id: 1,
    businessName: 'Demo Shop',
    businessAddress: {
      line1: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India'
    },
    gstin: '27AABCU9603R1ZX',
    phone: '+91 98765 43210',
    email: 'demo@openbill.app',
    currency: 'INR',
    taxSystem: 'GST',
    invoicePrefix: 'INV',
    invoiceNumbering: 'auto',
    invoiceAutoResetYearly: true,
    locale: 'en',
    timezone: 'Asia/Kolkata',
    dateFormat: 'dd/MM/yyyy',
    enablePIN: false,
    updatedAt: new Date()
  }
  await db.settings.add(settings)

  // Customers
  const customers: Customer[] = [
    {
      id: 'c1',
      type: 'customer',
      name: 'Rajesh Kumar',
      phone: '+91 98765 12345',
      email: 'rajesh@example.com',
      gstin: '29AABCU9603R1ZV',
      billingAddress: {
        line1: '456 MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India'
      },
      balance: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'c2',
      type: 'customer',
      name: 'Priya Sharma',
      phone: '+91 98765 67890',
      email: 'priya@example.com',
      balance: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  await db.customers.bulkAdd(customers)

  // Products
  const products: Product[] = [
    {
      id: 'p1',
      sku: 'PROD001',
      barcode: '1234567890123',
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with USB receiver',
      category: 'Electronics',
      unit: 'pcs',
      hsn: '8471',
      purchasePrice: 250,
      sellingPrice: 450,
      stock: 50,
      lowStockThreshold: 10,
      taxRate: 18,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'p2',
      sku: 'PROD002',
      barcode: '1234567890124',
      name: 'USB Cable',
      description: 'USB Type-C to USB-A cable, 1.5m',
      category: 'Accessories',
      unit: 'pcs',
      hsn: '8544',
      purchasePrice: 80,
      sellingPrice: 150,
      stock: 100,
      lowStockThreshold: 20,
      taxRate: 18,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'p3',
      sku: 'PROD003',
      name: 'Notebook A5',
      description: 'Ruled notebook, 200 pages',
      category: 'Stationery',
      unit: 'pcs',
      hsn: '4820',
      purchasePrice: 30,
      sellingPrice: 60,
      stock: 200,
      lowStockThreshold: 50,
      taxRate: 12,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  await db.products.bulkAdd(products)

  // Templates
  const templates: Template[] = [
    {
      id: 't1',
      name: 'Classic A4',
      type: 'invoice',
      config: {
        paperSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        colors: { primary: '#2563eb', text: '#1f2937', background: '#ffffff' },
        fonts: { family: 'Arial, sans-serif', size: 10, headerSize: 24 },
        logo: { show: true, position: 'left', maxWidth: 150 },
        header: { layout: 'split' },
        footer: { show: true, text: 'Thank you for your business!' },
        fields: {
          invoiceNumber: true,
          date: true,
          dueDate: true,
          customerDetails: true,
          itemDescription: true,
          hsn: true,
          quantity: true,
          rate: true,
          discount: true,
          tax: true,
          total: true,
          notes: true,
          terms: true,
          bankDetails: false
        },
        columns: ['#', 'Item', 'HSN', 'Qty', 'Rate', 'Discount', 'Tax', 'Amount'],
        qrCode: { show: false, position: 'footer' }
      },
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 't2',
      name: 'Modern A4',
      type: 'invoice',
      config: {
        paperSize: 'A4',
        orientation: 'portrait',
        margins: { top: 15, right: 15, bottom: 15, left: 15 },
        colors: { primary: '#059669', secondary: '#d1fae5', text: '#111827', background: '#ffffff' },
        fonts: { family: 'Helvetica, sans-serif', size: 10, headerSize: 28 },
        logo: { show: true, position: 'center', maxWidth: 180 },
        header: { layout: 'centered' },
        footer: { show: true, text: 'Powered by OpenBill' },
        fields: {
          invoiceNumber: true,
          date: true,
          dueDate: true,
          customerDetails: true,
          itemDescription: true,
          hsn: false,
          quantity: true,
          rate: true,
          discount: false,
          tax: true,
          total: true,
          notes: true,
          terms: false,
          bankDetails: false
        },
        columns: ['#', 'Item', 'Qty', 'Rate', 'Tax', 'Amount'],
        qrCode: { show: true, position: 'footer' }
      },
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 't3',
      name: 'Thermal 58mm',
      type: 'thermal',
      config: {
        paperSize: 'Thermal58',
        margins: { top: 5, right: 2, bottom: 5, left: 2 },
        colors: { text: '#000000', background: '#ffffff' },
        fonts: { family: 'monospace', size: 8, headerSize: 12 },
        logo: { show: false, position: 'center', maxWidth: 100 },
        header: { layout: 'centered' },
        footer: { show: true, text: 'Thank you, visit again!' },
        fields: {
          invoiceNumber: true,
          date: true,
          dueDate: false,
          customerDetails: true,
          itemDescription: false,
          hsn: false,
          quantity: true,
          rate: true,
          discount: false,
          tax: true,
          total: true,
          notes: false,
          terms: false,
          bankDetails: false
        },
        columns: ['Item', 'Qty', 'Rate', 'Amt'],
        qrCode: { show: false, position: 'footer' }
      },
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  await db.templates.bulkAdd(templates)
}
