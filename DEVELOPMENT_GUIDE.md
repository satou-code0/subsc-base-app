# 🚀 モダンなサブスクリプションアプリを作る完全ガイド

> Next.js + Supabase + Stripeで構築する本格的なSaaSアプリケーション

## 📖 この記事について

このガイドでは、モダンな技術スタックを使って**本格的なサブスクリプション管理アプリ**を0から構築する過程を、実際の開発で遭遇した問題と解決策を含めて詳しく解説します。

### 🎯 完成するもの

- ✅ ユーザー認証（登録・ログイン）
- ✅ Stripe連携による決済処理
- ✅ サブスクリプション管理
- ✅ リアルタイムWebhook処理
- ✅ プロフェッショナルなUI/UX
- ✅ ダッシュボード機能

### 🛠️ 使用技術スタック

| 技術 | 用途 | 選択理由 |
|------|------|----------|
| **Next.js 14** | フロントエンド・API | 最新のフルスタックReactフレームワーク |
| **Supabase** | 認証・データベース | PostgreSQL + 認証が簡単に導入可能 |
| **Stripe** | 決済・サブスクリプション | 世界標準の決済プラットフォーム |
| **Tailwind CSS** | スタイリング | ユーティリティファーストのCSS |
| **TypeScript** | 型安全性 | 大規模開発でのバグ防止 |

---

## 📚 目次

