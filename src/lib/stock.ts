import { db } from '@/db/schema'
import { generateId } from './utils'
import type { StockMovement } from '@/types'

export async function recordStockMovement(
  productId: string,
  quantity: number,
  type: 'in' | 'out' | 'adjustment',
  reason?: string,
  referenceId?: string
) {
  const movement: StockMovement = {
    id: generateId(),
    productId,
    type,
    quantity,
    reason,
    referenceId,
    date: new Date(),
    createdAt: new Date()
  }
  
  await db.stockMovements.add(movement)
  
  // Update product stock
  const product = await db.products.get(productId)
  if (product) {
    let newStock = product.stock
    if (type === 'in') newStock += quantity
    else if (type === 'out') newStock -= quantity
    else newStock = quantity // adjustment sets absolute value
    
    await db.products.update(productId, { stock: newStock, updatedAt: new Date() })
  }
}

export async function getProductStockHistory(productId: string) {
  return db.stockMovements.where('productId').equals(productId).reverse().sortBy('date')
}
