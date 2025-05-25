'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '../components/Header'

// サブスクリプションの型定義
type Subscription = {
  id: string
  user_id: string
  stripe_sub_id: string | null
  stripe_customer_id: string | null
  price_id: string | null
  status: string
  created_at: string
}

// APIレスポンスの型定義
type SubscriptionStatus = {
  hasActiveSubscription: boolean
  subscription: Subscription | null
  periodInfo?: {
    current_period_start: number
    current_period_end: number
    readable: {
      period_start: string
      period_end: string
      days_until_end: number
    }
    estimated?: boolean
    fallback?: boolean
    cancel_at_period_end: boolean
  } | null
  user: {
    id: string
    email: string
  }
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatus | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [cancellingSubscription, setCancellingSubscription] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        // まずセッションを取得
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          // セッションエラーの場合、リフレッシュを試行
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.error('Refresh failed:', refreshError)
              // リフレッシュも失敗した場合のみログイン画面へ
              router.replace('/login?message=session_expired')
              return
            }
            console.log('Session refreshed successfully')
          } catch (refreshErr) {
            console.error('Refresh session error:', refreshErr)
            router.replace('/login?message=session_expired')
            return
          }
        }

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (!user || error) {
          console.error('User check error:', error)
          // エラーの種類に応じて処理を分岐
          if (error?.message?.includes('refresh_token_not_found') || 
              error?.message?.includes('Invalid Refresh Token')) {
            // 決済後の復帰の可能性があるため、少し待ってからリダイレクト
            setTimeout(() => {
              router.replace('/login?message=session_expired&redirect=dashboard')
            }, 2000)
          } else {
            router.replace('/login')
          }
          return
        }

        // サブスクリプション状況をAPIから取得
        await checkSubscriptionStatus()
        
      } catch (err) {
        console.error('Auth check error:', err)
        // ネットワークエラーなどの場合は再試行
        setTimeout(() => {
          router.replace('/login?message=auth_error')
        }, 1000)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // セッション変更の監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login')
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed, updating subscription status')
        await checkSubscriptionStatus()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  // サブスクリプション状況をAPIエンドポイントから取得
  const checkSubscriptionStatus = async () => {
    try {
      setSubscriptionLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        console.error('No access token available')
        return
      }

      // 期間情報も含めて取得
      const response = await fetch('/api/subscription-status?include_period=true', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data: SubscriptionStatus = await response.json()
      setSubscriptionData(data)
      
    } catch (err) {
      console.error('Subscription status check error:', err)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const handleSubscribe = async () => {
    setSubscribing(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        alert('セッショントークンが取得できません。再度ログインしてください。')
        router.replace('/login')
        return
      }
      
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!res.ok) {
        const errorText = await res.text()
        alert(`エラーが発生しました: ${res.status} ${errorText}`)
        return
      }

      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('URLが取得できませんでした')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('エラーが発生しました。再度お試しください。')
    } finally {
      setSubscribing(false)
    }
  }

  // 解約機能（Customer Portal）
  const handleManageSubscription = async () => {
    const confirmed = window.confirm(
      'Stripe Customer Portalに移動します。\n' +
      'そこでサブスクリプションの解約、プラン変更、支払い方法の変更などができます。\n\n' +
      '続行しますか？'
    )

    if (!confirmed) return

    setCancellingSubscription(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        alert('セッショントークンが取得できません。再度ログインしてください。')
        router.replace('/login')
        return
      }
      
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!res.ok) {
        const errorText = await res.text()
        alert(`エラーが発生しました: ${res.status} ${errorText}`)
        return
      }

      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('ポータルURLが取得できませんでした')
      }
    } catch (error) {
      console.error('Portal session error:', error)
      alert('エラーが発生しました。再度お試しください。')
    } finally {
      setCancellingSubscription(false)
    }
  }

  // プラン表示のコンポーネント
  const PlanStatus = () => {
    if (subscriptionLoading) {
      return (
        <div className="card p-8 mb-8 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="space-y-2">
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
              <div className="w-48 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      )
    }

    if (subscriptionData?.hasActiveSubscription && subscriptionData.subscription) {
      const subscription = subscriptionData.subscription
      const periodInfo = subscriptionData.periodInfo
      const isExpiringSoon = subscription.status === 'active_until_period_end'
      
      return (
        <div className={`card ${isExpiringSoon ? 'card-cancel' : 'card-pro'} p-8 mb-8 text-white slide-in`}>
          {/* 背景装飾 */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    {isExpiringSoon ? '⚠️ プロプラン（終了予定）' : '✨ プロプラン'}
                  </h2>
                  <p className="text-white/80">
                    すべてのプレミアム機能をご利用いただけます
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    開始日: {new Date(subscription.created_at).toLocaleDateString('ja-JP')}
                  </p>
                  {/* 期間情報を表示 - キャンセル予定の場合のみ表示 */}
                  {periodInfo && isExpiringSoon && (
                    <div className="text-sm text-white/70 mt-2 space-y-1">
                      <p>
                        📅 現在の期間: {periodInfo.readable.period_start} ～ {periodInfo.readable.period_end}
                        {periodInfo.estimated && <span className="text-xs opacity-75"> </span>}
                      </p>
                      {periodInfo.readable.days_until_end > 0 ? (
                        <p>
                          ⏰ 残り: <span className="font-semibold">{periodInfo.readable.days_until_end}日</span>
                          {isExpiringSoon && ' で終了'}
                        </p>
                      ) : (
                        <p className="text-yellow-200">
                          ⚠️ 期間が終了しています
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                <span className="text-sm font-semibold">
                  {isExpiringSoon ? 'キャンセル予定' : 'アクティブ'}
                </span>
              </div>
            </div>
            
            {/* キャンセル予定の場合の警告表示 */}
            {isExpiringSoon && periodInfo && (
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
                <h3 className="font-semibold mb-2">🚨 プラン終了予定</h3>
                <p className="text-sm text-white/80">
                  {periodInfo.readable.period_end} にプランが終了します。<br/>
                  下記のプラン管理ボタンから継続または再開ができます。
                </p>
              </div>
            )}
            
            {/* アクション */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/pro-features"
                className="flex-1 bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold text-center transition-all duration-200 transform hover:scale-105"
              >
                ✨ プロ機能を使用
              </Link>
              <button
                onClick={handleManageSubscription}
                disabled={cancellingSubscription}
                className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {cancellingSubscription ? '処理中...' : (isExpiringSoon ? '🔄 プラン再開・管理' : '🔧 プラン・支払い管理')}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="card p-8 mb-8 slide-in">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">フリープラン</h2>
          <p className="text-gray-600">基本機能を無料でご利用いただけます</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-2">✨</span>
            プロプランにアップグレードして：
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">無制限のデータアクセス</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">高度な分析機能</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">優先サポート</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">API制限の撤廃</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {subscribing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>処理中...</span>
              </div>
            ) : (
              '🚀 プロプランにアップグレード'
            )}
          </button>
          
          <Link
            href="/pro-features"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold text-center transition-all duration-200 transform hover:scale-105"
          >
            👀 プロ機能を確認
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <main className="p-8 max-w-4xl mx-auto">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="p-8 max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12 fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            ダッシュボード
          </h1>
          <p className="text-xl text-gray-600">あなた専用の管理画面へようこそ</p>
        </div>
        
        {/* ユーザー情報 */}
        <div className="card p-6 mb-8 slide-in">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {subscriptionData?.user.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">ログイン中のアカウント</h3>
              <p className="text-gray-600">{subscriptionData?.user.email || '取得中...'}</p>
            </div>
          </div>
        </div>

        {/* プラン状況 */}
        <PlanStatus />

        {/* 統計情報（デモ用） */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stats-card stats-card-blue bounce-in">
            <div className="stats-icon-blue">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="stats-number">1,234</h3>
            <p className="stats-label">総利用回数</p>
          </div>
          
          <div className="stats-card stats-card-green bounce-in" style={{animationDelay: '0.1s'}}>
            <div className="stats-icon-green">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="stats-number">98.5%</h3>
            <p className="stats-label">稼働率</p>
          </div>
          
          <div className="stats-card stats-card-purple bounce-in" style={{animationDelay: '0.2s'}}>
            <div className="stats-icon-purple">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="stats-number">24/7</h3>
            <p className="stats-label">サポート</p>
          </div>
        </div>
      </main>
    </div>
  )
}
