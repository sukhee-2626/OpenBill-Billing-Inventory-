import { describe, it, expect } from 'vitest'
import { calculateItemAmount, calculateInvoiceTotals } from '../src/lib/tax'
import { amountToWords } from '../src/lib/currency'
import type { InvoiceItem, Discount } from '../src/types'

describe('calculateItemAmount', () => {
  it('tax exclusive no discount', () => {
    const item: InvoiceItem = {
      id: '1',
      name: 'Item',
      quantity: 2,
      unit: 'pcs',
      rate: 100,
      taxRate: 18,
      amount: 0
    }
    expect(calculateItemAmount(item, 'exclusive')).toBe(236)
  })

  it('tax inclusive no discount', () => {
    const item: InvoiceItem = {
      id: '1',
      name: 'Item',
      quantity: 2,
      unit: 'pcs',
      rate: 100,
      taxRate: 18,
      amount: 0
    }
    expect(calculateItemAmount(item, 'inclusive')).toBe(200)
  })

  it('tax exclusive with percent discount', () => {
    const item: InvoiceItem = {
      id: '1',
      name: 'Item',
      quantity: 2,
      unit: 'pcs',
      rate: 100,
      taxRate: 18,
      discount: { type: 'percent', value: 10 },
      amount: 0
    }
    expect(calculateItemAmount(item, 'exclusive')).toBe(212.4)
  })

  it('tax exclusive with flat discount', () => {
    const item: InvoiceItem = {
      id: '1',
      name: 'Item',
      quantity: 2,
      unit: 'pcs',
      rate: 100,
      taxRate: 18,
      discount: { type: 'flat', value: 20 },
      amount: 0
    }
    expect(calculateItemAmount(item, 'exclusive')).toBe(212.4)
  })

  it('tax inclusive with discount', () => {
    const item: InvoiceItem = {
      id: '1',
      name: 'Item',
      quantity: 2,
      unit: 'pcs',
      rate: 100,
      taxRate: 18,
      discount: { type: 'percent', value: 10 },
      amount: 0
    }
    expect(calculateItemAmount(item, 'inclusive')).toBe(180)
  })
})

