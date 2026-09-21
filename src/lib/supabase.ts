import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// 云端后端（Supabase）。未配置环境变量时 client 为 null → 应用以纯本地模式运行。
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isCloudEnabled = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isCloudEnabled
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

export const APP_STATE_TABLE = 'app_state'
