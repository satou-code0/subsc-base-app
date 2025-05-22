// /registerページ：メールアドレス認証（サインアップ/サインイン）
// Supabase Authを利用した最小構成の認証UI

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function RegisterPage() {
  // 入力用の状態管理
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // サインアップ/サインイン処理
  const handleAuth = async (type: 'signUp' | 'signIn') => {
    setLoading(true)
    setMessage('')
    let result
    if (type === 'signUp') {
      result = await supabase.auth.signUp({ email, password })
      if (result.error) {
        setMessage('サインアップ失敗: ' + result.error.message)
      } else {
        setMessage('サインアップ成功！メールを確認してください')
      }
    } else {
      result = await supabase.auth.signInWithPassword({ email, password })
      if (result.error) {
        setMessage('サインイン失敗: ' + result.error.message)
      } else {
        setMessage('サインイン成功！')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>会員登録 / ログイン</h2>
      <div style={{ marginBottom: 12 }}>
        <label>メールアドレス<br />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            autoComplete="email"
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>パスワード<br />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            autoComplete="current-password"
          />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => handleAuth('signUp')} disabled={loading} style={{ flex: 1 }}>
          新規登録
        </button>
        <button onClick={() => handleAuth('signIn')} disabled={loading} style={{ flex: 1 }}>
          ログイン
        </button>
      </div>
      {message && <div style={{ color: message.includes('成功') ? 'green' : 'red', marginBottom: 8 }}>{message}</div>}
      {/* --- 今後Google認証やリダイレクトも追加予定 --- */}
    </div>
  )
} 