import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Stripe設定
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

// Supabase設定
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    console.log('🔍 Webhook受信:', req.url)

    let event: Stripe.Event

    try {
      // Stripeのwebhookシークレットで署名を検証
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
      console.log('✅ Webhook署名検証成功:', event.type)
    } catch (err) {
      console.error('❌ Webhook署名検証失敗:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // イベントタイプごとの処理
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log('ℹ️ 未処理のイベント:', event.type)
    }

    console.log('✅ Webhook処理完了')
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('💥 Webhook処理エラー:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// チェックアウトセッション完了処理
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🛒 チェックアウト完了:', session.id)
  
  // セッションモードがサブスクリプションの場合のみ処理
  if (session.mode !== 'subscription') {
    return
  }

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  
  if (!customerId || !subscriptionId) {
    console.error('❌ 必要な情報が不足しています')
    return
  }

  // Stripeからサブスクリプション情報を取得
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  // Stripeから顧客情報を取得
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  
  // メタデータからSupabaseユーザーIDを取得
  const supabaseUserId = customer.metadata?.supabase_user_id
  
  if (!supabaseUserId) {
    console.error('❌ メタデータにSupabaseユーザーIDが見つかりません')
    
    // フォールバック: メールアドレスからSupabaseユーザーを検索
    if (customer.email) {
      try {
        const { data: users, error } = await supabase.auth.admin.listUsers()
        if (!error && users) {
          const matchingUser = users.users.find(u => u.email === customer.email)
          if (matchingUser) {
            console.log('✅ ユーザー発見:', matchingUser.id)
            await processSubscriptionForUser(matchingUser.id, subscription, customerId)
            return
          }
        }
      } catch (searchError) {
        console.error('❌ ユーザー検索エラー:', searchError)
      }
    }
    
    console.error('❌ 対応するSupabaseユーザーが見つかりません')
    return
  }

  await processSubscriptionForUser(supabaseUserId, subscription, customerId)
}

// サブスクリプション処理のヘルパー関数
async function processSubscriptionForUser(userId: string, subscription: Stripe.Subscription, customerId: string) {
  try {
    // Supabaseからユーザー情報を取得してemailを取得
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
    const userEmail = userData?.user?.email || null
    
    if (userError) {
      console.error('❌ ユーザー情報取得エラー:', userError)
    }

    // サブスクリプションデータを保存
    const subscriptionRecord: any = {
      user_id: userId,
      stripe_sub_id: subscription.id,
      stripe_customer_id: customerId,
      price_id: subscription.items.data[0]?.price.id,
      status: subscription.status,
      email: userEmail,
      created_at: new Date(subscription.created * 1000).toISOString(),
    }

    console.log('✅ サブスクリプションデータ準備完了:', subscriptionRecord)

    const { error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionRecord)

    if (error) {
      console.error('❌ Supabaseエラー:', error)
    } else {
      console.log('✅ サブスクリプション保存成功:', userId)
    }
  } catch (err) {
    console.error('💥 データベース処理エラー:', err)
  }
}

// サブスクリプション更新処理
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 サブスクリプション更新:', subscription.id, 'ステータス:', subscription.status)
  
  const subscriptionData = subscription as any
  
  try {
    const updateData: any = {
      status: subscription.status,
      price_id: subscription.items.data[0]?.price.id,
    }

    // cancel_at_period_endが設定されている場合
    if (subscriptionData.cancel_at_period_end) {
      updateData.status = 'active_until_period_end'
      updateData.canceled_at = new Date().toISOString()
    }

    // 実際にキャンセルされた場合
    if (subscription.status === 'canceled') {
      if (subscriptionData.canceled_at && typeof subscriptionData.canceled_at === 'number') {
        updateData.canceled_at = new Date(subscriptionData.canceled_at * 1000).toISOString()
      } else {
        updateData.canceled_at = new Date().toISOString()
      }
    }

    const { error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('stripe_sub_id', subscription.id)

    if (error) {
      console.error('❌ サブスクリプション更新エラー:', error)
    } else {
      console.log('✅ サブスクリプション更新成功')
    }
  } catch (err) {
    console.error('💥 更新処理エラー:', err)
  }
}

// サブスクリプション削除処理
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🗑️ サブスクリプション削除:', subscription.id)
  
  const subscriptionData = subscription as any
  
  try {
    // キャンセル時の詳細情報を記録
    const updateData = {
      status: 'canceled',
      canceled_at: subscriptionData.canceled_at ? new Date(subscriptionData.canceled_at * 1000).toISOString() : new Date().toISOString(),
      price_id: subscription.items.data[0]?.price.id,
    }

    const { error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('stripe_sub_id', subscription.id)

    if (error) {
      console.error('❌ サブスクリプション削除エラー:', error)
    } else {
      console.log('✅ サブスクリプション削除成功')
    }
  } catch (err) {
    console.error('💥 削除処理エラー:', err)
  }
}

// 支払い失敗処理
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ 支払い失敗:', invoice.id)
  
  const invoiceWithSub = invoice as any
  if (invoiceWithSub.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoiceWithSub.subscription as string)
    
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
        })
        .eq('stripe_sub_id', subscription.id)

      if (error) {
        console.error('❌ 支払い失敗後の更新エラー:', error)
      } else {
        console.log('✅ 支払い失敗後の更新完了')
      }
    } catch (err) {
      console.error('💥 支払い失敗処理エラー:', err)
    }
  }
} 