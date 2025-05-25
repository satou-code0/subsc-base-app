import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { 
        cookies: { 
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options || {})
            })
          },
        },
        global: {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      }
    )

    let user = null

    // トークンベース認証（優先）
    if (token) {
      const { data: userData, error } = await supabase.auth.getUser(token)
      if (userData?.user) {
        user = userData.user
      }
    }

    // Cookie認証（フォールバック）
    if (!user) {
      const { data: userData, error } = await supabase.auth.getUser()
      if (userData?.user) {
        user = userData.user
      }
    }

    if (!user) {
      return Response.json({ error: '未ログイン' }, { status: 401 })
    }

    // service_role_keyを使用してRLSをバイパス
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ユーザーのアクティブなサブスクリプションを確認
    // active と active_until_period_end の両方をアクティブとして扱う
    const { data: subscriptions, error } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'active_until_period_end'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('❌ Subscription check error:', error)
      return Response.json({ error: 'サブスクリプション確認エラー' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return Response.json({ error: 'アクティブなサブスクリプションが見つかりません' }, { status: 403 })
    }

    const subscription = subscriptions[0]

    // Customer IDが必要
    if (!subscription.stripe_customer_id) {
      return Response.json({ error: 'Stripe顧客IDが見つかりません' }, { status: 400 })
    }

    // Stripe Customer Portal Sessionを作成
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
    })

    return Response.json({ url: portalSession.url })

  } catch (error: any) {
    console.error('💥 Portal session creation error:', error)
    return Response.json({ error: 'サーバーエラー', details: error.message }, { status: 500 })
  }
} 