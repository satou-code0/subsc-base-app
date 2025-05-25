import { createClient } from '@supabase/supabase-js'

/**
 * クライアントサイド用のSupabaseクライアント
 * 'use client'コンポーネントで使用
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // セッション管理の改善
      autoRefreshToken: true,        // 自動トークンリフレッシュ
      persistSession: true,          // セッション永続化
      detectSessionInUrl: true,      // URLからセッション検出
      flowType: 'pkce',              // PKCE flow使用
      
      // デバッグ用
      debug: process.env.NODE_ENV === 'development'
    }
  }
) 