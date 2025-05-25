'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import Header from '../components/Header';

// サブスクリプションデータの型定義
interface SubscriptionData {
  hasActiveSubscription: boolean;
  userEmail?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: string | null;
  planName?: string;
  user: {
    id: string;
    email: string;
  };
  subscription?: any;
}

export default function ProFeaturesPage() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const router = useRouter();

  // サブスクリプション状態を取得
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        // まずSupabaseでユーザー認証をチェック
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (!user || authError) {
          router.push('/login');
          return;
        }

        // セッショントークンを取得
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/subscription-status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401) {
          // 未認証の場合はログインページにリダイレクト
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(`サブスクリプション状態の取得に失敗しました (${response.status})`);
        }

        const data = await response.json();
        setSubscriptionData(data);
      } catch (err) {
        console.error('サブスクリプション状態取得エラー:', err);
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [router]);

  // 認証状態の変化を監視
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router]);

  // プロプランにアップグレード
  const handleUpgrade = async () => {
    setIsCreatingCheckout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        alert('セッショントークンが取得できません。再度ログインしてください。')
        router.push('/login')
        return
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('決済セッションの作成に失敗しました');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('アップグレードエラー:', err);
      alert('アップグレード処理中にエラーが発生しました。再試行してください。');
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  // ローディング状態
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <main className="flex items-center justify-center p-8">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </main>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <main className="flex items-center justify-center p-8">
          <div className="card p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link 
              href="/dashboard"
              className="btn-primary inline-block"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // プロプランでない場合のアップグレード促進UI
  if (!subscriptionData?.hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* ヘロセクション */}
          <div className="text-center mb-16 fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              プロ機能を開放
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              高度な機能とプレミアムツールで、あなたのワークフローを次のレベルに引き上げます
            </p>
          </div>

          {/* 機能一覧グリッド */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="card p-8 text-center slide-in hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">高度な分析機能</h3>
              <p className="text-gray-600">
                詳細なデータ分析、カスタムレポート、リアルタイムダッシュボードで深いインサイトを獲得
              </p>
            </div>

            <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.1s'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">API無制限アクセス</h3>
              <p className="text-gray-600">
                REST APIを使用して外部システムとの連携や自動化を実現。レート制限なし
              </p>
            </div>

            <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">優先サポート</h3>
              <p className="text-gray-600">
                24時間以内の専用サポート対応で、問題を迅速に解決
              </p>
            </div>

            <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.3s'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">カスタマイズ機能</h3>
              <p className="text-gray-600">
                個人のニーズに合わせてインターフェースや機能を自由にカスタマイズ
              </p>
            </div>

            <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.4s'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">セキュリティ強化</h3>
              <p className="text-gray-600">
                エンタープライズレベルのセキュリティ機能と暗号化で安全性を保証
              </p>
            </div>

            <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.5s'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">無制限ストレージ</h3>
              <p className="text-gray-600">
                容量制限なしでデータを保存。バックアップとバージョン管理も自動
              </p>
            </div>
          </div>

          {/* 価格カード */}
          <div className="max-w-md mx-auto bounce-in">
            <div className="card-pro p-8 text-white text-center relative overflow-hidden">
              {/* 背景装飾 */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              
              <div className="relative">
                <h3 className="text-2xl font-bold mb-2">プロプラン</h3>
                <div className="mb-6">
                  <span className="text-5xl font-extrabold">¥980</span>
                  <span className="text-xl opacity-80">/月</span>
                </div>
                
                <div className="space-y-3 mb-8 text-left">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/90">すべての機能が使い放題</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/90">優先サポート</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/90">いつでもキャンセル可能</span>
                  </div>
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={isCreatingCheckout}
                  className="w-full bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {isCreatingCheckout ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>処理中...</span>
                    </div>
                  ) : (
                    '🚀 今すぐアップグレード'
                  )}
                </button>
                
                <p className="mt-4 text-sm text-white/70">
                  30日間の返金保証付き
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // プロプラン加入者向けの実際の機能画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-12 text-center fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            プロ機能ダッシュボード
          </h1>
          <p className="text-xl text-gray-600">
            プレミアム機能をフルに活用しましょう
          </p>
        </div>

        {/* ウェルカムバナー */}
        <div className="card-pro p-8 mb-8 text-white slide-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">🎉 プロプランへようこそ！</h2>
              <p className="text-white/80">
                すべてのプレミアム機能にアクセスできます。下記の機能をお試しください。
              </p>
            </div>
            <div className="text-6xl opacity-20">⭐</div>
          </div>
        </div>

        {/* 機能ダッシュボード */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="card p-8 text-center slide-in hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">高度な分析</h2>
            <p className="text-gray-600 mb-6">
              詳細なデータ分析とカスタムレポートを生成できます。
            </p>
            <button className="btn-primary w-full">
              分析を開始
            </button>
          </div>

          <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.1s'}}>
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">API管理</h2>
            <p className="text-gray-600 mb-6">
              APIキーの管理と使用状況の監視ができます。
            </p>
            <button className="btn-success w-full">
              API設定
            </button>
          </div>

          <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.2s'}}>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">カスタマイズ</h2>
            <p className="text-gray-600 mb-6">
              インターフェースと機能をカスタマイズできます。
            </p>
            <button className="btn-secondary w-full">
              設定を開く
            </button>
          </div>
        </div>

        {/* 実際のプロ機能コンテンツエリア */}
        <div className="card p-8 bounce-in">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">リアルタイムダッシュボード</h2>
          
          {/* サンプルデータ表示 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="stats-card stats-card-blue">
              <div className="stats-number text-blue-600">1,234</div>
              <div className="stats-label">総ユーザー数</div>
            </div>
            <div className="stats-card stats-card-green">
              <div className="stats-number text-green-600">¥123,456</div>
              <div className="stats-label">月間売上</div>
            </div>
            <div className="stats-card stats-card-purple">
              <div className="stats-number text-purple-600">98.5%</div>
              <div className="stats-label">稼働率</div>
            </div>
            <div className="stats-card stats-card-orange">
              <div className="stats-number text-orange-600">567</div>
              <div className="stats-label">アクティブセッション</div>
            </div>
          </div>

          {/* プロ機能の詳細コンテンツ */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              🚀 プレミアム機能がアクティブです
            </h3>
            <p className="text-gray-700 text-center mb-6">
              プロプランをご利用いただき、ありがとうございます！高度な分析機能、
              API管理、カスタマイズオプションなど、すべてのプレミアム機能をご活用ください。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">
                📊 詳細レポートを生成
              </button>
              <button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
                📁 設定をエクスポート
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 