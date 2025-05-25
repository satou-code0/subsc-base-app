# 🎯 Supabase + Stripe Webhook 問題解決から得た教訓

## 📋 問題の概要

**症状**: Stripe webhookでsubscriptionsテーブルにデータが追加されない  
**根本原因**: Foreign Key制約エラー  
**解決期間**: 数時間のデバッグ作業

---

## ❌ 根本原因：Foreign Key制約違反

### 問題のコード
```typescript
// ❌ 存在しないダミーユーザーID
userId = '00000000-0000-0000-0000-000000000000'
```

### エラーメッセージ
```
{
  "code": "23503",
  "message": "insert or update on table \"subscriptions\" violates foreign key constraint \"subscriptions_user_id_fkey\"",
  "details": "Key (user_id)=(00000000-0000-0000-0000-000000000000) is not present in table \"users\"."
}
```

### データベース構造
```
auth.users テーブル (Supabase認証)
├── 6d9effe3-6f86-46b1-a52e-0727c07a3fea ✅ 存在
├── f9446a3c-a0fe-4d76-812f-635dc7293f08 ✅ 存在
└── ...

subscriptions テーブル
├── user_id (Foreign Key → auth.users.id) ❌ 制約違反
└── ...
```

---

## 🔍 なぜ気づくのに時間がかかったか

### 1. **不十分なエラーログ**
```typescript
// ❌ 情報不足
console.error('Supabase error:', error)

// ✅ 詳細情報
console.error('Supabase error:', {
  message: error.message,
  details: error.details,
  hint: error.hint,
  code: error.code
})
```

### 2. **複数の要因が重なった**
- ポート不一致（3000 vs 3001）
- RLS（Row Level Security）の影響
- Foreign Key制約エラー
- 開発環境特有の問題

### 3. **webhookの500エラーのみ**
- 具体的なエラー内容が見えない
- 開発サーバーのログが確認困難

---

## 💡 重要な教訓

### 🗄️ **1. Foreign Key制約の理解**

**教訓**: データベースの参照整合性を必ず意識する

```typescript
// ❌ 危険：存在しないIDでテスト
const testUserId = '00000000-0000-0000-0000-000000000000'

// ✅ 安全：実在するIDを確認してからテスト
const { data: users } = await supabase.auth.admin.listUsers()
const testUserId = users.users[0]?.id // 実在するID
```

### 📝 **2. エラーログの充実**

**教訓**: エラーの詳細情報を必ず出力する

```typescript
// ❌ 情報不足
if (error) {
  console.error('Error occurred')
  return new Response('Error', { status: 500 })
}

// ✅ 詳細情報
if (error) {
  console.error('Database error:', {
    message: error.message,
    details: error.details,
    code: error.code,
    table: 'subscriptions',
    operation: 'upsert'
  })
  return new Response(`Database error: ${error.message}`, { status: 500 })
}
```

### 🧪 **3. 段階的テストの重要性**

**教訓**: 複雑な処理は段階的に分離してテスト

```typescript
// 1️⃣ まずSupabase接続をテスト
// 2️⃣ 次にテーブルへの書き込みをテスト  
// 3️⃣ 最後にwebhook全体をテスト
```

### 🌍 **4. 開発環境vs本番環境の違い**

**教訓**: 環境固有の問題を意識する

| 項目 | 開発環境 | 本番環境 |
|------|----------|----------|
| user_id | ダミーデータ | 実際のmetadata |
| ポート | 変動する可能性 | 固定 |
| Cookie設定 | 緩い設定 | 厳密な設定 |
| RLS | 無効化が必要 | 有効 |

---

## 🛠️ 今後の対策・ベストプラクティス

### **1. エラーハンドリング標準化**
```typescript
const logError = (context: string, error: any) => {
  console.error(`[${context}] Error:`, {
    message: error.message,
    details: error.details,
    code: error.code,
    timestamp: new Date().toISOString()
  })
}
```

### **2. テストデータ管理**
```typescript
// 実在するユーザーIDを動的に取得
const getTestUserId = async () => {
  const { data } = await supabase.auth.admin.listUsers()
  return data.users[0]?.id || null
}
```

### **3. 環境別設定**
```typescript
const isDev = process.env.NODE_ENV === 'development'

if (isDev) {
  // 開発環境用の詳細ログ
  console.log('Development mode: detailed logging enabled')
}
```

### **4. Foreign Key制約の事前チェック**
```typescript
// データ挿入前に参照先の存在確認
const userExists = await supabase
  .from('auth.users')
  .select('id')
  .eq('id', userId)
  .single()

if (!userExists.data) {
  throw new Error(`User not found: ${userId}`)
}
```

---

## 📚 参考情報

### **Supabase Foreign Key制約**
- [Supabase Database Schema](https://supabase.com/docs/guides/database/tables)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/tutorial-fk.html)

### **エラーハンドリング**
- [Supabase Error Handling](https://supabase.com/docs/reference/javascript/error-handling)
- [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html)

### **Stripe Webhook**
- [Stripe Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Metadata Usage](https://stripe.com/docs/api/metadata)

---

## 🎯 まとめ

**最も重要な教訓**: 
> データベースの参照整合性（Foreign Key制約）を軽視してはいけない。存在しないIDでのテストは必ず失敗する。

**今後のアプローチ**:
1. 🔍 **詳細なエラーログの実装**
2. 🧪 **段階的なテスト手法の採用** 
3. 🗄️ **Foreign Key制約の事前確認**
4. 🌍 **環境差異の明確化**

---

*作成日: 2025年5月24日*  
*対象プロジェクト: Next.js 15 + Supabase + Stripe* 