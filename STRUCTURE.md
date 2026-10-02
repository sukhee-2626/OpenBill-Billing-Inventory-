# OpenBill - Folder Structure

```
openbill/
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component with routing
│   ├── db/
│   │   ├── schema.ts            # Dexie database schema
│   │   └── seed.ts              # Demo data
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── stores/
│   │   └── settings.ts          # Zustand global state
│   ├── lib/
│   │   ├── utils.ts             # Helper functions
│   │   ├── tax.ts               # Tax calculations
│   │   ├── print.ts             # Print utilities
│   │   ├── currency.ts          # Amount formatting, words
│   │   └── i18n.ts              # i18next setup
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── Layout.tsx           # Main layout with sidebar
│   │   ├── InvoiceForm.tsx      # Invoice creation/edit
│   │   ├── InvoicePreview.tsx   # Live preview
│   │   ├── TemplateEngine.tsx   # Render template JSON
│   │   └── ...
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Invoices.tsx
│   │   ├── InvoiceCreate.tsx
│   │   ├── Products.tsx
│   │   ├── Customers.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── templates/
│   │   ├── index.ts             # All template definitions
│   │   ├── classic.json
│   │   ├── modern.json
│   │   ├── thermal58.json
│   │   └── ...
│   └── styles/
│       └── global.css           # Tailwind + print styles
├── public/
│   ├── manifest.json            # PWA manifest
│   └── templates/               # User can drop custom templates here
├── tests/
│   └── tax.test.ts              # Unit tests for calculations
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── Dockerfile
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

## Data Models (Dexie Schema)

### Invoices
```typescript
{
  id: string (UUID)
  type: 'invoice' | 'quotation' | 'proforma' | 'challan' | 'credit_note' | 'debit_note' | 'purchase_order'
  number: string (auto-generated or custom)
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'unpaid' | 'cancelled'
  date: Date
  dueDate: Date
  customerId: string
  items: InvoiceItem[]
  subtotal: number
  discount: { type: 'percent' | 'flat', value: number }
  taxType: 'inclusive' | 'exclusive'
  taxes: Tax[]
  shipping: number
  adjustment: number
  total: number
  amountPaid: number
  notes: string
  terms: string
  templateId: string
  currency: string
  createdAt: Date
  updatedAt: Date
}
```

### InvoiceItem
```typescript
{
  productId: string
  name: string
  description: string
  hsn: string
  quantity: number
  unit: string
  rate: number
  discount: { type: 'percent' | 'flat', value: number }
  taxRate: number
  amount: number
}
```

### Products
```typescript
{
  id: string
  sku: string
  barcode: string
  name: string
  description: string
  category: string
  unit: string
  hsn: string
  purchasePrice: number
  sellingPrice: number
  stock: number
  lowStockThreshold: number
  variants: ProductVariant[]
  batchTracking: boolean
  expiryTracking: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Customers
```typescript
{
  id: string
  type: 'customer' | 'supplier'
  name: string
  email: string
  phone: string
  gstin: string
  billingAddress: Address
  shippingAddress: Address
  balance: number (outstanding)
  createdAt: Date
  updatedAt: Date
}
```

### Payments
```typescript
{
  id: string
  invoiceId: string
  customerId: string
  amount: number
  method: 'cash' | 'upi' | 'card' | 'bank' | 'other'
  reference: string
  date: Date
  notes: string
  createdAt: Date
}
```

### StockMovements
```typescript
{
  id: string
  productId: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string
  referenceId: string (invoiceId or purchaseId)
  date: Date
  createdAt: Date
}
```

### Templates
```typescript
{
  id: string
  name: string
  type: 'invoice' | 'quotation' | 'thermal' | 'receipt'
  paperSize: 'A4' | 'A5' | 'Thermal58' | 'Thermal80' | 'Custom'
  customSize: { width: number, height: number, unit: 'mm' | 'inch' }
  config: TemplateConfig (JSON with layout, colors, fonts, fields)
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Settings
```typescript
{
  id: 1 (singleton)
  businessName: string
  businessLogo: string (base64 or URL)
  businessAddress: Address
  gstin: string
  phone: string
  email: string
  website: string
  currency: string
  taxSystem: 'GST' | 'VAT' | 'Sales Tax' | 'Custom'
  invoicePrefix: string
  invoiceNumbering: 'auto' | 'manual'
  invoiceAutoResetYearly: boolean
  locale: string
  timezone: string
  dateFormat: string
  defaultTemplateId: string
  enablePIN: boolean
  pinHash: string
  updatedAt: Date
}
```

## Phase 1 Focus

Build:
1. Database setup (Dexie)
2. Basic invoice creation form
3. Customer selector/creation
4. Product selector/creation (simple, no inventory logic yet)
5. Tax calculation engine
6. Template engine (JSON → HTML)
7. 3 templates: Classic A4, Modern A4, Thermal 58mm
8. Print preview + print button
9. Save/update invoice
10. Invoice list page

Next message: Start building Phase 1.
