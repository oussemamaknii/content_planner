import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseServerClient: SupabaseClient | null = null

export function getSupabaseServerClient() {
  if (supabaseServerClient) return supabaseServerClient
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  supabaseServerClient = createClient(url, key, { auth: { persistSession: false } })
  return supabaseServerClient
}



