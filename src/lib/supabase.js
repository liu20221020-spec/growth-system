import { createClient } from '@supabase/supabase-js'

// URL 已知；ANON_KEY 通过环境变量注入（本地 .env.local，线上 Netlify 环境变量）
const supabaseUrl = 'https://scnzcsakgkatxbzldhki.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const isSupabaseConfigured = () => supabaseAnonKey !== ''