describe('calculateInvoiceTotals', () => {
  it('single item no discount', () => {
    const items: InvoiceItem[] = [{
      id: '1',
      name: 'Item',
      quantity: 1,
      unit: 'pcs',
      rate: 1000,
      taxRate: 18,
      amount: 0
    }]
    
    const result = calculateInvoiceTotals(items, 'exclusive')
    expect(result.subtotal).toBe(1000)
    expect(result.discountAmount).toBe(0)
    expect(result.taxTotal).toBe(180)
    expect(result.total).toBe(1180)
  })

  it('multiple items different tax rates', () => {
    const items: InvoiceItem[] = [
      {
        id: '1',
        name: 'Item 1',
        quantity: 2,
        unit: 'pcs',
        rate: 100,
        taxRate: 18,
        amount: 0
      },
      {
        id: '2',
        name: 'Item 2',
        quantity: 1,
        unit: 'pcs',
        rate: 500,
        taxRate: 12,
        amount: 0
      }
    ]
    
    const result = calculateInvoiceTotals(items, 'exclusive')
    expect(result.subtotal).toBe(700)
    expect(result.taxes.length).toBe(2)
    expect(result.taxes.find(t => t.rate === 18)?.amount).toBe(36)
    expect(result.taxes.find(t => t.rate === 12)?.amount).toBe(60)
    expect(result.taxTotal).toBe(96)
    expect(result.total).toBe(796)
  })

  it('items with percent discount', () => {
    const items: InvoiceItem[] = [{
      id: '1',
      name: 'Item',
      quantity: 2,
      unit: 'pcs',
      rate: 100,
      taxRate: 18,
      discount: { type: 'percent', value: 10 },
      amount: 0
    }]
    
    const result = calculateInvoiceTotals(items, 'exclusive')
    expect(result.subtotal).toBe(200)
    expect(result.taxTotal).toBe(32.4)
    expect(result.total).toBe(232.4)
  })

  it('items with flat discount', () => {
    const items: InvoiceItem[] = [{
      id: '1',
      name: 'Item',
      quantity: 2,
      unit: 'pcs',
      rate: 100,
      taxRate: 18,
      discount: { type: 'flat', value: 50 },
      amount: 0
    }]
    
    const result = calculateInvoiceTotals(items, 'exclusive')
    expect(result.subtotal).toBe(200)
    expect(result.taxTotal).toBe(27)
    expect(result.total).toBe(227)
  })

  it('overall invoice percent discount', () => {
    const items: InvoiceItem[] = [{
      id: '1',
      name: 'Item',
      quantity: 1,
      unit: 'pcs',
      rate: 1000,
      taxRate: 18,
      amount: 0
    }]
    
    const discount: Discount = { type: 'percent', value: 10 }
    const result = calculateInvoiceTotals(items, 'exclusive', discount)
    expect(result.subtotal).toBe(1000)
    expect(result.discountAmount).toBe(100)
    expect(result.taxTotal).toBe(180)
    expect(result.total).toBe(1080)
  })

  it('overall invoice flat discount', () => {
    const items: InvoiceItem[] = [{
      id: '1',
      name: 'Item',
      quantity: 1,
      unit: 'pcs',
      rate: 1000,
      taxRate: 18,
      amount: 0
    }]
    
    const discount: Discount = { type: 'flat', value: 100 }
    const result = calculateInvoiceTotals(items, 'exclusive', discount)
    expect(result.subtotal).toBe(1000)
    expect(result.discountAmount).toBe(100)
    expect(result.total).toBe(1080)
  })

  it('shipping and adjustment', () => {
    const items: InvoiceItem[] = [{
      id: '1',
      name: 'Item',
      quantity: 1,
      unit: 'pcs',
      rate: 1000,
      taxRate: 18,
      amount: 0
    }]
    
    const result = calculateInvoiceTotals(items, 'exclusive', undefined, 50, -20)
    expect(result.subtotal).toBe(1000)
    expect(result.shipping).toBe(50)
    expect(result.adjustment).toBe(-20)
    expect(result.total).toBe(1210)
  })

  it('tax inclusive mode', () => {
    const items: InvoiceItem[] = [{
      id: '1',
      name: 'Item',
      quantity: 1,
      unit: 'pcs',
      rate: 1180,
      taxRate: 18,
      amount: 0
    }]
    
    const result = calculateInvoiceTotals(items, 'inclusive')
    expect(result.subtotal).toBe(1180)
    expect(result.taxTotal).toBe(180)
    expect(result.total).toBe(1180)
  })

  it('tax inclusive with item discount', () => {
    const items: InvoiceItem[] = [{
      id: '1',
      name: 'Item',
      quantity: 1,
      unit: 'pcs',
      rate: 1180,
      taxRate: 18,
      discount: { type: 'percent', value: 10 },
      amount: 0
    }]
    
    const result = calculateInvoiceTotals(items, 'inclusive')
    expect(result.subtotal).toBe(1180)
    expect(result.taxTotal).toBe(162)
    expect(result.total).toBe(1180)
  })

  it('complex scenario', () => {
    const items: InvoiceItem[] = [
      {
        id: '1',
        name: 'Item 1',
        quantity: 2,
        unit: 'pcs',
        rate: 500,
        taxRate: 18,
        discount: { type: 'percent', value: 10 },
        amount: 0
      },
      {
        id: '2',
        name: 'Item 2',
        quantity: 3,
        unit: 'pcs',
        rate: 200,
        taxRate: 12,
        amount: 0
      }
    ]
    
    const discount: Discount = { type: 'flat', value: 50 }
    const result = calculateInvoiceTotals(items, 'exclusive', discount, 100, 25)
    
    expect(result.subtotal).toBe(1600)
    expect(result.discountAmount).toBe(50)
    expect(result.taxes.find(t => t.rate === 18)?.amount).toBe(162)
    expect(result.taxes.find(t => t.rate === 12)?.amount).toBe(72)
    expect(result.taxTotal).toBe(234)
    expect(result.shipping).toBe(100)
    expect(result.adjustment).toBe(25)
    expect(result.total).toBe(1909)
  })
})

describe('amountToWords', () => {
  it('zero', () => {
    expect(amountToWords(0)).toBe('Zero')
  })

  it('basic numbers INR', () => {
    expect(amountToWords(1, 'INR')).toBe('One Rupees Only')
    expect(amountToWords(10, 'INR')).toBe('Ten Rupees Only')
    expect(amountToWords(99, 'INR')).toBe('Ninety Nine Rupees Only')
  })

  it('hundreds INR', () => {
    expect(amountToWords(100, 'INR')).toBe('One Hundred Rupees Only')
    expect(amountToWords(555, 'INR')).toBe('Five Hundred Fifty Five Rupees Only')
  })

  it('thousands INR', () => {
    expect(amountToWords(1000, 'INR')).toBe('One Thousand Rupees Only')
    expect(amountToWords(25000, 'INR')).toBe('Twenty Five Thousand Rupees Only')
  })

  it('lakhs INR', () => {
    expect(amountToWords(100000, 'INR')).toBe('One Lakh Rupees Only')
    expect(amountToWords(550000, 'INR')).toBe('Five Lakh Fifty Thousand Rupees Only')
  })

  it('crores INR', () => {
    expect(amountToWords(10000000, 'INR')).toBe('One Crore Rupees Only')
    expect(amountToWords(12345678, 'INR')).toBe('One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Rupees Only')
  })

  it('decimals INR', () => {
    expect(amountToWords(100.50, 'INR')).toBe('One Hundred Rupees and Fifty Paise Only')
    expect(amountToWords(1234.99, 'INR')).toBe('One Thousand Two Hundred Thirty Four Rupees and Ninety Nine Paise Only')
  })

  it('international format', () => {
    expect(amountToWords(1000, 'USD')).toBe('One Thousand Only')
    expect(amountToWords(1000000, 'USD')).toBe('One Million Only')
    expect(amountToWords(1000000000, 'USD')).toBe('One Billion Only')
    expect(amountToWords(1234567890, 'USD')).toBe('One Billion Two Hundred Thirty Four Million Five Hundred Sixty Seven Thousand Eight Hundred Ninety Only')
  })
})
