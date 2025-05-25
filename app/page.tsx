'use client';

import Link from "next/link";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import Header from './components/Header';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error('認証チェックエラー:', err);
        setUser(null);
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
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // CTAボタンコンポーネント
  const CTAButtons = () => {
    if (user) {
      return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
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
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
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
          {/* 背景装飾 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="text-center">
              {/* バッジ */}
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-8 shadow-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">✨ モダンなSaaSテンプレート</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold mb-6 fade-in">
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  サブスクリプション
                </span>
                <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  管理を簡単に
                </span>
              </h1>
              
              <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed slide-in">
                SubsBaseは、モダンで安全なサブスクリプション管理プラットフォームです。<br/>
                Stripe統合、リアルタイム分析、プロフェッショナルなUIで、<br/>
                あなたのSaaSビジネスを加速させましょう。
              </p>

              {user && (
                <div className="mt-6 inline-flex items-center space-x-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 bounce-in">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-600">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-green-700 font-medium">
                    こんにちは、{user.email?.split('@')[0]}さん！
                  </span>
                </div>
              )}

              <CTAButtons />

              {/* 統計情報 */}
              <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">99.9%</div>
                  <div className="text-sm text-gray-600">稼働率</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600">サポート</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">5分</div>
                  <div className="text-sm text-gray-600">セットアップ</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 特徴セクション */}
        <section className="py-24 bg-white relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-blue-50/50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 fade-in">
              <div className="inline-flex items-center space-x-2 bg-blue-100 rounded-full px-4 py-2 mb-6">
                <span className="text-sm font-semibold text-blue-600">✨ なぜSubsBase？</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                プロフェッショナルなサブスク管理
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                最新技術とベストプラクティスで構築された、エンタープライズレベルのソリューション
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="card p-8 text-center slide-in hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">⚡ 高速処理</h3>
                <p className="text-gray-600">
                  Next.js 14とSupabaseによる超高速なパフォーマンスで、ユーザー体験を最適化
                </p>
              </div>

              <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.1s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">🔒 セキュリティ</h3>
                <p className="text-gray-600">
                  エンタープライズレベルのセキュリティと暗号化で、お客様のデータを完全保護
                </p>
              </div>

              <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.2s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">❤️ 直感的UI</h3>
                <p className="text-gray-600">
                  モダンでレスポンシブなデザインで、どんなデバイスからでも快適に利用可能
                </p>
              </div>

              <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.3s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">🚀 API統合</h3>
                <p className="text-gray-600">
                  Stripe決済とSupabase認証のシームレスな統合で、開発時間を大幅短縮
                </p>
              </div>

              <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.4s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">📊 分析機能</h3>
                <p className="text-gray-600">
                  リアルタイム分析とカスタムレポートで、ビジネスの成長を可視化
                </p>
              </div>

              <div className="card p-8 text-center slide-in hover:scale-105" style={{animationDelay: '0.5s'}}>
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">🎯 24/7サポート</h3>
                <p className="text-gray-600">
                  専門チームによる24時間体制のサポートで、安心してご利用いただけます
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* プランセクション */}
        <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 fade-in">
              <div className="inline-flex items-center space-x-2 bg-purple-100 rounded-full px-4 py-2 mb-6">
                <span className="text-sm font-semibold text-purple-600">💎 プラン選択</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                あなたに最適なプランを
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                スタートアップから大企業まで、すべてのニーズに対応する柔軟なプラン
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* フリープラン */}
              <div className="card p-8 relative slide-in">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">フリープラン</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">¥0</div>
                  <p className="text-gray-600">個人利用・学習用</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">基本機能利用</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">コミュニティサポート</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">月間100リクエスト</span>
                  </li>
                </ul>
                
                <Link
                  href="/register"
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold text-center block transition-all duration-200 transform hover:scale-105"
                >
                  無料で始める
                </Link>
              </div>

              {/* プロプラン */}
              <div className="card-pro p-8 text-white relative slide-in" style={{animationDelay: '0.1s'}}>
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-sm font-semibold">人気No.1</span>
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">プロプラン</h3>
                  <div className="text-4xl font-bold mb-2">¥980</div>
                  <p className="text-white/80">ビジネス利用</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/90">すべての機能利用</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/90">優先サポート</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/90">無制限リクエスト</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/90">高度な分析機能</span>
                  </li>
                </ul>
                
                <Link
                  href="/register"
                  className="w-full bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-xl font-bold text-center block transition-all duration-200 transform hover:scale-105"
                >
                  プロプランを始める
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTAセクション */}
        <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 fade-in">
              今すぐ始めましょう
            </h2>
            <p className="text-xl text-white/90 mb-8 slide-in">
              5分で設定完了。30日間の返金保証付きで安心してお試しいただけます。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center bounce-in">
              <Link
                href="/register"
                className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🚀 無料でスタート
              </Link>
              <Link
                href="/features"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 backdrop-blur-sm"
              >
                📖 詳細を見る
              </Link>
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
