'use client'
// トップページ：サブスクサービスの概要と主要導線
// サービス説明・新規登録/ログイン・プラン選択・会員エリアへのリンクを配置

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    // ログイン中ならサブスク状態を判定してリダイレクト
    const checkAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setIsLoggedIn(true)
        // サブスク状態を取得
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()
        if (!error && data && data.status === 'active') {
          router.replace('/dashboard')
        } else {
          router.replace('/pricing')
        }
      } else {
        setIsLoggedIn(false)
      }
    }
    checkAndRedirect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 認証チェック中
  if (isLoggedIn === null) {
    return <div style={{ textAlign: 'center', marginTop: '100px' }}>読み込み中...</div>
  }

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>サブスク型サービスへようこそ</h1>
      <p style={{ marginBottom: 24 }}>
        このサービスは、Next.js・Supabase・Stripeを使った月額サブスクリプションのデモアプリです。<br />
        ユーザー登録・プラン選択・決済・会員限定エリアの一連の流れを体験できます。
      </p>
      <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
        <li style={{ marginBottom: 12 }}>
          <Link href="/register" style={{ color: '#0070f3', textDecoration: 'underline', fontWeight: 'bold' }}>
            新規登録 / ログインはこちら
          </Link>
        </li>
        {/* ログイン済みの場合のみ以下のリンクを表示（実際には自動リダイレクトされるが念のため） */}
        {isLoggedIn && (
          <>
            <li style={{ marginBottom: 12 }}>
              <Link href="/pricing" style={{ color: '#0070f3', textDecoration: 'underline', fontWeight: 'bold' }}>
                プラン選択・お申し込み
              </Link>
            </li>
            <li>
              <Link href="/dashboard" style={{ color: '#0070f3', textDecoration: 'underline', fontWeight: 'bold' }}>
                有料会員エリアへ
              </Link>
            </li>
          </>
        )}
      </ul>
      <div style={{ fontSize: 14, color: '#666' }}>
        ※ Stripeのテストカードで決済体験が可能です。<br />
        <b>カード番号:</b> 4242 4242 4242 4242<br />
        <b>有効期限:</b> 未来の日付<br />
        <b>CVC:</b> 任意の3桁
      </div>
    </main>
  )
}