1. [プロジェクトのセットアップ](#1-プロジェクトのセットアップ)
2. [認証システムの構築](#2-認証システムの構築)
3. [Stripe決済の統合](#3-stripe決済の統合)
4. [Webhook処理の実装](#4-webhook処理の実装)
5. [データベース設計と管理](#5-データベース設計と管理)
6. [サブスクリプション管理](#6-サブスクリプション管理)
7. [UI/UXの改善](#7-uiuxの改善)
8. [本番運用の準備](#8-本番運用の準備)

---

## 1. プロジェクトのセットアップ

### 1.1 Next.jsプロジェクトの作成

```bash
npx create-next-app@latest my-subscription-app --typescript --tailwind --eslint --app
cd my-subscription-app
npm install
```

### 1.2 必要なライブラリのインストール

```bash
# Supabase認証・データベース
npm install @supabase/supabase-js

# Stripe決済処理
npm install stripe @stripe/stripe-js

# 追加のユーティリティ
npm install clsx
```

### 1.3 環境変数の設定

`.env.local`ファイルを作成し、必要な環境変数を設定：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# アプリケーション
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 1.4 Supabaseクライアントの設定

`lib/supabase/client.ts`を作成：

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})
```

**ポイント**: PKCEフローにより、より安全な認証を実現

---

## 2. 認証システムの構築

### 2.1 ログインページの作成

`app/login/page.tsx`：

```tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('メールアドレスとパスワードを入力してください')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(`ログインに失敗しました: ${error.message}`)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setMessage('予期しないエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* フォームの実装 */}
    </div>
  )
}
```

### 2.2 新規登録ページの作成

同様の構造で`app/register/page.tsx`を作成。重要なのは**パスワード確認**と**バリデーション**：

```tsx
const handleRegister = async () => {
  // バリデーション
  if (!email || !password || !confirmPassword) {
    setMessage('❌ すべての項目を入力してください')
    return
  }

  if (password.length < 6) {
    setMessage('❌ パスワードは6文字以上で入力してください')
    return
  }

  if (password !== confirmPassword) {
    setMessage('❌ パスワードが一致しません')
    return
  }

  // Supabase認証
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
}
```

**学習ポイント**: 
- フロントエンドでのバリデーションの重要性
- セキュリティを考慮したパスワード要件

---

## 3. Stripe決済の統合

### 3.1 Stripeの初期設定

`lib/stripe.ts`でStripeクライアントを設定：

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})
```

### 3.2 決済セッション作成API

`app/api/create-checkout-session/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    // ユーザー認証の確認
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 既存の顧客を検索
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    let customerId = customers.data[0]?.id

    // 新規顧客の場合は作成
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      })
      customerId = customer.id
    }

    // チェックアウトセッションの作成
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_your_price_id',
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
```

**重要なポイント**:
- 顧客の重複作成を防ぐ検索処理
- メタデータでSupabaseとの連携
- 成功・キャンセル時のリダイレクト設定

---

## 4. Webhook処理の実装

### 4.1 Webhookエンドポイントの作成

`app/api/webhook/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    // Webhookの署名検証
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    console.log('Webhook received:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}

async function handleCheckoutCompleted(session: any) {
  // サブスクリプション情報をデータベースに保存
  const subscription = await stripe.subscriptions.retrieve(session.subscription)
  const customer = await stripe.customers.retrieve(session.customer)
  
  await supabase.from('subscriptions').upsert({
    user_id: customer.metadata.supabase_user_id,
    stripe_customer_id: session.customer,
    stripe_sub_id: session.subscription,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    email: customer.email
  })
}
```

### 4.2 Webhookで発生した問題と解決策

#### 問題1: 404エラー
**症状**: Stripeからのwebhookが404エラーになる
**原因**: ファイルパスの間違い（`/api/webhooks/stripe/` vs `/api/webhook/`）
**解決**: 正しいパスに移動

#### 問題2: データの不整合
**症状**: 顧客情報とユーザー情報の紐付けが正しくない
**原因**: 顧客検索時のメタデータ不備
**解決**: `supabase_user_id`をメタデータに確実に保存

---

## 5. データベース設計と管理

### 5.1 サブスクリプションテーブルの設計

```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_sub_id TEXT UNIQUE,
  status TEXT NOT NULL,
  price_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  email TEXT,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5.2 RLS（Row Level Security）の設定

```sql
-- RLSを有効化
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のサブスクリプションのみ閲覧可能
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
```

### 5.3 インデックスの作成

```sql
-- 頻繁に検索されるカラムにインデックス
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

**学習ポイント**:
- データベース設計におけるリレーションの重要性
- セキュリティを考慮したRLSの実装
- パフォーマンス向上のためのインデックス戦略

---

## 6. サブスクリプション管理

### 6.1 ステータス管理の実装

サブスクリプションには以下のステータスがあります：

| ステータス | 説明 | UI表示 |
|------------|------|--------|
| `active` | 通常のアクティブ状態 | ✅ プロプラン |
| `active_until_period_end` | 解約予定（期間終了まで有効） | ⚠️ プロプラン（終了予定） |
| `canceled` | 解約済み | ❌ 解約済み |

### 6.2 解約処理の実装

```typescript
// Billing Portalへのリダイレクト
const handleManageSubscription = async () => {
  const response = await fetch('/api/create-portal-session', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  })
  
  const data = await response.json()
  window.location.href = data.url
}
```

### 6.3 期間終了解約の検出

Stripe Billing Portalで「期間終了時に解約」を選択した場合：

```typescript
case 'customer.subscription.updated':
  const subscription = event.data.object
  
  // 期間終了時の解約を検出
  if (subscription.cancel_at_period_end) {
    await supabase.from('subscriptions').update({
      status: 'active_until_period_end',
      canceled_at: new Date().toISOString()
    }).eq('stripe_sub_id', subscription.id)
  }
  break
```

---

## 7. UI/UXの改善

### 7.1 統一されたデザインシステム

CSS変数を使用した統一カラーシステム：

```css
:root {
  /* 統一カラーパレット */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-card-blue: #eff6ff;
  --color-card-green: #f0fdf4;
  --color-card-purple: #faf5ff;
  
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  
  /* グラデーション */
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-success: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
```

### 7.2 再利用可能なコンポーネント

```css
.card {
  @apply rounded-2xl border-0 transition-all duration-300 hover:scale-[1.02];
  background: var(--color-card-default);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-soft);
  border: 1px solid var(--color-border-light);
}

.btn-primary {
  @apply px-6 py-3 rounded-xl font-medium text-white transform transition-all duration-200 hover:scale-105;
  background: var(--gradient-primary);
}
```

### 7.3 統計カードの実装

```tsx
// 色分けされた統計カード
<div className="stats-card stats-card-blue">
  <div className="stats-icon-blue">
    <svg className="w-6 h-6 text-blue-600">...</svg>
  </div>
  <h3 className="stats-number">1,234</h3>
  <p className="stats-label">総利用回数</p>
</div>
```

**デザインのポイント**:
- 視認性の向上（濃いグレー背景を廃止）
- カテゴリ別の色分け
- 統一されたスタイリングシステム

---

## 8. 本番運用の準備

### 8.1 認証フロー問題の解決

決済後の認証エラー対策：

```typescript
useEffect(() => {
  const checkUser = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        // リフレッシュトークンで復旧を試行
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          router.replace('/login?message=session_expired')
          return
        }
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      
    } catch (err) {
      console.error('Auth check error:', err)
    }
  }
  
  checkUser()
}, [])
```

### 8.2 エラーハンドリングの強化

```typescript
// APIエラーの統一処理
export async function handleApiError(error: any, fallbackMessage: string) {
  if (error.message?.includes('refresh_token_not_found')) {
    return 'セッションが期限切れです。再度ログインしてください。'
  }
  
  return error.message || fallbackMessage
}
```

### 8.3 環境別設定

```typescript
// 環境に応じたベースURL
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com' 
  : 'http://localhost:3000'
```

---

## 📊 開発で学んだ重要なポイント

### 🔧 技術的な学び

1. **Webhook処理の重要性**
   - 決済処理はWebhookで確実に処理する
   - 署名検証でセキュリティを確保

2. **認証フローの複雑さ**
   - 決済完了後のセッション管理
   - リフレッシュトークンの適切な処理

3. **データベース設計**
   - 適切なリレーションとインデックス
   - RLSによるセキュリティ強化

### 🎨 UX/UIの学び

1. **視認性の重要性**
   - 背景色とテキストのコントラスト
   - 統一されたカラーシステム

2. **フィードバックの充実**
   - ローディング状態の表示
   - エラーメッセージの分かりやすさ

3. **レスポンシブデザイン**
   - モバイルファーストの設計
   - 統一されたコンポーネント

---

## 🚀 次のステップ

このガイドで基本的なサブスクリプションアプリが完成しましたが、さらに以下の機能追加を検討できます：

### 📈 機能拡張

- [ ] **分析ダッシュボード**: Chart.jsによる売上分析
- [ ] **メール通知**: Resendによる自動メール
- [ ] **多言語対応**: i18nによる国際化
- [ ] **テスト**: Jest/Cypressによるテスト
- [ ] **API制限**: Redis/Upstashによるレート制限

### 🔒 セキュリティ強化

- [ ] **CSRF対策**: Next.jsのCSRF保護
- [ ] **入力サニタイゼーション**: DOMPurifyの導入
- [ ] **ログ監視**: Sentryによるエラー追跡

### 📱 モバイル対応

- [ ] **PWA化**: Service Workerの実装
- [ ] **プッシュ通知**: Web Push APIの活用

---

## 💡 まとめ

このガイドでは、モダンなサブスクリプションアプリの構築を通じて、以下の技術とベストプラクティスを学びました：

✅ **フルスタック開発**: Next.js 14の App Router  
✅ **認証・データベース**: Supabaseの活用  
✅ **決済処理**: Stripeの統合とWebhook処理  
✅ **UI/UX**: Tailwind CSSによるモダンデザイン  
✅ **型安全性**: TypeScriptによる開発効率向上  

実際の開発では、このガイドで紹介したような問題に遭遇することがありますが、**問題を一つずつ解決していく過程**が最も重要な学習となります。

ぜひこのガイドを参考に、あなた独自のサブスクリプションアプリを構築してみてください！

---

## 📚 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**作成者**: SubsBase Development Team  
**更新日**: 2024年12月  
**バージョン**: 1.0.0 