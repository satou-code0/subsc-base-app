// /dashboardページ：有料会員エリア
// Supabase認証＋サブスク状態でアクセス制御を行う最小構成

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

// DashboardContent：useSearchParamsを使用する部分をサブコンポーネント化
function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // 認証状態の取得と自動再認証処理
    const getUserAndSubscription = async () => {
      // まず現在の認証状態をチェック
      const { data: { user } } = await supabase.auth.getUser()
      
      // Stripe決済後のリダイレクトでuser_idパラメータがあるが
      // ログイン状態がない場合は自動再認証を試みる
      if (!user) {
        const success = searchParams.get('success')
        const userId = searchParams.get('user_id')
        
        if (success === '1' && userId) {
          // user_idからサブスク情報を取得して存在確認
          const { data: subscriptionData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single()
          
          if (subscriptionData) {
            try {
              // サービスロールを使ってJWTを作成（セキュリティ上の配慮が必要）
              const adminClient = supabase.auth.admin
              if (adminClient) {
                await adminClient.generateLink({
                  type: 'magiclink',
                  email: 'temp@example.com', // 実際のメールアドレスはDBから取得する必要があります
                })
                // 注: 実際の実装ではユーザーIDからメールアドレスを取得し
                // そのメールアドレスでのログイン処理を行う必要があります
                
                // 上記は概念的な実装であり、実際にはサーバーサイドで
                // セッションを発行する処理が必要です
              }
              
              // 代替策: ログインページにリダイレクトし、セッション復元を促す
              alert('セッションが切れています。もう一度ログインしてください。')
              router.replace('/register')
              return
            } catch (err) {
              console.error('自動再認証エラー:', err)
              // 認証に失敗した場合も後続処理で「ログインが必要です」と表示
            }
          }
        }
      }
      
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
  }, [searchParams, router])

  if (loading) return <div>読み込み中...</div>
  if (!user) return <div>ログインが必要です</div>
  if (!subscription || subscription.status !== 'active') {
    return <div>有料会員のみアクセス可能です。プランに加入してください。</div>
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

// メインのDashboardPageコンポーネント
export default function DashboardPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <DashboardContent />
    </Suspense>
  )
} 