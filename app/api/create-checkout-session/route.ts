import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    console.log('🔍 Checkout session作成開始')
    
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { 
        cookies: { 
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                const cookieOptions = {
                  ...options,
                  httpOnly: false,
                  secure: false,
                  sameSite: 'lax' as const,
                  path: '/',
                }
                cookieStore.set(name, value, cookieOptions)
              } catch (error) {
                console.error('Cookie set failed:', name, error)
              }
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
        console.log('✅ トークンベース認証成功:', user.id, user.email)
      }
    }

    // Cookie認証（フォールバック）
    if (!user) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user
      if (user) {
        console.log('✅ Cookie認証成功:', user.id, user.email)
      }
    }

    if (!user) {
      console.error('❌ 認証失敗')
      return new Response('未ログイン', { status: 401 })
    }

    // 既存のStripe customerを検索または新規作成
    let customer
    
    // まず、Supabaseユーザーに対応するcustomerを検索
    console.log('🔍 ユーザー専用のStripe customerを検索中...')
    const allCustomers = await stripe.customers.list({
      email: user.email!,
      limit: 100, // 同じメールアドレスの全customerを取得
    })
    
    // メタデータでSupabaseユーザーIDが一致するcustomerを探す
    const matchingCustomer = allCustomers.data.find(c => 
      c.metadata?.supabase_user_id === user.id
    )
    
    if (matchingCustomer) {
      customer = matchingCustomer
      console.log('✅ ユーザー専用のStripe customer発見:', customer.id)
      console.log('🏷️ 対応メタデータ:', customer.metadata)
    } else {
      console.log('❌ ユーザー専用のcustomerが見つかりません')
      
      // 既存のcustomer（別ユーザーのもの）がある場合の処理
      if (allCustomers.data.length > 0) {
        console.log('⚠️ 同じメールアドレスの他のcustomerが存在します:')
        allCustomers.data.forEach((c, index) => {
          console.log(`  ${index + 1}. ID: ${c.id}, メタデータ:`, c.metadata)
        })
        console.log('🆕 新しいcustomerを作成します')
      }
      
      // 新規Stripe customer作成（必ずこのユーザー専用）
      customer = await stripe.customers.create({
        email: user.email!,
        name: user.email, // 識別しやすくするため
        description: `Supabase User: ${user.id}`, // 説明にもユーザーIDを記載
        metadata: {
          supabase_user_id: user.id,
          created_for_email: user.email!, // 参考情報として保存
        },
      })
      console.log('✅ 新規Stripe customer作成:', customer.id)
      console.log('🏷️ 設定したmetadata:', customer.metadata)
    }

    // Stripeセッション作成
    const session_stripe = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customer.id, // 明示的にcustomerを指定
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      subscription_data: {
        // 現在時刻をbilling_cycle_anchorとして設定
        billing_cycle_anchor: Math.floor(Date.now() / 1000),
        // 即座に開始
        trial_end: undefined,
        metadata: {
          created_from: 'dashboard',
          user_id: user.id,
          created_at: new Date().toISOString()
        }
      },
      metadata: {
        user_id: user.id, // セッションにもuser_idを設定（念のため）
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?canceled=true`,
    })

    console.log('✅ Stripe session作成完了:', session_stripe.id)
    console.log('👤 対象ユーザー:', user.id, user.email)
    console.log('🏷️ Stripe customer:', customer.id)

    return Response.json({ url: session_stripe.url })
  } catch (error) {
    console.error('💥 API Error:', error)
    return new Response('サーバーエラー', { status: 500 })
  }
}
