// /pricingページ：プラン選択とStripe Checkout導線
// 最小構成でStripe Checkoutセッションを作成しリダイレクトします

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function PricingPage() {
  // StripeのPrice IDは.env.localから取得（セキュリティのためサーバー経由が推奨）
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // 認証状態をチェック
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/register')
      } else {
        setUserId(user.id) // ユーザーIDを状態に保存
        setLoading(false)
      }
    }
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 認証確認中はローディング表示
  if (loading) return <div>認証確認中...</div>

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  // Checkoutセッション作成APIを叩いてリダイレクト
  const handleCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      // Next.jsのAPI Route経由でCheckoutセッションを作成
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId }), // ユーザーIDを含める
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url // StripeのCheckoutページへリダイレクト
      } else {
        // APIからのエラーメッセージを詳細に表示
        setError(`Checkoutセッションの作成に失敗しました: ${data.error || '不明なエラー'}\nPrice ID: ${priceId || '未設定'}`);
      }
    } catch (e) {
      setError(`エラーが発生しました: ${e instanceof Error ? e.message : '不明なエラー'}`);
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8, position: 'relative' }}>
      {/* ログアウトボタン */}
      <button 
        onClick={handleLogout}
        style={{ 
          position: 'absolute',
          top: 24,
          right: 24,
          background: 'transparent',
          border: '1px solid #ccc',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 12,
          cursor: 'pointer'
        }}
      >
        ログアウト
      </button>

      <h2>プラン選択</h2>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 'bold', fontSize: 18 }}>スタンダードプラン</div>
        <div>月額 980円（税込）</div>
      </div>
      <button onClick={handleCheckout} disabled={loading} style={{ width: '100%', padding: 12, fontSize: 16 }}>
        {loading ? 'リダイレクト中...' : 'このプランで申し込む'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 12, whiteSpace: 'pre-wrap' }}>{error}</div>}
      {/* --- 複数プランや詳細説明は必要に応じて追加 --- */}
    </div>
  )
} 