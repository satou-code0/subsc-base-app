# トラブルシューティング記録

## 概要
Next.js 15 + Supabase + Stripe統合における認証とAPI Route問題の解決記録

## 発生した問題

### 1. 初期設定問題
**エラー**: `Cannot find module '@/utils/supabase/server'`
**原因**: Supabaseクライアント設定ファイルが不足
**解決策**: 
- `lib/supabase/server.ts` - サーバーサイド用クライアント作成
- `lib/supabase/client.ts` - クライアントサイド用クライアント作成

### 2. Middleware Cookie処理問題
**エラー**: ログイン後にダッシュボードにリダイレクトされずログイン画面に戻される
**原因**: 
- Next.js 15でのCookie処理変更（`cookies()`がPromiseを返す）
- ローカル開発環境でのCookie同期問題
- Supabaseプロジェクト設定とCookieの不一致

**症状**:
```
Middleware: Available cookies: [
  'sb-db-auth-token-code-verifier',
  'sb-iabpxzufggonfcoyfsua-auth-token',  // 古いプロジェクトID
  '__next_hmr_refresh_hash__',
  '__stripe_mid'
]
Middleware: Auth check result: {
  hasUser: false,
  userEmail: undefined,
  error: 'Auth session missing!',
  isDev: true
}
```

### 3. API Route認証問題
**エラー**: `POST /api/create-checkout-session 401 (Unauthorized)`
**原因**: 
- Middlewareを無効化したことでAPI Route側のCookie処理が不十分
- サーバーサイドでのセッション情報取得失敗

## 解決手順

### Step 1: Supabaseクライアント設定の統一

**ファイル構成**:
```
lib/supabase/
├── client.ts    # クライアントサイド用（'use client'）
└── server.ts    # サーバーサイド用（サーバーコンポーネント）
```

**client.ts**:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**server.ts**:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
```

### Step 2: 開発環境での認証データクリア

**問題**: 古いSupabaseプロジェクトのCookieが残存
**解決**: 認証データクリア機能を実装

```typescript
const clearAllData = async () => {
  // Supabaseセッションクリア
  await supabase.auth.signOut()
  // ローカルストレージクリア
  localStorage.clear()
  sessionStorage.clear()
  // Cookieクリア
  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=")
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  })
}
```

### Step 3: Middleware設定の調整

**問題**: ローカル開発環境でのCookie処理が不安定
**解決**: 開発環境ではmiddlewareを無効化

```typescript
// .env
DISABLE_MIDDLEWARE=true

// middleware.ts
export async function middleware(req: NextRequest) {
  if (process.env.DISABLE_MIDDLEWARE === 'true') {
    return NextResponse.next()
  }
  // ... 認証処理
}
```

### Step 4: API Route認証の改善

**問題**: Cookie-based認証が機能しない
**解決**: Authorizationヘッダーベース認証を実装

**クライアント側**:
```typescript
const handleSubscribe = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  })
}
```

**API Route側**:
```typescript
export async function POST(req: NextRequest) {
  // Authorizationヘッダーからトークンを取得
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { /* Cookie処理 */ },
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    }
  )
  
  // トークンベース認証を優先
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) {
      // Stripe処理
    }
  }
  
  // Cookie認証をフォールバック
  // ...
}
```

## 最終的な動作フロー

1. **ログイン**: クライアントサイドでSupabase認証実行
2. **セッション確立**: ローカルストレージとCookieにセッション保存
3. **ダッシュボードアクセス**: Middlewareが無効化されているため直接アクセス可能
4. **API呼び出し**: Authorizationヘッダーでアクセストークンを送信
5. **Stripe処理**: トークンベース認証でユーザー確認後Checkoutセッション作成

## 学んだ教訓

### 1. Next.js 15での変更点
- `cookies()`がPromiseを返すようになった
- `await cookies()`として呼び出す必要がある

### 2. ローカル開発での考慮事項
- Cookieセキュリティ設定（httpOnly, secure, sameSite）
- プロジェクト変更時の古いCookieクリア

### 3. 認証方式の選択
- **Middleware**: 本番環境でのページレベル保護
- **Token-based**: API Routeでの確実な認証
- **Client-side**: ダッシュボード内での状態管理

### 4. デバッグのベストプラクティス
- 段階的なログ出力
- ブラウザ開発者ツールでのCookie確認
- セッション状態の詳細チェック

## 環境別設定

### 開発環境
```env
DISABLE_MIDDLEWARE=true
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 本番環境
```env
DISABLE_MIDDLEWARE=false
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## 参考資料
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Next.js 15 Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading)
- [Stripe Checkout Integration](https://stripe.com/docs/checkout/quickstart)

## コードクリーンアップ（2024年解決完了後）

### 削除された不要・冗長なコード

#### 1. 過度なデバッグログの削除
**対象ファイル**: 
- `middleware.ts`
- `app/login/page.tsx` 
- `app/dashboard/page.tsx`
- `app/api/create-checkout-session/route.ts`

**削除内容**:
- 本番環境で不要な詳細ログ出力
- 認証プロセスの段階的ログ
- Cookie設定の詳細ログ
- API レスポンスの詳細ログ

**残存ログ**: 開発環境でのエラーログのみ保持

#### 2. 開発用一時機能の削除
**対象**: `app/login/page.tsx`
- 認証データクリア機能（`clearAllData`関数）
- 複数回のセッション確認ループ
- 強制的なCookieクリア処理

**理由**: 問題解決後は不要な機能のため削除

#### 3. 冗長な認証処理の簡略化
**対象**: `app/api/create-checkout-session/route.ts`
- 二重の認証チェック処理を統合
- Token認証を優先、Cookie認証をフォールバックに整理
- 不要なセッション情報取得処理を削除

**改善前**:
```typescript
// トークン認証とCookie認証を別々に詳細ログ付きで実行
if (token) { /* 詳細ログ付きトークン認証 */ }
/* 詳細ログ付きCookie認証 */
```

**改善後**:
```typescript
let user = null
// トークンベース認証（優先）
if (token) { user = await getUserFromToken(token) }
// Cookie認証（フォールバック）
if (!user) { user = await getUserFromCookie() }
```

#### 4. Middlewareの最適化
**変更内容**:
- 不要なセッション強制更新処理を削除
- デバッグログを開発環境のみに限定
- Cookie設定エラーハンドリングを簡素化

### 最終的なファイル構成

**簡潔になったファイル**:
- `middleware.ts`: 98行 → 67行（-31行）
- `app/login/page.tsx`: 165行 → 77行（-88行）
- `app/dashboard/page.tsx`: 149行 → 95行（-54行）
- `app/api/create-checkout-session/route.ts`: 140行 → 64行（-76行）

**合計削除行数**: 249行のコード削除

### クリーンアップの効果

1. **保守性向上**: デバッグ用の一時的なコードを削除し、本質的な機能のみに集約
2. **パフォーマンス改善**: 不要なログ出力やセッション確認ループを削除
3. **可読性向上**: 冗長な認証処理を統合し、シンプルなフローに整理
4. **本番準備**: 開発用の機能を削除し、本番環境に適したコードベースに最適化

### 推奨事項（今後の開発）

- 新機能追加時は最初からシンプルな実装を心がける
- デバッグログは環境変数で制御する
- 一時的な機能には明確なコメントを付けて後で削除しやすくする
- 定期的なコードレビューでクリーンアップのタイミングを設ける 