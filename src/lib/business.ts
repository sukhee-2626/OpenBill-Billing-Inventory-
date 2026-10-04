import { db } from '@/db/schema'
import { fetchSettingsRow, upsertSettingsRow, type SettingsRow } from '@/lib/supabase'
import type { Settings } from '@/types'

// App camelCase Settings <-> Supabase snake_case row
function toRow(s: Settings): Partial<SettingsRow> {
  return {
    business_name: s.businessName,
    business_type: s.businessType,
    business_logo: s.businessLogo,
    signature_image: s.signatureImage,
    stamp_image: s.stampImage,
    business_address: s.businessAddress as SettingsRow['business_address'],
    gstin: s.gstin, phone: s.phone, email: s.email, website: s.website,
    upi_id: s.upiId, currency: s.currency, tax_system: s.taxSystem,
    invoice_prefix: s.invoicePrefix, enable_pin: s.enablePIN,
    config: { pin: s.pinHash, isOnboarded: s.isOnboarded },
  }
}

function fromRow(r: SettingsRow): Settings | null {
  if (!r) return null
  return {
    id: r.id ?? 1,
    businessName: r.business_name || '',
    businessType: r.business_type,
    businessLogo: r.business_logo,
    signatureImage: r.signature_image,
    stampImage: r.stamp_image,
    businessAddress: r.business_address as Settings['businessAddress'],
    gstin: r.gstin, phone: r.phone, email: r.email, website: r.website,
    upiId: r.upi_id, currency: r.currency || 'INR',
    taxSystem: (r.tax_system as Settings['taxSystem']) || 'GST',
    invoicePrefix: r.invoice_prefix || 'INV',
    invoiceNumbering: 'auto', invoiceAutoResetYearly: true,
    locale: 'en', timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY',
    enablePIN: r.enable_pin ?? false, pinHash: r.config?.pin,
    isOnboarded: r.config?.isOnboarded,
    updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
  }
}

/** Supabase first, local Dexie fallback. */
export async function getBusinessSettings(): Promise<Settings | null> {
  try {
    const row = await fetchSettingsRow()
    if (row?.business_name) return fromRow(row)
  } catch (e) { console.warn('[supabase] settings fetch failed, using local', e) }
  return (await db.settings.get(1)) ?? null
}

/** Dual-write: always local, best-effort cloud. */
export async function saveBusinessSettings(s: Settings): Promise<void> {
  await db.settings.put(s)
  try { await upsertSettingsRow(toRow(s)) } catch (e) { console.warn('[supabase] settings save failed (offline?)', e) }
}
