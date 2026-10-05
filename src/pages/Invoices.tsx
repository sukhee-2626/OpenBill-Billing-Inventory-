import { useState, useRef, useCallback, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { notify } from '@/components/NotificationContainer'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { amountToWords } from '@/lib/currency'
import {
  Plus, Trash2, Printer, Save, FileText, Eye, EyeOff,
  Download, Share2, Mail, Copy, CheckCircle,
  ChevronDown, ChevronUp, Palette, ZoomIn, ZoomOut, Layout
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type CustomInput = { key: string; value: string }
type Item = { description: string; quantity: number; rate: number; taxRate: number }
type FormValues = {
  sender: { name: string; address: string; zipCode: string; city: string; country: string; email: string; phone: string; customInputs: CustomInput[] }
  receiver: { name: string; address: string; zipCode: string; city: string; country: string; email: string; phone: string; customInputs: CustomInput[] }
  details: {
    invoiceNumber: string; invoiceDate: string; dueDate: string; currency: string
    invoiceLogo: string; signature: string; notes: string; terms: string
    discount: number; shipping: number; tax: number
    paymentMethod: string; upiId: string; bankName: string; accountNumber: string; ifsc: string
    status: string
  }
  items: Item[]
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'INR', symbol: '₹' }, { code: 'USD', symbol: '$' }, { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' }, { code: 'AED', symbol: 'د.إ' }, { code: 'JPY', symbol: '¥' },
  { code: 'SGD', symbol: 'S$' }, { code: 'CAD', symbol: 'C$' },
]

const THEMES = [
  { name: 'Violet',   from: '#4c1d95', to: '#7c3aed', accent: '#8b5cf6', light: '#f5f3ff' },
  { name: 'Ocean',    from: '#1e3a5f', to: '#0891b2', accent: '#06b6d4', light: '#ecfeff' },
  { name: 'Sunset',   from: '#7c2d12', to: '#dc2626', accent: '#f97316', light: '#fff7ed' },
  { name: 'Forest',   from: '#14532d', to: '#059669', accent: '#10b981', light: '#f0fdf4' },
  { name: 'Midnight', from: '#0f172a', to: '#334155', accent: '#6366f1', light: '#f1f5f9' },
  { name: 'Rose',     from: '#881337', to: '#e11d48', accent: '#f43f5e', light: '#fff1f2' },
]

type PageSize = 'a4' | 'thermal58' | 'thermal80' | 'letter' | 'custom'
const PAGE_SIZES: { id: PageSize; label: string; w: number; desc: string }[] = [
  { id: 'a4',        label: 'A4',         w: 210, desc: '210 × 297 mm' },
  { id: 'letter',    label: 'Letter',     w: 216, desc: '216 × 279 mm' },
  { id: 'thermal58', label: 'Thermal 58', w: 58,  desc: '58 mm roll' },
  { id: 'thermal80', label: 'Thermal 80', w: 80,  desc: '80 mm roll' },
  { id: 'custom',    label: 'Custom',     w: 0,   desc: 'Set your own' },
]

type TemplateName = 'classic' | 'modern' | 'minimal' | 'bold' | 'sidebar' | 'thermal' | 'elegant' | 'gstpro'
const TEMPLATES: { id: TemplateName; label: string; desc: string }[] = [
  { id: 'classic',  label: 'Classic',   desc: 'Traditional header + table' },
  { id: 'modern',   label: 'Modern',    desc: 'Color header band, clean rows' },
  { id: 'minimal',  label: 'Minimal',   desc: 'Zero decoration, just data' },
  { id: 'bold',     label: 'Bold',      desc: 'Large typography, strong colors' },
  { id: 'sidebar',  label: 'Sidebar',   desc: 'Left color rail + content' },
  { id: 'elegant',  label: 'Elegant',   desc: 'Luxe dark header, serif type' },
  { id: 'gstpro',   label: 'GST Pro',   desc: 'Tax split + amount in words' },
  { id: 'thermal',  label: 'Thermal',   desc: 'Monospace receipt style' },
]

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-600',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-600', cancelled: 'bg-gray-200 text-gray-500',
}

// ─── Invoice Preview Templates ─────────────────────────────────────────────────
function InvoicePreview({ w, theme, currency, itemsTotal, discountAmt, taxAmt, shippingAmt, total, logoPreview, sigPreview, template, pageSize }: any) {
  const isThermal = pageSize === 'thermal58' || pageSize === 'thermal80'
  const thermalW = pageSize === 'thermal58' ? '58mm' : pageSize === 'thermal80' ? '80mm' : '100%'

  if (isThermal || template === 'thermal') {
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 11, width: isThermal ? thermalW : '100%', margin: '0 auto', padding: '8px', background: '#fff', lineHeight: 1.5 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          {logoPreview && <img src={logoPreview} style={{ height: 40, objectFit: 'contain', marginBottom: 4 }} />}
          <div style={{ fontWeight: 900, fontSize: 14 }}>{w.sender?.name || 'Your Business'}</div>
          {w.sender?.address && <div style={{ fontSize: 10 }}>{w.sender.address}</div>}
          {w.sender?.phone && <div style={{ fontSize: 10 }}>Ph: {w.sender.phone}</div>}
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
          <div style={{ fontWeight: 700, fontSize: 13 }}>INVOICE</div>
          <div style={{ fontSize: 10 }}>#{w.details?.invoiceNumber}</div>
          <div style={{ fontSize: 10 }}>Date: {w.details?.invoiceDate}</div>
        </div>
        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
        <div style={{ fontWeight: 700, fontSize: 11 }}>Bill To: {w.receiver?.name}</div>
        {w.receiver?.phone && <div style={{ fontSize: 10 }}>{w.receiver.phone}</div>}
        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 10, borderBottom: '1px solid #000', paddingBottom: 3 }}>
          <span style={{ flex: 3 }}>Item</span><span style={{ flex: 1, textAlign: 'right' }}>Qty</span><span style={{ flex: 2, textAlign: 'right' }}>Amt</span>
        </div>
        {(w.items || []).map((it: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '2px 0', borderBottom: '1px dotted #ccc' }}>
            <span style={{ flex: 3 }}>{it.description || '—'}</span>
            <span style={{ flex: 1, textAlign: 'right' }}>{it.quantity}</span>
            <span style={{ flex: 2, textAlign: 'right' }}>{currency.symbol}{(Number(it.quantity) * Number(it.rate)).toFixed(2)}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
        {discountAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Discount</span><span>-{currency.symbol}{discountAmt.toFixed(2)}</span></div>}
        {taxAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Tax</span><span>+{currency.symbol}{taxAmt.toFixed(2)}</span></div>}
        {shippingAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Shipping</span><span>+{currency.symbol}{shippingAmt.toFixed(2)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 13, marginTop: 4 }}>
          <span>TOTAL</span><span>{currency.symbol}{total.toFixed(2)}</span>
        </div>
        {w.details?.upiId && <div style={{ fontSize: 10, marginTop: 6 }}>UPI: {w.details.upiId}</div>}
        {w.details?.notes && <div style={{ fontSize: 10, marginTop: 6, textAlign: 'center' }}>{w.details.notes}</div>}
        <div style={{ textAlign: 'center', fontSize: 9, marginTop: 8, borderTop: '1px dashed #000', paddingTop: 4 }}>Thank you! · OpenBill</div>
      </div>
    )
  }

  // ── Minimal ──
  if (template === 'minimal') return (
    <div style={{ fontFamily: 'system-ui', padding: '40px', background: '#fff', color: '#111' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          {logoPreview && <img src={logoPreview} style={{ height: 48, objectFit: 'contain', marginBottom: 12 }} />}
          <div style={{ fontWeight: 700, fontSize: 16 }}>{w.sender?.name}</div>
          <div style={{ color: '#666', fontSize: 12, lineHeight: 1.6 }}>
            {w.sender?.address}<br/>{w.sender?.email}<br/>{w.sender?.phone}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>Invoice</div>
          <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}># {w.details?.invoiceNumber}</div>
          <div style={{ color: '#999', fontSize: 12 }}>Date: {w.details?.invoiceDate}</div>
          {w.details?.dueDate && <div style={{ color: '#999', fontSize: 12 }}>Due: {w.details.dueDate}</div>}
        </div>
      </div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Bill To</div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{w.receiver?.name}</div>
        <div style={{ color: '#666', fontSize: 12 }}>{w.receiver?.address} · {w.receiver?.email}</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead><tr style={{ borderBottom: '2px solid #111' }}>
          <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 700 }}>Description</th>
          <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 700 }}>Qty</th>
          <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 700 }}>Rate</th>
          <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 700 }}>Amount</th>
        </tr></thead>
        <tbody>
          {(w.items || []).map((it: any, i: number) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 0' }}>{it.description || '—'}</td>
              <td style={{ padding: '8px 0', textAlign: 'right', color: '#666' }}>{it.quantity}</td>
              <td style={{ padding: '8px 0', textAlign: 'right', color: '#666' }}>{currency.symbol}{Number(it.rate).toFixed(2)}</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{currency.symbol}{(Number(it.quantity)*Number(it.rate)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <div style={{ width: 200 }}>
          {discountAmt > 0 && <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#10b981' }}><span>Discount</span><span>-{currency.symbol}{discountAmt.toFixed(2)}</span></div>}
          {taxAmt > 0 && <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#666' }}><span>Tax</span><span>+{currency.symbol}{taxAmt.toFixed(2)}</span></div>}
          <div style={{ display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:16,borderTop:'2px solid #111',marginTop:8,paddingTop:8 }}><span>Total</span><span>{currency.symbol}{total.toFixed(2)}</span></div>
        </div>
      </div>
      {sigPreview && <div style={{ marginTop:32, display:'flex', justifyContent:'flex-end' }}><div style={{ textAlign:'center' }}><img src={sigPreview} style={{ height:48, objectFit:'contain' }} /><div style={{ fontSize:10,color:'#999',borderTop:'1px solid #ccc',paddingTop:4,marginTop:4 }}>Authorised Signature</div></div></div>}
    </div>
  )

  // ── Elegant (luxe dark header, serif, gold accent) ──
  if (template === 'elegant') return (
    <div style={{ fontFamily: 'Georgia, serif', background: '#fff', color: '#1a1a1a' }}>
      <div style={{ background: '#0f172a', color: '#fff', padding: '42px 48px', borderBottom: `4px solid ${theme.accent}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {logoPreview && <img src={logoPreview} style={{ height: 52, objectFit: 'contain', marginBottom: 14, filter: 'brightness(0) invert(1)' }} />}
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>{w.sender?.name}</div>
            <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.7, marginTop: 6 }}>{w.sender?.address}<br/>{w.sender?.email}{w.sender?.phone ? ` · ${w.sender.phone}` : ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 34, fontWeight: 400, letterSpacing: 6, color: theme.accent }}>INVOICE</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>№ {w.details?.invoiceNumber}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{w.details?.invoiceDate}{w.details?.dueDate ? ` · Due ${w.details.dueDate}` : ''}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '36px 48px' }}>
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: theme.accent, marginBottom: 6 }}>Billed To</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{w.receiver?.name}</div>
        <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{w.receiver?.address}{w.receiver?.email ? ` · ${w.receiver.email}` : ''}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 28, fontSize: 12 }}>
          <thead><tr style={{ borderBottom: `2px solid ${theme.accent}` }}>
            <th style={{ textAlign:'left', padding: 10, fontSize: 10, letterSpacing: 2, textTransform:'uppercase', color:'#666' }}>Item</th>
            <th style={{ textAlign:'right', padding: 10, fontSize: 10, letterSpacing: 2, textTransform:'uppercase', color:'#666' }}>Qty</th>
            <th style={{ textAlign:'right', padding: 10, fontSize: 10, letterSpacing: 2, textTransform:'uppercase', color:'#666' }}>Rate</th>
            <th style={{ textAlign:'right', padding: 10, fontSize: 10, letterSpacing: 2, textTransform:'uppercase', color:'#666' }}>Amount</th>
          </tr></thead>
          <tbody>
            {(w.items || []).map((it: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{it.description || '—'}</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#666' }}>{it.quantity}</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#666' }}>{currency.symbol}{Number(it.rate).toFixed(2)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{currency.symbol}{(Number(it.quantity)*Number(it.rate)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop: 28 }}>
          <div style={{ minWidth: 240, border: `1px solid ${theme.accent}`, padding: '14px 18px' }}>
            {discountAmt > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, color:'#10b981' }}><em>Discount</em><span>-{currency.symbol}{discountAmt.toFixed(2)}</span></div>}
            {taxAmt > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, color:'#555' }}><em>Tax</em><span>+{currency.symbol}{taxAmt.toFixed(2)}</span></div>}
            {shippingAmt > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, color:'#555' }}><em>Shipping</em><span>+{currency.symbol}{shippingAmt.toFixed(2)}</span></div>}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 17, fontWeight: 700, marginTop: 8, borderTop:`1px solid ${theme.accent}`, paddingTop: 8, color: '#0f172a' }}>
              <span>Total Due</span><span>{currency.symbol}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        {w.details?.upiId && <div style={{ fontSize: 11, color:'#666', marginTop: 16 }}>Pay via UPI: <b>{w.details.upiId}</b></div>}
        {sigPreview && <div style={{ marginTop: 28, display:'flex', justifyContent:'flex-end' }}><div style={{ textAlign:'center' }}><img src={sigPreview} style={{ height: 44, objectFit:'contain' }} /><div style={{ fontSize: 9, color:'#999', letterSpacing: 2, marginTop: 4 }}>AUTHORISED SIGNATORY</div></div></div>}
        <div style={{ textAlign:'center', fontSize: 10, color:'#999', marginTop: 32, letterSpacing: 3, fontStyle:'italic' }}>{w.details?.notes || 'Thank you for your business'}</div>
      </div>
    </div>
  )

  // ── GST Pro (Indian tax invoice: CGST/SGST split + amount in words) ──
  if (template === 'gstpro') return (
    <div style={{ fontFamily: 'system-ui', background: '#fff', color: '#111', padding: 0 }}>
      <div style={{ background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`, color: '#fff', padding: '22px 30px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
          {logoPreview && <img src={logoPreview} style={{ height: 44, objectFit:'contain' }} />}
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{w.sender?.name}</div>
            <div style={{ fontSize: 10, opacity: 0.85 }}>{w.sender?.address}</div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 3 }}>TAX INVOICE</div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>#{w.details?.invoiceNumber} · {w.details?.invoiceDate}</div>
        </div>
      </div>
      <div style={{ padding: '24px 30px' }}>
        <div style={{ display:'flex', gap: 24, marginBottom: 20 }}>
          <div style={{ flex: 1, fontSize: 11 }}>
            <div style={{ fontWeight: 800, fontSize: 10, color:'#666', letterSpacing: 1, marginBottom: 4 }}>BILL TO</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{w.receiver?.name}</div>
            <div style={{ color:'#555', lineHeight: 1.6 }}>{w.receiver?.address}<br/>{w.receiver?.email}</div>
          </div>
          <div style={{ fontSize: 11, textAlign:'right', color:'#555', lineHeight: 1.8 }}>
            {w.details?.dueDate && <div><b>Due Date:</b> {w.details.dueDate}</div>}
            {w.sender?.phone && <div><b>Ph:</b> {w.sender.phone}</div>}
          </div>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize: 11 }}>
          <thead><tr style={{ background: theme.light, borderBottom: `1.5px solid ${theme.accent}` }}>
            <th style={{ textAlign:'left', padding: 7 }}>#</th>
            <th style={{ textAlign:'left', padding: 7 }}>Description</th>
            <th style={{ textAlign:'right', padding: 7 }}>Qty</th>
            <th style={{ textAlign:'right', padding: 7 }}>Rate</th>
            <th style={{ textAlign:'right', padding: 7 }}>Tax%</th>
            <th style={{ textAlign:'right', padding: 7 }}>Amount</th>
          </tr></thead>
          <tbody>
            {(w.items || []).map((it: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 7, color:'#999' }}>{i + 1}</td>
                <td style={{ padding: 7 }}>{it.description || '—'}</td>
                <td style={{ padding: 7, textAlign:'right' }}>{it.quantity}</td>
                <td style={{ padding: 7, textAlign:'right' }}>{currency.symbol}{Number(it.rate).toFixed(2)}</td>
                <td style={{ padding: 7, textAlign:'right', color:'#666' }}>{it.taxRate ?? 0}%</td>
                <td style={{ padding: 7, textAlign:'right', fontWeight: 600 }}>{currency.symbol}{(Number(it.quantity)*Number(it.rate)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop: 20, gap: 24, alignItems:'flex-start' }}>
          <div style={{ flex: 1, fontSize: 10, color:'#555' }}>
            {taxAmt > 0 && <table style={{ borderCollapse:'collapse', width:'100%', maxWidth: 260, fontSize: 10 }}>
              <thead><tr style={{ borderBottom:'1px solid #ddd' }}><th style={{ textAlign:'left', padding: 4 }}>Tax Split</th><th style={{ textAlign:'right', padding: 4 }}>Amount</th></tr></thead>
              <tbody>
                <tr><td style={{ padding: 4 }}>CGST @ {(Number(w.details?.tax || 0)/2).toFixed(1)}%</td><td style={{ padding: 4, textAlign:'right' }}>{currency.symbol}{(taxAmt/2).toFixed(2)}</td></tr>
                <tr><td style={{ padding: 4 }}>SGST @ {(Number(w.details?.tax || 0)/2).toFixed(1)}%</td><td style={{ padding: 4, textAlign:'right' }}>{currency.symbol}{(taxAmt/2).toFixed(2)}</td></tr>
              </tbody>
            </table>}
            <div style={{ marginTop: 10, fontStyle:'italic' }}>
              <b>In words:</b> {amountToWords(total, w.details?.currency || 'INR')}
            </div>
          </div>
          <div style={{ minWidth: 220 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12 }}><span>Subtotal</span><span>{currency.symbol}{itemsTotal.toFixed(2)}</span></div>
            {discountAmt > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, color:'#10b981' }}><span>Discount</span><span>-{currency.symbol}{discountAmt.toFixed(2)}</span></div>}
            {taxAmt > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12 }}><span>Tax</span><span>+{currency.symbol}{taxAmt.toFixed(2)}</span></div>}
            {shippingAmt > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12 }}><span>Shipping</span><span>+{currency.symbol}{shippingAmt.toFixed(2)}</span></div>}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 15, fontWeight: 900, marginTop: 6, background: theme.from, color:'#fff', padding:'6px 10px', borderRadius: 6 }}>
              <span>GRAND TOTAL</span><span>{currency.symbol}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        {w.details?.upiId && <div style={{ fontSize: 10, marginTop: 14, color:'#555' }}>UPI: <b>{w.details.upiId}</b></div>}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop: 20 }}>
          <div style={{ fontSize: 9, color:'#888', maxWidth: 320 }}>{w.details?.terms}</div>
          {sigPreview && <div style={{ textAlign:'center' }}><img src={sigPreview} style={{ height: 40, objectFit:'contain' }} /><div style={{ fontSize: 9, color:'#888', borderTop:'1px solid #ccc', paddingTop: 2 }}>Authorised Signatory</div></div>}
        </div>
      </div>
    </div>
  )

  // ── Sidebar ──
  if (template === 'sidebar') return (
    <div style={{ fontFamily: 'system-ui', display: 'flex', background: '#fff', minHeight: 600 }}>
      <div style={{ width: 180, background: `linear-gradient(180deg, ${theme.from}, ${theme.to})`, padding: 24, color: '#fff', flexShrink: 0 }}>
        {logoPreview && <img src={logoPreview} style={{ width: '100%', height: 60, objectFit: 'contain', marginBottom: 16, filter: 'brightness(0) invert(1)' }} />}
        <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 4 }}>{w.sender?.name}</div>
        <div style={{ fontSize: 10, opacity: 0.8, lineHeight: 1.6 }}>{w.sender?.address}<br/>{w.sender?.phone}<br/>{w.sender?.email}</div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', margin: '20px 0' }} />
        <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Bill To</div>
        <div style={{ fontWeight: 700, fontSize: 12 }}>{w.receiver?.name}</div>
        <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4, lineHeight: 1.6 }}>{w.receiver?.address}<br/>{w.receiver?.phone}</div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', margin: '20px 0' }} />
        <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Payment</div>
        {w.details?.upiId && <div style={{ fontSize: 10, opacity: 0.85 }}>UPI: {w.details.upiId}</div>}
        {w.details?.bankName && <div style={{ fontSize: 10, opacity: 0.85 }}>Bank: {w.details.bankName}</div>}
      </div>
      <div style={{ flex: 1, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 900, color: theme.from, letterSpacing: -2 }}>INVOICE</div>
            <div style={{ color: '#999', fontSize: 12 }}>#{w.details?.invoiceNumber}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: '#666' }}>
            <div>Date: {w.details?.invoiceDate}</div>
            {w.details?.dueDate && <div>Due: {w.details.dueDate}</div>}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: theme.light }}>
            <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 700, color: theme.from }}>Description</th>
            <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700, color: theme.from }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700, color: theme.from }}>Rate</th>
            <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700, color: theme.from }}>Amount</th>
          </tr></thead>
          <tbody>
            {(w.items || []).map((it: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '8px' }}>{it.description || '—'}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: '#666' }}>{it.quantity}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: '#666' }}>{currency.symbol}{Number(it.rate).toFixed(2)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{currency.symbol}{(Number(it.quantity)*Number(it.rate)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <div style={{ width: 220 }}>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#666',padding:'4px 0' }}><span>Subtotal</span><span>{currency.symbol}{itemsTotal.toFixed(2)}</span></div>
            {discountAmt > 0 && <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#10b981',padding:'4px 0' }}><span>Discount</span><span>-{currency.symbol}{discountAmt.toFixed(2)}</span></div>}
            {taxAmt > 0 && <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#666',padding:'4px 0' }}><span>Tax</span><span>+{currency.symbol}{taxAmt.toFixed(2)}</span></div>}
            <div style={{ display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:16,background:theme.light,padding:'8px',borderRadius:8,marginTop:8,color:theme.from }}><span>Total</span><span>{currency.symbol}{total.toFixed(2)}</span></div>
          </div>
        </div>
        {w.details?.notes && <div style={{ marginTop:24,fontSize:11,color:'#666',background:'#f9f9f9',padding:12,borderRadius:8 }}><b>Notes:</b> {w.details.notes}</div>}
        {sigPreview && <div style={{ marginTop:24,display:'flex',justifyContent:'flex-end' }}><div style={{ textAlign:'center' }}><img src={sigPreview} style={{ height:48,objectFit:'contain' }} /><div style={{ fontSize:10,color:'#999',borderTop:'1px solid #ccc',paddingTop:4,marginTop:4 }}>Authorised Signature</div></div></div>}
      </div>
    </div>
  )

  // ── Bold ──
  if (template === 'bold') return (
    <div style={{ fontFamily: 'system-ui', background: '#fff' }}>
      <div style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, padding: '32px 40px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {logoPreview && <img src={logoPreview} style={{ height: 56, objectFit: 'contain', marginBottom: 12, filter: 'brightness(0) invert(1)' }} />}
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>INVOICE</div>
            <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>#{w.details?.invoiceNumber}</div>
          </div>
          <div style={{ textAlign: 'right', opacity: 0.9, fontSize: 13, lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{w.sender?.name}</div>
            <div>{w.sender?.address}</div>
            <div>{w.sender?.email}</div>
            <div>{w.sender?.phone}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Bill To</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{w.receiver?.name}</div>
            <div style={{ color: '#666', fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>{w.receiver?.address}<br/>{w.receiver?.email}<br/>{w.receiver?.phone}</div>
          </div>
          <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Invoice Details</div>
            <div style={{ fontSize: 12, lineHeight: 2, color: '#444' }}>
              <div><b>Date:</b> {w.details?.invoiceDate}</div>
              {w.details?.dueDate && <div><b>Due:</b> {w.details.dueDate}</div>}
              <div><b>Status:</b> <span style={{ fontWeight: 700 }}>{w.details?.status?.toUpperCase()}</span></div>
            </div>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`, color: '#fff' }}>
            <th style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px 0 0 0' }}>Description</th>
            <th style={{ textAlign: 'right', padding: '12px 16px' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '12px 16px' }}>Rate</th>
            <th style={{ textAlign: 'right', padding: '12px 16px', borderRadius: '0 8px 0 0' }}>Amount</th>
          </tr></thead>
          <tbody>
            {(w.items || []).map((it: any, i: number) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px' }}>{it.description || '—'}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#666' }}>{it.quantity}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#666' }}>{currency.symbol}{Number(it.rate).toFixed(2)}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>{currency.symbol}{(Number(it.quantity)*Number(it.rate)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <div style={{ width: 240, background: '#f9f9f9', borderRadius: 12, padding: 16 }}>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'#666',padding:'4px 0' }}><span>Subtotal</span><span>{currency.symbol}{itemsTotal.toFixed(2)}</span></div>
            {discountAmt > 0 && <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'#10b981',padding:'4px 0' }}><span>Discount</span><span>-{currency.symbol}{discountAmt.toFixed(2)}</span></div>}
            {taxAmt > 0 && <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'#666',padding:'4px 0' }}><span>Tax</span><span>+{currency.symbol}{taxAmt.toFixed(2)}</span></div>}
            {shippingAmt > 0 && <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'#666',padding:'4px 0' }}><span>Shipping</span><span>+{currency.symbol}{shippingAmt.toFixed(2)}</span></div>}
            <div style={{ display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:18,color:theme.from,borderTop:`2px solid ${theme.from}`,marginTop:8,paddingTop:8 }}><span>Total</span><span>{currency.symbol}{total.toFixed(2)}</span></div>
          </div>
        </div>
        {sigPreview && <div style={{ marginTop:24,display:'flex',justifyContent:'flex-end' }}><div style={{ textAlign:'center' }}><img src={sigPreview} style={{ height:48,objectFit:'contain' }} /><div style={{ fontSize:10,color:'#999',borderTop:'1px solid #ccc',paddingTop:4,marginTop:4 }}>Authorised Signature</div></div></div>}
      </div>
    </div>
  )

  // ── Modern (default) ──
  if (template === 'modern') return (
    <div style={{ fontFamily: 'system-ui', background: '#fff' }}>
      <div style={{ height: 8, background: `linear-gradient(90deg, ${theme.from}, ${theme.to})` }} />
      <div style={{ padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            {logoPreview && <img src={logoPreview} style={{ height: 48, objectFit: 'contain', marginBottom: 12 }} />}
            <div style={{ fontWeight: 900, fontSize: 15 }}>{w.sender?.name}</div>
            <div style={{ color: '#666', fontSize: 12, lineHeight: 1.7 }}>{w.sender?.address}<br/>{w.sender?.email}<br/>{w.sender?.phone}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: theme.from, letterSpacing: -2 }}>INVOICE</div>
            <div style={{ color: '#999', fontSize: 12, marginTop: 4, fontFamily: 'monospace' }}>#{w.details?.invoiceNumber}</div>
            <div style={{ color: '#999', fontSize: 12 }}>Date: {w.details?.invoiceDate}</div>
            {w.details?.dueDate && <div style={{ color: '#999', fontSize: 12 }}>Due: {w.details.dueDate}</div>}
          </div>
        </div>
        <div style={{ background: theme.light, borderRadius: 12, padding: '14px 20px', marginBottom: 24, borderLeft: `4px solid ${theme.from}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.from, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Bill To</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{w.receiver?.name}</div>
          <div style={{ color: '#666', fontSize: 12 }}>{w.receiver?.address} · {w.receiver?.email} · {w.receiver?.phone}</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: theme.light, color: theme.from }}>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700 }}>Description</th>
            <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700 }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700 }}>Rate</th>
            <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700 }}>Amount</th>
          </tr></thead>
          <tbody>
            {(w.items || []).map((it: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px 12px' }}>{it.description || '—'}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#666' }}>{it.quantity}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#666' }}>{currency.symbol}{Number(it.rate).toFixed(2)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{currency.symbol}{(Number(it.quantity)*Number(it.rate)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <div style={{ width: 220 }}>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#666',padding:'3px 0' }}><span>Subtotal</span><span>{currency.symbol}{itemsTotal.toFixed(2)}</span></div>
            {discountAmt > 0 && <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#10b981',padding:'3px 0' }}><span>Discount</span><span>-{currency.symbol}{discountAmt.toFixed(2)}</span></div>}
            {taxAmt > 0 && <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#666',padding:'3px 0' }}><span>Tax</span><span>+{currency.symbol}{taxAmt.toFixed(2)}</span></div>}
            {shippingAmt > 0 && <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#666',padding:'3px 0' }}><span>Shipping</span><span>+{currency.symbol}{shippingAmt.toFixed(2)}</span></div>}
            <div style={{ display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:16,borderTop:`2px solid ${theme.from}`,marginTop:8,paddingTop:8,color:theme.from }}><span>Total</span><span>{currency.symbol}{total.toFixed(2)}</span></div>
          </div>
        </div>
        {(w.details?.notes || w.details?.terms) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24, borderTop: '1px solid #f0f0f0', paddingTop: 20, fontSize: 12, color: '#666' }}>
            {w.details?.notes && <div><b style={{ color: '#333' }}>Notes</b><p style={{ marginTop: 4 }}>{w.details.notes}</p></div>}
            {w.details?.terms && <div><b style={{ color: '#333' }}>Terms</b><p style={{ marginTop: 4 }}>{w.details.terms}</p></div>}
          </div>
        )}
        {sigPreview && <div style={{ marginTop:24,display:'flex',justifyContent:'flex-end' }}><div style={{ textAlign:'center' }}><img src={sigPreview} style={{ height:48,objectFit:'contain' }} /><div style={{ fontSize:10,color:'#999',borderTop:'1px solid #ccc',paddingTop:4,marginTop:4 }}>Authorised Signature</div></div></div>}
        <div style={{ textAlign: 'center', fontSize: 10, color: '#ccc', marginTop: 32, borderTop: '1px solid #f5f5f5', paddingTop: 12 }}>Generated by OpenBill · {new Date().getFullYear()}</div>
      </div>
    </div>
  )

  // ── Classic (fallback) ──
  return (
    <div style={{ fontFamily: 'Georgia, serif', background: '#fff', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          {logoPreview && <img src={logoPreview} style={{ height: 56, objectFit: 'contain', marginBottom: 12 }} />}
          <div style={{ fontWeight: 700, fontSize: 20 }}>{w.sender?.name}</div>
          <div style={{ color: '#555', fontSize: 12, lineHeight: 1.7, marginTop: 4 }}>{w.sender?.address}<br/>{w.sender?.email}<br/>{w.sender?.phone}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: theme.from }}>INVOICE</div>
          <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>No. {w.details?.invoiceNumber}</div>
          <div style={{ fontSize: 12, color: '#777' }}>Date: {w.details?.invoiceDate}</div>
          {w.details?.dueDate && <div style={{ fontSize: 12, color: '#777' }}>Due: {w.details.dueDate}</div>}
        </div>
      </div>
      <div style={{ borderTop: `3px double ${theme.from}`, borderBottom: `3px double ${theme.from}`, padding: '12px 0', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Bill To:</div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{w.receiver?.name}</div>
        <div style={{ color: '#555', fontSize: 12 }}>{w.receiver?.address} · {w.receiver?.email} · {w.receiver?.phone}</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ borderBottom: `2px solid ${theme.from}` }}>
          <th style={{ textAlign: 'left', padding: '8px 0' }}>Description</th>
          <th style={{ textAlign: 'right', padding: '8px 0' }}>Qty</th>
          <th style={{ textAlign: 'right', padding: '8px 0' }}>Rate</th>
          <th style={{ textAlign: 'right', padding: '8px 0' }}>Amount</th>
        </tr></thead>
        <tbody>
          {(w.items || []).map((it: any, i: number) => (
            <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px 0' }}>{it.description || '—'}</td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>{it.quantity}</td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>{currency.symbol}{Number(it.rate).toFixed(2)}</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>{currency.symbol}{(Number(it.quantity)*Number(it.rate)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <div style={{ width: 200 }}>
          <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,padding:'3px 0' }}><span>Subtotal</span><span>{currency.symbol}{itemsTotal.toFixed(2)}</span></div>
          {discountAmt > 0 && <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'green',padding:'3px 0' }}><span>Discount</span><span>-{currency.symbol}{discountAmt.toFixed(2)}</span></div>}
          {taxAmt > 0 && <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,padding:'3px 0' }}><span>Tax</span><span>+{currency.symbol}{taxAmt.toFixed(2)}</span></div>}
          <div style={{ display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:16,borderTop:`2px solid ${theme.from}`,marginTop:8,paddingTop:8,color:theme.from }}><span>TOTAL</span><span>{currency.symbol}{total.toFixed(2)}</span></div>
        </div>
      </div>
      {sigPreview && <div style={{ marginTop:24,display:'flex',justifyContent:'flex-end' }}><div style={{ textAlign:'center' }}><img src={sigPreview} style={{ height:48,objectFit:'contain' }} /><div style={{ fontSize:10,color:'#999',borderTop:'1px solid #ccc',paddingTop:4,marginTop:4 }}>Authorised Signature</div></div></div>}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Invoices() {
  const [preview, setPreview] = useState(true)
  const [logoPreview, setLogoPreview] = useState('')
  const [sigPreview, setSigPreview] = useState('')
  const [theme, setTheme] = useState(THEMES[0])
  const [showThemes, setShowThemes] = useState(false)
  const [template, setTemplate] = useState<TemplateName>('modern')
  const [showTemplates, setShowTemplates] = useState(false)
  const [pageSize, setPageSize] = useState<PageSize>('a4')
  const [zoom, setZoom] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const sigRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const settings = useLiveQuery(() => db.settings.get(1))

  const { register, handleSubmit, control, watch, setValue, reset } = useForm<FormValues>({
    defaultValues: {
      sender: { name: '', address: '', zipCode: '', city: '', country: '', email: '', phone: '', customInputs: [] },
      receiver: { name: '', address: '', zipCode: '', city: '', country: '', email: '', phone: '', customInputs: [] },
      details: {
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '', currency: 'INR', invoiceLogo: '', signature: '',
        notes: 'Thank you for your business!', terms: 'Payment due within 30 days.',
        discount: 0, shipping: 0, tax: 18,
        paymentMethod: 'upi', upiId: '', bankName: '', accountNumber: '', ifsc: '',
        status: 'draft',
      },
      items: [{ description: '', quantity: 1, rate: 0, taxRate: 0 }],
    },
  })

  // Auto-fill company details from Settings on load
  useEffect(() => {
    if (!settings) return
    const addr = settings.businessAddress
    setValue('sender.name', settings.businessName || '')
    setValue('sender.address', addr ? [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') : '')
    setValue('sender.email', settings.email || '')
    setValue('sender.phone', settings.phone || '')
    setValue('sender.country', addr?.country || 'India')
    setValue('details.currency', settings.currency || 'INR')
    setValue('details.upiId', settings.upiId || '')
    if (logoPreview === '' && settings.businessLogo) setLogoPreview(settings.businessLogo)
    if (sigPreview === '' && settings.signatureImage) setSigPreview(settings.signatureImage)
  }, [settings])

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: 'items' })
  const { fields: senderCustom, append: appendSenderCustom, remove: removeSenderCustom } = useFieldArray({ control, name: 'sender.customInputs' })
  const { fields: receiverCustom, append: appendReceiverCustom, remove: removeReceiverCustom } = useFieldArray({ control, name: 'receiver.customInputs' })

  const w = watch()
  const currency = CURRENCIES.find(c => c.code === w.details?.currency) || CURRENCIES[0]
  const itemsTotal = (w.items || []).reduce((s, i) => s + Number(i.quantity) * Number(i.rate), 0)
  const discountAmt = (itemsTotal * Number(w.details?.discount || 0)) / 100
  const taxAmt = ((itemsTotal - discountAmt) * Number(w.details?.tax || 0)) / 100
  const shippingAmt = Number(w.details?.shipping || 0)
  const total = itemsTotal - discountAmt + taxAmt + shippingAmt

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>, field: 'details.invoiceLogo' | 'details.signature', setP: (s: string) => void) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { const v = ev.target?.result as string; setValue(field, v); setP(v) }
    reader.readAsDataURL(file)
  }

  const generatePDF = useCallback(async (): Promise<Blob | null> => {
    if (!previewRef.current) return null
    setGenerating(true)
    try {
      const isThermal = pageSize === 'thermal58' || pageSize === 'thermal80'
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      if (isThermal) {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pageSize === 'thermal58' ? 58 : 80, canvas.height * (pageSize === 'thermal58' ? 58 : 80) / canvas.width] })
        pdf.addImage(imgData, 'PNG', 0, 0, pageSize === 'thermal58' ? 58 : 80, canvas.height * (pageSize === 'thermal58' ? 58 : 80) / canvas.width)
        return pdf.output('blob')
      }
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pageSize === 'letter' ? 'letter' : 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = (canvas.height * pdfW) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
      return pdf.output('blob')
    } finally { setGenerating(false) }
  }, [pageSize])

  const downloadPDF = async () => {
    const blob = await generatePDF(); if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `${w.details?.invoiceNumber || 'invoice'}.pdf`; a.click()
    URL.revokeObjectURL(url)
    notify.success('PDF Downloaded', `${w.details?.invoiceNumber}.pdf`)
  }

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(`Hi ${w.receiver?.name || 'there'},\n\nYour invoice *${w.details?.invoiceNumber}* for *${currency.symbol}${total.toFixed(2)}* is ready.\n\nThank you! 🙏\n— ${w.sender?.name || 'OpenBill'}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const shareEmail = () => {
    const sub = encodeURIComponent(`Invoice ${w.details?.invoiceNumber} — ${currency.symbol}${total.toFixed(2)}`)
    const body = encodeURIComponent(`Dear ${w.receiver?.name || 'Customer'},\n\nPlease find your invoice ${w.details?.invoiceNumber} for ${currency.symbol}${total.toFixed(2)}.\n\nThank you!\n${w.sender?.name || ''}`)
    window.open(`mailto:${w.receiver?.email || ''}?subject=${sub}&body=${body}`)
  }

  const duplicateInvoice = () => {
    reset({ ...w, details: { ...w.details, invoiceNumber: `INV-${Date.now().toString().slice(-6)}`, invoiceDate: new Date().toISOString().split('T')[0], status: 'draft' } })
    notify.info('Duplicated', 'Update invoice number and date')
  }

  const onSubmit = async (data: FormValues) => {
    const items = data.items.map(i => ({ id: `${Date.now()}-${Math.random()}`, name: i.description, quantity: Number(i.quantity), unit: 'pcs', rate: Number(i.rate), taxRate: Number(i.taxRate), amount: Number(i.quantity) * Number(i.rate) }))
    await db.invoices.add({ id: Date.now().toString(), type: 'invoice', number: data.details.invoiceNumber, status: data.details.status as any, date: new Date(data.details.invoiceDate), dueDate: data.details.dueDate ? new Date(data.details.dueDate) : undefined, customerId: data.receiver.name, items, subtotal: itemsTotal, taxType: 'exclusive', taxes: [], shipping: shippingAmt, adjustment: -discountAmt, total, amountPaid: 0, currency: data.details.currency, notes: data.details.notes, templateId: 't1', createdAt: new Date(), updatedAt: new Date() } as any)
    setSaved(true); setTimeout(() => setSaved(false), 3000)
    notify.success('Saved', `${data.details.invoiceNumber} saved`)
  }

  const inp = 'w-full rounded-xl border border-gray-200 bg-white/70 backdrop-blur px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition placeholder:text-gray-300'
  const lbl = 'block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest'
  const sec = 'bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-6'

  return (
    <div className="min-h-screen relative">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-2xl border-b border-white/40 shadow-sm px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap no-print">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
            <FileText size={15} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-black text-gray-900 leading-none">Invoice Generator</div>
            <div className="text-xs text-gray-400">offline-first · all templates</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Template picker */}
          <div className="relative">
            <button onClick={() => { setShowTemplates(p => !p); setShowThemes(false) }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50 transition">
              <Layout size={12} /> {TEMPLATES.find(t => t.id === template)?.label}
            </button>
            {showTemplates && (
              <div className="absolute left-0 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-30 w-72 grid grid-cols-2 gap-2">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => { setTemplate(t.id); setShowTemplates(false) }}
                    className={`text-left px-3 py-2 rounded-xl text-xs transition ${template === t.id ? 'text-white shadow-md' : 'hover:bg-gray-50 text-gray-700'}`}
                    style={template === t.id ? { background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` } : {}}>
                    <div className="font-bold">{t.label}</div>
                    <div className="opacity-70">{t.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Page size */}
          <select value={pageSize} onChange={e => setPageSize(e.target.value as PageSize)}
            className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold bg-white hover:bg-gray-50 transition cursor-pointer">
            {PAGE_SIZES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>

          {/* Theme */}
          <div className="relative">
            <button onClick={() => { setShowThemes(p => !p); setShowTemplates(false) }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50 transition">
              <Palette size={12} /> {theme.name}
            </button>
            {showThemes && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 p-2 flex gap-2 z-30">
                {THEMES.map(t => (
                  <button key={t.name} onClick={() => { setTheme(t); setShowThemes(false) }}
                    title={t.name}
                    className="w-8 h-8 rounded-lg shadow transition hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }} />
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <select {...register('details.status')}
            className={`px-2 py-1.5 rounded-xl text-xs font-bold border-0 cursor-pointer ${STATUS_COLORS[w.details?.status || 'draft']}`}>
            {['draft','sent','paid','overdue','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>

          <button onClick={() => setPreview(p => !p)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-medium hover:bg-gray-50 transition">
            {preview ? <EyeOff size={12} /> : <Eye size={12} />}
            <span className="hidden sm:inline">{preview ? 'Hide' : 'Preview'}</span>
          </button>
          <button onClick={duplicateInvoice} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-medium hover:bg-gray-50 transition">
            <Copy size={12} /><span className="hidden sm:inline">Duplicate</span>
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-medium hover:bg-gray-50 transition">
            <Printer size={12} /><span className="hidden sm:inline">Print</span>
          </button>
          <button onClick={downloadPDF} disabled={generating} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition">
            <Download size={12} className={generating ? 'animate-bounce' : ''} />
            <span className="hidden sm:inline">{generating ? '…' : 'PDF'}</span>
          </button>
          <button onClick={shareWhatsApp} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition shadow">
            <Share2 size={12} /><span className="hidden sm:inline">WhatsApp</span>
          </button>
          <button onClick={shareEmail} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition shadow">
            <Mail size={12} /><span className="hidden sm:inline">Email</span>
          </button>
          <button onClick={handleSubmit(onSubmit)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition shadow hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
            {saved ? <CheckCircle size={12} /> : <Save size={12} />}
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-[1fr_500px] gap-6">
        {/* ══ FORM ══ */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Logo + Invoice meta */}
          <div className={sec}>
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="shrink-0">
                <p className={lbl}>Logo</p>
                <div onClick={() => logoRef.current?.click()}
                  className="w-28 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-violet-400 transition overflow-hidden bg-gray-50">
                  {logoPreview ? <img src={logoPreview} className="w-full h-full object-contain p-1" /> : <><span className="text-xl">🖼️</span><span className="text-xs text-gray-400 mt-1">Upload logo</span></>}
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => handleImage(e, 'details.invoiceLogo', setLogoPreview)} />
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2"><label className={lbl}>Invoice #</label><input className={inp} {...register('details.invoiceNumber')} /></div>
                <div><label className={lbl}>Date</label><input type="date" className={inp} {...register('details.invoiceDate')} /></div>
                <div><label className={lbl}>Due Date</label><input type="date" className={inp} {...register('details.dueDate')} /></div>
                <div><label className={lbl}>Currency</label>
                  <select className={inp} {...register('details.currency')}>
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Bill From / To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(['sender','receiver'] as const).map(party => (
              <div key={party} className={sec}>
                <h2 className="text-sm font-black text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shadow"
                    style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
                    {party === 'sender' ? 'F' : 'T'}
                  </span>
                  {party === 'sender' ? 'Bill From' : 'Bill To'}
                </h2>
                <div className="space-y-2.5">
                  {(['name','address','zipCode','city','country','email','phone'] as const).map(f => (
                    <div key={f}>
                      <label className={lbl}>{f === 'zipCode' ? 'ZIP' : f}</label>
                      <input className={inp} placeholder={`${party === 'sender' ? 'Your' : "Client's"} ${f}`} {...register(`${party}.${f}`)} />
                    </div>
                  ))}
                  {(party === 'sender' ? senderCustom : receiverCustom).map((field, i) => (
                    <div key={field.id} className="flex gap-2">
                      <input className={inp} placeholder="Label" {...register(`${party}.customInputs.${i}.key`)} />
                      <input className={inp} placeholder="Value" {...register(`${party}.customInputs.${i}.value`)} />
                      <button type="button" onClick={() => party === 'sender' ? removeSenderCustom(i) : removeReceiverCustom(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => party === 'sender' ? appendSenderCustom({ key:'',value:'' }) : appendReceiverCustom({ key:'',value:'' })}
                    className="text-xs font-bold flex items-center gap-1 hover:underline" style={{ color: theme.accent }}>
                    <Plus size={12} /> Custom field
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Items */}
          <div className={sec}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-gray-700">Items</h2>
              <button type="button" onClick={() => appendItem({ description:'', quantity:1, rate:0, taxRate:0 })}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl text-white shadow"
                style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
                <Plus size={12} /> Add Item
              </button>
            </div>
            <div className="mb-2 grid grid-cols-12 gap-2 text-xs font-black text-gray-400 uppercase tracking-widest px-1">
              <span className="col-span-5">Description</span><span className="col-span-2">Qty</span>
              <span className="col-span-2">Rate</span><span className="col-span-2">Amount</span><span className="col-span-1"/>
            </div>
            {itemFields.map((field, i) => {
              const amt = Number(w.items?.[i]?.quantity ?? 0) * Number(w.items?.[i]?.rate ?? 0)
              return (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center mb-2">
                  <input className={`${inp} col-span-5`} placeholder="Description" {...register(`items.${i}.description` as const)} />
                  <input type="number" className={`${inp} col-span-2`} min={0} {...register(`items.${i}.quantity` as const, { valueAsNumber: true })} />
                  <input type="number" className={`${inp} col-span-2`} min={0} step="0.01" {...register(`items.${i}.rate` as const, { valueAsNumber: true })} />
                  <span className="col-span-2 text-sm font-black" style={{ color: theme.accent }}>{currency.symbol}{amt.toFixed(2)}</span>
                  <button type="button" onClick={() => removeItem(i)} disabled={itemFields.length === 1} className="col-span-1 text-red-400 hover:text-red-600 disabled:opacity-20 flex justify-center"><Trash2 size={14} /></button>
                </div>
              )
            })}
            <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3">
              <div><label className={lbl}>Discount %</label><input type="number" className={inp} min={0} max={100} step="0.5" {...register('details.discount', { valueAsNumber: true })} /></div>
              <div><label className={lbl}>Tax %</label><input type="number" className={inp} min={0} step="0.5" {...register('details.tax', { valueAsNumber: true })} /></div>
              <div><label className={lbl}>Shipping</label><input type="number" className={inp} min={0} step="0.01" {...register('details.shipping', { valueAsNumber: true })} /></div>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="w-56 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{currency.symbol}{itemsTotal.toFixed(2)}</span></div>
                {discountAmt > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{currency.symbol}{discountAmt.toFixed(2)}</span></div>}
                {taxAmt > 0 && <div className="flex justify-between text-gray-500"><span>Tax</span><span>+{currency.symbol}{taxAmt.toFixed(2)}</span></div>}
                {shippingAmt > 0 && <div className="flex justify-between text-gray-500"><span>Shipping</span><span>+{currency.symbol}{shippingAmt.toFixed(2)}</span></div>}
                <div className="flex justify-between font-black text-lg pt-2 border-t-2 border-gray-900" style={{ color: theme.accent }}>
                  <span>Total</span><span>{currency.symbol}{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment info */}
          <div className={sec}>
            <button type="button" className="w-full flex items-center justify-between text-sm font-black text-gray-700" onClick={() => setShowPayment(p => !p)}>
              <span>Payment Information</span>{showPayment ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
            {showPayment && (
              <div className="mt-4 space-y-3">
                <div><label className={lbl}>Method</label>
                  <select className={inp} {...register('details.paymentMethod')}>
                    <option value="upi">UPI</option><option value="bank">Bank Transfer</option>
                    <option value="cash">Cash</option><option value="card">Card</option><option value="cheque">Cheque</option>
                  </select>
                </div>
                {w.details?.paymentMethod === 'upi' && <div><label className={lbl}>UPI ID</label><input className={inp} placeholder="yourname@paytm" {...register('details.upiId')} /></div>}
                {w.details?.paymentMethod === 'bank' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>Bank</label><input className={inp} {...register('details.bankName')} /></div>
                    <div><label className={lbl}>Account #</label><input className={inp} {...register('details.accountNumber')} /></div>
                    <div><label className={lbl}>IFSC</label><input className={inp} {...register('details.ifsc')} /></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes + Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className={sec}><label className={lbl}>Notes</label><textarea className={inp} rows={4} {...register('details.notes')} /></div>
            <div className={sec}><label className={lbl}>Terms & Conditions</label><textarea className={inp} rows={4} {...register('details.terms')} /></div>
          </div>

          {/* Signature */}
          <div className={sec}>
            <p className={lbl}>Signature / Seal</p>
            <div onClick={() => sigRef.current?.click()}
              className="w-48 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-violet-400 transition overflow-hidden bg-gray-50">
              {sigPreview ? <img src={sigPreview} className="w-full h-full object-contain p-1" /> : <><span className="text-xl">✍️</span><span className="text-xs text-gray-400 mt-1">Upload signature</span></>}
            </div>
            <input ref={sigRef} type="file" accept="image/*" className="hidden" onChange={e => handleImage(e, 'details.signature', setSigPreview)} />
          </div>

          {/* Bottom actions */}
          <div className="flex flex-wrap justify-end gap-3 pb-12 no-print">
            <button type="button" onClick={shareWhatsApp} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition shadow-lg"><Share2 size={15}/> WhatsApp</button>
            <button type="button" onClick={downloadPDF} disabled={generating} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"><Download size={15}/> {generating ? 'Generating…' : 'Download PDF'}</button>
            <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition"><Printer size={15}/> Print</button>
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition shadow-lg hover:opacity-90" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
              {saved ? <CheckCircle size={15}/> : <Save size={15}/>}{saved ? 'Saved!' : 'Save Invoice'}
            </button>
          </div>
        </form>

        {/* ══ LIVE PREVIEW ══ */}
        {preview && (
          <div className="hidden xl:block">
            <div className="sticky top-16">
              <div className="flex items-center justify-between mb-3 no-print">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Live Preview · {PAGE_SIZES.find(s=>s.id===pageSize)?.label}</span>
                <div className="flex gap-2 items-center">
                  <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ZoomOut size={12}/></button>
                  <span className="text-xs text-gray-400 w-10 text-center">{Math.round(zoom*100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ZoomIn size={12}/></button>
                </div>
              </div>
              <div className="overflow-auto rounded-2xl shadow-2xl border border-gray-100" style={{ maxHeight: 'calc(100vh - 130px)', background: '#e5e7eb' }}>
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s', padding: zoom < 1 ? 0 : 8 }}>
                  <div ref={previewRef}>
                    <InvoicePreview w={w} theme={theme} currency={currency} itemsTotal={itemsTotal} discountAmt={discountAmt} taxAmt={taxAmt} shippingAmt={shippingAmt} total={total} logoPreview={logoPreview} sigPreview={sigPreview} template={template} pageSize={pageSize} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
