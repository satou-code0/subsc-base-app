// /pricingページ：プラン選択とStripe Checkout導線
// 最小構成でStripe Checkoutセッションを作成しリダイレクトします

'use client'

import { useState } from 'react'

export default function PricingPage() {
  // StripeのPrice IDは.env.localから取得（セキュリティのためサーバー経由が推奨）
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Checkoutセッション作成APIを叩いてリダイレクト
  const handleCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      // Next.jsのAPI Route経由でCheckoutセッションを作成
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url // StripeのCheckoutページへリダイレクト
      } else {
        setError('Checkoutセッションの作成に失敗しました')
      }
    } catch (e) {
      setError('エラーが発生しました')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>プラン選択</h2>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 'bold', fontSize: 18 }}>スタンダードプラン</div>
        <div>月額 980円（税込）</div>
      </div>
      <button onClick={handleCheckout} disabled={loading} style={{ width: '100%', padding: 12, fontSize: 16 }}>
        {loading ? 'リダイレクト中...' : 'このプランで申し込む'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      {/* --- 複数プランや詳細説明は必要に応じて追加 --- */}
    </div>
  )
} 