# Stripe × Supabase サブスクリプション連携 完全ガイド

## 📋 概要

Next.js、Stripe、Supabaseを使用したサブスクリプション決済システムの構築過程で発生した問題と解決方法をまとめたドキュメントです。

## 🏗️ システム構成

### アーキテクチャ
```
フロントエンド (Next.js)
    ↓
Stripe Checkout Session
    ↓
Stripe Webhook → `/api/webhook`
    ↓
Supabase Database (subscriptions テーブル)
```

### 必要なAPI エンドポイント
- `POST /api/create-checkout-session` - チェックアウトセッション作成
- `POST /api/webhook` - Stripe Webhook処理
- `POST /api/create-portal-session` - 顧客ポータル（アカウント管理）
- `GET /api/subscription-status` - サブスクリプション状態確認

## 🐛 発生した問題と解決方法

### 問題1: Webhook URLパスの不一致

**問題**: 
- Stripe設定: `/api/webhook` にWebhook送信
- コード配置: `/api/webhooks/stripe/route.ts` に実装
- 結果: 404エラーでWebhook処理が実行されない

**エラーログ**:
```
POST /api/webhook 404 in 28ms
POST /api/webhook 404 in 19ms
```

**解決方法**:
Webhookコードを `/api/webhook/route.ts` に移動して、Stripe設定とパスを一致させた。

### 問題2: 間違ったユーザーへのサブスクリプション割り当て

**問題**: 
- 同じStripe Customer IDが異なるSupabaseユーザーと紐づけられる
- Webhookで正しいメタデータがあるのに、間違ったユーザーにサブスクリプションが作成される

**原因**: 
- データベースの既存データとStripe Customerメタデータの不整合
- フォールバック処理でメールアドレス検索が間違ったユーザーを返していた

**解決方法**:
1. **データ修正API**で既存の不整合データを修正
2. **Checkout Session作成**でユーザー専用のStripe Customerを確実に作成
3. **Webhook処理**でメタデータ優先、フォールバック機能付きのユーザー検索

### 問題3: イベント選択の誤り

**問題**: 
最初は `customer.subscription.created` イベントを使用していたが、実際は `checkout.session.completed` を採用していた。

**解決方法**:
- `checkout.session.completed` イベント処理を追加
- 冗長になった `customer.subscription.created` と `invoice.payment_succeeded` の初回処理を削除

### 問題4: TypeScript型エラー

**問題**: 
```typescript
Property 'subscription' does not exist on type 'Invoice'.
```

**解決方法**:
```typescript
const invoiceWithSub = invoice as any
if (invoiceWithSub.subscription) {
  // 処理...
}
```

### 問題5: Stripe Billing Portal設定不備

**問題**: 
顧客ポータル（プラン・支払い方法管理）ボタンを押すと500エラーが発生。

**エラーメッセージ**:
```
No configuration provided and your test mode default configuration has not been created. 
Provide a configuration or create your default by saving your customer portal settings 
in test mode at https://dashboard.stripe.com/test/settings/billing/portal.
```

**原因**: 
Stripe Billing Portal（顧客ポータル）を使用するには、事前にStripeダッシュボードで設定を行う必要がある。

**解決方法**:
1. **Stripeダッシュボードにアクセス**:
   ```
   https://dashboard.stripe.com/test/settings/billing/portal
   ```

2. **Customer portal設定**:
   - "Activate test link"をクリック
   - Business information（会社情報）を入力
   - Features設定（顧客が利用できる機能を選択）:
     - Payment method management（支払い方法管理）
     - Subscription management（サブスクリプション管理）  
     - Invoice history（請求履歴）
     - など
   - "Save changes"をクリック

3. **設定完了後**: 
   `/api/create-portal-session`エンドポイントが正常に動作し、顧客がプラン変更や支払い方法変更を行えるようになる。

**重要な注意点**:
- テスト環境と本番環境で個別に設定が必要
- 設定なしではBilling Portal機能を使用できない
- 一度設定すれば、以降はコードによる動的作成が可能

## 💡 重要な学び

### 1. Stripe Customer管理の重要性

**ベストプラクティス**:
```typescript
// ユーザー専用のStripe Customerを作成/更新
const existingCustomers = await stripe.customers.list({
  email: user.email,
  limit: 10
})

const userSpecificCustomer = existingCustomers.data.find(customer => 
  customer.metadata?.supabase_user_id === user.id
)

if (userSpecificCustomer) {
  // 既存のユーザー専用Customer使用
} else {
  // 新規作成（メタデータ付き）
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { supabase_user_id: user.id }
  })
}
```

### 2. Webhook処理の堅牢性

**重要ポイント**:
- メタデータによるユーザー特定を最優先
- メールアドレス検索のフォールバック機能
- データ不整合の検出と警告
- エラーログの充実

### 3. イベント選択の考慮

**推奨**:
- `checkout.session.completed` - 決済完了とサブスクリプション作成
- `customer.subscription.updated` - プラン変更など
- `customer.subscription.deleted` - キャンセル
- `invoice.payment_failed` - 支払い失敗

## 🔧 最終的なコード構成

### Webhookエンドポイント (`/api/webhook/route.ts`)
```typescript
switch (event.type) {
  case 'checkout.session.completed':
    // メイン：サブスクリプション作成処理
    await handleCheckoutSessionCompleted(session)
    break
  
  case 'customer.subscription.updated':
    // サブスクリプション更新
    await handleSubscriptionUpdated(subscription)
    break
  
  case 'customer.subscription.deleted':
    // サブスクリプション削除
    await handleSubscriptionDeleted(subscription)
    break
  
  case 'invoice.payment_failed':
    // 支払い失敗
    await handleInvoicePaymentFailed(invoice)
    break
}
```

### データベーススキーマ
```sql
subscriptions テーブル:
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- stripe_customer_id (Text)
- stripe_sub_id (Text)
- status (Text)
- price_id (Text)
- current_period_end (Timestamp)
- created_at (Timestamp)
- email (Text)
```

## 🎯 運用のポイント

### 監視すべきログ
```
✅ 正常なフロー:
🔍 Checkout session作成開始
✅ ユーザー専用のStripe customer発見/作成
✅ Stripe session作成完了
🔍 Webhook受信開始
✅ Webhook署名検証成功: checkout.session.completed
🛒 チェックアウトセッション完了処理開始
✅ サブスクリプション保存成功
```

### トラブルシューティング
1. **404エラー**: Webhook URLパスを確認
2. **署名エラー**: STRIPE_WEBHOOK_SECRET環境変数を確認
3. **ユーザー不整合**: Stripe Customerメタデータとデータベースの整合性確認
4. **未処理イベント**: 必要なイベント処理が実装されているか確認
5. **Billing Portal 500エラー**: Stripeダッシュボードでポータル設定が完了しているか確認

### 環境設定チェックリスト
- [ ] Stripe API Keys設定済み
- [ ] Stripe Webhook Secret設定済み
- [ ] Supabase環境変数設定済み
- [ ] **Stripe Billing Portal設定済み**（テスト環境・本番環境両方）
- [ ] ngrok URL更新済み（開発時）
- [ ] Next.js BASE_URL設定済み

## 🚀 今後の拡張

### 推奨機能
- **プラン変更**: `customer.subscription.updated` での詳細処理
- **試用期間**: Stripe試用期間の活用
- **クーポン**: Stripe Couponの実装
- **分析**: サブスクリプション分析ダッシュボード

---

**作成日**: 2025年5月24日  
**対象システム**: Next.js + Stripe + Supabase  
**ステータス**: 本番稼働準備完了 ✅ 