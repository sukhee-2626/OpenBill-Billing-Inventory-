import { db } from '@/db/schema'

export async function exportData() {
  const data = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    invoices: await db.invoices.toArray(),
    products: await db.products.toArray(),
    customers: await db.customers.toArray(),
    payments: await db.payments.toArray(),
    stockMovements: await db.stockMovements.toArray(),
    templates: await db.templates.toArray(),
    settings: await db.settings.toArray()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `openbill-backup-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importData(jsonString: string, mode: 'merge' | 'replace' = 'merge') {
  const data = JSON.parse(jsonString)
  
  if (!validateBackup(data)) {
    throw new Error('Invalid backup file format')
  }
  
  if (mode === 'replace') {
    await db.invoices.clear()
    await db.products.clear()
    await db.customers.clear()
    await db.payments.clear()
    await db.stockMovements.clear()
    await db.templates.clear()
  }
  
  if (data.invoices) await db.invoices.bulkPut(data.invoices)
  if (data.products) await db.products.bulkPut(data.products)
  if (data.customers) await db.customers.bulkPut(data.customers)
  if (data.payments) await db.payments.bulkPut(data.payments)
  if (data.stockMovements) await db.stockMovements.bulkPut(data.stockMovements)
  if (data.templates) await db.templates.bulkPut(data.templates)
  if (data.settings && data.settings.length > 0) await db.settings.put(data.settings[0])
}

export function validateBackup(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    data.version &&
    Array.isArray(data.invoices) &&
    Array.isArray(data.products) &&
    Array.isArray(data.customers)
  )
}

export function autoBackup() {
  const lastBackup = localStorage.getItem('lastAutoBackup')
  const now = Date.now()
  
  if (!lastBackup || now - parseInt(lastBackup) > 24 * 60 * 60 * 1000) {
    db.invoices.toArray().then(async () => {
      const data = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        invoices: await db.invoices.toArray(),
        products: await db.products.toArray(),
        customers: await db.customers.toArray(),
        payments: await db.payments.toArray(),
        stockMovements: await db.stockMovements.toArray(),
        templates: await db.templates.toArray(),
        settings: await db.settings.toArray()
      }
      localStorage.setItem('autoBackup', JSON.stringify(data))
      localStorage.setItem('lastAutoBackup', now.toString())
    })
  }
}
