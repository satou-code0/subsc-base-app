import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function GET(req: NextRequest) {
  try {
    // クエリパラメータで期間情報の取得を制御
    const url = new URL(req.url)
    const includePeriodInfo = url.searchParams.get('include_period') === 'true'
    
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
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user
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
      console.error('Subscription check error:', error)
      return Response.json({ error: 'サブスクリプション確認エラー' }, { status: 500 })
    }

    const hasActiveSubscription = subscriptions && subscriptions.length > 0
    const subscription = hasActiveSubscription ? subscriptions[0] : null

    // 期間情報をStripe APIから取得（リクエストされた場合のみ）
    let periodInfo = null
    if (includePeriodInfo && subscription?.stripe_sub_id) {
      try {
        console.log('📅 Stripe APIから期間情報を取得中:', subscription.stripe_sub_id)
        
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_sub_id)
        const subData = stripeSubscription as any // TypeScript型の問題を回避
        
        if (subData.current_period_start && subData.current_period_end) {
          // Stripeに期間情報がある場合
          periodInfo = {
            current_period_start: subData.current_period_start,
            current_period_end: subData.current_period_end,
            readable: {
              period_start: new Date(subData.current_period_start * 1000).toLocaleDateString('ja-JP'),
              period_end: new Date(subData.current_period_end * 1000).toLocaleDateString('ja-JP'),
              days_until_end: Math.ceil((subData.current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
            },
            billing_cycle_anchor: subData.billing_cycle_anchor,
            cancel_at_period_end: subData.cancel_at_period_end
          }
          console.log('✅ Stripe期間情報取得成功')
        } else {
          // Stripeに期間情報がない場合、Invoiceから取得を試行
          console.log('⚠️ Stripeサブスクリプションに期間情報なし。Invoiceから取得を試行...')
          
          const invoices = await stripe.invoices.list({
            subscription: subscription.stripe_sub_id,
            limit: 1
          })
          
          if (invoices.data.length > 0) {
            const latestInvoice = invoices.data[0]
            
            if (latestInvoice.period_start && latestInvoice.period_end) {
              // period_startとperiod_endが同じ場合は月次と仮定
              let periodEnd = latestInvoice.period_end
              if (latestInvoice.period_start === latestInvoice.period_end) {
                const nextMonth = new Date(latestInvoice.period_start * 1000)
                nextMonth.setMonth(nextMonth.getMonth() + 1)
                periodEnd = Math.floor(nextMonth.getTime() / 1000)
              }
              
              periodInfo = {
                current_period_start: latestInvoice.period_start,
                current_period_end: periodEnd,
                readable: {
                  period_start: new Date(latestInvoice.period_start * 1000).toLocaleDateString('ja-JP'),
                  period_end: new Date(periodEnd * 1000).toLocaleDateString('ja-JP'),
                  days_until_end: Math.ceil((periodEnd * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
                },
                estimated: true, // Invoiceから推定したことを示す
                cancel_at_period_end: stripeSubscription.cancel_at_period_end
              }
              console.log('✅ Invoice期間情報取得成功（推定）')
            }
          }
          
          // それでも取得できない場合は作成日から推定
          if (!periodInfo) {
            const createdDate = new Date(subscription.created_at)
            const estimatedEnd = new Date(createdDate)
            estimatedEnd.setMonth(estimatedEnd.getMonth() + 1)
            
            periodInfo = {
              current_period_start: Math.floor(createdDate.getTime() / 1000),
              current_period_end: Math.floor(estimatedEnd.getTime() / 1000),
              readable: {
                period_start: createdDate.toLocaleDateString('ja-JP'),
                period_end: estimatedEnd.toLocaleDateString('ja-JP'),
                days_until_end: Math.ceil((estimatedEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              },
              estimated: true,
              fallback: true, // フォールバック推定であることを示す
              cancel_at_period_end: subData.cancel_at_period_end
            }
            console.log('⚠️ フォールバック期間推定を使用')
          }
        }
        
      } catch (stripeError) {
        console.error('❌ Stripe期間情報取得エラー:', stripeError)
        // エラーの場合は期間情報なしで続行
      }
    }

    const response = {
      hasActiveSubscription,
      subscription,
      periodInfo,
      user: {
        id: user.id,
        email: user.email
      }
    }

    return Response.json(response)

  } catch (error: any) {
    console.error('Subscription status API error:', error)
    return Response.json({ error: 'サーバーエラー' }, { status: 500 })
  }
} 