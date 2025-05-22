# Next.js + Supabase + Stripe サブスクサービス構築 ToDoリスト

## 1. Next.js プロジェクトの初期化
- [x] Next.jsプロジェクトを作成する（`npx create-next-app@latest --typescript`）
  - 既存プロジェクトがあればスキップ

## 2. 必要パッケージのインストール
- [x] `@supabase/supabase-js`、`@supabase/auth-helpers-nextjs`、`stripe` をインストールする

## 3. 環境変数の設定（.env.local）
- [x] Supabase/Stripeの各種キーを`.env.local`に設定する
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

## 4. Supabaseクライアントのセットアップ
- [x] `lib/supabaseClient.ts`などでSupabaseクライアントを初期化する

## 5. ページ・APIルートの作成
- [x] `/register`：認証ページ（メール認証/Google認証UI）
- [x] `/pricing`：プラン選択ページ（Stripe Checkoutへの導線）
  - [x] `/api/create-checkout-session`：Stripe Checkoutセッション作成API（補助）
- [x] `/dashboard`：有料会員エリア（認証・サブスク状態でアクセス制御）
- [x] `/api/webhook.ts`：Stripe Webhook受信・DB反映

## 6. Vercelへのデプロイ
- [ ] GitHubリポジトリにpush
- [ ] Vercelで新規プロジェクト作成
- [ ] 環境変数をVercel側にも登録
- [ ] デプロイ

## 7. Stripe Webhookの本番URL設定
- [ ] StripeのWebhook送信先をVercelの本番URLに変更

## 8. 動作確認
- [ ] 新規ユーザー登録→プラン選択→決済→会員エリアアクセスまで一連の流れをテスト
- [ ] Stripeのテストカードで決済確認

---

### 補足
- 必要に応じてプロフィール管理や会員限定コンテンツの追加も検討
- 進捗に応じてチェックを入れて管理してください 