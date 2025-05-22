// /dashboardページ：有料会員エリア（最小構成）

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 認証状態の取得
    const getUserAndSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // サブスク状態を取得（subscriptionsテーブルから）
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()
        if (!error) setSubscription(data)
      }
      
      setLoading(false)
    }
    
    getUserAndSubscription()
  }, [])

  if (loading) return <div>読み込み中...</div>
  if (!user) return <div>ログインが必要です。<a href="/register" style={{color: 'blue', textDecoration: 'underline'}}>ログインページへ</a></div>
  if (!subscription || subscription.status !== 'active') {
    return <div>有料会員のみアクセス可能です。<a href="/pricing" style={{color: 'blue', textDecoration: 'underline'}}>プランに加入する</a></div>
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>有料会員エリア</h2>
      <p>ようこそ、{user.email} さん！</p>
      <p>あなたのサブスクリプションは <b>{subscription.status}</b> です。</p>
      {/* ここに会員限定コンテンツや機能を追加 */}
    </div>
  )
} 