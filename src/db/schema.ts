import Dexie, { Table } from 'dexie'
import type { Invoice, Product, Customer, Payment, StockMovement, Template, Settings } from '../types'

export class OpenBillDB extends Dexie {
  invoices!: Table<Invoice, string>
  products!: Table<Product, string>
  customers!: Table<Customer, string>
  payments!: Table<Payment, string>
  stockMovements!: Table<StockMovement, string>
  templates!: Table<Template, string>
  settings!: Table<Settings, number>

  constructor() {
    super('OpenBillDB')
    this.version(1).stores({
      invoices: 'id, number, type, status, customerId, date, createdAt',
      products: 'id, sku, barcode, name, category, createdAt',
      customers: 'id, type, name, phone, email, createdAt',
      payments: 'id, invoiceId, customerId, date, createdAt',
      stockMovements: 'id, productId, type, date, createdAt',
      templates: 'id, name, type, isDefault, createdAt',
      settings: 'id'
    })
  }
}

export const db = new OpenBillDB()
