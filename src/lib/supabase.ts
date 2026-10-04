import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Vercel env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
// ponytail: minimal client wrapper; add auth/users + row-level ownership when moving past test scope.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && key)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, key as string)
  : null

/** One row of public.settings (snake_case, matches Postgres). */
export interface SettingsRow {
  id: number
  business_name?: string
  business_type?: string
  business_logo?: string
  signature_image?: string
  stamp_image?: string
  business_address?: { line1: string; city: string; state: string; pincode: string; country: string }
  gstin?: string
  phone?: string
  email?: string
  website?: string
  upi_id?: string
  currency?: string
  tax_system?: string
  invoice_prefix?: string
  enable_pin?: boolean
  config?: { pin?: string; isOnboarded?: boolean; [k: string]: unknown }
  updated_at?: string
}

export async function fetchSettingsRow(): Promise<SettingsRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as SettingsRow) ?? null
}

export async function upsertSettingsRow(row: Partial<SettingsRow>): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('settings').upsert({ id: 1, ...row, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
}

/** Upsert a row of any app table (test scope: anon + permissive RLS). */
export async function upsertRow(table: string, row: Record<string, unknown>): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from(table).upsert(row)
  if (error) throw new Error(error.message)
}
