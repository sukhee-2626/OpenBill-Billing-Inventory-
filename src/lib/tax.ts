import type { InvoiceItem, Tax, Discount } from '../types'
import { roundTo } from './utils'

export function calculateItemAmount(item: InvoiceItem, taxType: 'inclusive' | 'exclusive'): number {
  let baseAmount = item.quantity * item.rate
  
  if (item.discount) {
    const discountAmount = item.discount.type === 'percent' 
      ? (baseAmount * item.discount.value) / 100 
      : item.discount.value
    baseAmount -= discountAmount
  }
  
  if (taxType === 'exclusive') {
    const taxAmount = (baseAmount * item.taxRate) / 100
    baseAmount += taxAmount
  }
  
  return roundTo(baseAmount)
}

export function calculateInvoiceTotals(
  items: InvoiceItem[],
  taxType: 'inclusive' | 'exclusive',
  discount?: Discount,
  shipping = 0,
  adjustment = 0
) {
  let subtotal = 0
  const taxGroups: { [rate: number]: number } = {}
  
  items.forEach(item => {
    const itemBaseAmount = item.quantity * item.rate
    let itemDiscountedAmount = itemBaseAmount
    
    if (item.discount) {
      const discountAmount = item.discount.type === 'percent'
        ? (itemBaseAmount * item.discount.value) / 100
        : item.discount.value
      itemDiscountedAmount -= discountAmount
    }
    
    subtotal += itemBaseAmount
    
    const taxableAmount = taxType === 'inclusive'
      ? itemDiscountedAmount / (1 + item.taxRate / 100)
      : itemDiscountedAmount
    
    const taxAmount = taxType === 'inclusive'
      ? itemDiscountedAmount - taxableAmount
      : (itemDiscountedAmount * item.taxRate) / 100
    
    taxGroups[item.taxRate] = (taxGroups[item.taxRate] || 0) + taxAmount
  })
  
  let discountAmount = 0
  if (discount) {
    discountAmount = discount.type === 'percent'
      ? (subtotal * discount.value) / 100
      : discount.value
  }
  
  const taxes: Tax[] = Object.entries(taxGroups).map(([rate, amount]) => ({
    name: `${taxType === 'inclusive' ? 'GST' : 'GST'} ${rate}%`,
    rate: Number(rate),
    amount: roundTo(amount)
  }))
  
  const taxTotal = taxes.reduce((sum, tax) => sum + tax.amount, 0)
  
  const total = roundTo(
    subtotal - discountAmount + (taxType === 'exclusive' ? taxTotal : 0) + shipping + adjustment
  )
  
  return {
    subtotal: roundTo(subtotal),
    discountAmount: roundTo(discountAmount),
    taxes,
    taxTotal: roundTo(taxTotal),
    shipping: roundTo(shipping),
    adjustment: roundTo(adjustment),
    total
  }
}
