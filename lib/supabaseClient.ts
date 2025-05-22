// Supabaseクライアントの初期化ファイル
// このファイルをimportすることで、どこからでもSupabaseの機能を利用できます

import { createClient } from '@supabase/supabase-js'

// .env.local から環境変数を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- 解説 ---
// ・supabaseUrl, supabaseAnonKey は必ず.env.localに設定してください
// ・このクライアントを使って認証やDB操作が可能です 