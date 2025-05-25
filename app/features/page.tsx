'use client';

import Link from "next/link";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import Header from '../components/Header';

export default function FeaturesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error('認証チェックエラー:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // 認証状態の変化を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // CTAボタンコンポーネント
  const CTAButtons = () => {
    if (user) {
      return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/dashboard"
            className="btn-primary text-center"
          >
            🚀 ダッシュボードを開く
          </Link>
          <Link 
            href="/pro-features"
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-8 py-3 rounded-xl font-semibold text-center transition-all duration-200 transform hover:scale-105"
          >
            ✨ プロ機能を見る
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link 
          href="/register"
          className="btn-primary text-center"
        >
          🚀 今すぐ無料で始める
        </Link>
        <Link 
          href="/login"
          className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-8 py-3 rounded-xl font-semibold text-center transition-all duration-200 transform hover:scale-105"
        >
          ログイン
        </Link>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main>
        {/* ヒーローセクション */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-8 shadow-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">🔍 機能詳細</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold mb-6 fade-in">
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  豊富な機能で
                </span>
                <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ビジネス成長を
                </span>
              </h1>
              
              <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed slide-in">
                SubsBaseが提供するすべての機能をご紹介します。<br/>
                スタートアップから大企業まで、あらゆる規模のビジネスに対応する<br/>
                プロフェッショナルなサブスクリプション管理機能をお試しください。
              </p>

              {user && (
                <div className="mt-6 inline-flex items-center space-x-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 bounce-in">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-600">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-green-700 font-medium">
                    ようこそ、{user.email?.split('@')[0]}さん！
                  </span>
                </div>
              )}

              <div className="mt-8">
                <CTAButtons />
              </div>
            </div>
          </div>
        </section>

        {/* コア機能セクション */}
        <section className="py-24 bg-white relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-blue-50/50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 fade-in">
              <div className="inline-flex items-center space-x-2 bg-blue-100 rounded-full px-4 py-2 mb-6">
                <span className="text-sm font-semibold text-blue-600">⚡ コア機能</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                すべてのビジネスニーズに対応
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                基本機能から高度な分析まで、成長するビジネスに必要なすべてを提供
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 認証・ユーザー管理 */}
              <div className="card p-8 text-center slide-in hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">🔐 安全な認証システム</h3>
                <p className="text-gray-600 mb-6">
                  Supabase認証による安全なユーザー管理。メール認証、パスワードリセット、セッション管理を完全サポート。
                </p>
                <ul className="text-sm text-gray-500 space-y-2 text-left">
                  <li>✓ メール/パスワード認証</li>
                  <li>✓ セキュアなセッション管理</li>
                  <li>✓ パスワードリセット機能</li>
                  <li>✓ PKCE認証フロー</li>
                </ul>
              </div>

              {/* 決済・サブスクリプション */}
              <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.1s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">💳 Stripe統合決済</h3>
                <p className="text-gray-600 mb-6">
                  世界標準のStripe決済システム。安全で信頼性の高い決済処理とサブスクリプション管理を実現。
                </p>
                <ul className="text-sm text-gray-500 space-y-2 text-left">
                  <li>✓ セキュアな決済処理</li>
                  <li>✓ 自動課金・更新</li>
                  <li>✓ 返金・キャンセル対応</li>
                  <li>✓ 複数通貨サポート</li>
                </ul>
              </div>

              {/* リアルタイム同期 */}
              <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.2s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">⚡ リアルタイム同期</h3>
                <p className="text-gray-600 mb-6">
                  Webhookによるリアルタイムデータ同期。決済状況やサブスクリプション変更を即座に反映。
                </p>
                <ul className="text-sm text-gray-500 space-y-2 text-left">
                  <li>✓ Webhook自動処理</li>
                  <li>✓ データベース即時更新</li>
                  <li>✓ 署名検証セキュリティ</li>
                  <li>✓ エラーハンドリング</li>
                </ul>
              </div>

              {/* ダッシュボード */}
              <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.3s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">📊 インテリジェントダッシュボード</h3>
                <p className="text-gray-600 mb-6">
                  直感的なダッシュボードで重要な指標を一目で把握。カスタマイズ可能な統計表示。
                </p>
                <ul className="text-sm text-gray-500 space-y-2 text-left">
                  <li>✓ リアルタイム統計</li>
                  <li>✓ カスタマイズ可能</li>
                  <li>✓ レスポンシブデザイン</li>
                  <li>✓ エクスポート機能</li>
                </ul>
              </div>

              {/* API管理 */}
              <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.4s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">🔧 REST API</h3>
                <p className="text-gray-600 mb-6">
                  完全なREST APIでサードパーティツールとの連携や独自アプリケーションの構築が可能。
                </p>
                <ul className="text-sm text-gray-500 space-y-2 text-left">
                  <li>✓ RESTful設計</li>
                  <li>✓ 認証ベース</li>
                  <li>✓ レート制限対応</li>
                  <li>✓ JSON形式</li>
                </ul>
              </div>

              {/* セキュリティ */}
              <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.5s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">🛡️ エンタープライズセキュリティ</h3>
                <p className="text-gray-600 mb-6">
                  Row Level Security、暗号化、監査ログなど、エンタープライズレベルのセキュリティ機能。
                </p>
                <ul className="text-sm text-gray-500 space-y-2 text-left">
                  <li>✓ RLS（行レベルセキュリティ）</li>
                  <li>✓ データ暗号化</li>
                  <li>✓ 監査ログ</li>
                  <li>✓ GDPR準拠</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* プロ機能セクション */}
        <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 fade-in">
              <div className="inline-flex items-center space-x-2 bg-purple-100 rounded-full px-4 py-2 mb-6">
                <span className="text-sm font-semibold text-purple-600">⭐ プロ機能</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                ビジネスを次のレベルへ
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                プロプランでは、さらに高度な機能とプレミアムサポートを提供
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* 高度な分析 */}
              <div className="card p-8 slide-in hover:scale-105">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">📈 高度な分析・レポート</h3>
                    <p className="text-gray-600 mb-4">
                      詳細なデータ分析、カスタムレポート生成、予測分析で深いビジネスインサイトを獲得。
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• カスタムダッシュボード作成</li>
                      <li>• 売上・解約率分析</li>
                      <li>• コホート分析</li>
                      <li>• 予測モデリング</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* API無制限 */}
              <div className="card p-8 slide-in hover:scale-105" style={{animationDelay: '0.1s'}}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">🚀 API無制限アクセス</h3>
                    <p className="text-gray-600 mb-4">
                      レート制限なしのAPI利用で、大規模なシステム統合と自動化を実現。
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• 無制限API呼び出し</li>
                      <li>• 優先レスポンス</li>
                      <li>• Webhook優先処理</li>
                      <li>• 高度なフィルタリング</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* カスタマイズ */}
              <div className="card p-8 slide-in hover:scale-105" style={{animationDelay: '0.2s'}}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">🎨 高度なカスタマイズ</h3>
                    <p className="text-gray-600 mb-4">
                      ブランドに合わせたカスタマイズとホワイトラベルソリューション。
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• カスタムブランディング</li>
                      <li>• カラーテーマ設定</li>
                      <li>• ロゴ・デザイン変更</li>
                      <li>• カスタムドメイン</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 優先サポート */}
              <div className="card p-8 slide-in hover:scale-105" style={{animationDelay: '0.3s'}}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">💬 優先サポート</h3>
                    <p className="text-gray-600 mb-4">
                      専任エキスパートによる24時間以内の優先サポート対応。
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• 24時間以内レスポンス</li>
                      <li>• 専任サポート担当</li>
                      <li>• 画面共有サポート</li>
                      <li>• 優先バグ修正</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* プロプラン価格カード */}
            <div className="max-w-md mx-auto bounce-in">
              <div className="card-pro p-8 text-white text-center relative overflow-hidden">
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
                  
                  <p className="text-white/80 mb-8">
                    すべてのプレミアム機能を利用してビジネスを次のレベルへ
                  </p>

                  <CTAButtons />
                  
                  <p className="mt-4 text-sm text-white/70">
                    30日間の返金保証付き • いつでもキャンセル可能
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 技術仕様セクション */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 fade-in">
              <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2 mb-6">
                <span className="text-sm font-semibold text-gray-600">⚙️ 技術仕様</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                最新技術で構築
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                最新のテクノロジースタックと業界標準のベストプラクティスで構築
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center slide-in">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.572 0C5.189 0 0 5.188 0 11.572c0 5.109 3.292 9.445 7.863 10.985.575-.105 1.002-.502 1.002-1.11V18.42c-3.204.697-3.881-1.543-3.881-1.543-.525-1.334-1.283-1.689-1.283-1.689-1.05-.717.08-.703.08-.703 1.16.082 1.77 1.191 1.77 1.191 1.03 1.764 2.701 1.254 3.36.959.105-.747.403-1.254.734-1.543-2.559-.291-5.25-1.279-5.25-5.695 0-1.258.45-2.287 1.19-3.094-.119-.291-.516-1.461.113-3.044 0 0 .97-.311 3.179 1.186.922-.256 1.91-.384 2.892-.389.982.005 1.97.133 2.892.389 2.209-1.497 3.179-1.186 3.179-1.186.629 1.583.232 2.753.113 3.044.74.807 1.19 1.836 1.19 3.094 0 4.426-2.696 5.401-5.264 5.686.414.357.784 1.061.784 2.138v3.171c0 .611.43 1.009 1.009 1.111C20.717 21.009 24 16.675 24 11.572 24 5.188 18.811 0 12.428 0z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Next.js 14</h3>
                <p className="text-sm text-gray-600">React Server Components対応の最新フレームワーク</p>
              </div>

              <div className="text-center slide-in" style={{animationDelay: '0.1s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c6.627 0 12 5.373 12 12 0 6.627-5.373 12-12 12S0 18.627 0 12C0 5.373 5.373 0 12 0zm-.74 5.11L5.95 9.428c-.98.686-.98 2.46 0 3.146l5.31 4.317c.98.686 2.57.686 3.55 0l5.31-4.317c.98-.686.98-2.46 0-3.146L14.81 5.11c-.98-.686-2.57-.686-3.55 0z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Supabase</h3>
                <p className="text-sm text-gray-600">PostgreSQL + 認証が統合されたBaaS</p>
              </div>

              <div className="text-center slide-in" style={{animationDelay: '0.2s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Stripe</h3>
                <p className="text-sm text-gray-600">世界標準の決済・サブスクリプション</p>
              </div>

              <div className="text-center slide-in" style={{animationDelay: '0.3s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Tailwind CSS</h3>
                <p className="text-sm text-gray-600">ユーティリティファーストなCSS</p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <div className="inline-flex items-center space-x-4 bg-gray-50 rounded-2xl px-8 py-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">99.9% 稼働率</span>
                </div>
                <div className="w-px h-6 bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">リアルタイム処理</span>
                </div>
                <div className="w-px h-6 bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">エンタープライズレベル</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 最終CTAセクション */}
        <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 fade-in">
              今すぐ始めてみませんか？
            </h2>
            <p className="text-xl text-white/90 mb-8 slide-in">
              5分で設定完了。すべての機能を無料でお試しいただけます。<br/>
              プロプランは30日間の返金保証付きで安心です。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center bounce-in">
              <Link
                href="/register"
                className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🚀 無料で始める
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 backdrop-blur-sm"
                >
                  📊 ダッシュボードを開く
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">SubsBase</span>
              </div>
              <p className="text-gray-400 mb-4">
                次世代のサブスクリプション管理プラットフォーム。<br/>
                開発者とビジネスオーナーのためのプロフェッショナルツール。
              </p>
              <p className="text-sm text-gray-500">
                © 2024 SubsBase. All rights reserved.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">プロダクト</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">機能一覧</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">料金プラン</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">ドキュメント</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">サポート</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">ヘルプセンター</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">お問い合わせ</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">ステータス</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 